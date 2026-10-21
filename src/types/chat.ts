// Chat Types
export interface ChatRoom {
  id: string;
  name: string;
  type: 'GROUP' | 'PRIVATE' | 'DIRECT';
  status: string;
  mentorType?: string;
  lastMessage: ChatLastMessage | null;
  otherUser: ChatUser | null;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatLastMessage {
  id: string;
  content: string;
  type: string;
  createdAt: Date;
  senderName: string;
  isFromMe: boolean;
}

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  type: string;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  isFromMe: boolean;
  isPending?: boolean;
  error?: string;
  status?: 'sent' | 'delivered' | 'read';
  attachments?: ChatAttachment[];
}

export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface ChatParticipant {
  id: string;
  userId: string;
  roomId: string;
  role: string;
  joinedAt: Date;
  users: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string | null;
    role: string;
  };
}
