/**
 * Admin Components - All UI components for Admin role
 * 
 * Features:
 * - dashboard: Admin dashboard with user management
 * - chat: Admin chat interface
 * - student management: Student list and detail components
 * - user avatar: Enhanced avatar component with database integration
 */

export * from './dashboard';
export * from './chat';
export { default as AdminNavbar } from './AdminNavbar';
export { default as StudentDetail } from './StudentDetail';
export { default as StudentManagement } from './StudentManagement';
export { default as UserAvatar } from '../ui/UserAvatar';
