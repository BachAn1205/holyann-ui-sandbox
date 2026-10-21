import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth/get-user'
import { requirePremium } from '@/lib/api/require-premium'

/**
 * POST /api/chat/rooms/[roomId]/read
 * Mark the current participant as having read the active room.
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ roomId: string }> }
) {
    try {
        const user = await getAuthenticatedUser(request)

        if (!user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { roomId } = await context.params

        const participant = await prisma.chat_participants.findFirst({
            where: {
                room_id: roomId,
                user_id: user.id,
                is_active: true
            },
            select: {
                id: true
            }
        })

        if (!participant) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            )
        }

        await prisma.chat_participants.update({
            where: {
                id: participant.id
            },
            data: {
                last_read_at: new Date()
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error marking room as read:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to mark room as read',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
