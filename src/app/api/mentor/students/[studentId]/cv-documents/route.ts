/**
 * GET /api/mentor/students/[studentId]/cv-documents
 * Mentor xem danh sách CV (theo slot) của học viên từ DB (chỉ khi mentor được assign).
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
      select: { id: true },
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Bạn không được assign với học sinh này' },
        { status: 403 }
      );
    }

    const documents = await prisma.student_cv_documents.findMany({
      where: { student_id: studentId },
      orderBy: { slot_index: 'asc' },
    });

    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    console.error('❌ [mentor/students/[studentId]/cv-documents] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Lỗi khi lấy danh sách CV',
      },
      { status: 500 }
    );
  }
}
