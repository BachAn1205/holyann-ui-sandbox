'use server'

import { prisma } from '@/lib/prisma'

interface FileData {
  url: string
  name: string
  size: number
  type: string
  thumbnail?: string | null
}

interface SendMessageResult {
  success: boolean
  message?: any
  error?: string
}

/**
 * Server Action: Send message with optional attachment
 * Supports TEXT, IMAGE, FILE, LINK message types
 */
export async function sendMessageWithAttachment(
  roomId: string,
  senderId: string,
  content: string | null,
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'LINK',
  fileData?: FileData
): Promise<SendMessageResult> {
  try {
    // Validate required fields
    if (!roomId || !senderId) {
      return {
        success: false,
        error: 'Room ID and Sender ID are required',
      }
    }

    // Validate that either content or fileData exists
    if (!content && !fileData) {
      return {
        success: false,
        error: 'Message must have either content or attachment',
      }
    }

    // Verify user is a participant in this room
    const participant = await prisma.chat_participants.findFirst({
      where: {
        room_id: roomId,
        user_id: senderId,
        is_active: true,
      },
    })

    if (!participant) {
      return {
        success: false,
        error: 'User is not a participant of this chat room',
      }
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create chat message
      const message = await tx.chat_messages.create({
        data: {
          id: crypto.randomUUID(),
          room_id: roomId,
          sender_id: senderId,
          content: content || null,
          type: type,
        },
      })

      // 2. Create attachment if fileData provided
      let attachment = null
      if (fileData) {
        attachment = await tx.chat_attachments.create({
          data: {
            id: crypto.randomUUID(),
            message_id: message.id,
            file_url: fileData.url,
            file_name: fileData.name,
            file_type: fileData.type,
            file_size: fileData.size,
            thumbnail_url: fileData.thumbnail || null,
          },
        })
      }

      // 3. Update room's updated_at timestamp
      await tx.chat_rooms.update({
        where: { id: roomId },
        data: { updated_at: new Date() },
      })

      // 4. Fetch complete message with relations
      return await tx.chat_messages.findUnique({
        where: { id: message.id },
        include: {
          users: {
            select: {
              id: true,
              full_name: true,
              avatar_url: true,
              role: true,
            },
          },
          chat_attachments: {
            select: {
              id: true,
              file_url: true,
              file_name: true,
              file_type: true,
              file_size: true,
              thumbnail_url: true,
            },
          },
        },
      })
    })

    if (!result) {
      throw new Error('Failed to fetch created message')
    }

    // Format response
    const formattedMessage = {
      id: result.id,
      content: result.content,
      type: result.type,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      isEdited: result.is_edited,
      sender: {
        id: result.users.id,
        name: result.users.full_name,
        avatar: result.users.avatar_url,
        role: result.users.role,
      },
      isFromMe: true,
      attachments: result.chat_attachments.map((att) => ({
        id: att.id,
        url: att.file_url,
        name: att.file_name,
        type: att.file_type,
        size: att.file_size ? Number(att.file_size) : null,
        thumbnail: att.thumbnail_url,
      })),
    }

    return {
      success: true,
      message: formattedMessage,
    }
  } catch (error) {
    console.error('❌ [sendMessageWithAttachment] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
    }
  }
}

/**
 * Helper: Get file type category from MIME type
 */
export async function getMessageTypeFromMime(mimeType: string): Promise<'IMAGE' | 'FILE'> {
  if (mimeType.startsWith('image/')) {
    return 'IMAGE'
  }
  return 'FILE'
}

// ============================================================
// MEETING MESSAGE
// ============================================================

export interface MeetingMessagePayload {
  meetingId: string;
  title: string;
  startTime: string;
  endTime: string;
  meetLink: string | null;
  hostMeetLink: string | null;
}

/**
 * Send a MEETING reminder as a special TEXT message.
 * Content is stored as: `__MEETING__{"meetingId":"...","title":"...","startTime":"...","endTime":"...","meetLink":"...","hostMeetLink":"..."}`
 * Client-side detects the prefix and renders a meeting bubble.
 */
export async function sendMeetingMessage(
  roomId: string,
  senderId: string,
  payload: MeetingMessagePayload
): Promise<SendMessageResult> {
  const content = `__MEETING__${JSON.stringify(payload)}`;
  try {
    if (!roomId || !senderId) {
      return { success: false, error: 'Room ID and Sender ID are required' };
    }

    const participant = await prisma.chat_participants.findFirst({
      where: { room_id: roomId, user_id: senderId, is_active: true },
    });

    if (!participant) {
      return { success: false, error: 'User is not a participant of this chat room' };
    }

    const result = await prisma.$transaction(async (tx) => {
      const message = await tx.chat_messages.create({
        data: {
          id: crypto.randomUUID(),
          room_id: roomId,
          sender_id: senderId,
          content,
          type: 'TEXT', // stored as TEXT, detected by __MEETING__ prefix
        },
      });

      await tx.chat_rooms.update({
        where: { id: roomId },
        data: { updated_at: new Date() },
      });

      return await tx.chat_messages.findUnique({
        where: { id: message.id },
        include: {
          users: {
            select: { id: true, full_name: true, avatar_url: true, role: true },
          },
          chat_attachments: true,
        },
      });
    });

    if (!result) throw new Error('Failed to create meeting message');

    return {
      success: true,
      message: {
        id: result.id,
        content: result.content,
        type: 'MEETING', // override for client
        createdAt: result.created_at,
        updatedAt: result.updated_at,
        isEdited: result.is_edited,
        sender: {
          id: result.users.id,
          name: result.users.full_name,
          avatar: result.users.avatar_url,
          role: result.users.role,
        },
        isFromMe: true,
        attachments: [],
      },
    };
  } catch (error) {
    console.error('❌ [sendMeetingMessage] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send' };
  }
}
