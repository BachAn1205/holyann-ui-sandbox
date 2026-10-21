/**
 * Mentor Components - All UI components for Mentor role
 * 
 * Features:
 * - dashboard: Mentor dashboard with stats and student list
 * - student: Student detail pages with deadline management
 * - profile: Hồ sơ Cố vấn settings
 * - chat: Mentor chat interface with students
 */

// Mentor Navigation (Navbar at top, not sidebar)
export { default as MentorNavbar } from './MentorNavbar';

// Dashboard Components
export { default as MentorDashboardContent } from './dashboard/MentorDashboardContent';
export { default as StatsCard } from './dashboard/StatsCard';
export { default as StudentList } from './dashboard/StudentList';
export { default as UpcomingSchedule } from './dashboard/UpcomingSchedule';

// Student Detail Components
export { default as StudentDetailContent } from './student/StudentDetailContent';
export { default as StudentTabs } from './student/StudentTabs';
export { default as SchoolListTab } from './student/SchoolListTab';
export { default as DeadlineManagementTab } from './student/DeadlineManagementTab';

// Profile Components
export { default as MentorProfileForm } from './profile/MentorProfileForm';

// Chat Components
export * from './chat';
