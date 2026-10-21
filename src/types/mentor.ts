// ==================== ENUMS ====================

export type UserRole = 'STUDENT' | 'MENTOR' | 'ADMIN';
export type MentorType = 'AS' | 'ACS' | 'ARD';
export type AssignmentStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

// ==================== CORE INTERFACES ====================

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: Date;
}

export interface Mentor {
  user_id: string;
  specialization: MentorType;
  bio: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  university_name: string | null;
  degree: string | null;
  major: string | null;
  graduation_year: number | null;
  current_company: string | null;
  current_job_title: string | null;
  years_of_experience: number | null;
  expertises: string[]; // Parsed from Json
  outstanding_achievements: Achievement[]; // Parsed from Json
  is_accepting_students: boolean | null;
  max_students: number | null;
  rating: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Achievement {
  title: string;
  year: number;
}

export interface MentorWithUser {
  user_id: string;
  user: {
    full_name: string;
    email: string;
    avatar_url: string | null;
    phone_number: string | null;
  };
  specialization: MentorType;
  bio: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  university_name: string | null;
  degree: string | null;
  major: string | null;
  graduation_year: number | null;
  current_company: string | null;
  current_job_title: string | null;
  years_of_experience: number | null;
  expertises: string[];
  outstanding_achievements: Achievement[];
  is_accepting_students: boolean | null;
  max_students: number | null;
  rating: number | null;
}

export interface MentorAssignment {
  id: string;
  student_id: string;
  mentor_id: string;
  type: MentorType;
  status: AssignmentStatus;
  assigned_at: Date;
}

export interface AssignedStudent {
  student_id: string;
  assignment_id: string;
  type: MentorType;
  status: AssignmentStatus;
  student: {
    full_name: string;
    email: string;
    avatar_url: string | null;
    phone_number: string | null;
  };
  progress: number; // Mock/calculated field
}

// ==================== DASHBOARD STATS ====================

export interface MentorDashboardStats {
  totalActiveStudents: number;
  weeklyDeadlines: number;
  averageRating: number;
}

// ==================== STUDENT TASK/DEADLINE ====================

export interface StudentTask {
  id: string;
  student_id: string;
  task_name: string;
  description: string | null;
  deadline: Date | null;
  status: 'PENDING' | 'IN_REVIEW' | 'COMPLETED';
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

// ==================== SCHEDULE/EVENTS ====================

export interface ScheduleEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: Date;
  student_id: string | null;
  student_name: string | null;
}

// ==================== PROFILE UPDATE ====================

export interface MentorProfileUpdateData {
  // Basic Info (users table)
  full_name?: string;
  phone_number?: string;
  avatar_url?: string;
  
  // Professional Info (mentors table)
  bio?: string;
  linkedin_url?: string;
  website_url?: string;
  university_name?: string;
  degree?: string;
  major?: string;
  graduation_year?: number;
  current_company?: string;
  current_job_title?: string;
  years_of_experience?: number;
  expertises?: string[];
  outstanding_achievements?: Achievement[];
}
