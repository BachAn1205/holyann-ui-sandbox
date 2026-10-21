/**
 * GET /api/mentor/students/[studentId]/essays
 * Mentor xem danh sách bài luận của học sinh (chỉ khi mentor được assign cho student đó).
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const mentorId = session.user.id;
    const { studentId } = await params;

    const assignment = await prisma.mentor_assignments.findFirst({
      where: { student_id: studentId, mentor_id: mentorId, status: 'ACTIVE' },
    });
    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Bạn không được assign với học sinh này' },
        { status: 403 }
      );
    }

    const essays = await prisma.essays.findMany({
      where: { student_id: studentId },
      orderBy: { updated_at: 'desc' },
      select: {
        id: true,
        title: true,
        slot_index: true,
        content: true,
        created_at: true,
        updated_at: true,
        _count: { select: { essay_comments: true } },
      },
    });

    return NextResponse.json({ success: true, data: essays });
  } catch (error) {
    console.error('❌ [mentor/students/[studentId]/essays] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Lỗi khi lấy danh sách luận' },
      { status: 500 }
    );
  }
}
