import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/mentor/students/[studentId]/school-wishlist
 * Mentor xem danh sách trường mục tiêu (nguyện vọng) của học viên được gán cho mình.
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

    // Verify mentor has access to this student
    const assignment = await prisma.mentor_assignments.findFirst({
      where: { mentor_id: session.user.id, student_id: studentId },
    });
    if (!assignment) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const items = await prisma.school_wishlist.findMany({
      where: { student_id: studentId },
      orderBy: { sort_order: 'asc' },
      include: {
        university_rankings: {
          select: { 
            id: true, 
            name: true, 
            country: true, 
            qs_rank: true, 
            qs_overall_score: true,
            status: true,
            website_url: true,
            region: true
          },
        },
      },
    });

    return NextResponse.json({
      items: items.map((r) => ({
        university_id: r.university_id,
        name: r.university_rankings?.name ?? '',
        country: r.university_rankings?.country ?? '',
        region: r.university_rankings?.region ?? '',
        website_url: r.university_rankings?.website_url ?? '',
        status: r.university_rankings?.status ?? 'APPROVED',
        qs_rank: r.university_rankings?.qs_rank ?? null,
        qs_overall_score: r.university_rankings?.qs_overall_score ?? null,
        sort_order: r.sort_order,
      })),
    });
  } catch (e) {
    console.error('[mentor school-wishlist] GET', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
