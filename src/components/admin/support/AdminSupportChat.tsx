'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useChat } from '@/hooks/useChat';
import { supabase } from '@/lib/supabase/realtime';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Search,
  CheckCircle2,
  MoreVertical,
  Paperclip,
  Send,
  Loader2,
  User as UserIcon,
  MessageSquare,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import Image from 'next/image';

interface SupportRoom {
  id: string;
  roomId: string;
  name: string;
  status: string;
  studentId: string;
  supportEmailSent: boolean;
  updatedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  } | null;
  lastMessage: {
    id: string;
    content: string;
    type: string;
    createdAt: string;
    sender: {
      id: string;
      name: string;
    };
  } | null;
  unreadCount?: number;
}

export default function AdminSupportChat() {
  const { user } = useAuthSession();
  const [rooms, setRooms] = useState<SupportRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Fetch rooms
  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/support-rooms', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms);
      }
    } catch (error) {
      console.error('Failed to fetch rooms', error);
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Realtime subscription for room list updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`admin-support-list-updates:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
        },
        () => {
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchRooms]);

  // Clear unread count optimistically when a room is selected
  useEffect(() => {
    if (selectedRoomId) {
      setRooms(prev => prev.map(r => 
        r.roomId === selectedRoomId ? { ...r, unreadCount: 0 } : r
      ));
    }
  }, [selectedRoomId]);

  const filteredRooms = rooms.filter(room => {
    if (filterStatus !== 'ALL' && room.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return room.student?.name.toLowerCase().includes(q) || room.student?.email.toLowerCase().includes(q);
    }
    return true;
  });

  const selectedRoom = rooms.find(r => r.roomId === selectedRoomId);

  return (
    <div className="flex h-full w-full bg-white dark:bg-card overflow-hidden">
      {/* LEFT SIDEBAR - Room List */}
      <div className={`w-full md:w-1/3 md:min-w-[300px] border-r border-border flex flex-col bg-slate-50/50 dark:bg-slate-900/20 ${selectedRoomId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-foreground">
            <MessageSquare className="w-5 h-5 text-primary" />
            Tin nhắn hỗ trợ
          </h2>
          
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm học viên..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex gap-2">
            {(['ALL', 'ACTIVE', 'RESOLVED'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  filterStatus === status 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {status === 'ALL' ? 'Tất cả' : status === 'ACTIVE' ? 'Đang chờ' : 'Đã giải quyết'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingRooms ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground text-sm">
              Không có cuộc trò chuyện nào
            </div>
          ) : (
            filteredRooms.map(room => (
              <button
                key={room.roomId}
                onClick={() => setSelectedRoomId(room.roomId)}
                className={`w-full text-left p-4 border-b border-border/50 hover:bg-secondary/30 transition-colors flex items-start gap-3 ${
                  selectedRoomId === room.roomId ? 'bg-primary/5 dark:bg-primary/10' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                  {room.student?.avatar ? (
                    <Image src={room.student.avatar} alt="Avatar" fill className="object-cover" sizes="40px" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm truncate text-foreground mt-0.5">
                      {room.student?.name || 'Học viên ẩn danh'}
                    </span>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(room.updatedAt), 'HH:mm')}
                      </span>
                      {!!room.unreadCount && room.unreadCount > 0 && (
                        <span className="bg-destructive text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                          {room.unreadCount > 99 ? '99+' : room.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {room.lastMessage?.sender.id === user?.id ? 'Bạn: ' : ''}
                    {room.lastMessage?.content || 'Chưa có tin nhắn'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT SIDE - Chat Window */}
      <div className={`flex-1 flex flex-col min-w-0 ${selectedRoomId ? 'flex' : 'hidden md:flex'}`}>
        {selectedRoom ? (
          <ActiveChatWindow 
            room={selectedRoom} 
            userId={user?.id || ''} 
            onBack={() => setSelectedRoomId(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
            <p>Chọn một cuộc hội thoại để bắt đầu hỗ trợ</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Separate component to isolate useChat hook and avoid unnecessary re-renders
function ActiveChatWindow({ room, userId, onBack }: { room: SupportRoom; userId: string; onBack: () => void }) {
  const { messages, loading, sendMessage, sending, otherParticipantLastReadAt, markAsRead, refreshMessages } = useChat({
    roomId: room.roomId,
    userId: userId,
    playSound: true,
  });
  
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync latest message from the parent's room list in case local realtime channel misses it
  useEffect(() => {
    if (room.lastMessage && messages.length > 0) {
      const exists = messages.some(m => m.id === room.lastMessage!.id);
      if (!exists) {
        refreshMessages(true); // Silent refresh
      }
    }
  }, [room.lastMessage?.id, messages, refreshMessages]);

  // Mark as read when opening the chat
  useEffect(() => {
    markAsRead();
  }, [markAsRead]);

  // Find the last message sent by the current user to display Sent/Seen status only there
  let lastMyMessageIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender.id === userId) {
      lastMyMessageIndex = i;
      break;
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;
    const content = inputValue;
    setInputValue('');
    try {
      await sendMessage(content, 'TEXT', []);
    } catch (error) {
      console.error('Send error:', error);
      setInputValue(content); // restore on fail
    }
  };

  return (
    <>
      {/* Header */}
      <div className="h-16 px-4 md:px-6 border-b border-border flex items-center justify-between bg-white dark:bg-card">
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            onClick={onBack}
            className="md:hidden p-2 -ml-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden relative shrink-0">
            {room.student?.avatar ? (
              <Image src={room.student.avatar} alt="Avatar" fill className="object-cover" sizes="40px" />
            ) : (
              <UserIcon className="w-5 h-5 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">{room.student?.name || 'Học viên ẩn danh'}</h3>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">{room.student?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#0a0a0a]">
        {loading ? (
          <div className="flex justify-center h-full items-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Chưa có tin nhắn nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isMe = msg.sender.id === userId;
              const isLastMyMessage = index === lastMyMessageIndex;
              
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-white dark:bg-card border border-border rounded-tl-sm text-foreground shadow-sm'
                    } ${msg.error ? 'opacity-50 border-red-500' : ''}`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <div className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${isMe ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      <span>{format(new Date(msg.createdAt), 'HH:mm')}</span>
                      {msg.isPending && <span>• Đang gửi...</span>}
                      {!msg.isPending && isMe && isLastMyMessage && (
                        <span className="font-medium">
                          {otherParticipantLastReadAt && new Date(msg.createdAt) <= otherParticipantLastReadAt ? '• Đã xem' : '• Đã gửi'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-card border-t border-border">
        <div className="flex items-end gap-2 bg-white dark:bg-background p-1.5 rounded-xl border border-border focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-sm">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <Paperclip className="w-5 h-5" />
          </button>
          
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Nhập nội dung hỗ trợ..."
            className="flex-1 max-h-32 min-h-[40px] bg-transparent resize-none outline-none text-sm py-2.5 px-2 text-foreground"
            rows={1}
          />
          
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className={`p-2.5 rounded-lg shrink-0 transition-all ${
              inputValue.trim() && !sending
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                : 'bg-secondary text-muted-foreground cursor-not-allowed'
            }`}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Nhấn Enter để gửi, Shift + Enter để xuống dòng
        </p>
      </div>
    </>
  );
}
