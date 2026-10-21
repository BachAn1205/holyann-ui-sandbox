import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth/get-user'

export const dynamic = 'force-dynamic'

function isAdminRole(role: string | null | undefined) {
    return role?.toUpperCase() === 'ADMIN'
}

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
            select: {
                id: true,
                role: true,
                is_active: true
            }
        })

        if (!admin || !admin.is_active || !isAdminRole(admin.role)) {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            )
        }

        const rooms = await prisma.chat_rooms.findMany({
            where: {
                type: 'SUPPORT',
                deleted_at: null
            },
            include: {
                chat_participants: {
                    where: {
                        is_active: true
                    },
                    include: {
                        users: {
                            select: {
                                id: true,
                                full_name: true,
                                email: true,
                                avatar_url: true,
                                role: true
                            }
                        }
                    }
                },
                chat_messages: {
                    where: {
                        deleted_at: null
                    },
                    orderBy: {
                        created_at: 'desc'
                    },
                    take: 1,
                    include: {
                        users: {
                            select: {
                                id: true,
                                full_name: true,
                                email: true,
                                avatar_url: true,
                                role: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                updated_at: 'desc'
            }
        })

        const supportRooms = await Promise.all(rooms.map(async (room) => {
            const studentParticipant =
                room.chat_participants.find((participant) => participant.users.role === 'STUDENT') ??
                room.chat_participants.find((participant) => participant.user_id === room.student_id)
            const adminParticipant = room.chat_participants.find((participant) => participant.user_id === admin.id)
            const lastMessage = room.chat_messages[0] ?? null

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

            return {
                id: room.id,
                roomId: room.id,
                name: room.name,
                type: room.type,
                status: room.status,
                studentId: room.student_id,
                supportEmailSent: room.support_email_sent,
                createdAt: room.created_at,
                updatedAt: room.updated_at,
                student: studentParticipant
                    ? {
                        id: studentParticipant.users.id,
                        name: studentParticipant.users.full_name,
                        email: studentParticipant.users.email,
                        avatar: studentParticipant.users.avatar_url,
                        role: studentParticipant.users.role
                    }
                    : null,
                lastMessage: lastMessage
                    ? {
                        id: lastMessage.id,
                        content: lastMessage.content,
                        type: lastMessage.type,
                        createdAt: lastMessage.created_at,
                        sender: {
                            id: lastMessage.users.id,
                            name: lastMessage.users.full_name,
                            email: lastMessage.users.email,
                            avatar: lastMessage.users.avatar_url,
                            role: lastMessage.users.role
                        }
                    }
                    : null,
                unreadCount,
                participants: room.chat_participants.map((participant) => ({
                    id: participant.users.id,
                    name: participant.users.full_name,
                    email: participant.users.email,
                    avatar: participant.users.avatar_url,
                    role: participant.users.role
                }))
            }
        }))

        return NextResponse.json({
            success: true,
            rooms: supportRooms,
            count: supportRooms.length
        })
    } catch (error) {
        console.error('Error fetching support rooms:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch support rooms',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
