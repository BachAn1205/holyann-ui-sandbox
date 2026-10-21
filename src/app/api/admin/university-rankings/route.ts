/**
 * Admin API – CRUD university_rankings (QS)
 * GET: list all. POST: create.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';

function isAdmin(session: { user?: { role?: string } } | null) {
  const role = session?.user?.role;
  return role === 'ADMIN' || role === 'admin';
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const list = await prisma.university_rankings.findMany({
      orderBy: { qs_rank: 'asc' },
    });
    return NextResponse.json({ universities: list });
  } catch (error) {
    console.error('[GET /api/admin/university-rankings]', error);
    return NextResponse.json(
      { error: 'Không thể tải danh sách' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    if (qs_rank == null || !name || !country) {
      return NextResponse.json(
        { error: 'Thiếu trường bắt buộc: qs_rank, name, country' },
        { status: 400 },
      );
    }

    const created = await prisma.university_rankings.create({
      data: {
        qs_rank: Number(qs_rank),
        previous_rank: previous_rank != null && String(previous_rank).trim() !== '' ? String(previous_rank) : null,
        name: String(name),
        country: String(country),
        country_code: country_code != null && String(country_code).trim() !== '' ? String(country_code) : null,
        region: region != null && region !== '' ? String(region) : null,
        size: size != null && String(size).trim() !== '' ? String(size) : null,
        focus: focus != null && String(focus).trim() !== '' ? String(focus) : null,
        research_level: research_level != null && String(research_level).trim() !== '' ? String(research_level) : null,
        type: type != null && type !== '' ? String(type) : null,
        qs_overall_score: qs_overall_score != null && qs_overall_score !== '' ? Number(qs_overall_score) : null,
        ranking_year: ranking_year != null && ranking_year !== '' ? Number(ranking_year) : 2026,
        academic_reputation: academic_reputation != null ? Number(academic_reputation) : 0,
        employer_reputation: employer_reputation != null ? Number(employer_reputation) : 0,
        faculty_student_ratio: faculty_student_ratio != null ? Number(faculty_student_ratio) : 0,
        citations_per_faculty: citations_per_faculty != null ? Number(citations_per_faculty) : 0,
        international_faculty: international_faculty != null ? Number(international_faculty) : 0,
        international_students: international_students != null ? Number(international_students) : 0,
        isd_score: isd_score != null && isd_score !== '' ? Number(isd_score) : null,
        irn_score: irn_score != null && irn_score !== '' ? Number(irn_score) : null,
        eo_score: eo_score != null && eo_score !== '' ? Number(eo_score) : null,
        sus_score: sus_score != null && sus_score !== '' ? Number(sus_score) : null,
        ar_rank: ar_rank != null && String(ar_rank).trim() !== '' ? String(ar_rank) : null,
        er_rank: er_rank != null && String(er_rank).trim() !== '' ? String(er_rank) : null,
        fsr_rank: fsr_rank != null && String(fsr_rank).trim() !== '' ? String(fsr_rank) : null,
        cpf_rank: cpf_rank != null && String(cpf_rank).trim() !== '' ? String(cpf_rank) : null,
        ifr_rank: ifr_rank != null && String(ifr_rank).trim() !== '' ? String(ifr_rank) : null,
        isr_rank: isr_rank != null && String(isr_rank).trim() !== '' ? String(isr_rank) : null,
        isd_rank: isd_rank != null && String(isd_rank).trim() !== '' ? String(isd_rank) : null,
        irn_rank: irn_rank != null && String(irn_rank).trim() !== '' ? String(irn_rank) : null,
        eo_rank: eo_rank != null && String(eo_rank).trim() !== '' ? String(eo_rank) : null,
        sus_rank: sus_rank != null && String(sus_rank).trim() !== '' ? String(sus_rank) : null,
      },
    });
    return NextResponse.json({ university: created });
  } catch (error) {
    console.error('[POST /api/admin/university-rankings]', error);
    return NextResponse.json(
      { error: 'Không thể tạo bản ghi' },
      { status: 500 }
    );
  }
}
