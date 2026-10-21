"use client"
import RoleGuard from '@/components/auth/RoleGuard'
import AdminDashboard from '@/components/admin/dashboard/AdminDashboard'

export default function AdminDashboardPage() {
    return (
        <RoleGuard allowedRoles={['admin', 'ADMIN']}>
            <AdminDashboard />
        </RoleGuard>
    )
}

