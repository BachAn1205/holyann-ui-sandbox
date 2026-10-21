// WebSocket server for real-time chat
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from '@/lib/auth';

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

let io: SocketIOServer | null = null;

// Store user socket mappings (userId -> socketId)
const userSockets = new Map<string, string>();

// Store conversation room memberships
const conversationMembers = new Map<string, Set<string>>();

export function initSocketIO(httpServer: HTTPServer) {
    if (io) {
        return io;
    }

    io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        },
        path: '/api/socket'
    });

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = verifyToken(token);

            if (!decoded) {
                return next(new Error('Authentication error: Invalid token'));
            }

            // Attach user info to socket
            socket.data.userId = decoded.userId;
            socket.data.userRole = decoded.role;
            
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.data.userId;

        // Store user socket mapping
        userSockets.set(userId, socket.id);

        // Broadcast user online status
        socket.broadcast.emit('user:online', {
            userId,
            isOnline: true
        } as OnlineStatus);

        // Join user's conversations
        socket.on('conversation:join', (conversationId: string) => {
            socket.join(`conversation:${conversationId}`);
            
            // Track conversation membership
            if (!conversationMembers.has(conversationId)) {
                conversationMembers.set(conversationId, new Set());
            }
            conversationMembers.get(conversationId)?.add(userId);
        });

        // Leave conversation
        socket.on('conversation:leave', (conversationId: string) => {
            socket.leave(`conversation:${conversationId}`);
            conversationMembers.get(conversationId)?.delete(userId);
        });

        // Handle new message
        socket.on('message:send', (message: ChatMessage) => {
            // Broadcast to conversation room
            socket.to(`conversation:${message.conversationId}`).emit('message:new', message);
        });

        // Handle typing indicator
        socket.on('typing:start', (data: TypingEvent) => {
            socket.to(`conversation:${data.conversationId}`).emit('typing:update', {
                ...data,
                isTyping: true
            });
        });

        socket.on('typing:stop', (data: TypingEvent) => {
            socket.to(`conversation:${data.conversationId}`).emit('typing:update', {
                ...data,
                isTyping: false
            });
        });

        // Handle message read status
        socket.on('message:read', (data: { conversationId: string; messageIds: string[] }) => {
            socket.to(`conversation:${data.conversationId}`).emit('message:read', data);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            // Remove from user sockets
            userSockets.delete(userId);
            
            // Remove from all conversations
            conversationMembers.forEach((members, conversationId) => {
                if (members.has(userId)) {
                    members.delete(userId);
                }
            });

            // Broadcast user offline status
            socket.broadcast.emit('user:offline', {
                userId,
                isOnline: false,
                lastSeen: new Date()
            } as OnlineStatus);
        });

        // Error handling
        socket.on('error', (error) => {
            console.error(`Socket error for user ${userId}:`, error);
        });
    });

    return io;
}

export function getSocketIO(): SocketIOServer | null {
    return io;
}

// Helper function to send message to specific user
export function sendToUser(userId: string, event: string, data: any) {
    const socketId = userSockets.get(userId);
    if (socketId && io) {
        io.to(socketId).emit(event, data);
    }
}

// Helper function to send to conversation
export function sendToConversation(conversationId: string, event: string, data: any) {
    if (io) {
        io.to(`conversation:${conversationId}`).emit(event, data);
    }
}

// Check if user is online
export function isUserOnline(userId: string): boolean {
    return userSockets.has(userId);
}

// Get online users in conversation
export function getOnlineUsersInConversation(conversationId: string): string[] {
    const members = conversationMembers.get(conversationId);
    if (!members) return [];
    
    return Array.from(members).filter(userId => isUserOnline(userId));
}
