'use server';

import { prisma } from '@/lib/prisma';
import { MessageType } from '@prisma/client';
import { sendChatNotificationEmail } from '@/lib/email/chat-notification';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface SendMessageInput {
  roomId: string;
  senderId: string;
  content?: string;
  type?: MessageType;
  attachments?: {
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize?: bigint;
    thumbnailUrl?: string;
  }[];
}

export async function sendMessage(input: SendMessageInput) {
  try {
    const { roomId, senderId, content, type = MessageType.TEXT, attachments = [] } = input;

    // Kiểm tra sender có quyền gửi tin nhắn trong phòng này không
    const participant = await prisma.chat_participants.findFirst({
      where: {
        room_id: roomId,
        user_id: senderId,
        is_active: true,
      },
    });

    if (!participant) {
      throw new Error('Bạn không có quyền gửi tin nhắn trong phòng này');
    }

    // Kiểm tra phòng có đang active không
    const room = await prisma.chat_rooms.findUnique({
      where: { id: roomId },
      include: {
        chat_participants: {
          where: { is_active: true },
          include: { users: true },
        },
      },
    });

    if (!room) {
      throw new Error('Phòng chat không tồn tại');
    }

    if (room.status === 'CLOSED') {
      throw new Error('Phòng chat đã đóng, không thể gửi tin nhắn');
    }

    // Tạo message và attachments trong transaction
    const message = await prisma.$transaction(async (tx) => {
      const newMessage = await tx.chat_messages.create({
        data: {
          id: crypto.randomUUID(),
          room_id: roomId,
          sender_id: senderId,
          content,
          type,
          chat_attachments: {
            create: attachments.map((att) => ({
              id: crypto.randomUUID(),
              file_url: att.fileUrl,
              file_name: att.fileName,
              file_type: att.fileType,
              file_size: att.fileSize,
              thumbnail_url: att.thumbnailUrl,
            })),
          },
        },
        include: {
          chat_attachments: true,
          users: true,
        },
      });

      // Update last_read_at của sender
      await tx.chat_participants.update({
        where: {
          room_id_user_id: {
            room_id: roomId,
            user_id: senderId,
          },
        },
        data: {
          last_read_at: new Date(),
        },
      });

      return newMessage;
    });

    // Broadcast tin nhắn ngay lập tức qua Supabase Realtime
    try {
      const messagePayload = {
        id: message.id,
        room_id: roomId,
        sender_id: senderId,
        content: message.content,
        type: message.type,
        created_at: message.created_at,
        users: {
          id: message.users.id,
          full_name: message.users.full_name,
          avatar_url: message.users.avatar_url,
          role: message.users.role,
        },
        attachments: message.chat_attachments,
        is_edited: false,
      };

      // Subscribe và send trong 1 operation
      const channel = supabase.channel(`room:${roomId}`, {
        config: { broadcast: { self: true } }
      });

      // Subscribe trước
      await new Promise<void>((resolve) => {
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            resolve();
          }
        });
        // Timeout sau 500ms nếu chưa subscribe được
        setTimeout(resolve, 500);
      });

      // Send broadcast
      await channel.send({
        type: 'broadcast',
        event: 'new_message',
        payload: messagePayload,
      });


      // Cleanup channel sau khi send
      setTimeout(() => {
        supabase.removeChannel(channel);
      }, 100);

    } catch (broadcastError) {
      console.error('Failed to broadcast message:', broadcastError);
      // Không fail nếu broadcast lỗi, message đã được lưu vào DB
    }

    // Gửi email notification (async, không block)
    const otherParticipants = room.chat_participants.filter((p) => p.user_id !== senderId);

    for (const participant of otherParticipants) {
      // Chỉ gửi email nếu người nhận đã không đọc tin nhắn > 15 phút
      const shouldSendEmail =
        !participant.last_read_at ||
        (new Date().getTime() - new Date(participant.last_read_at).getTime()) > 15 * 60 * 1000;

      if (shouldSendEmail && participant.users.email) {
        // Fire and forget - không await
        sendChatNotificationEmail({
          toEmail: participant.users.email,
          toName: participant.users.full_name,
          senderName: message.users.full_name,
          roomName: room.name,
          messagePreview: content?.substring(0, 100) || '[Đính kèm file]',
          roomId: room.id,
        }).catch((err) => {
          console.error('Failed to send email notification:', err);
        });
      }
    }

    return {
      success: true,
      data: message,
    };
  } catch (error: unknown) {
    console.error('Error sending message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi gửi tin nhắn',
    };
  }
}

export async function markAsRead(roomId: string, userId: string) {
  try {
    await prisma.chat_participants.update({
      where: {
        room_id_user_id: {
          room_id: roomId,
          user_id: userId,
        },
      },
      data: {
        last_read_at: new Date(),
      },
    });

    return { success: true };
  } catch (error: unknown) {
    console.error('Error marking as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function deleteMessage(messageId: string, userId: string) {
  try {
    // Kiểm tra quyền xóa (chỉ người gửi mới được xóa)
    const message = await prisma.chat_messages.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Tin nhắn không tồn tại');
    }

    if (message.sender_id !== userId) {
      throw new Error('Bạn không có quyền xóa tin nhắn này');
    }

    // Soft delete
    await prisma.chat_messages.update({
      where: { id: messageId },
      data: {
        deleted_at: new Date(),
        content: '[Tin nhắn đã bị xóa]',
      },
    });

    return {
      success: true,
      message: 'Đã xóa tin nhắn',
    };
  } catch (error: unknown) {
    console.error('Error deleting message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function editMessage(messageId: string, userId: string, newContent: string) {
  try {
    const message = await prisma.chat_messages.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Tin nhắn không tồn tại');
    }

    if (message.sender_id !== userId) {
      throw new Error('Bạn không có quyền sửa tin nhắn này');
    }

    if (message.deleted_at) {
      throw new Error('Không thể sửa tin nhắn đã bị xóa');
    }

    const updated = await prisma.chat_messages.update({
      where: { id: messageId },
      data: {
        content: newContent,
        is_edited: true,
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      data: updated,
    };
  } catch (error: unknown) {
    console.error('Error editing message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
