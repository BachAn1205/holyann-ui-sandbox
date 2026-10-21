/**
 * GET /api/mentor/students/[studentId]/essay-improve/latest?essay_id=
 * Mirror student essay-improve/latest với kiểm tra mentor assignment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { cloneJsonSafe, sanitizeEnhanceOutputForClient } from '@/lib/essay-feature4';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;
    const essayId = request.nextUrl.searchParams.get('essay_id');
    if (!essayId) {
      return NextResponse.json({ error: 'Thiếu essay_id' }, { status: 400 });
    }

    const assignment = await prisma.mentor_assignments.findFirst({
      where: { student_id: studentId, mentor_id: session.user.id, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!assignment) {
      return NextResponse.json(
        { error: 'Bạn không được assign với học sinh này' },
        { status: 403 }
      );
    }

    const essay = await prisma.essays.findFirst({
      where: { id: essayId, student_id: studentId },
      select: { id: true },
    });
    if (!essay) {
      return NextResponse.json({ error: 'Không tìm thấy bài luận' }, { status: 404 });
    }

    const [lastAnalysis, lastEnhance] = await Promise.all([
      prisma.essay_analysis_runs.findFirst({
        where: { essay_id: essayId, run_kind: 'analysis' },
        orderBy: { created_at: 'desc' },
        select: { output_data: true, input_data: true, created_at: true },
      }),
      prisma.essay_analysis_runs.findFirst({
        where: { essay_id: essayId, run_kind: 'enhance' },
        orderBy: { created_at: 'desc' },
        select: { output_data: true, input_data: true, created_at: true },
      }),
    ]);

    return NextResponse.json({
      analysis: lastAnalysis
        ? {
            output_data: cloneJsonSafe(lastAnalysis.output_data),
            input_data: cloneJsonSafe(lastAnalysis.input_data),
            created_at: lastAnalysis.created_at,
          }
        : null,
      enhance: lastEnhance
        ? {
            output_data: sanitizeEnhanceOutputForClient(cloneJsonSafe(lastEnhance.output_data)),
            input_data: cloneJsonSafe(lastEnhance.input_data),
            created_at: lastEnhance.created_at,
          }
        : null,
    });
  } catch (e) {
    console.error('[mentor essay-improve/latest]', e);
    return NextResponse.json({ error: 'Lỗi tải dữ liệu' }, { status: 500 });
  }
}
