"use client"
import RoleGuard from '@/components/auth/RoleGuard'
import MentorManagement from '@/components/admin/MentorManagement'

export default function AdminMentorsPage() {
    return (
        <RoleGuard allowedRoles={['admin', 'ADMIN']}>
            <MentorManagement />
        </RoleGuard>
    )
}
