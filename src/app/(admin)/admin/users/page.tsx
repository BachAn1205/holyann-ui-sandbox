"use client"
import RoleGuard from '@/components/auth/RoleGuard'
import UserManagement from '@/components/admin/UserManagement'

export default function AdminUsersPage() {
    return (
        <RoleGuard allowedRoles={['admin', 'ADMIN']}>
            <div className="w-full max-w-6xl mx-auto min-h-[300px] flex flex-col">
                <div className="flex-1 p-6 md:p-8 space-y-6">
                    <UserManagement />
                </div>
            </div>
        </RoleGuard>
    )
}
