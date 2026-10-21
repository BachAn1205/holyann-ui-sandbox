/**
 * GET  /api/student/improve/results: Lấy kết quả phân tích & đề xuất đã lưu (để hiển thị sau khi refresh).
 * POST /api/student/improve/results: Lưu analysis và/hoặc enhance, hoặc cập nhật đánh giá (rating).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { randomUUID } from 'crypto';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  const role = (session?.user as { role?: string })?.role;
  if (!studentId || (role !== 'STUDENT' && role !== 'student')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const row = await prisma.profile_improve_results.findFirst({
      where: { student_id: studentId },
      orderBy: { created_at: 'desc' },
    });
    if (!row) {
      return NextResponse.json({
        analysis: null,
        enhance: null,
        analysis_rating: null,
        enhance_rating: null,
        analysis_at: null,
        enhance_at: null,
      });
    }
    return NextResponse.json({
      analysis: row.analysis_result as Record<string, unknown> | null,
      enhance: row.enhance_result as Record<string, unknown> | null,
      analysis_rating: row.analysis_rating,
      enhance_rating: row.enhance_rating,
      analysis_at: row.analysis_at?.toISOString() ?? null,
      enhance_at: row.enhance_at?.toISOString() ?? null,
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2021') {
      return NextResponse.json({
        analysis: null,
        enhance: null,
        analysis_rating: null,
        enhance_rating: null,
        analysis_at: null,
        enhance_at: null,
      });
    }
    console.error('[improve/results] GET error:', e);
    return NextResponse.json({ error: 'Failed to load results' }, { status: 500 });
  }
}

type Body = {
  analysis?: Record<string, unknown>;
  enhance?: Record<string, unknown>;
  analysis_rating?: number | null;
  enhance_rating?: number | null;
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  const role = (session?.user as { role?: string })?.role;
  if (!studentId || (role !== 'STUDENT' && role !== 'student')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: Body = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { analysis, enhance, analysis_rating, enhance_rating } = body;
  const ratingMin = 1;
  const ratingMax = 5;
  const clampRating = (v: number) => Math.min(ratingMax, Math.max(ratingMin, Math.round(v)));
  try {
    const now = new Date();
    const existing = await prisma.profile_improve_results.findFirst({
      where: { student_id: studentId },
      orderBy: { created_at: 'desc' },
    });

    const updateData: Record<string, unknown> = { updated_at: now };
    if (analysis !== undefined) {
      updateData.analysis_result = analysis ?? null;
      updateData.analysis_at = analysis != null ? now : null;
    }
    if (enhance !== undefined) {
      updateData.enhance_result = enhance ?? null;
      updateData.enhance_at = enhance != null ? now : null;
    }
    if (analysis_rating !== undefined) updateData.analysis_rating = analysis_rating == null ? null : clampRating(analysis_rating);
    if (enhance_rating !== undefined) updateData.enhance_rating = enhance_rating == null ? null : clampRating(enhance_rating);

    const updated = existing
      ? await prisma.profile_improve_results.update({
          where: { id: existing.id },
          data: updateData as Parameters<typeof prisma.profile_improve_results.update>[0]['data'],
        })
      : await prisma.profile_improve_results.create({
          data: {
            id: randomUUID(),
            student_id: studentId,
            ...(analysis != null && { analysis_result: analysis as object, analysis_at: now }),
            ...(enhance != null && { enhance_result: enhance as object, enhance_at: now }),
            ...(analysis_rating != null && !Number.isNaN(analysis_rating) && { analysis_rating: clampRating(analysis_rating) }),
            ...(enhance_rating != null && !Number.isNaN(enhance_rating) && { enhance_rating: clampRating(enhance_rating) }),
          },
        });
    return NextResponse.json({
      ok: true,
      analysis_at: updated.analysis_at?.toISOString() ?? null,
      enhance_at: updated.enhance_at?.toISOString() ?? null,
    });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === 'P2021') {
      return NextResponse.json({ error: 'Table not ready. Run: npx prisma migrate deploy' }, { status: 503 });
    }
    console.error('[improve/results] POST error:', e);
    return NextResponse.json({ error: 'Failed to save results' }, { status: 500 });
  }
}
