import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mentor/student/[id]
 * Lấy thông tin chi tiết của một học viên
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mentorId = session.user.id;
    const { id: studentId } = await params;

    // Kiểm tra mentor có quyền truy cập học viên này không
    const assignment = await prisma.mentor_assignments.findFirst({
      where: {
        mentor_id: mentorId,
        student_id: studentId,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Student not found or access denied' },
        { status: 404 }
      );
    }

    // Lấy thông tin học viên
    const student = await prisma.students.findUnique({
      where: { user_id: studentId },
      include: {
        users: {
          select: {
            full_name: true,
            email: true,
            phone_number: true,
            avatar_url: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: studentId,
      full_name: student.users.full_name,
      email: student.users.email,
      phone_number: student.users.phone_number,
      avatar_url: student.users.avatar_url,
    });
  } catch (error) {
    console.error('Error fetching student detail:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
