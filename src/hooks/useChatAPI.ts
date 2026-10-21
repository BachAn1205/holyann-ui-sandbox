// Custom hook for chat API operations
'use client';

import { useState, useCallback } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';

export interface Conversation {
    id: string;
    participant: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
        role?: string;
        grade?: string;
        targetCountry?: string;
    };
    lastMessage: string;
    lastMessageTime: Date;
    unreadCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Message {
    id: string;
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    senderRole?: string;
    content: string;
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
    attachmentUrl?: string;
    timestamp: Date;
    isRead: boolean;
    isMine: boolean;
}

export function useChatAPI() {
    const { session } = useAuthSession();
    const token = session?.accessToken;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        if (!token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(endpoint, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `HTTP error ${response.status}`);
        }

        return response.json();
    }, [token]);

    // Get all conversations
    const getConversations = useCallback(async (): Promise<{ conversations: Conversation[]; userRole: string }> => {
        setLoading(true);
        setError(null);

        try {
            const data = await apiCall('/api/chat/conversations');
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiCall]);

    // Create new conversation
    const createConversation = useCallback(async (mentorId?: string, studentId?: string): Promise<{ conversation: any }> => {
        setLoading(true);
        setError(null);

        try {
            const data = await apiCall('/api/chat/conversations', {
                method: 'POST',
                body: JSON.stringify({ mentorId, studentId }),
            });
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create conversation';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiCall]);

    // Get messages for a conversation
    const getMessages = useCallback(async (
        conversationId: string,
        page: number = 1,
        limit: number = 50
    ): Promise<{ messages: Message[]; pagination: any }> => {
        setLoading(true);
        setError(null);

        try {
            const data = await apiCall(
                `/api/chat/messages/${conversationId}?page=${page}&limit=${limit}`
            );
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiCall]);

    // Send a message
    const sendMessage = useCallback(async (
        conversationId: string,
        content: string,
        messageType: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT',
        attachmentUrl?: string
    ): Promise<{ message: Message }> => {
        setLoading(true);
        setError(null);

        try {
            const data = await apiCall(`/api/chat/messages/${conversationId}`, {
                method: 'POST',
                body: JSON.stringify({
                    content,
                    messageType,
                    attachmentUrl
                }),
            });
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiCall]);

    // Mark messages as read
    const markMessagesAsRead = useCallback(async (conversationId: string): Promise<{ success: boolean }> => {
        setLoading(true);
        setError(null);

        try {
            const data = await apiCall(`/api/chat/messages/${conversationId}`, {
                method: 'PATCH',
            });
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to mark messages as read';
            setError(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiCall]);

    return {
        loading,
        error,
        getConversations,
        createConversation,
        getMessages,
        sendMessage,
        markMessagesAsRead,
    };
}
