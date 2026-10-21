"use client"
import RoleGuard from '@/components/auth/RoleGuard'
import AdminDashboard from '@/components/admin/dashboard/AdminDashboard'

export default function AdminPage() {
    return (
        <RoleGuard allowedRoles={['admin']}>
            <AdminDashboard />
        </RoleGuard>
    )
}

