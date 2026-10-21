import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth/get-user'

/**
 * GET /api/chat/rooms/[roomId]/messages
 * Lấy messages của một room
 */
export async function GET(
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

        const userId = user.id
        const { roomId } = await context.params

        // Verify user is participant of this room
        let participant = await prisma.chat_participants.findFirst({
            where: {
                room_id: roomId,
                user_id: userId,
                is_active: true
            }
        })

        if (!participant) {
            const adminUser = await prisma.users.findUnique({
                where: { id: userId },
                select: { role: true, is_active: true }
            })

            if (adminUser?.is_active && adminUser.role === 'ADMIN') {
                const supportRoom = await prisma.chat_rooms.findFirst({
                    where: {
                        id: roomId,
                        type: 'SUPPORT',
                        deleted_at: null
                    },
                    select: { id: true }
                })

                if (supportRoom) {
                    participant = await prisma.chat_participants.upsert({
                        where: {
                            room_id_user_id: {
                                room_id: roomId,
                                user_id: userId
                            }
                        },
                        create: {
                            id: crypto.randomUUID(),
                            room_id: roomId,
                            user_id: userId,
                            is_active: true
                        },
                        update: {
                            is_active: true,
                            left_at: null
                        }
                    })
                }
            }

            if (!participant) {
                return NextResponse.json(
                    { error: 'Access denied' },
                    { status: 403 }
                )
            }
        }

        // Get messages
        const messages = await prisma.chat_messages.findMany({
            where: {
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
            },
            orderBy: {
                created_at: 'asc'
            }
        })

        // Format messages
        const formattedMessages = messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            type: msg.type,
            createdAt: msg.created_at,
            updatedAt: msg.updated_at,
            isEdited: msg.is_edited,
            sender: {
                id: msg.users.id,
                name: msg.users.full_name,
                avatar: msg.users.avatar_url,
                role: msg.users.role
            },
            isFromMe: msg.sender_id === userId,
            attachments: msg.chat_attachments.map(att => ({
                id: att.id,
                url: att.file_url,
                name: att.file_name,
                type: att.file_type,
                size: att.file_size ? Number(att.file_size) : null,
                thumbnail: att.thumbnail_url
            }))
        }))

        // Update last_read_at for current user
        await prisma.chat_participants.update({
            where: {
                id: participant.id
            },
            data: {
                last_read_at: new Date()
            }
        })

        // Get other participant's last_read_at
        const otherParticipant = await prisma.chat_participants.findFirst({
            where: {
                room_id: roomId,
                user_id: { not: userId },
                is_active: true
            },
            select: { last_read_at: true }
        })

        return NextResponse.json({
            success: true,
            messages: formattedMessages,
            count: formattedMessages.length,
            otherParticipantLastReadAt: otherParticipant?.last_read_at || null
        })

    } catch (error) {
        console.error('Error fetching messages:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch messages',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

/**
 * POST /api/chat/rooms/[roomId]/messages
 * Gửi message mới
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

        const userId = user.id
        const { roomId } = await context.params
        const body = await request.json()
        const { content, type = 'TEXT', attachments = [] } = body

        // Verify user is participant
        let participant = await prisma.chat_participants.findFirst({
            where: {
                room_id: roomId,
                user_id: userId,
                is_active: true
            }
        })

        if (!participant) {
            if (user.role === 'ADMIN') {
                const supportRoom = await prisma.chat_rooms.findFirst({
                    where: {
                        id: roomId,
                        type: 'SUPPORT',
                        deleted_at: null,
                        status: 'ACTIVE'
                    },
                    select: {
                        id: true
                    }
                })

                if (supportRoom) {
                    participant = await prisma.chat_participants.upsert({
                        where: {
                            room_id_user_id: {
                                room_id: roomId,
                                user_id: userId
                            }
                        },
                        create: {
                            id: crypto.randomUUID(),
                            room_id: roomId,
                            user_id: userId,
                            is_active: true
                        },
                        update: {
                            is_active: true,
                            left_at: null
                        }
                    })
                }
            }

            if (!participant) {
                return NextResponse.json(
                    { error: 'Access denied' },
                    { status: 403 }
                )
            }
        }

        // Validate content
        if (!content && (!attachments || attachments.length === 0)) {
            return NextResponse.json(
                { error: 'Message content or attachments required' },
                { status: 400 }
            )
        }

        // Create message
        const message = await prisma.chat_messages.create({
            data: {
                id: crypto.randomUUID(),
                room_id: roomId,
                sender_id: userId,
                content,
                type,
                chat_attachments: attachments.length > 0 ? {
                    createMany: {
                        data: attachments.map((att: any) => ({
                            id: crypto.randomUUID(),
                            file_url: att.url,
                            file_name: att.name,
                            file_type: att.type,
                            file_size: att.size ? BigInt(att.size) : null,
                            thumbnail_url: att.thumbnail || null
                        }))
                    }
                } : undefined
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
                chat_attachments: true
            }
        })

        // Update room's updated_at
        await prisma.chat_rooms.update({
            where: { id: roomId },
            data: { updated_at: new Date() }
        })

        const formattedMessage = {
            id: message.id,
            content: message.content,
            type: message.type,
            createdAt: message.created_at,
            sender: {
                id: message.users.id,
                name: message.users.full_name,
                avatar: message.users.avatar_url,
                role: message.users.role
            },
            attachments: message.chat_attachments.map(att => ({
                id: att.id,
                url: att.file_url,
                name: att.file_name,
                type: att.file_type,
                size: att.file_size ? Number(att.file_size) : null,
                thumbnail: att.thumbnail_url
            }))
        }

        // Trigger server-side Supabase realtime broadcast
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (supabaseUrl && supabaseServiceKey) {
            try {
                const { createClient } = await import('@supabase/supabase-js')
                const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
                const channel = supabaseAdmin.channel(`room:${roomId}`)
                
                channel.subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        channel.send({
                            type: 'broadcast',
                            event: 'new_message',
                            payload: {
                                roomId,
                                message: formattedMessage,
                                senderId: userId
                            }
                        }).then(() => {
                            supabaseAdmin.removeChannel(channel)
                        })
                    }
                })
            } catch (err) {
                console.error('Failed to send server-side socket broadcast:', err)
            }
        }

        return NextResponse.json({
            success: true,
            message: formattedMessage
        })

    } catch (error) {
        console.error('Error sending message:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to send message',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
