import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

function isAdmin(session: { user?: { role?: string } } | null) {
  const role = session?.user?.role;
  return role === 'ADMIN' || role === 'admin';
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await request.json();
    const {
      qs_rank,
      previous_rank,
      name,
      country,
      country_code,
      region,
      size,
      focus,
      research_level,
      type,
      qs_overall_score,
      ranking_year,
      academic_reputation,
      employer_reputation,
      faculty_student_ratio,
      citations_per_faculty,
      international_faculty,
      international_students,
      isd_score,
      irn_score,
      eo_score,
      sus_score,
      ar_rank,
      er_rank,
      fsr_rank,
      cpf_rank,
      ifr_rank,
      isr_rank,
      isd_rank,
      irn_rank,
      eo_rank,
      sus_rank,
    } = body;

    const data: Parameters<typeof prisma.university_rankings.update>[0]['data'] = {};
    if (qs_rank != null) data.qs_rank = Number(qs_rank);
    if (previous_rank !== undefined) {
      data.previous_rank = previous_rank != null && String(previous_rank).trim() !== '' ? String(previous_rank) : null;
    }
    if (name != null) data.name = String(name);
    if (country != null) data.country = String(country);
    if (country_code !== undefined) {
      data.country_code = country_code != null && String(country_code).trim() !== '' ? String(country_code) : null;
    }
    if (region !== undefined) data.region = region != null && region !== '' ? String(region) : null;
    if (size !== undefined) data.size = size != null && String(size).trim() !== '' ? String(size) : null;
    if (focus !== undefined) data.focus = focus != null && String(focus).trim() !== '' ? String(focus) : null;
    if (research_level !== undefined) {
      data.research_level = research_level != null && String(research_level).trim() !== '' ? String(research_level) : null;
    }
    if (type !== undefined) data.type = type != null && type !== '' ? String(type) : null;
    if (qs_overall_score !== undefined) {
      data.qs_overall_score = qs_overall_score != null && qs_overall_score !== '' ? Number(qs_overall_score) : null;
    }
    if (ranking_year !== undefined) {
      data.ranking_year = ranking_year != null && ranking_year !== '' ? Number(ranking_year) : 2026;
    }
    if (academic_reputation !== undefined) data.academic_reputation = Number(academic_reputation);
    if (employer_reputation !== undefined) data.employer_reputation = Number(employer_reputation);
    if (faculty_student_ratio !== undefined) data.faculty_student_ratio = Number(faculty_student_ratio);
    if (citations_per_faculty !== undefined) data.citations_per_faculty = Number(citations_per_faculty);
    if (international_faculty !== undefined) data.international_faculty = Number(international_faculty);
    if (international_students !== undefined) data.international_students = Number(international_students);
    if (isd_score !== undefined) data.isd_score = isd_score != null && isd_score !== '' ? Number(isd_score) : null;
    if (irn_score !== undefined) data.irn_score = irn_score != null && irn_score !== '' ? Number(irn_score) : null;
    if (eo_score !== undefined) data.eo_score = eo_score != null && eo_score !== '' ? Number(eo_score) : null;
    if (sus_score !== undefined) data.sus_score = sus_score != null && sus_score !== '' ? Number(sus_score) : null;
    if (ar_rank !== undefined) data.ar_rank = ar_rank != null && String(ar_rank).trim() !== '' ? String(ar_rank) : null;
    if (er_rank !== undefined) data.er_rank = er_rank != null && String(er_rank).trim() !== '' ? String(er_rank) : null;
    if (fsr_rank !== undefined) data.fsr_rank = fsr_rank != null && String(fsr_rank).trim() !== '' ? String(fsr_rank) : null;
    if (cpf_rank !== undefined) data.cpf_rank = cpf_rank != null && String(cpf_rank).trim() !== '' ? String(cpf_rank) : null;
    if (ifr_rank !== undefined) data.ifr_rank = ifr_rank != null && String(ifr_rank).trim() !== '' ? String(ifr_rank) : null;
    if (isr_rank !== undefined) data.isr_rank = isr_rank != null && String(isr_rank).trim() !== '' ? String(isr_rank) : null;
    if (isd_rank !== undefined) data.isd_rank = isd_rank != null && String(isd_rank).trim() !== '' ? String(isd_rank) : null;
    if (irn_rank !== undefined) data.irn_rank = irn_rank != null && String(irn_rank).trim() !== '' ? String(irn_rank) : null;
    if (eo_rank !== undefined) data.eo_rank = eo_rank != null && String(eo_rank).trim() !== '' ? String(eo_rank) : null;
    if (sus_rank !== undefined) data.sus_rank = sus_rank != null && String(sus_rank).trim() !== '' ? String(sus_rank) : null;

    const updated = await prisma.university_rankings.update({
      where: { id: numId },
      data,
    });

    // Invalidate Redis Cache
    if (redis) {
      try {
        await redis.del('universities:approved');
        await redis.del('universities:countries:approved');
        await redis.del(`university:detail:${numId}`);
      } catch (err) {
        console.error('[Redis] Failed to clear university caches on PATCH:', err);
      }
    }

    return NextResponse.json({ university: updated });
  } catch (error) {
    console.error('[PATCH /api/admin/university-rankings/:id]', error);
    return NextResponse.json(
      { error: 'Không thể cập nhật' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    await prisma.university_rankings.delete({
      where: { id: numId },
    });

    // Invalidate Redis Cache
    if (redis) {
      try {
        await redis.del('universities:approved');
        await redis.del('universities:countries:approved');
        await redis.del(`university:detail:${numId}`);
      } catch (err) {
        console.error('[Redis] Failed to clear university caches on DELETE:', err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/university-rankings/:id]', error);
    return NextResponse.json(
      { error: 'Không thể xóa' },
      { status: 500 }
    );
  }
}
