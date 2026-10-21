import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requirePremium } from '@/lib/api/require-premium';

export async function GET(request: NextRequest) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const userId = decoded.userId;
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const conversations = user.role === 'STUDENT' || user.role === 'ADMIN'
            ? await prisma.chat_rooms.findMany({
                where: {
                    student_id: userId,
                    status: 'ACTIVE',
                    deleted_at: null,
                },
                include: {
                    users: {
                        select: {
                            id: true,
                            full_name: true,
                            email: true,
                            avatar_url: true,
                            students: {
                                select: {
                                    current_grade: true,
                                    target_faculty_name: true,
                                    target_university_name: true,
                                },
                            },
                        },
                    },
                    chat_participants: {
                        where: {
                            user_id: { not: userId },
                            is_active: true,
                        },
                        include: {
                            users: {
                                select: {
                                    id: true,
                                    full_name: true,
                                    email: true,
                                    avatar_url: true,
                                    role: true,
                                },
                            },
                        },
                    },
                    chat_messages: {
                        orderBy: { created_at: 'desc' },
                        take: 1,
                        select: {
                            id: true,
                            content: true,
                            created_at: true,
                            sender_id: true,
                        },
                    },
                    _count: {
                        select: {
                            chat_messages: {
                                where: {
                                    sender_id: { not: userId },
                                },
                            },
                        },
                    },
                },
                orderBy: { updated_at: 'desc' },
            })
            : await prisma.chat_rooms.findMany({
                where: {
                    chat_participants: {
                        some: {
                            user_id: userId,
                            is_active: true,
                        },
                    },
                    status: 'ACTIVE',
                    deleted_at: null,
                },
                include: {
                    users: {
                        select: {
                            id: true,
                            full_name: true,
                            email: true,
                            avatar_url: true,
                            students: {
                                select: {
                                    current_grade: true,
                                    target_faculty_name: true,
                                    target_university_name: true,
                                },
                            },
                        },
                    },
                    chat_participants: {
                        where: {
                            user_id: { not: userId },
                            is_active: true,
                        },
                        include: {
                            users: {
                                select: {
                                    id: true,
                                    full_name: true,
                                    email: true,
                                    avatar_url: true,
                                    role: true,
                                },
                            },
                        },
                    },
                    chat_messages: {
                        orderBy: { created_at: 'desc' },
                        take: 1,
                        select: {
                            id: true,
                            content: true,
                            created_at: true,
                            sender_id: true,
                        },
                    },
                    _count: {
                        select: {
                            chat_messages: {
                                where: {
                                    sender_id: { not: userId },
                                },
                            },
                        },
                    },
                },
                orderBy: { updated_at: 'desc' },
            });

        const formattedConversations = conversations
            .map((conv) => {
                const participant = user.role === 'STUDENT' || user.role === 'ADMIN'
                    ? conv.chat_participants[0]?.users
                    : conv.users;
                const participantRole = participant && 'role' in participant
                    ? participant.role
                    : (user.role === 'MENTOR' ? 'STUDENT' : 'MENTOR');

                return {
                    id: conv.id,
                    participant: participant ? {
                        id: participant.id,
                        name: participant.full_name,
                        email: participant.email,
                        avatar: participant.avatar_url,
                        role: participantRole,
                        ...(user.role === 'MENTOR' && conv.users && 'students' in conv.users ? {
                            grade: conv.users.students?.current_grade,
                            targetCountry: conv.users.students?.target_university_name ?? null,
                        } : {}),
                    } : null,
                    lastMessage: conv.chat_messages[0]?.content || '',
                    lastMessageTime: conv.chat_messages[0]?.created_at || conv.created_at,
                    unreadCount: conv._count.chat_messages,
                    createdAt: conv.created_at,
                    updatedAt: conv.updated_at,
                };
            })
            .filter((conv) => conv.participant !== null);

        return NextResponse.json({
            conversations: formattedConversations,
            userRole: user.role,
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const forbidden = await requirePremium(request);
        if (forbidden) return forbidden;

        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const userId = decoded.userId;
        const { mentorId, studentId } = await request.json();

        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let finalStudentId = studentId;
        let finalMentorId = mentorId;

        if (user.role === 'STUDENT') {
            finalStudentId = userId;
            if (!mentorId) {
                return NextResponse.json({ error: 'Mentor ID is required' }, { status: 400 });
            }
        } else if (user.role === 'MENTOR') {
            finalMentorId = userId;
            if (!studentId) {
                return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
            }
        } else {
            return NextResponse.json({ error: 'Invalid user role' }, { status: 403 });
        }

        const assignment = await prisma.mentor_assignments.findFirst({
            where: {
                mentor_id: finalMentorId,
                student_id: finalStudentId,
                status: 'ACTIVE',
            },
            select: { id: true },
        });

        if (!assignment) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const existingRoom = await prisma.chat_rooms.findFirst({
            where: {
                student_id: finalStudentId,
                chat_participants: {
                    some: {
                        user_id: finalMentorId,
                        is_active: true,
                    },
                },
                status: 'ACTIVE',
                deleted_at: null,
            },
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        avatar_url: true,
                    },
                },
                chat_participants: {
                    where: { is_active: true },
                    include: {
                        users: {
                            select: {
                                id: true,
                                full_name: true,
                                email: true,
                                avatar_url: true,
                            },
                        },
                    },
                },
            },
        });

        if (existingRoom) {
            const mentorParticipant = existingRoom.chat_participants.find((p) => p.user_id === finalMentorId);
            return NextResponse.json({
                conversation: {
                    id: existingRoom.id,
                    student: existingRoom.users || null,
                    mentor: mentorParticipant?.users || null,
                },
                message: 'Conversation already exists',
            });
        }

        const { randomUUID } = await import('crypto');
        const roomId = randomUUID();
        const newRoom = await prisma.chat_rooms.create({
            data: {
                id: roomId,
                name: `Chat ${finalStudentId.substring(0, 8)}-${finalMentorId.substring(0, 8)}`,
                type: 'PRIVATE',
                status: 'ACTIVE',
                student_id: finalStudentId,
                chat_participants: {
                    create: [
                        { id: randomUUID(), user_id: finalStudentId, is_active: true },
                        { id: randomUUID(), user_id: finalMentorId, is_active: true },
                    ],
                },
            },
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        avatar_url: true,
                    },
                },
                chat_participants: {
                    where: { is_active: true },
                    include: {
                        users: {
                            select: {
                                id: true,
                                full_name: true,
                                email: true,
                                avatar_url: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            conversation: {
                id: newRoom.id,
                student: newRoom.users,
                mentor: newRoom.chat_participants.find((p) => p.user_id === finalMentorId)?.users,
            },
            message: 'Conversation created successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating conversation:', error);
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }
}


