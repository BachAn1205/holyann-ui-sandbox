// Custom hook for Socket.IO client connection (TEMPORARILY DISABLED)
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
// import { io, Socket } from 'socket.io-client';
// import { useAuth } from '@/contexts/AuthContext';

export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderAvatar: string;
    content: string;
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
    timestamp: Date;
    isRead: boolean;
    isMine?: boolean;
}

export interface TypingEvent {
    conversationId: string;
    userId: string;
    userName: string;
    isTyping: boolean;
}

export interface OnlineStatus {
    userId: string;
    isOnline: boolean;
    lastSeen?: Date;
}

export function useSocket() {
    // const { user, token } = useAuth();
    // const socketRef = useRef<Socket | null>(null);
    const socketRef = useRef<any>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    // SOCKET FUNCTIONALITY TEMPORARILY DISABLED
    // Uncomment below when ready to re-enable
    /*
    useEffect(() => {
        if (!user || !token) {
            return;
        }

        // Initialize socket connection
        const socketUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const socket = io(socketUrl, {
            path: '/api/socket',
            auth: {
                token
            },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        socketRef.current = socket;

        // Connection events
        socket.on('connect', () => {
            // Socket connected
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.warn('⚠️ Socket disconnected');
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
        });

        // Online status events
        socket.on('user:online', (data: OnlineStatus) => {
            setOnlineUsers(prev => {
                const updated = new Set(prev);
                updated.add(data.userId);
                return updated;
            });
        });

        socket.on('user:offline', (data: OnlineStatus) => {
            setOnlineUsers(prev => {
                const updated = new Set(prev);
                updated.delete(data.userId);
                return updated;
            });
        });

        // Cleanup on unmount
        return () => {
            socket.disconnect();
        };
    }, [user, token]);
    */

    // Join conversation room
    const joinConversation = useCallback((conversationId: string) => {
        // Disabled - Socket functionality not available
        // Socket disabled - would join conversation
    }, []);

    // Leave conversation room
    const leaveConversation = useCallback((conversationId: string) => {
        // Disabled - Socket functionality not available
    }, []);

    // Send message
    const sendMessage = useCallback((message: ChatMessage) => {
        // Disabled - Socket functionality not available
        // Socket disabled - would send message
    }, []);

    // Start typing
    const startTyping = useCallback((conversationId: string, userName: string) => {
        // Disabled - Socket functionality not available
    }, []);

    // Stop typing
    const stopTyping = useCallback((conversationId: string, userName: string) => {
        // Disabled - Socket functionality not available
    }, []);

    // Mark messages as read
    const markAsRead = useCallback((conversationId: string, messageIds: string[]) => {
        // Disabled - Socket functionality not available
        // Socket disabled - would mark as read
    }, []);

    // Listen for new messages
    const onNewMessage = useCallback((callback: (message: ChatMessage) => void) => {
        // Disabled - Socket functionality not available
        return () => {}; // Return empty cleanup function
    }, []);

    // Listen for typing events
    const onTyping = useCallback((callback: (event: TypingEvent) => void) => {
        // Disabled - Socket functionality not available
        return () => {}; // Return empty cleanup function
    }, []);

    // Listen for message read events
    const onMessageRead = useCallback((callback: (data: { conversationId: string; messageIds: string[] }) => void) => {
        // Disabled - Socket functionality not available
        return () => {}; // Return empty cleanup function
    }, []);

    // Check if user is online
    const isUserOnline = useCallback((userId: string) => {
        return false; // Always return false when socket is disabled
    }, [onlineUsers]);

    return {
        socket: socketRef.current,
        isConnected,
        onlineUsers,
        isUserOnline,
        joinConversation,
        leaveConversation,
        sendMessage,
        startTyping,
        stopTyping,
        markAsRead,
        onNewMessage,
        onTyping,
        onMessageRead
    };
}
