import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/mentors
 * Lấy danh sách mentors với specializations
 *
 * Query params:
 * - specialization: AS | ACS | ARD (filter by type)
 * - available: true | false (chỉ lấy mentors đang nhận học sinh)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const specialization = searchParams.get('specialization')
        const availableOnly = searchParams.get('available') === 'true'

        const where: any = {}

        // Filter by specialization (SINGLE VALUE)
        if (specialization && ['AS', 'ACS', 'ARD'].includes(specialization)) {
            where.specialization = specialization
        }

        // Filter by availability
        if (availableOnly) {
            where.is_accepting_students = true
            where.user = {
                is_active: true
            }
        }

        const mentors = await prisma.mentors.findMany({
            where,
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        avatar_url: true,
                        is_active: true
                    }
                }
            },
            orderBy: {
                rating: 'desc'
            }
        })

        // Transform data
        const transformedMentors = mentors.map(mentor => ({
            id: mentor.user_id,
            name: mentor.users.full_name,
            email: mentor.users.email,
            avatar: mentor.users.avatar_url,
            university: mentor.university_name,
            degree: mentor.degree,
            major: mentor.major,
            company: mentor.current_company,
            jobTitle: mentor.current_job_title,
            experience: mentor.years_of_experience,
            specialization: mentor.specialization, // SINGLE VALUE
            expertises: mentor.expertises || [],
            achievements: mentor.outstanding_achievements || [],
            bio: mentor.bio,
            linkedin: mentor.linkedin_url,
            website: mentor.website_url,
            rating: mentor.rating,
            isAccepting: mentor.is_accepting_students,
            maxStudents: mentor.max_students,
            isActive: mentor.users.is_active
        }))

        // Statistics
        const stats = {
            total: transformedMentors.length,
            bySpecialization: {
                AS: transformedMentors.filter(m => m.specialization === 'AS').length,
                ACS: transformedMentors.filter(m => m.specialization === 'ACS').length,
                ARD: transformedMentors.filter(m => m.specialization === 'ARD').length
            },
            available: transformedMentors.filter(m => m.isAccepting && m.isActive).length
        }

        return NextResponse.json({
            success: true,
            data: transformedMentors,
            stats
        })

    } catch (error) {
        console.error('Error fetching mentors:', error)
        return NextResponse.json(
            {
                success: false,
                message: 'Lỗi khi lấy danh sách mentors'
            },
            { status: 500 }
        )
    }
}
