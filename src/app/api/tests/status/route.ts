import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({
                success: false,
                error: 'Unauthorized'
            }, { status: 401 })
        }

        const studentId = session.user.id

        // Check if student exists
        const student = await prisma.students.findUnique({
            where: { user_id: studentId }
        })

        if (!student) {
            return NextResponse.json({
                success: false,
                error: 'Student not found'
            }, { status: 404 })
        }

        // Get test statuses
        const [mbtiTest, gritTest, riasecTest] = await Promise.all([
            prisma.mbti_tests.findUnique({
                where: { student_id: studentId },
                select: { status: true, completed_at: true }
            }),
            prisma.grit_tests.findUnique({
                where: { student_id: studentId },
                select: { status: true, completed_at: true }
            }),
            prisma.riasec_tests.findUnique({
                where: { student_id: studentId },
                select: { status: true, completed_at: true }
            })
        ])

        return NextResponse.json({
            success: true,
            data: {
                mbti: mbtiTest,
                grit: gritTest,
                riasec: riasecTest
            }
        })

    } catch (error) {
        console.error('❌ Error fetching test status:', error)
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 })
    }
}
