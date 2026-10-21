/**
 * GET /api/mentor/students/[studentId]/essays/[essayId]
 * Mentor xem chi tiết bài luận của học sinh (kèm comments).
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentId: string; essayId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const mentorId = session.user.id;
    const { studentId, essayId } = await params;

    const assignment = await prisma.mentor_assignments.findFirst({
      where: { student_id: studentId, mentor_id: mentorId, status: 'ACTIVE' },
    });
    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Bạn không được assign với học sinh này' },
        { status: 403 }
      );
    }

    const essay = await prisma.essays.findFirst({
      where: { id: essayId, student_id: studentId },
      include: {
        essay_comments: {
          orderBy: { created_at: 'asc' },
          include: {
            users: {
              select: { id: true, full_name: true, email: true },
            },
          },
        },
      },
    });

    if (!essay) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài luận' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: essay });
  } catch (error) {
    console.error('❌ [mentor/students/.../essays/...] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Lỗi khi lấy bài luận' },
      { status: 500 }
    );
  }
}
