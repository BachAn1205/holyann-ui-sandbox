import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/mentors  
 * Lấy danh sách mentors cho admin với đầy đủ thông tin
 */
export async function GET(request: NextRequest) {
    try {
        const mentors = await prisma.mentors.findMany({
            include: {
                users: {
                    select: {
                        id: true,
                        full_name: true,
                        email: true,
                        avatar_url: true,
                        is_active: true,
                        created_at: true
                    }
                }
            },
            orderBy: {
                rating: 'desc'
            }
        })

        // Transform data to match expected format for AssignMentorForm
        const formattedMentors = mentors.map(mentor => ({
            id: mentor.user_id, // Use user_id as it's the primary key in mentors table
            name: mentor.users.full_name,
            email: mentor.users.email,
            specialization: mentor.specialization,
            university: mentor.university_name || 'N/A',
            rating: mentor.rating || 0,
            isActive: mentor.users.is_active,
            avatarUrl: mentor.users.avatar_url,
            createdAt: mentor.users.created_at,
            isAcceptingStudents: mentor.is_accepting_students
        }))

        return NextResponse.json({ 
            mentors: formattedMentors,
            count: formattedMentors.length 
        })
        
    } catch (error) {
        console.error('Error fetching mentors:', error)
        return NextResponse.json(
            { message: 'Lỗi khi lấy danh sách mentors', error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}