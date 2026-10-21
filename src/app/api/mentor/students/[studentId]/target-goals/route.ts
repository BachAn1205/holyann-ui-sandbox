import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mentor/students/[studentId]/target-goals
 * Mentor xem danh sách mục tiêu (student_target_goals) của học viên được gán cho mình.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;

    const assignment = await prisma.mentor_assignments.findFirst({
      where: { mentor_id: session.user.id, student_id: studentId },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const goals = await prisma.student_target_goals.findMany({
      where: { student_id: studentId },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
      select: {
        id: true,
        faculty_name: true,
        university_name: true,
        sort_order: true,
        created_at: true,
      },
    });

    return NextResponse.json({
      goals: goals.map((goal) => ({
        id: goal.id,
        faculty_name: goal.faculty_name,
        university_name: goal.university_name,
        sort_order: goal.sort_order,
        created_at: goal.created_at.toISOString(),
      })),
    });
  } catch (e) {
    console.error('[mentor target-goals] GET', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
