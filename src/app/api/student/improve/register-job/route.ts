/**
 * POST /api/student/improve/register-job
 * Đăng ký job improve đang chạy (sau khi gọi Python và nhận job_id) để khi user quay lại trang vẫn thấy loading.
 * Body: { job_type, external_job_id, essay_id? }
 */

import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

const VALID_TYPES = [
  'profile_analysis',
  'profile_enhance',
  'essay_analysis',
  'essay_enhance',
  'cv_analysis',
  'cv_enhance',
] as const;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId || session?.user?.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const job_type = body.job_type as string;
    const external_job_id = body.external_job_id as string | undefined;
    const essay_id = body.essay_id as string | undefined;

    if (!job_type || !VALID_TYPES.includes(job_type as (typeof VALID_TYPES)[number])) {
      return NextResponse.json(
        { error: 'job_type bắt buộc và phải là một trong: ' + VALID_TYPES.join(', ') },
        { status: 400 }
      );
    }
    if (!external_job_id || typeof external_job_id !== 'string') {
      return NextResponse.json({ error: 'external_job_id bắt buộc' }, { status: 400 });
    }

    const row = await prisma.improve_jobs.create({
      data: {
        id: randomUUID(),
        student_id: studentId,
        job_type,
        external_job_id,
        essay_id: essay_id || null,
        status: 'in_progress',
      },
    });
    return NextResponse.json({ success: true, id: row.id });
  } catch (e) {
    console.error('[improve/register-job] POST error:', e);
    return NextResponse.json({ error: 'Tạo job thất bại' }, { status: 500 });
  }
}
