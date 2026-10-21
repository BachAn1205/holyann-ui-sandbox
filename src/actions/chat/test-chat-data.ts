'use server';

import { prisma } from '@/lib/prisma';

export async function testChatData() {
    try {
        // Get chat rooms
        const rooms = await prisma.chat_rooms.findMany({
            include: {
                chat_participants: {
                    include: {
                        users: {
                            select: {
                                email: true,
                                full_name: true
                            }
                        }
                    }
                },
                chat_messages: {
                    orderBy: {
                        created_at: 'desc'
                    },
                    take: 1
                }
            }
        });

        return {
            success: true,
            data: rooms
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
