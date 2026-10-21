import { getServerSession } from 'next-auth'
import type { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth/auth-config'

export const SAFE_USER_SELECT = {
  id: true,
  full_name: true,
  email: true,
  avatar_url: true,
  role: true,
} satisfies Prisma.usersSelect

export const SAFE_USER_PROFILE_SELECT = {
  ...SAFE_USER_SELECT,
  phone_number: true,
  is_active: true,
  created_at: true,
} satisfies Prisma.usersSelect

export type AuthenticatedUser = {
  id: string
  email?: string | null
  name?: string | null
  role: string
}

export type AuthenticatedStudent = AuthenticatedUser & {
  role: 'STUDENT'
}

export type AuthenticatedMentor = AuthenticatedUser & {
  role: 'MENTOR'
}

export type AuthenticatedAdmin = AuthenticatedUser & {
  role: 'ADMIN'
}

export type AuthenticatedMarketing = AuthenticatedUser & {
  role: 'ADMIN' | 'MARKETING'
}

function normalizeRole(role?: string | null) {
  return role?.toString().trim().toUpperCase() ?? ''
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error('UNAUTHORIZED')
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: normalizeRole(session.user.role),
  }
}

export async function requireStudentAuth(): Promise<AuthenticatedStudent> {
  const user = await requireAuthenticatedUser()

  if (user.role !== 'STUDENT') {
    throw new Error('UNAUTHORIZED')
  }

  return {
    ...user,
    role: 'STUDENT',
  }
}

export async function requireMentorAuth(): Promise<AuthenticatedMentor> {
  const user = await requireAuthenticatedUser()

  if (user.role !== 'MENTOR' && !['AS', 'ACS', 'ARD'].includes(user.role)) {
    throw new Error('UNAUTHORIZED')
  }

  return {
    ...user,
    role: 'MENTOR',
  }
}

export async function requireAdminAuth(): Promise<AuthenticatedAdmin> {
  const user = await requireAuthenticatedUser()

  if (user.role !== 'ADMIN') {
    throw new Error('UNAUTHORIZED')
  }

  return {
    ...user,
    role: 'ADMIN',
  }
}

export async function requireMarketingAuth(): Promise<AuthenticatedMarketing> {
  const user = await requireAuthenticatedUser()

  if (user.role !== 'ADMIN' && user.role !== 'MARKETING') {
    throw new Error('UNAUTHORIZED')
  }

  return {
    ...user,
    role: user.role as 'ADMIN' | 'MARKETING',
  }
}

export async function requireStudentOwnership(studentId: string): Promise<AuthenticatedStudent> {
  const user = await requireStudentAuth()

  if (String(studentId) !== String(user.id)) {
    throw new Error('FORBIDDEN')
  }

  return user
}

export async function requireStudentRouteAccess(studentId: string): Promise<AuthenticatedStudent> {
  return requireStudentOwnership(studentId)
}
