import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { roomId } = await context.params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'images';

    // Verify user is participant in this room
    const participant = await prisma.chat_participants.findFirst({
      where: {
        room_id: roomId,
        user_id: session.user.id,
        is_active: true,
      },
    });

    if (!participant) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Fetch attachments based on type
    let whereClause: any = {
      chat_messages: {
        room_id: roomId,
        deleted_at: null,
      },
    };

    if (type === 'links') {
      // Links: extract from message content
      const messages = await prisma.chat_messages.findMany({
        where: {
          room_id: roomId,
          deleted_at: null,
          content: { not: null },
        },
        include: {
          users: {
            select: {
              full_name: true,
              avatar_url: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        take: 200,
      });

      const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
      const seen = new Set<string>();
      const items: Array<{
        id: string;
        url: string;
        name: string;
        type: string;
        size: null;
        thumbnail: null;
        createdAt: Date;
        sender: { name: string; avatar: string | null };
      }> = [];

      for (const msg of messages) {
        if (!msg.content) continue;
        const matches = msg.content.match(URL_REGEX) || [];
        for (const rawUrl of matches) {
          const url = rawUrl.replace(/[.,;:!?)]+$/, '').trim();
          if (!url || seen.has(url)) continue;
          seen.add(url);
          const displayName = url.length > 60 ? url.slice(0, 60) + '...' : url;
          items.push({
            id: `link-${msg.id}-${url.slice(0, 20)}`,
            url: url.startsWith('www.') ? 'https://' + url : url,
            name: displayName,
            type: 'LINK',
            size: null,
            thumbnail: null,
            createdAt: msg.created_at,
            sender: {
              name: msg.users.full_name,
              avatar: msg.users.avatar_url,
            },
          });
        }
      }

      return NextResponse.json({ success: true, items });
    }

    if (type === 'images') {
      whereClause.file_type = {
        startsWith: 'image/',
      };
    } else if (type === 'files') {
      whereClause.file_type = {
        not: {
          startsWith: 'image/',
        },
      };
    }

    const attachments = await prisma.chat_attachments.findMany({
      where: whereClause,
      include: {
        chat_messages: {
          include: {
            users: {
              select: {
                full_name: true,
                avatar_url: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 100,
    });

    const items = attachments.map((attachment) => ({
      id: attachment.id,
      url: attachment.file_url,
      name: attachment.file_name,
      type: attachment.file_type,
      size: attachment.file_size ? Number(attachment.file_size) : null,
      thumbnail: attachment.thumbnail_url,
      createdAt: attachment.created_at,
      sender: {
        name: attachment.chat_messages.users.full_name,
        avatar: attachment.chat_messages.users.avatar_url,
      },
    }));

    return NextResponse.json({
      success: true,
      items,
    });
  } catch (error: any) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
