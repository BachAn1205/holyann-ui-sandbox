/**
 * GET /api/student/improve/status
 * Trả về danh sách job improve đang chạy (in_progress) của student để trang có thể hiển thị loading và polling.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

const MAX_JOB_AGE_MS = 15 * 60 * 1000; // 15 phút

export async function GET() {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId || session?.user?.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const jobs = await prisma.improve_jobs.findMany({
      where: {
        student_id: studentId,
        status: 'in_progress',
      },
      orderBy: { started_at: 'desc' },
    });
    const now = Date.now();
    const valid = jobs.filter((j) => now - new Date(j.started_at).getTime() < MAX_JOB_AGE_MS);
    return NextResponse.json({
      success: true,
      jobs: valid.map((j) => ({
        id: j.id,
        job_type: j.job_type,
        external_job_id: j.external_job_id,
        essay_id: j.essay_id,
        started_at: j.started_at.toISOString(),
      })),
    });
  } catch (e) {
    console.error('[improve/status] GET error:', e);
    return NextResponse.json({ success: false, jobs: [] }, { status: 500 });
  }
}
