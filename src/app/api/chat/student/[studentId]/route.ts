import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth/get-user';

/**
 * GET /api/chat/student/[studentId]
 * Lấy thông tin chi tiết học viên cho Cố vấn trong trang chat
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { studentId } = await params;

    // Get student info with user details
    const student = await prisma.students.findUnique({
      where: {
        user_id: studentId
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone_number: true,
            avatar_url: true,
            role: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Format response
    const formattedStudent = {
      id: student.user_id,
      full_name: student.users.full_name,
      email: student.users.email,
      phone_number: student.users.phone_number,
      avatar_url: student.users.avatar_url,
      date_of_birth: student.date_of_birth,
      current_school: student.current_school,
      grade: student.current_grade,
      current_address: student.current_address,
      target_faculty_name: student.target_faculty_name,
      target_university_name: student.target_university_name
    };

    return NextResponse.json({
      success: true,
      student: formattedStudent
    });

  } catch (error) {
    console.error('Error fetching student info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
