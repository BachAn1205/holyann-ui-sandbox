import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { SAFE_USER_SELECT } from '@/lib/auth-utils';

async function canMentorAccessEssay(studentId: string, mentorId: string) {
  const assignment = await prisma.mentor_assignments.findFirst({
    where: {
      student_id: studentId,
      mentor_id: mentorId,
      status: 'ACTIVE',
    },
    select: { id: true },
  });

  return Boolean(assignment);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { id: essayId } = await params;

    const essay = await prisma.essays.findUnique({
      where: { id: essayId },
      select: { student_id: true },
    });
    if (!essay) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài luận' }, { status: 404 });
    }

    const userId = session.user.id;
    const role = (session.user as { role?: string }).role?.toUpperCase();

    let canView = essay.student_id === userId || role === 'ADMIN';
    if (!canView && role === 'MENTOR') {
      canView = await canMentorAccessEssay(essay.student_id, userId);
    }

    if (!canView) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền xem bài luận này' }, { status: 403 });
    }

    const comments = await prisma.essay_comments.findMany({
      where: { essay_id: essayId },
      orderBy: { created_at: 'asc' },
      include: {
        users: {
          select: SAFE_USER_SELECT,
        },
      },
    });

    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    console.error('❌ [student/essays/[id]/comments GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Lỗi khi lấy comment' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as { role?: string }).role?.toUpperCase();
    if (role !== 'MENTOR' && role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Chỉ mentor hoặc admin mới được comment vào bài luận' },
        { status: 403 }
      );
    }

    const { id: essayId } = await params;

    const essay = await prisma.essays.findUnique({
      where: { id: essayId },
      select: { id: true, student_id: true },
    });
    if (!essay) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài luận' }, { status: 404 });
    }

    if (role === 'MENTOR') {
      const canComment = await canMentorAccessEssay(essay.student_id, session.user.id);
      if (!canComment) {
        return NextResponse.json({ success: false, error: 'Bạn không có quyền comment bài luận này' }, { status: 403 });
      }
    }

    const body = await request.json();
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    if (!content) {
      return NextResponse.json({ success: false, error: 'Nội dung comment không được để trống' }, { status: 400 });
    }
    const start_offset = typeof body.start_offset === 'number' ? body.start_offset : undefined;
    const end_offset = typeof body.end_offset === 'number' ? body.end_offset : undefined;

    const comment = await prisma.essay_comments.create({
      data: {
        id: randomUUID(),
        essay_id: essayId,
        author_id: session.user.id,
        content,
        start_offset: start_offset ?? null,
        end_offset: end_offset ?? null,
      },
      include: {
        users: {
          select: SAFE_USER_SELECT,
        },
      },
    });

    return NextResponse.json({ success: true, data: comment });
  } catch (error) {
    console.error('❌ [student/essays/[id]/comments POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Lỗi khi thêm comment' },
      { status: 500 }
    );
  }
}
