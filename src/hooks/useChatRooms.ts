'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/realtime';

const ROOM_LIST_DEBOUNCE_MS = 450;

interface ChatRoom {
  id: string;
  name: string;
  type: string;
  status: string;
  mentorType?: string;
  lastMessage: {
    id: string;
    content: string;
    type: string;
    createdAt: Date;
    senderName: string;
    isFromMe: boolean;
  } | null;
  otherUser: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
  } | null;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function useChatRooms(userId: string) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const roomRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadRooms = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      const response = await fetch('/api/chat/rooms', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Vui lòng đăng nhập để xem tin nhắn');
        }
        
        if (response.status === 402) {
          setRooms([]);
          if (!silent) setError('PREMIUM_REQUIRED');
          return;
        }
        
        // Try to parse error details from backend if available
        let errDetails = response.statusText;
        try {
          const errData = await response.json();
          if (errData.details) errDetails = errData.details;
          else if (errData.error) errDetails = errData.error;
        } catch (_) {}

        throw new Error(`HTTP ${response.status}: ${errDetails}`);
      }

      const data = await response.json();

      if (data.success) {
        const formattedRooms = data.rooms.map((room: any) => ({
          ...room,
          createdAt: new Date(room.createdAt),
          updatedAt: new Date(room.updatedAt),
          lastMessage: room.lastMessage
            ? {
                ...room.lastMessage,
                createdAt: new Date(room.lastMessage.createdAt),
              }
            : null,
        }));
        setRooms(formattedRooms);
      } else {
        throw new Error(data.error || 'Không thể tải danh sách tin nhắn');
      }
    } catch (err) {
      console.error('Error loading rooms:', err);
      if (!silent) setError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const scheduleRoomsRefresh = useCallback(() => {
    if (roomRefreshTimerRef.current) {
      clearTimeout(roomRefreshTimerRef.current);
    }
    roomRefreshTimerRef.current = setTimeout(() => {
      roomRefreshTimerRef.current = null;
      loadRooms(true);
    }, ROOM_LIST_DEBOUNCE_MS);
  }, [loadRooms]);

  // Setup realtime subscription for room updates
  useEffect(() => {
    if (!userId) return;

    // Subscribe to message changes to update room list
    const channel = supabase
      .channel(`room-list-updates:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          scheduleRoomsRefresh();
        }
      )
      .subscribe();

    return () => {
      if (roomRefreshTimerRef.current) {
        clearTimeout(roomRefreshTimerRef.current);
        roomRefreshTimerRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [userId, scheduleRoomsRefresh]);

  // Load rooms on mount
  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Periodic refresh as fallback when realtime misses events
  useEffect(() => {
    const interval = setInterval(() => loadRooms(true), 120000);
    return () => clearInterval(interval);
  }, [loadRooms]);

  return {
    rooms,
    loading,
    error,
    refreshRooms: loadRooms,
  };
}
