import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mentor/dashboard/stats
 * Lấy thống kê cho dashboard mentor
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mentorId = session.user.id;

    // 1. Đếm số học viên đang phụ trách (ACTIVE)
    const totalActiveStudents = await prisma.mentor_assignments.count({
      where: {
        mentor_id: mentorId,
        status: 'ACTIVE',
      },
    });

    // 2. Lấy rating của mentor
    const mentor = await prisma.mentors.findUnique({
      where: { user_id: mentorId },
      select: { rating: true },
    });

    // 3. Weekly deadlines (mock for now - requires tasks table)
    const weeklyDeadlines = 0; // TODO: Implement when tasks table exists

    return NextResponse.json({
      totalActiveStudents,
      weeklyDeadlines,
      averageRating: mentor?.rating || 5.0,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
