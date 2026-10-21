import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/admin/mentors/[id]
 * Cập nhật thông tin user + mentor profile (chỉ admin).
 * id = user_id của mentor.
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if ((session.user as { role?: string })?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: userId } = await context.params
    const body = await request.json()

    const userPayload: { full_name?: string; email?: string; phone_number?: string | null; role?: string; is_active?: boolean } = {}
    if (body.full_name != null) userPayload.full_name = String(body.full_name)
    if (body.email != null) userPayload.email = String(body.email)
    if (body.phone_number != null) userPayload.phone_number = body.phone_number === '' ? null : String(body.phone_number)
    if (body.role != null) userPayload.role = body.role
    if (body.is_active != null) userPayload.is_active = Boolean(body.is_active)

    const mentorPayload: {
      specialization?: string
      bio?: string | null
      linkedin_url?: string | null
      website_url?: string | null
      university_name?: string | null
      degree?: string | null
      major?: string | null
      graduation_year?: number | null
      current_company?: string | null
      current_job_title?: string | null
      years_of_experience?: number | null
      is_accepting_students?: boolean | null
      max_students?: number | null
    } = {}
    if (body.specialization != null) mentorPayload.specialization = body.specialization
    if (body.bio != null) mentorPayload.bio = body.bio === '' ? null : body.bio
    if (body.linkedin_url != null) mentorPayload.linkedin_url = body.linkedin_url === '' ? null : body.linkedin_url
    if (body.website_url != null) mentorPayload.website_url = body.website_url === '' ? null : body.website_url
    if (body.university_name != null) mentorPayload.university_name = body.university_name === '' ? null : body.university_name
    if (body.degree != null) mentorPayload.degree = body.degree === '' ? null : body.degree
    if (body.major != null) mentorPayload.major = body.major === '' ? null : body.major
    if (body.graduation_year != null) mentorPayload.graduation_year = body.graduation_year === '' ? null : Number(body.graduation_year)
    if (body.current_company != null) mentorPayload.current_company = body.current_company === '' ? null : body.current_company
    if (body.current_job_title != null) mentorPayload.current_job_title = body.current_job_title === '' ? null : body.current_job_title
    if (body.years_of_experience != null) mentorPayload.years_of_experience = body.years_of_experience === '' ? null : Number(body.years_of_experience)
    if (body.is_accepting_students != null) mentorPayload.is_accepting_students = body.is_accepting_students
    if (body.max_students != null) mentorPayload.max_students = body.max_students === '' ? null : Number(body.max_students)

    const hasUser = Object.keys(userPayload).length > 0
    const hasMentor = Object.keys(mentorPayload).length > 0

    if (!hasUser && !hasMentor) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 })
    }

    if (hasUser) {
      await prisma.users.update({
        where: { id: userId },
        data: userPayload as Parameters<typeof prisma.users.update>[0]['data'],
      })
    }

    if (hasMentor) {
      await prisma.mentors.update({
        where: { user_id: userId },
        data: mentorPayload as Parameters<typeof prisma.mentors.update>[0]['data'],
      })
    }

    const updated = await prisma.mentors.findUnique({
      where: { user_id: userId },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true,
            role: true,
            is_active: true,
            avatar_url: true,
            created_at: true,
          },
        },
      },
    })

    return NextResponse.json({ message: 'Updated', mentor: updated })
  } catch (error) {
    console.error('Error updating mentor:', error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to update mentor' },
      { status: 500 }
    )
  }
}
