'use server';

import { prisma } from '@/lib/prisma';

export async function getChatRooms(userId: string) {
  try {
    const rooms = await prisma.chat_rooms.findMany({
      where: {
        deleted_at: null,
        chat_participants: {
          some: {
            user_id: userId,
            is_active: true,
          },
        },
      },
      include: {
        chat_participants: {
          where: { is_active: true },
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
        },
        chat_messages: {
          where: { deleted_at: null },
          orderBy: { created_at: 'desc' },
          take: 1,
          include: {
            users: {
              select: {
                id: true,
                full_name: true,
              },
            },
          },
        },
        _count: {
          select: {
            chat_messages: {
              where: {
                deleted_at: null,
              },
            },
          },
        },
      },
      orderBy: {
        updated_at: 'desc',
      },
    });

    // Optimize: Batch query unread counts instead of N+1 queries
    const roomIds = rooms.map(r => r.id);
    const participantsMap = new Map(
      rooms.flatMap(r => 
        r.chat_participants
          .filter(p => p.user_id === userId)
          .map(p => [r.id, p.last_read_at || new Date(0)])
      )
    );

    // Batch query all unread counts at once
    const unreadCounts = await Promise.all(
      roomIds.map(async (roomId) => {
        const lastReadAt = participantsMap.get(roomId) || new Date(0);
        const count = await prisma.chat_messages.count({
          where: {
            room_id: roomId,
            created_at: { gt: lastReadAt },
            sender_id: { not: userId },
            deleted_at: null,
          },
        });
        return { roomId, count };
      })
    );

    const unreadCountMap = new Map(unreadCounts.map(u => [u.roomId, u.count]));

    // Map results with unread counts
    const roomsWithUnreadCount = rooms.map((room) => ({
      ...room,
      unreadCount: unreadCountMap.get(room.id) || 0,
      lastMessage: room.chat_messages[0] || null,
    }));

    return {
      success: true,
      data: roomsWithUnreadCount,
    };
  } catch (error: unknown) {
    console.error('Error getting chat rooms:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getChatMessages(roomId: string, userId: string, limit = 50, cursor?: string) {
  try {
    // Kiểm tra quyền truy cập phòng
    const participant = await prisma.chat_participants.findFirst({
      where: {
        room_id: roomId,
        user_id: userId,
        is_active: true,
      },
    });

    if (!participant) {
      throw new Error('Bạn không có quyền xem tin nhắn trong phòng này');
    }

    const messages = await prisma.chat_messages.findMany({
      where: {
        room_id: roomId,
        deleted_at: null,
        ...(cursor && {
          id: {
            lt: cursor,
          },
        }),
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
        chat_attachments: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: limit,
    });

    return {
      success: true,
      data: messages.reverse(), // Đảo ngược để hiển thị từ cũ đến mới
      nextCursor: messages.length === limit ? messages[messages.length - 1].id : null,
    };
  } catch (error: unknown) {
    console.error('Error getting messages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getRoomParticipants(roomId: string) {
  try {
    const participants = await prisma.chat_participants.findMany({
      where: {
        room_id: roomId,
        is_active: true,
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            avatar_url: true,
            role: true,
            email: true,
            phone_number: true,
          },
        },
      },
    });

    return {
      success: true,
      data: participants,
    };
  } catch (error: unknown) {
    console.error('Error getting participants:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getRoomMedia(roomId: string, userId: string) {
  try {
    // Kiểm tra quyền truy cập
    const participant = await prisma.chat_participants.findFirst({
      where: {
        room_id: roomId,
        user_id: userId,
        is_active: true,
      },
    });

    if (!participant) {
      throw new Error('Bạn không có quyền xem media trong phòng này');
    }

    const attachments = await prisma.chat_attachments.findMany({
      where: {
        chat_messages: {
          room_id: roomId,
          deleted_at: null,
        },
      },
      include: {
        chat_messages: {
          include: {
            users: {
              select: {
                id: true,
                full_name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Phân loại media
    const images = attachments.filter((att) => att.file_type.startsWith('image/'));
    const files = attachments.filter((att) => !att.file_type.startsWith('image/'));

    // Trích xuất links từ messages
    const messages = await prisma.chat_messages.findMany({
      where: {
        room_id: roomId,
        deleted_at: null,
        content: {
          contains: 'http',
        },
      },
      select: {
        id: true,
        content: true,
        created_at: true,
        users: {
          select: {
            id: true,
            full_name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Extract URLs từ content
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links = messages
      .map((msg) => {
        const urls = msg.content?.match(urlRegex) || [];
        return urls.map((url) => ({
          url,
          messageId: msg.id,
          sender: msg.users,
          sentAt: msg.created_at,
        }));
      })
      .flat();

    return {
      success: true,
      data: {
        images,
        files,
        links,
      },
    };
  } catch (error: unknown) {
    console.error('Error getting room media:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
