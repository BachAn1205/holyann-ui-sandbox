// Chat Constants

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  FILE: 'FILE',
  SYSTEM: 'SYSTEM',
} as const;

// Room Types
export const ROOM_TYPES = {
  PRIVATE: 'PRIVATE',
  DIRECT: 'DIRECT',
  GROUP: 'GROUP',
} as const;

// Room Status
export const ROOM_STATUS = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
  DELETED: 'DELETED',
} as const;

// Message Status
export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
} as const;

// UI Constants
export const CHAT_CONFIG = {
  SIDEBAR_WIDTH: {
    MIN: 280,
    MAX: 500,
    DEFAULT: 360,
  },
  MESSAGE: {
    MAX_LENGTH: 2000,
    BUBBLE_MAX_WIDTH: '70%',
  },
  AVATAR: {
    SIZE: {
      SMALL: 28,
      MEDIUM: 40,
      LARGE: 56,
    },
  },
  COLORS: {
    PRIMARY: '#0084ff',
    SECONDARY: '#e4e6eb',
    BACKGROUND: '#f0f2f5',
    MESSAGE_OWN: 'linear-gradient(to bottom right, #0084ff, #0066ff)',
    MESSAGE_OTHER: '#e4e6eb',
  },
  POLLING_INTERVAL: 3000, // 3 seconds
  TYPING_INDICATOR_TIMEOUT: 3000, // 3 seconds
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

// API Endpoints
export const CHAT_API_ENDPOINTS = {
  ROOMS: '/api/chat/rooms',
  MESSAGES: (roomId: string) => `/api/chat/rooms/${roomId}/messages`,
  SEND_MESSAGE: (roomId: string) => `/api/chat/rooms/${roomId}/messages`,
  UPLOAD: '/api/chat/upload',
  PARTICIPANTS: (roomId: string) => `/api/chat/rooms/${roomId}/participants`,
  MEDIA: (roomId: string) => `/api/chat/rooms/${roomId}/media`,
} as const;
