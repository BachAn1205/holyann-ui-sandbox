import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/students
 * Lấy danh sách students cho admin
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const q = (searchParams.get('q') ?? '').trim()
        const premiumOnly = (searchParams.get('premiumOnly') ?? '').toLowerCase() === 'true'
        const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)
        const pageSize = Math.min(500, Math.max(1, Number(searchParams.get('pageSize') ?? '20') || 20))

        const where = {
            role: 'STUDENT' as const,
            ...(premiumOnly ? { subscription_plan: 'PREMIUM' as const } : {}),
            ...(q
                ? {
                    OR: [
                        { full_name: { contains: q, mode: 'insensitive' as const } },
                        { email: { contains: q, mode: 'insensitive' as const } },
                    ],
                }
                : {}),
        }

        const [total, students] = await Promise.all([
            prisma.users.count({ where }),
            prisma.users.findMany({
                where,
                select: {
                    id: true,
                    full_name: true,
                    email: true,
                    is_active: true,
                    avatar_url: true,
                    created_at: true,
                    subscription_plan: true,
                    subscription_start: true,
                    subscription_end: true,
                },
                orderBy: {
                    created_at: 'desc'
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
            })
        ])

        // Transform data to match expected format
        const formattedStudents = students.map(student => ({
            id: student.id,
            name: student.full_name,
            email: student.email,
            isActive: student.is_active,
            avatarUrl: student.avatar_url,
            createdAt: student.created_at,
            subscriptionPlan: student.subscription_plan ?? null,
            subscriptionStart: student.subscription_start ?? null,
            subscriptionEnd: student.subscription_end ?? null,
        }))

        return NextResponse.json({ 
            students: formattedStudents,
            count: formattedStudents.length,
            total,
            page,
            pageSize,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
        })
        
    } catch (error) {
        console.error('Error fetching students:', error)
        return NextResponse.json(
            { message: 'Lỗi khi lấy danh sách học viên', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}