import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth/get-user'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const authUser = await getAuthenticatedUser(request)

        if (!authUser?.id) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const admin = await prisma.users.findUnique({
            where: { id: authUser.id },
            select: { id: true, role: true }
        })

        if (!admin || admin.role !== 'ADMIN') {
            return NextResponse.json(
                { success: false, error: 'Access denied' },
                { status: 403 }
            )
        }

        // Fetch support rooms where the admin is a participant or joined
        const rooms = await prisma.chat_rooms.findMany({
            where: {
                type: 'SUPPORT',
                deleted_at: null
            },
            include: {
                chat_participants: {
                    where: { user_id: admin.id }
                }
            }
        })

        let totalUnreadCount = 0

        for (const room of rooms) {
            const adminParticipant = room.chat_participants[0] // Since we filtered by user_id in include

            const unreadCount = await prisma.chat_messages.count({
                where: {
                    room_id: room.id,
                    sender_id: { not: admin.id },
                    deleted_at: null,
                    ...(adminParticipant?.last_read_at
                        ? { created_at: { gt: adminParticipant.last_read_at } }
                        : {})
                }
            })
            totalUnreadCount += unreadCount
        }

        return NextResponse.json({
            success: true,
            totalUnreadCount
        })

    } catch (error) {
        console.error('Error fetching total unread count:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch unread count',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
