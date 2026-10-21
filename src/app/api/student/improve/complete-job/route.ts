/**
 * POST /api/student/improve/complete-job
 * Đánh dấu job hoàn thành hoặc thất bại (sau khi poll result xong).
 * Body: { job_id } hoặc { external_job_id } và { status: 'completed' | 'failed', error_message? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId || session?.user?.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const job_id = body.job_id as string | undefined;
    const external_job_id = body.external_job_id as string | undefined;
    const status = body.status as string; // 'completed' | 'failed'
    const error_message = body.error_message as string | undefined;

    if (status !== 'completed' && status !== 'failed') {
      return NextResponse.json({ error: 'status phải là completed hoặc failed' }, { status: 400 });
    }

    if (job_id) {
      await prisma.improve_jobs.updateMany({
        where: { id: job_id, student_id: studentId, status: 'in_progress' },
        data: {
          status,
          completed_at: new Date(),
          error_message: error_message ?? null,
        },
      });
    } else if (external_job_id) {
      await prisma.improve_jobs.updateMany({
        where: { external_job_id, student_id: studentId, status: 'in_progress' },
        data: {
          status,
          completed_at: new Date(),
          error_message: error_message ?? null,
        },
      });
    } else {
      return NextResponse.json({ error: 'Cần job_id hoặc external_job_id' }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('[improve/complete-job] POST error:', e);
    return NextResponse.json({ error: 'Cập nhật job thất bại' }, { status: 500 });
  }
}
