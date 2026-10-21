import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth/get-user'

/**
 * GET /api/chat/rooms/[roomId]/messages/[messageId]
 * Lấy chi tiết một message cụ thể
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ roomId: string; messageId: string }> }
) {
    try {
        const user = await getAuthenticatedUser(request)

        if (!user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const userId = user.id
        const { roomId, messageId } = await context.params

        // Verify user is participant of this room
        const participant = await prisma.chat_participants.findFirst({
            where: {
                room_id: roomId,
                user_id: userId,
                is_active: true
            }
        })

        if (!participant) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            )
        }

        // Get message
        const message = await prisma.chat_messages.findFirst({
            where: {
                id: messageId,
                room_id: roomId,
                deleted_at: null
            },
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        avatar_url: true,
                        role: true
                    }
                },
                chat_attachments: {
                    select: {
                        id: true,
                        file_url: true,
                        file_name: true,
                        file_type: true,
                        file_size: true,
                        thumbnail_url: true
                    }
                }
            }
        })

        if (!message) {
            return NextResponse.json(
                { error: 'Message not found' },
                { status: 404 }
            )
        }

        // Format message
        const formattedMessage = {
            id: message.id,
            content: message.content,
            type: message.type,
            createdAt: message.created_at,
            updatedAt: message.updated_at,
            isEdited: message.is_edited,
            sender: {
                id: message.users.id,
                name: message.users.full_name,
                avatar: message.users.avatar_url,
                role: message.users.role
            },
            isFromMe: message.sender_id === userId,
            attachments: message.chat_attachments.map(att => ({
                id: att.id,
                url: att.file_url,
                name: att.file_name,
                type: att.file_type,
                size: att.file_size ? Number(att.file_size) : null,
                thumbnail: att.thumbnail_url
            }))
        }

        return NextResponse.json({
            success: true,
            message: formattedMessage
        })
    } catch (error) {
        console.error('Error fetching message:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/chat/rooms/[roomId]/messages/[messageId]
 * Xóa tin nhắn (chỉ người gửi). Soft delete: set deleted_at.
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ roomId: string; messageId: string }> }
) {
    try {
        const user = await getAuthenticatedUser(request)
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { roomId, messageId } = await context.params

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

        const message = await prisma.chat_messages.findFirst({
            where: { id: messageId, room_id: roomId, deleted_at: null }
        })
        if (!message) {
            return NextResponse.json({ error: 'Message not found' }, { status: 404 })
        }
        if (message.sender_id !== user.id) {
            return NextResponse.json({ error: 'Chỉ có thể xóa tin nhắn của bạn' }, { status: 403 })
        }

        await prisma.chat_messages.update({
            where: { id: messageId },
            data: { deleted_at: new Date() }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting message:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
