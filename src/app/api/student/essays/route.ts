/**
 * GET  /api/student/essays: Danh sách essay của student đăng nhập (hoặc essay mới nhất).
 * POST /api/student/essays: Tạo essay mới (student).
 */

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const studentId = session.user.id;

    const essays = await prisma.essays.findMany({
      where: { student_id: studentId },
      orderBy: { updated_at: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({ success: true, data: essays });
  } catch (error) {
    console.error('❌ [student/essays GET] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Lỗi khi lấy danh sách luận' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const studentId = session.user.id;

    const body = await request.json();
    const title = typeof body.title === 'string' ? body.title : undefined;
    const content = typeof body.content === 'string' ? body.content : '';

    const essay = await prisma.essays.create({
      data: {
        id: randomUUID(),
        student_id: studentId,
        title: title || null,
        content,
      },
    });

    return NextResponse.json({ success: true, data: essay });
  } catch (error) {
    console.error('❌ [student/essays POST] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Lỗi khi tạo luận' },
      { status: 500 }
    );
  }
}
