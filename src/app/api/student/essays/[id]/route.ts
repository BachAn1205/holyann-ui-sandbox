/**
 * GET   /api/student/essays/[id]: Chi tiết một essay (student sở hữu).
 * PATCH /api/student/essays/[id]: Cập nhật essay (student sở hữu).
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireStudentAuth, SAFE_USER_SELECT } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireStudentAuth();
    const { id } = await params;

    const essay = await prisma.essays.findFirst({
      where: { id, student_id: currentUser.id },
      include: {
        essay_comments: {
          orderBy: { created_at: 'asc' },
          include: {
            users: {
              select: SAFE_USER_SELECT,
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
    const status = error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Unauthorized' : error instanceof Error ? error.message : 'Lỗi khi lấy bài luận' },
      { status }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireStudentAuth();
    const { id } = await params;

    const essay = await prisma.essays.findFirst({
      where: { id, student_id: currentUser.id },
      select: { id: true, student_id: true },
    });
    if (!essay) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bài luận' }, { status: 404 });
    }

    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title : undefined;
    const content = typeof body.content === 'string' ? body.content : undefined;

    await prisma.essays.updateMany({
      where: { id, student_id: currentUser.id },
      data: {
        ...(title !== undefined && { title: title || null }),
        ...(content !== undefined && { content }),
      },
    });

    const updated = await prisma.essays.findFirst({
      where: { id, student_id: currentUser.id },
      select: {
        id: true,
        title: true,
        content: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    const status = error instanceof Error && error.message === 'UNAUTHORIZED' ? 401 : 500;
    return NextResponse.json(
      { success: false, error: status === 401 ? 'Unauthorized' : error instanceof Error ? error.message : 'Lỗi khi cập nhật bài luận' },
      { status }
    );
  }
}
