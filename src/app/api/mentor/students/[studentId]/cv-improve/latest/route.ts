/**
 * GET /api/mentor/students/[studentId]/cv-improve/latest?cv_document_id=
 * Mirror student cv-improve/latest với kiểm tra mentor assignment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { cloneJsonSafe } from '@/lib/essay-feature4';
import {
  parseCvEnhanceStoredOutput,
  sanitizeCvAnalysisOutputForClient,
  sanitizeCvEnhanceOutputForClient,
} from '@/lib/cv-feature7';

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
    const cvDocumentId = request.nextUrl.searchParams.get('cv_document_id');
    if (!cvDocumentId) {
      return NextResponse.json({ error: 'Thiếu cv_document_id' }, { status: 400 });
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

    const doc = await prisma.student_cv_documents.findFirst({
      where: { id: cvDocumentId, student_id: studentId },
      select: { id: true },
    });
    if (!doc) {
      return NextResponse.json({ error: 'Không tìm thấy CV' }, { status: 404 });
    }

    const [lastAnalysis, lastEnhance] = await Promise.all([
      prisma.cv_analysis_runs.findFirst({
        where: { cv_document_id: cvDocumentId, run_kind: 'analysis' },
        orderBy: { created_at: 'desc' },
        select: { output_data: true, input_data: true, created_at: true },
      }),
      prisma.cv_analysis_runs.findFirst({
        where: { cv_document_id: cvDocumentId, run_kind: 'enhance' },
        orderBy: { created_at: 'desc' },
        select: { output_data: true, input_data: true, created_at: true },
      }),
    ]);

    const analysisOut = lastAnalysis?.output_data
      ? sanitizeCvAnalysisOutputForClient(cloneJsonSafe(lastAnalysis.output_data))
      : null;
    const enhanceParsed = lastEnhance?.output_data
      ? parseCvEnhanceStoredOutput(lastEnhance.output_data) ?? lastEnhance.output_data
      : null;
    const enhanceOut = enhanceParsed ? sanitizeCvEnhanceOutputForClient(enhanceParsed) : null;

    return NextResponse.json({
      analysis: lastAnalysis
        ? {
            output_data: analysisOut,
            input_data: cloneJsonSafe(lastAnalysis.input_data),
            created_at: lastAnalysis.created_at,
          }
        : null,
      enhance: lastEnhance
        ? {
            output_data: enhanceOut,
            input_data: cloneJsonSafe(lastEnhance.input_data),
            created_at: lastEnhance.created_at,
          }
        : null,
    });
  } catch (e) {
    console.error('[mentor cv-improve/latest]', e);
    return NextResponse.json({ error: 'Lỗi tải dữ liệu' }, { status: 500 });
  }
}
