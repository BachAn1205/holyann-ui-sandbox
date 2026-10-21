'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

export default function NextAuthErrorBoundary({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    // Listen for CLIENT_FETCH_ERROR and handle it gracefully
    const handleAuthError = (event: ErrorEvent) => {
      if (
        event.message?.includes('CLIENT_FETCH_ERROR') ||
        event.message?.includes('SessionRequired')
      ) {
        console.warn('🔄 [Auth] Session fetch error detected, attempting recovery...')

        // Clear potentially corrupted session data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user')
          localStorage.removeItem('token')
        }

        // Force sign out and redirect to login
        signOut({
          redirect: false,
          callbackUrl: '/login'
        }).then(() => {
          router.push('/login')
        })
      }
    }

    window.addEventListener('error', handleAuthError)

    return () => {
      window.removeEventListener('error', handleAuthError)
    }
  }, [router])

  return <>{children}</>
}
