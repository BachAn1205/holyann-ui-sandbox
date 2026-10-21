// API: GET /api/chat/messages/[conversationId] - Get messages for a conversation
// API: POST /api/chat/messages/[conversationId] - Send a new message
// API: PATCH /api/chat/messages/[conversationId] - Mark messages as read

import {NextRequest, NextResponse} from 'next/server';
import {verifyToken} from '@/lib/auth';
import {prisma} from '@/lib/prisma';

// GET - Get all messages for a conversation
export async function GET(
    request: NextRequest,
    {params}: { params: Promise<{ conversationId: string }> }
) {
    try {
        const { conversationId } = await params
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401});
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({error: 'Invalid token'}, {status: 401});
        }

        const userId = decoded.userId;

        // Verify user has access to this room
        const room = await prisma.chat_rooms.findFirst({
            where: {
                id: conversationId,
                OR: [
                    {student_id: userId},
                    {chat_participants: {some: {user_id: userId, is_active: true}}}
                ],
                status: 'ACTIVE',
                deleted_at: null
            }
        });

        if (!room) {
            return NextResponse.json({error: 'Conversation not found'}, {status: 404});
        }

        // Get messages with pagination
        const {searchParams} = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        const messages = await prisma.chat_messages.findMany({
            where: {
                room_id: conversationId,
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
                        file_type: true
                    }
                }
            },
            orderBy: {created_at: 'asc'},
            skip,
            take: limit
        });

        const totalMessages = await prisma.chat_messages.count({
            where: {
                room_id: conversationId,
                deleted_at: null
            }
        });

        // Format messages
        const formattedMessages = messages.map(msg => ({
            id: msg.id,
            senderId: msg.sender_id,
            senderName: msg.users.full_name,
            senderAvatar: msg.users.avatar_url,
            senderRole: msg.users.role,
            content: msg.content,
            messageType: msg.type,
            attachmentUrl: msg.chat_attachments[0]?.file_url || null,
            attachments: msg.chat_attachments.map(att => ({
                id: att.id,
                url: att.file_url,
                name: att.file_name,
                type: att.file_type
            })),
            timestamp: msg.created_at,
            isRead: true, // Note: is_read field doesn't exist in schema, using true as default
            isMine: msg.sender_id === userId
        }));

        return NextResponse.json({
            messages: formattedMessages,
            pagination: {
                page,
                limit,
                total: totalMessages,
                totalPages: Math.ceil(totalMessages / limit)
            }
        });

    } catch (error: unknown) {
        console.error('Error fetching messages:', error);
        return NextResponse.json(
            {error: error instanceof Error ? error.message : 'Failed to fetch messages'},
            {status: 500}
        );
    }
}

// POST - Send a new message
export async function POST(
    request: NextRequest,
    {params}: { params: Promise<{ conversationId: string }> }
) {
    try {
        const { conversationId } = await params
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401});
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({error: 'Invalid token'}, {status: 401});
        }

        const userId = decoded.userId;
        const {content, messageType = 'TEXT', attachmentUrl} = await request.json();

        if (!content || content.trim() === '') {
            return NextResponse.json({error: 'Message content is required'}, {status: 400});
        }

        // Verify user has access to this room
        const room = await prisma.chat_rooms.findFirst({
            where: {
                id: conversationId,
                OR: [
                    {student_id: userId},
                    {chat_participants: {some: {user_id: userId, is_active: true}}}
                ],
                status: 'ACTIVE',
                deleted_at: null
            }
        });

        if (!room) {
            return NextResponse.json({error: 'Conversation not found'}, {status: 404});
        }

        // Create new message
        const {randomUUID} = await import('crypto');
        const messageId = randomUUID();
        
        // Create message with optional attachment
        const messageData: any = {
            id: messageId,
            room_id: conversationId,
            sender_id: userId,
            content: content.trim(),
            type: messageType
        };

        // Create attachment if provided (before creating message)
        if (attachmentUrl) {
            const attachmentId = randomUUID();
            messageData.chat_attachments = {
                create: {
                    id: attachmentId,
                    file_url: attachmentUrl,
                    file_name: attachmentUrl.split('/').pop() || 'attachment',
                    file_type: messageType === 'IMAGE' ? 'image' : 'file'
                }
            };
        }

        const newMessage = await prisma.chat_messages.create({
            data: messageData,
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
                        file_type: true
                    }
                }
            }
        });

        // Update room's updated_at
        await prisma.chat_rooms.update({
            where: {id: conversationId},
            data: {
                updated_at: new Date()
            }
        });

        // Format response
        const formattedMessage = {
            id: newMessage.id,
            senderId: newMessage.sender_id,
            senderName: newMessage.users.full_name,
            senderAvatar: newMessage.users.avatar_url,
            senderRole: newMessage.users.role,
            content: newMessage.content,
            messageType: newMessage.type,
            attachmentUrl: attachmentUrl || null,
            attachments: newMessage.chat_attachments.map(att => ({
                id: att.id,
                url: att.file_url,
                name: att.file_name,
                type: att.file_type
            })),
            timestamp: newMessage.created_at,
            isRead: true,
            isMine: true
        };

        return NextResponse.json({
            message: formattedMessage,
            success: true
        }, {status: 201});

    } catch (error: unknown) {
        console.error('Error sending message:', error);
        return NextResponse.json(
            {error: error instanceof Error ? error.message : 'Failed to send message'},
            {status: 500}
        );
    }
}

// PATCH - Mark messages as read
export async function PATCH(
    request: NextRequest,
    {params}: { params: Promise<{ conversationId: string }> }
) {
    try {
        const { conversationId } = await params
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({error: 'Unauthorized'}, {status: 401});
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({error: 'Invalid token'}, {status: 401});
        }

        const userId = decoded.userId;

        // Verify user has access to this room
        const room = await prisma.chat_rooms.findFirst({
            where: {
                id: conversationId,
                OR: [
                    {student_id: userId},
                    {chat_participants: {some: {user_id: userId, is_active: true}}}
                ],
                status: 'ACTIVE',
                deleted_at: null
            }
        });

        if (!room) {
            return NextResponse.json({error: 'Conversation not found'}, {status: 404});
        }

        // Update participant's last_read_at (since is_read field doesn't exist in messages)
        await prisma.chat_participants.updateMany({
            where: {
                room_id: conversationId,
                user_id: userId,
                is_active: true
            },
            data: {
                last_read_at: new Date()
            }
        });

        // Return success (note: is_read field doesn't exist in schema, using last_read_at instead)
        const result = {count: 1};

        return NextResponse.json({
            success: true,
            updatedCount: result.count
        });

    } catch (error: unknown) {
        console.error('Error marking messages as read:', error);
        return NextResponse.json(
            {error: error instanceof Error ? error.message : 'Failed to mark messages as read'},
            {status: 500}
        );
    }
}
