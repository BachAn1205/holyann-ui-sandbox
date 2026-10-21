import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { deleteS3ObjectByPublicUrlForUser } from '@/lib/s3-storage'

/**
 * DELETE /api/chat/rooms/[roomId]/attachments/[attachmentId]
 * Xóa file đính kèm (chỉ người gửi tin nhắn).
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ roomId: string; attachmentId: string }> }
) {
    try {
        const user = await getAuthenticatedUser(request)
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { roomId, attachmentId } = await context.params

        const participant = await prisma.chat_participants.findFirst({
            where: {
                room_id: roomId,
                user_id: user.id,
                is_active: true
            }
        })
        if (!participant) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        const attachment = await prisma.chat_attachments.findFirst({
            where: { id: attachmentId },
            include: {
                chat_messages: {
                    select: { sender_id: true, room_id: true }
                }
            }
        })
        if (!attachment || attachment.chat_messages.room_id !== roomId) {
            return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
        }
        if (attachment.chat_messages.sender_id !== user.id) {
            return NextResponse.json({ error: 'Chỉ có thể xóa file của tin nhắn do bạn gửi' }, { status: 403 })
        }

        const fileUrl = attachment.file_url

        await prisma.chat_attachments.delete({
            where: { id: attachmentId }
        })

        // Xóa file trên S3 (URL công khai → key trong uploads/users|students/…)
        try {
            if (fileUrl) {
                await deleteS3ObjectByPublicUrlForUser(user.id, fileUrl)
            }
        } catch (_) {
            // Bỏ qua lỗi xóa storage, record DB đã xóa
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting attachment:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
