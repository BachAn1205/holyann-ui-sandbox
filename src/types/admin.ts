// Admin types

export type UserRole = 'STUDENT' | 'MENTOR' | 'ADMIN' | 'MARKETING';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  role: UserRole;
  is_active: boolean;
  avatar_url: string | null;
  created_at: Date | string;
  auth_provider?: string;
  subscriptionPlan?: string | null;
  subscriptionStart?: Date | string | null;
  subscriptionEnd?: Date | string | null;
}

export type MentorType = 'AS' | 'ACS' | 'ARD';

export interface UserFormData {
  full_name: string;
  email: string;
  phone_number: string;
  role: UserRole;
  is_active: boolean;
  password?: string;
  mentor_type?: MentorType;
}