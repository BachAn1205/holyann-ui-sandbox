"use client"
import { use } from 'react'
import RoleGuard from '@/components/auth/RoleGuard'
import AuthHeader from '@/components/auth/AuthHeader'
import { StudentDetail } from '@/components/admin'

interface StudentDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function StudentDetailPage({ params }: StudentDetailPageProps) {
    const { id } = use(params)

    return (
        <RoleGuard allowedRoles={['admin', 'ADMIN']}>
            <div
                className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
                <AuthHeader/>
                <main className="flex-1 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-muted/50 dark:bg-card/20 shadow-2xl rounded-3xl overflow-hidden p-8">
                            <StudentDetail studentId={id} />
                        </div>
                    </div>
                </main>
            </div>
        </RoleGuard>
    )
}
