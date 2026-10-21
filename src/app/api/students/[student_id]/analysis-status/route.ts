/**
 * GET /api/students/[student_id]/analysis-status
 * Trả về: đang có phân tích chạy nền không (inProgress) và kết quả mới nhất (nếu có).
 * Dùng để khi user quay lại trang analysis vẫn thấy loading + "Vui lòng đợi" nếu job đang chạy.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MAX_JOB_AGE_MS = 15 * 60 * 1000; // 15 phút

export async function GET(
  _request: Request,
  context: { params: Promise<{ student_id: string }> }
) {
  try {
    const { student_id: studentId } = await context.params;
    if (!studentId) {
      return NextResponse.json(
        { error: 'Thiếu student_id', inProgress: false },
        { status: 400 }
      );
    }

    const job = await prisma.profile_analysis_jobs.findFirst({
      where: { student_id: studentId, status: 'in_progress' },
      orderBy: { started_at: 'desc' },
    });

    const now = Date.now();
    const jobAge = job ? now - new Date(job.started_at).getTime() : 0;
    const inProgress = !!job && jobAge < MAX_JOB_AGE_MS;

    let latest: { fullResult: unknown } | null = null;
    if (!inProgress) {
      const analysis = await prisma.profile_analyses.findFirst({
        where: { student_id: studentId },
        orderBy: { created_at: 'desc' },
      });
      const raw = analysis as { full_result?: unknown } | null;
      if (raw?.full_result != null) {
        latest = { fullResult: raw.full_result };
      }
    }

    return NextResponse.json({
      success: true,
      inProgress,
      latest: latest?.fullResult ?? null,
    });
  } catch (e) {
    console.error('[analysis-status]', e);
    return NextResponse.json(
      { success: false, inProgress: false, latest: null, error: (e as Error).message },
      { status: 500 }
    );
  }
}
