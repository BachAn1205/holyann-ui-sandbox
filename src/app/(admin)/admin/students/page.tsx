"use client"
import RoleGuard from '@/components/auth/RoleGuard'
import { StudentManagement } from '@/components/admin'

export default function AdminStudentsPage() {
    return (
        <RoleGuard allowedRoles={['admin', 'ADMIN']}>
            <div className="w-full max-w-6xl mx-auto min-h-[300px] flex flex-col">
                <div className="flex-1 p-6 md:p-8 space-y-6">
                    <StudentManagement />
                </div>
            </div>
        </RoleGuard>
    )
}
