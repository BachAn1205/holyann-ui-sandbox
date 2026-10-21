import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';

/**
 * POST /api/chat/test-message
 * Endpoint để test Supabase Realtime - tạo một tin nhắn test
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    // Tìm room đầu tiên mà user là participant (để test)
    const participant = await prisma.chat_participants.findFirst({
      where: {
        user_id: session.user.id,
        is_active: true,
      },
      select: {
        room_id: true,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'No chat room found. Please create a chat room first.' },
        { status: 404 }
      );
    }

    // Tạo test message
    const message = await prisma.chat_messages.create({
      data: {
        id: randomUUID(),
        room_id: participant.room_id,
        sender_id: session.user.id,
        content: content || 'Test message from Realtime Test',
        type: 'TEXT',
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
            role: true,
          },
        },
      },
    });


    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        roomId: message.room_id,
        createdAt: message.created_at,
      },
    });
  } catch (error) {
    console.error('❌ Error creating test message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
