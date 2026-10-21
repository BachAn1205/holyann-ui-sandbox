import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import {
  findQs2026HeaderLine,
  parseCsvLine,
  parseCsvWithHeader,
  rowToQs2026Payload,
  toFloat,
} from '@/lib/qs-ranking-csv';

function isAdmin(session: { user?: { role?: string } } | null) {
  const role = session?.user?.role;
  return role === 'ADMIN' || role === 'admin';
}

function num(v: string): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function parseLegacyCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  return parseCsvWithHeader(lines, 0);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let csvText: string;
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file || typeof file === 'string') {
        return NextResponse.json({ error: 'Cần gửi file CSV (field: file)' }, { status: 400 });
      }
      csvText = await file.text();
    } else if (contentType.includes('text/csv') || contentType.includes('text/plain')) {
      csvText = await request.text();
    } else {
      const body = await request.json().catch(() => null);
      if (body && typeof body.csv === 'string') csvText = body.csv;
      else if (body && typeof body.content === 'string') csvText = body.content;
      else
        return NextResponse.json(
          { error: 'Gửi file CSV (form-data file) hoặc body text/csv' },
          { status: 400 },
        );
    }

    const lines = csvText.split(/\r?\n/).filter((l) => l.length > 0);
    const qsHeaderIdx = findQs2026HeaderLine(lines);

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    if (qsHeaderIdx >= 0) {
      const rows = parseCsvWithHeader(lines, qsHeaderIdx);
      for (let i = 0; i < rows.length; i++) {
        const payload = rowToQs2026Payload(rows[i]);
        if (!payload) {
          errors.push(`Dòng ${qsHeaderIdx + i + 2}: thiếu Rank, Name hoặc Country`);
          continue;
        }
        try {
          const existing = await prisma.university_rankings.findFirst({
            where: {
              name: payload.name,
              country: payload.country,
            },
          });
          if (existing) {
            await prisma.university_rankings.update({
              where: { id: existing.id },
              data: payload,
            });
            updated++;
          } else {
            await prisma.university_rankings.create({ data: payload });
            created++;
          }
        } catch (e) {
          errors.push(
            `Dòng ${qsHeaderIdx + i + 2} (${payload.name}): ${e instanceof Error ? e.message : 'Lỗi'}`,
          );
        }
      }
    } else {
      const rows = parseLegacyCsv(csvText);
      if (rows.length === 0) {
        return NextResponse.json({
          success: true,
          created: 0,
          updated: 0,
          errors: ['CSV trống hoặc không nhận dạng được định dạng (QS 2026 hoặc legacy).'],
        });
      }

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const qsRank = num(r.qs_rank ?? r['qs_rank']);
        const name = (r.name ?? '').trim();
        const country = (r.country ?? '').trim();
        const countryCode = (r.country_code ?? r['country_code'] ?? '').trim();
        if (qsRank == null || !name || !country) {
          errors.push(`Dòng ${i + 2}: thiếu qs_rank, name hoặc country`);
          continue;
        }
        if (!countryCode) {
          errors.push(`Dòng ${i + 2}: legacy CSV cần country_code`);
          continue;
        }
        const data = {
          qs_rank: qsRank,
          name,
          country,
          country_code: countryCode,
          region: (r.region ?? '').trim() || null,
          size: (r.size ?? '').trim() || null,
          focus: (r.focus ?? '').trim() || null,
          research_level: (r.research_level ?? '').trim() || null,
          type: (r.type ?? '').trim() || null,
          qs_overall_score: num(r.qs_overall_score ?? r['qs_overall_score'] ?? '') ?? null,
          ranking_year: num(r.ranking_year ?? '') ?? 2026,
          academic_reputation: toFloat(r.academic_reputation ?? r['academic_reputation'] ?? '', 0),
          employer_reputation: toFloat(r.employer_reputation ?? r['employer_reputation'] ?? '', 0),
          faculty_student_ratio: toFloat(r.faculty_student_ratio ?? r['faculty_student_ratio'] ?? '', 0),
          citations_per_faculty: toFloat(r.citations_per_faculty ?? r['citations_per_faculty'] ?? '', 0),
          international_faculty: toFloat(r.international_faculty ?? r['international_faculty'] ?? '', 0),
          international_students: toFloat(r.international_students ?? r['international_students'] ?? '', 0),
          isd_score: num(r.isd_score ?? ''),
          irn_score: num(r.irn_score ?? ''),
          eo_score: num(r.eo_score ?? ''),
          sus_score: num(r.sus_score ?? ''),
          ar_rank: (r.ar_rank ?? '').trim() || null,
          er_rank: (r.er_rank ?? '').trim() || null,
          fsr_rank: (r.fsr_rank ?? '').trim() || null,
          cpf_rank: (r.cpf_rank ?? '').trim() || null,
          ifr_rank: (r.ifr_rank ?? '').trim() || null,
          isr_rank: (r.isr_rank ?? '').trim() || null,
          isd_rank: (r.isd_rank ?? '').trim() || null,
          irn_rank: (r.irn_rank ?? '').trim() || null,
          eo_rank: (r.eo_rank ?? '').trim() || null,
          sus_rank: (r.sus_rank ?? '').trim() || null,
          previous_rank: (r.previous_rank ?? '').trim() || null,
        };

        try {
          const existing = await prisma.university_rankings.findFirst({
            where: { name, country },
          });

          if (existing) {
            await prisma.university_rankings.update({
              where: { id: existing.id },
              data,
            });
            updated++;
          } else {
            await prisma.university_rankings.create({ data });
            created++;
          }
        } catch (e) {
          errors.push(`Dòng ${i + 2} (name=${name}): ${e instanceof Error ? e.message : 'Lỗi'}`);
        }
      }
    }

    // Invalidate Redis Cache
    if ((created > 0 || updated > 0) && redis) {
      try {
        await redis.del('universities:approved');
        await redis.del('universities:countries:approved');
        
        const keys = await redis.keys('university:detail:*');
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (err) {
        console.error('[Redis] Failed to clear university caches on bulk:', err);
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      total: created + updated,
      format: qsHeaderIdx >= 0 ? 'qs_2026' : 'legacy',
      errors: errors.length ? errors : undefined,
    });
  } catch (error) {
    console.error('[POST /api/admin/university-rankings/bulk]', error);
    return NextResponse.json(
      { error: 'Bulk upsert thất bại', detail: error instanceof Error ? error.message : '' },
      { status: 500 },
    );
  }
}
