/**
 * GET /api/mentor/students/[studentId]/recommend-faculty/latest
 * Lần gợi ý ngành gần nhất (faculty_recommendations) — mentor được assign.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

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
      where: { student_id: studentId, mentor_id: session.user.id, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!assignment) {
      return NextResponse.json(
        { error: 'Bạn không được assign với học sinh này' },
        { status: 403 }
      );
    }

    const latest = await prisma.faculty_recommendations.findFirst({
      where: { student_id: studentId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        assessment_summary: true,
        faculties: true,
        created_at: true,
      },
    });

    if (!latest) {
      return NextResponse.json({ recommendation: null });
    }

    return NextResponse.json({
      recommendation: {
        id: latest.id,
        assessment_summary: latest.assessment_summary,
        faculties: latest.faculties,
        created_at: latest.created_at,
      },
    });
  } catch (e) {
    console.error('[mentor recommend-faculty/latest]', e);
    return NextResponse.json({ error: 'Lỗi tải gợi ý ngành' }, { status: 500 });
  }
}
