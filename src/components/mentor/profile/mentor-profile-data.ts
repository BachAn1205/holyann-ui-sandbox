import type { Achievement, MentorType, MentorWithUser } from '@/types/mentor';

export const emptyMentorFormState = (): Partial<MentorWithUser> => ({
  user: {
    full_name: '',
    email: '',
    phone_number: '',
    avatar_url: null,
  },
  specialization: 'AS',
  bio: '',
  linkedin_url: '',
  website_url: '',
  university_name: '',
  degree: '',
  major: '',
  graduation_year: undefined,
  current_company: '',
  current_job_title: '',
  years_of_experience: 0,
  expertises: [],
  outstanding_achievements: [],
});

/** Parse GET /api/mentor/profile JSON → cùng shape với form & overview. */
export function mentorProfileFromApi(data: Record<string, unknown>): Partial<MentorWithUser> {
  const user = (data.user as Record<string, unknown>) || {};
  const expertisesRaw = data.expertises;
  const achievementsRaw = data.outstanding_achievements;

  const expertises =
    typeof expertisesRaw === 'string'
      ? JSON.parse(expertisesRaw)
      : (expertisesRaw as string[]) || [];

  const outstanding_achievements =
    typeof achievementsRaw === 'string'
      ? JSON.parse(achievementsRaw)
      : (achievementsRaw as Achievement[]) || [];

  return {
    user: {
      full_name: (user.full_name as string) || '',
      email: (user.email as string) || '',
      phone_number: (user.phone_number as string) || '',
      avatar_url: (user.avatar_url as string | null) ?? null,
    },
    specialization: (data.specialization as MentorType) || 'AS',
    bio: (data.bio as string) || '',
    linkedin_url: (data.linkedin_url as string) || '',
    website_url: (data.website_url as string) || '',
    university_name: (data.university_name as string) || '',
    degree: (data.degree as string) || '',
    major: (data.major as string) || '',
    graduation_year: data.graduation_year != null ? Number(data.graduation_year) : undefined,
    current_company: (data.current_company as string) || '',
    current_job_title: (data.current_job_title as string) || '',
    years_of_experience: Number(data.years_of_experience) || 0,
    expertises,
    outstanding_achievements,
  };
}

export function getMentorSpecializationLabel(type: MentorType | string | undefined): string {
  switch (type) {
    case 'AS':
      return 'Admissions Strategist';
    case 'ACS':
      return 'Academic Content Specialist';
    case 'ARD':
      return 'Activity & Research Development';
    default:
      return String(type || '—');
  }
}

export function displayOrDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const s = String(value).trim();
  return s.length ? s : '—';
}

/** Gộp dữ liệu API / state cha với default — dùng cho form & đồng bộ modal. */
export function mergeMentorForm(data: Partial<MentorWithUser>): Partial<MentorWithUser> {
  const e = emptyMentorFormState();
  return {
    ...e,
    ...data,
    user: { ...e.user!, ...(data.user || {}) },
    expertises: Array.isArray(data.expertises) ? data.expertises : e.expertises,
    outstanding_achievements: Array.isArray(data.outstanding_achievements)
      ? data.outstanding_achievements
      : e.outstanding_achievements,
  };
}
