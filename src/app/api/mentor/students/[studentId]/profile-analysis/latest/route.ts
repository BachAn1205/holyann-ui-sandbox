/**
 * GET /api/mentor/students/[studentId]/profile-analysis/latest
 * Giống /api/students/[id]/profile-analysis/latest nhưng chỉ mentor được assign.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import {
  mergeAreasColumnIntoFullResult,
  normalizeFeature1FullResult,
} from '@/lib/profile-analysis-normalize';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;

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

    const [analysis, enhance] = await Promise.all([
      prisma.profile_analyses.findFirst({
        where: { student_id: studentId },
        orderBy: { created_at: 'desc' },
        select: { id: true, full_result: true, areas: true, input_data: true, created_at: true },
      }),
      prisma.profile_improve_results.findFirst({
        where: { student_id: studentId },
        orderBy: { created_at: 'desc' },
        select: { id: true, enhance_result: true, enhance_at: true },
      }),
    ]);

    return NextResponse.json({
      analysis: analysis
        ? (() => {
            const merged = mergeAreasColumnIntoFullResult(analysis.full_result, analysis.areas);
            const normalized = normalizeFeature1FullResult(merged);
            return {
              id: analysis.id,
              full_result: (normalized ?? merged) as object,
              input_data: analysis.input_data,
              analysis_date: analysis.created_at,
            };
          })()
        : null,
      enhance: enhance
        ? {
            id: enhance.id,
            enhance_result: enhance.enhance_result,
            enhance_at: enhance.enhance_at,
          }
        : null,
    });
  } catch (e) {
    console.error('[mentor profile-analysis/latest]', e);
    return NextResponse.json({ error: 'Lỗi tải dữ liệu' }, { status: 500 });
  }
}
