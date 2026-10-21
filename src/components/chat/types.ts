export interface Attachment {
  id: string;
  url: string;
  name: string;
  type: string; // MIME type (e.g., 'image/jpeg', 'application/pdf')
  size: number | null; // Size in bytes
  thumbnail?: string | null; // For image thumbnails
}

export interface MeetingMessageData {
  meetingId: string;
  title: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  meetLink: string | null;      // Student link
  hostMeetLink: string | null;  // Mentor/host link
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string | null; // Allow null for messages with only attachments
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'LINK' | 'MEETING'; // Message type
  meetingData?: MeetingMessageData; // Populated when type === 'MEETING'
  timestamp: Date;
  isRead: boolean;
  isMine: boolean;
  isSending?: boolean; // For optimistic UI
  isError?: boolean; // For optimistic UI error state
  attachments?: Attachment[]; // Array of file attachments
}

export interface Mentor {
  id: string;
  name: string;
  avatar: string | null;
  roleCode: string;
  roleTitle: string;
  isOnline: boolean;
  lastSeen?: string;
  description: string;
  achievements: string[];
}

export interface Conversation {
  id: string; // This is likely the roomId
  mentor: Mentor;
  messages: Message[];
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}
