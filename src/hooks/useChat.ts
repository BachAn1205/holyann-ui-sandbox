'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/realtime';

const MESSAGE_REFRESH_DEBOUNCE_MS = 250;
const MESSAGE_POLL_INTERVAL_MS = 10000;
const CHAT_BROADCAST_EVENT = 'new_message';

interface Message {
  id: string;
  content: string | null;
  type: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  sender: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  };
  isFromMe: boolean;
  attachments: Array<{
    id: string;
    url: string;
    name: string;
    type: string;
    size: number | null;
    thumbnail: string | null;
  }>;
  isPending?: boolean;
  error?: boolean;
  tempId?: string; // Track temporary ID for replacement
}

interface UseChatOptions {
  roomId: string;
  userId: string;
  onNewMessage?: (message: Message) => void;
  playSound?: boolean; // Optional sound notification
}

export function useChat({ roomId, userId, onNewMessage, playSound = false }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otherParticipantLastReadAt, setOtherParticipantLastReadAt] = useState<Date | null>(null);
  const channelRef = useRef<any>(null);
  const pendingMessagesRef = useRef<Map<string, string>>(new Map()); // Map tempId -> realId
  const processedMessagesRef = useRef<Set<string>>(new Set()); // Track processed messages
  const loadMessagesRef = useRef<(silent?: boolean) => Promise<void>>(() => Promise.resolve());
  const messageRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Inline `onNewMessage` from parents would otherwise force Supabase channel teardown every render */
  const onNewMessageRef = useRef<typeof onNewMessage>(onNewMessage);
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (!playSound) return;
    try {
      // Try to play MP3 file first
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Fallback: Generate simple beep sound using Web Audio API
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = 800; // Hz
          oscillator.type = 'sine';

          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
        } catch (_err) {
          // Could not play notification sound
        }
      });
    } catch (_err) {
      // Could not play notification sound
    }
  }, [playSound]);

  // Load messages (silent = true: no loading spinner, for polling/realtime fallback)
  const loadMessages = useCallback(async (silent = false) => {
    if (!roomId || !userId) return;

    try {
      if (!silent) setLoading(true);
      setError(null);

      const response = await fetch(`/api/chat/rooms/${roomId}/messages`);

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();

      if (data.success) {
        const incomingMessages = data.messages.map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt),
          updatedAt: new Date(msg.updatedAt),
        }));

        setMessages((prev) => {
          // Identify messages that are still pending (optimistic UI)
          const pending = prev.filter(m => m.isPending);
          
          // Create a map of existing message IDs to avoid duplicates
          const existingIds = new Set(incomingMessages.map((m: any) => m.id));
          
          // Filter out pending messages that have already been confirmed by the server
          const remainingPending = pending.filter(p => !existingIds.has(pendingMessagesRef.current.get(p.id || '') || ''));

          return [...incomingMessages, ...remainingPending];
        });
        
        if (data.otherParticipantLastReadAt) {
          setOtherParticipantLastReadAt(new Date(data.otherParticipantLastReadAt));
        }
      } else {
        throw new Error(data.error || 'Failed to load messages');
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      if (!silent) setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [roomId, userId]);

  // Keep ref in sync so realtime handler always calls latest version
  useEffect(() => {
    loadMessagesRef.current = loadMessages;
  }, [loadMessages]);

  const scheduleMessagesRefresh = useCallback(() => {
    if (messageRefreshTimerRef.current) {
      clearTimeout(messageRefreshTimerRef.current);
    }

    messageRefreshTimerRef.current = setTimeout(() => {
      messageRefreshTimerRef.current = null;
      loadMessagesRef.current(true);
    }, MESSAGE_REFRESH_DEBOUNCE_MS);
  }, []);

  const broadcastRoomMessage = useCallback(
    async (message: any) => {
      if (!channelRef.current || !roomId || !userId) return;

      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: CHAT_BROADCAST_EVENT,
          payload: {
            roomId,
            message: typeof message === 'string' ? { id: message } : message,
            senderId: userId,
          },
        });
      } catch (err) {
        console.warn('Failed to broadcast chat message:', err);
      }
    },
    [roomId, userId]
  );

  // Send message with Optimistic UI
  const sendMessage = useCallback(
    async (content: string, type: string = 'TEXT', attachments: any[] = []) => {
      if (!content.trim() && attachments.length === 0) return;

      setSending(true);
      setError(null);

      // Create temporary message ID
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Optimistic UI: Add message immediately
      const optimisticMessage: Message = {
        id: tempId,
        content: content.trim(),
        type,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEdited: false,
        sender: {
          id: userId,
          name: 'You',
          avatar: null,
          role: 'USER',
        },
        isFromMe: true,
        attachments: attachments || [],
        isPending: true,
        tempId, // Store temp ID for tracking
      };

      // Add to state immediately for instant feedback
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: content.trim(),
            type,
            attachments,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        const data = await response.json();

        if (data.success) {
          const realMessage = {
            ...data.message,
            createdAt: new Date(data.message.createdAt),
            updatedAt: new Date(data.message.updatedAt),
            isFromMe: true,
            isPending: false,
          };

          // Map temp ID to real ID
          pendingMessagesRef.current.set(tempId, realMessage.id);
          processedMessagesRef.current.add(realMessage.id);

          // Replace optimistic message with real message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === tempId ? realMessage : msg
            )
          );
          
          // Clear from pending after 3 seconds (to avoid duplicate from realtime)
          setTimeout(() => {
            pendingMessagesRef.current.delete(tempId);
            processedMessagesRef.current.delete(realMessage.id);
          }, 3000);

          await broadcastRoomMessage(realMessage);

          return realMessage;
        } else {
          throw new Error(data.error || 'Failed to send message');
        }
      } catch (err) {
        console.error('❌ [ERROR] Failed to send message:', err);

        // Mark message as error (keep it visible with error state)
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, error: true, isPending: false } : msg
          )
        );
        
        setError(err instanceof Error ? err.message : 'Unknown error');
        throw err;
      } finally {
        setSending(false);
      }
    },
    [roomId, userId, broadcastRoomMessage]
  );

  // Retry failed message
  const retryMessage = useCallback(
    async (messageId: string) => {
      const failedMessage = messages.find(m => m.id === messageId);
      if (!failedMessage || !failedMessage.error) return;

      // Remove error message
      setMessages((prev) => prev.filter(m => m.id !== messageId));

      // Resend
      try {
        await sendMessage(
          failedMessage.content || '',
          failedMessage.type,
          failedMessage.attachments
        );
      } catch (err) {
        console.error('Retry failed:', err);
      }
    },
    [messages, sendMessage]
  );

  // Delete message (soft delete on server, remove from local state)
  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!roomId) return;
      try {
        const res = await fetch(`/api/chat/rooms/${roomId}/messages/${messageId}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to delete message');
        }
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
      } catch (err) {
        console.error('Delete message error:', err);
        throw err;
      }
    },
    [roomId]
  );

  // Delete single attachment (remove from message in DB and local state)
  const deleteAttachment = useCallback(
    async (messageId: string, attachmentId: string) => {
      if (!roomId) return;
      try {
        const res = await fetch(
          `/api/chat/rooms/${roomId}/attachments/${attachmentId}`,
          { method: 'DELETE' }
        );
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to delete file');
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  attachments: m.attachments.filter((a) => a.id !== attachmentId),
                }
              : m
          )
        );
      } catch (err) {
        console.error('Delete attachment error:', err);
        throw err;
      }
    },
    [roomId]
  );

  // Update read status
  const markAsRead = useCallback(async () => {
    if (!roomId || !userId) return;

    try {
      await fetch(`/api/chat/rooms/${roomId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, [roomId, userId]);

  // Setup realtime subscription
  useEffect(() => {
    if (!roomId || !userId) return;

    let retryCount = 0;
    const maxRetries = 3;
    let retryTimeout: NodeJS.Timeout;

    const setupSubscription = () => {
      // Subscribe WITHOUT filter — filtered postgres_changes needs special RLS config.
      // Filter by room_id inside the handler instead (same pattern as useChatRooms).
      const channel = supabase
        .channel(`room:${roomId}`, {
          config: { broadcast: { self: false } },
        })
        .on('broadcast', { event: CHAT_BROADCAST_EVENT }, async ({ payload }) => {
          if (payload?.roomId !== roomId) return;
          if (String(payload?.senderId).toLowerCase() === String(userId).toLowerCase()) return;

          const incomingMsg = payload?.message;
          if (incomingMsg && incomingMsg.id) {
            const formattedMsg: Message = {
              id: incomingMsg.id,
              content: incomingMsg.content ?? null,
              type: incomingMsg.type ?? 'TEXT',
              createdAt: new Date(incomingMsg.createdAt ?? incomingMsg.created_at ?? Date.now()),
              updatedAt: new Date(incomingMsg.updatedAt ?? incomingMsg.updated_at ?? Date.now()),
              isEdited: incomingMsg.isEdited ?? incomingMsg.is_edited ?? false,
              sender: {
                id: incomingMsg.sender?.id ?? incomingMsg.sender_id ?? payload.senderId,
                name: incomingMsg.sender?.name ?? 'Participant',
                avatar: incomingMsg.sender?.avatar ?? null,
                role: incomingMsg.sender?.role ?? 'USER',
              },
              isFromMe: false,
              attachments: incomingMsg.attachments ?? [],
            };

            setMessages((prev) => {
              if (prev.some((m) => m.id === formattedMsg.id)) {
                return prev.map((m) => (m.id === formattedMsg.id ? { ...m, ...formattedMsg } : m));
              }
              return [...prev, formattedMsg];
            });

            processedMessagesRef.current.add(formattedMsg.id);
            setTimeout(() => processedMessagesRef.current.delete(formattedMsg.id), 5000);
          }

          scheduleMessagesRefresh();
          playNotificationSound();
          await markAsRead();
          
          if (incomingMsg) {
            onNewMessageRef.current?.(incomingMsg);
          }
        })
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages' },
          async (payload) => {
            // Only handle messages for the currently selected room
            if ((payload.new as any).room_id !== roomId) return;

            const newMessageId = (payload.new as any).id as string;
            const senderId = (payload.new as any).sender_id as string;

            // Skip if already processed (optimistic UI — own sent message)
            if (processedMessagesRef.current.has(newMessageId)) return;

            // Skip own pending messages
            if (String(senderId).toLowerCase() === String(userId).toLowerCase()) {
              const isPending = Array.from(pendingMessagesRef.current.values()).includes(newMessageId);
              if (isPending) return;
            }

            // Mark to avoid duplicate
            processedMessagesRef.current.add(newMessageId);
            setTimeout(() => processedMessagesRef.current.delete(newMessageId), 5000);

            // Instant Append: Add the message directly to state if it's not already there
            const rawMessage = payload.new as any;
            
            // We still need the sender details, but we can optimistically use basic info
            // and trigger a background refresh to get full details (avatar, role etc)
            const instantMessage: Message = {
              id: rawMessage.id,
              content: rawMessage.content,
              type: rawMessage.type,
              createdAt: new Date(rawMessage.created_at),
              updatedAt: new Date(rawMessage.updated_at),
              isEdited: rawMessage.is_edited || false,
              sender: {
                id: rawMessage.sender_id,
                name: String(senderId).toLowerCase() === String(userId).toLowerCase() ? 'You' : 'Participant',
                avatar: null,
                role: 'USER',
              },
              isFromMe: String(senderId).toLowerCase() === String(userId).toLowerCase(),
              attachments: [],
            };

            setMessages((prev) => {
              if (prev.some(m => m.id === instantMessage.id)) return prev;
              
              // If it's our own message, it might already be in the list as a pending message
              // but handled by the POST response. If not, we append it.
              return [...prev, instantMessage];
            });

            // Refresh in background to get full user details and attachments
            scheduleMessagesRefresh();

            // Sound + callback for incoming messages
            if (String(senderId).toLowerCase() !== String(userId).toLowerCase()) {
              playNotificationSound();
              await markAsRead();
              onNewMessageRef.current?.(instantMessage);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'chat_messages' },
          (payload) => {
            if ((payload.new as any).room_id !== roomId) return;
            scheduleMessagesRefresh();
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'chat_messages' },
          (payload) => {
            const oldRow = (payload as unknown as { old?: { room_id?: string } }).old;
            if (oldRow?.room_id && oldRow.room_id !== roomId) return;
            scheduleMessagesRefresh();
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'chat_participants' },
          (payload) => {
            if ((payload.new as any).room_id !== roomId) return;
            const eventUserId = String((payload.new as any).user_id).toLowerCase();
            if (eventUserId !== String(userId).toLowerCase() && (payload.new as any).last_read_at) {
              setOtherParticipantLastReadAt(new Date((payload.new as any).last_read_at));
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            retryCount = 0; // Reset retry count on success
          } else if (status === 'CLOSED') {
            // Attempt to reconnect
            if (retryCount < maxRetries) {
              retryCount++;

              retryTimeout = setTimeout(() => {
                if (channelRef.current) {
                  supabase.removeChannel(channelRef.current);
                }
                setupSubscription();
              }, 2000 * retryCount); // Exponential backoff
            }
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('⚠️ [REALTIME] Channel error - Check Supabase configuration');
            console.warn('Troubleshooting tips:');
            console.warn('1. Verify NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
            console.warn('2. Check if Realtime is enabled: ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages');
            console.warn('3. Verify RLS policies allow SELECT on chat_messages');
            console.warn('4. Check Supabase Dashboard → Database → Replication for enabled tables');

            // Attempt retry on channel error
            if (retryCount < maxRetries) {
              retryCount++;

              retryTimeout = setTimeout(() => {
                if (channelRef.current) {
                  supabase.removeChannel(channelRef.current);
                }
                setupSubscription();
              }, 3000 * retryCount);
            } else {
              console.warn('⚠️ [REALTIME] Max retries reached. Realtime features disabled.');
              console.warn('💡 Chat will still work but messages won\'t update automatically.');
              console.warn('💡 Please refresh the page or check Supabase configuration.');
            }
          }
        });

      channelRef.current = channel;
    };

    // Initial setup
    setupSubscription();

    // Cleanup
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (messageRefreshTimerRef.current) {
        clearTimeout(messageRefreshTimerRef.current);
        messageRefreshTimerRef.current = null;
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, userId, markAsRead, playNotificationSound, scheduleMessagesRefresh]);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Fallback poll if realtime misses events.
  useEffect(() => {
    if (!roomId) return;
    const interval = setInterval(() => loadMessages(true), MESSAGE_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [roomId, loadMessages]);

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    broadcastRoomMessage,
    retryMessage,
    deleteMessage,
    deleteAttachment,
    markAsRead,
    refreshMessages: loadMessages,
    otherParticipantLastReadAt,
  };
}
