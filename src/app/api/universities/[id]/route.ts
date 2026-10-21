import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

const DETAIL_CACHE_TTL = 604800; // 7 days (seconds)

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    const numId = parseInt(id, 10);
    if (Number.isNaN(numId)) {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    const cacheKey = `university:detail:${numId}`;
    let university: any = null;

    // 1. Try to read from cache
    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          university = JSON.parse(cached);
        }
      } catch (err) {
        console.error(`[Redis] Failed to read university detail cache for ${numId}:`, err);
      }
    }

    // 2. Cache Miss -> Query Database
    if (!university) {
      university = await prisma.university_rankings.findUnique({
        where: { id: numId },
        select: {
          id: true,
          qs_rank: true,
          previous_rank: true,
          name: true,
          country: true,
          country_code: true,
          region: true,
          size: true,
          focus: true,
          research_level: true,
          type: true,
          website_url: true,
          status: true,
          created_by_user_id: true,
          qs_overall_score: true,
          ranking_year: true,
          academic_reputation: true,
          employer_reputation: true,
          faculty_student_ratio: true,
          citations_per_faculty: true,
          international_faculty: true,
          international_students: true,
          isd_score: true,
          irn_score: true,
          eo_score: true,
          sus_score: true,
          ar_rank: true,
          er_rank: true,
          fsr_rank: true,
          cpf_rank: true,
          ifr_rank: true,
          isr_rank: true,
          isd_rank: true,
          irn_rank: true,
          eo_rank: true,
          sus_rank: true,
        },
      });

      // 3. Cache it only if it is APPROVED
      if (university && university.status === 'APPROVED' && redis) {
        try {
          await redis.set(cacheKey, JSON.stringify(university), 'EX', DETAIL_CACHE_TTL);
        } catch (err) {
          console.error(`[Redis] Failed to write university detail cache for ${numId}:`, err);
        }
      }
    }

    if (!university) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    if (university.status === 'PENDING' && String(university.created_by_user_id ?? '') !== String(sessionUserId ?? '')) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, university });
  } catch (error) {
    console.error('❌ [GET /api/universities/[id]] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể tải thông tin trường' },
      { status: 500 }
    );
  }
}
