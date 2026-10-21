import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await context.params

    // Lấy thông tin chi tiết học viên
    const student = await prisma.users.findUnique({
      where: {
        id: studentId,
        role: 'STUDENT'
      },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone_number: true,
        avatar_url: true,
        is_active: true,
        created_at: true,
        subscription_plan: true,
        subscription_start: true,
        subscription_end: true,
        students: {
          select: {
            current_school: true,
            current_grade: true,
            current_address: true,
            date_of_birth: true,
            talents: true,
            hobbies: true,
            target_faculty_name: true,
            target_university_name: true,
            yearly_budget: true,
            yearly_budget_currency: true,
            personal_desire: true,
            assessments_completed: true,
            created_at: true,
            updated_at: true,
          }
        },
        student_applications: {
          select: {
            id: true,
            category: true,
            status: true,
            personal_notes: true,
            created_at: true,
            universities: {
              select: {
                id: true,
                name: true,
                country: true,
                current_ranking: true,
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy học viên' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: student
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
