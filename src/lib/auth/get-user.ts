import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { JWTService } from '@/lib/services/jwt.service'
import { cookies } from 'next/headers'

export async function getAuthenticatedUser(request?: NextRequest) {
  // Try NextAuth session first
  const session = await getServerSession(authOptions)
  if (session?.user?.id) {
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || '',
      role: session.user.role || 'STUDENT'
    }
  }

  // Try custom auth token from cookie
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (token) {
    try {
      const decoded = JWTService.verifyToken(token)
      if (decoded && decoded.userId) {
        return {
          id: decoded.userId,
          email: decoded.email || '',
          name: decoded.email || '', // JWT doesn't store full_name
          role: decoded.role || 'STUDENT'
        }
      }
    } catch (error) {
      console.error('Error verifying auth token:', error)
    }
  }

  return null
}
