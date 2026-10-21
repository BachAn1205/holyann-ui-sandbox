/**
 * GET /api/mentor/students/[studentId]/admission-chance/latest
 * Giống /api/students/[id]/admission-chance/latest — mentor được assign.
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

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

    const latest = await prisma.admission_chance_results.findFirst({
      where: { student_id: studentId },
      orderBy: { created_at: 'desc' },
      select: { id: true, summary: true, faculties: true, created_at: true },
    });

    if (!latest) {
      return NextResponse.json({ result: null }, { status: 200 });
    }

    const fac = latest.faculties as Record<string, unknown> | null;
    const hasLists =
      fac &&
      (Array.isArray(fac.reach) || Array.isArray(fac.match) || Array.isArray(fac.safety));

    if (!hasLists) {
      return NextResponse.json({ result: null }, { status: 200 });
    }

    type PairRow = Record<string, unknown>;
    const allRows: PairRow[] = [
      ...(Array.isArray(fac.reach) ? fac.reach : []),
      ...(Array.isArray(fac.match) ? fac.match : []),
      ...(Array.isArray(fac.safety) ? fac.safety : []),
    ];
    const uniqueNames = [...new Set(allRows.map((r) => r.university_name).filter(Boolean) as string[])];

    const universityRows =
      uniqueNames.length > 0
        ? await prisma.university_rankings.findMany({
            where: { name: { in: uniqueNames } },
            select: { id: true, name: true },
          })
        : [];
    const nameToId = new Map<string, number>(universityRows.map((u) => [u.name, u.id]));

    const enrich = (list: unknown[]) =>
      list.map((row) => {
        const r = row as PairRow;
        const uname = typeof r.university_name === 'string' ? r.university_name : null;
        return {
          ...r,
          university_id: uname ? (nameToId.get(uname) ?? null) : null,
        };
      });

    const enrichedFac = {
      reach: Array.isArray(fac.reach) ? enrich(fac.reach) : [],
      match: Array.isArray(fac.match) ? enrich(fac.match) : [],
      safety: Array.isArray(fac.safety) ? enrich(fac.safety) : [],
    };

    return NextResponse.json({
      result: {
        summary: (latest.summary as object) ?? {},
        faculties: enrichedFac,
        created_at: latest.created_at?.toISOString() ?? null,
      },
    });
  } catch (e) {
    console.error('[mentor admission-chance/latest]', e);
    return NextResponse.json({ error: 'Lỗi tải kết quả' }, { status: 500 });
  }
}
