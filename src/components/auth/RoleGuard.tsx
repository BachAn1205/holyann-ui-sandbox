"use client"
import {useEffect, useRef} from 'react'
import {useRouter, usePathname} from 'next/navigation'
import {useAuthSession} from '@/hooks/useAuthSession'
import {signOut} from 'next-auth/react'
import { getRoleDashboardPath } from '@/lib/utils/role-paths'
import { PageLoading } from '@/components/ui/PageLoading'

export type UserRole = 'STUDENT' | 'MENTOR' | 'ADMIN' | 'student' | 'mentor' | 'admin' | string;

interface RoleGuardProps {
    children: React.ReactNode
    allowedRoles: UserRole[]
    redirectTo?: string
}

export default function RoleGuard({children, allowedRoles, redirectTo = '/login'}: RoleGuardProps) {
    const {user, isAuthenticated, isLoading} = useAuthSession()
    const authReady = !isLoading
    const hasRole = (roles: UserRole[]) => {
        if (!user || !user.role) return false
        return roles.includes(user.role) || roles.includes(user.role.toLowerCase())
    }
    const router = useRouter()
    const pathname = usePathname()
    const isRedirecting = useRef(false)
    const userRole = user?.role
    const userId = user?.id

    useEffect(() => {
        if (!authReady) return
        if (isRedirecting.current) return

        if (!isAuthenticated) {
            if (pathname !== redirectTo) {
                isRedirecting.current = true
                router.replace(redirectTo)
                setTimeout(() => (isRedirecting.current = false), 1000)
            }
            return
        }

        const hasAllowedRole = userRole && (
            allowedRoles.includes(userRole) ||
            allowedRoles.includes(String(userRole).toLowerCase())
        )
        if (!hasAllowedRole) {
            const target = getRoleDashboardPath(userRole)
            if (pathname !== target) {
                isRedirecting.current = true
                router.replace(target)
                setTimeout(() => (isRedirecting.current = false), 1000)
            }
        }
    }, [authReady, isAuthenticated, userId, userRole, router, redirectTo, pathname])

    // While auth status is initializing, show loading (cùng background với các page)
    if (!authReady) {
        return (
            <div className="min-h-screen bg-background">
                <PageLoading message="Đang kiểm tra quyền truy cập..." />
            </div>
        )
    }

    // If not authenticated: show friendly message and link to login
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="max-w-md w-full bg-card border border-border rounded-xl shadow-lg p-8 text-center">
                    <h3 className="text-xl font-semibold mb-4">Bạn chưa đăng nhập</h3>
                    <p className="text-sm text-muted-foreground mb-6">Bạn cần đăng nhập để truy cập trang này.</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => router.replace('/login')}
                                className="px-4 py-2 bg-primary text-white rounded-lg">Đến trang đăng nhập
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // If authenticated but not authorized: show message and options
    if (!hasRole(allowedRoles)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="max-w-md w-full bg-card border border-border rounded-xl shadow-lg p-8 text-center">
                    <h3 className="text-xl font-semibold mb-4">Bạn không có quyền truy cập</h3>
                    <p className="text-sm text-muted-foreground mb-6">Tài khoản của bạn không có quyền truy cập trang
                        này.</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => {
                            signOut({ callbackUrl: '/login' });
                        }} className="px-4 py-2 bg-destructive text-white rounded-lg">Đăng xuất
                        </button>
                        <button onClick={() => router.replace('/student/dashboard')}
                                className="px-4 py-2 bg-primary text-white rounded-lg">Về Dashboard
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
