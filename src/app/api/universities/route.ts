/**
 * GET /api/universities
 * Public API – danh sách trường QS (schema: university_rankings).
 * Query: ?search=&region=&country=&minRank=&maxRank=&page=1&pageSize=24
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;

const CACHE_KEY = 'universities:approved';
const CACHE_TTL = 86400; // 24 hours

let globalApprovedUnis: any[] | null = null;
let globalCacheTime = 0;

function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getAcronym(name: string): string {
  const words = normalizeText(name).split(/\s+/).filter(Boolean);
  return words.map((word) => word[0]).join('');
}

function getSearchPriority(name: string, search: string): number {
  if (!search) return 5;
  const normalizedName = normalizeText(name);
  const normalizedSearch = normalizeText(search);
  const acronym = getAcronym(name);

  if (acronym === normalizedSearch) return 1;
  if (normalizedName === normalizedSearch) return 2;
  if (normalizedName.startsWith(normalizedSearch)) return 3;
  if (normalizedName.includes(normalizedSearch)) return 4;
  return 5;
}

function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('next-auth.session-token') || request.cookies.get('__Secure-next-auth.session-token');
    let sessionUserId: string | null | undefined = null;
    if (sessionToken) {
      const session = await getServerSession(authOptions);
      sessionUserId = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;
    }
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const region = searchParams.get('region')?.trim() || '';
    const country = searchParams.get('country')?.trim() || '';
    const minRank = searchParams.get('minRank');
    const maxRank = searchParams.get('maxRank');

    const pageRaw = searchParams.get('page');
    const pageSizeRaw = searchParams.get('pageSize');

    let pageSize = parseInt(pageSizeRaw ?? '', 10);
    if (Number.isNaN(pageSize) || pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;
    pageSize = Math.min(pageSize, MAX_PAGE_SIZE);

    const minRankNum = minRank ? parseInt(minRank, 10) : NaN;
    const maxRankNum = maxRank ? parseInt(maxRank, 10) : NaN;

    let page = parseInt(pageRaw ?? '1', 10);
    if (Number.isNaN(page) || page < 1) page = 1;

    // 1. Try reading APPROVED universities from in-memory cache, then Redis
    let approvedUnis: any[] = [];
    if (globalApprovedUnis && Date.now() - globalCacheTime < CACHE_TTL * 1000) {
      approvedUnis = globalApprovedUnis;
    } else {
      if (redis) {
        try {
          const cached = await redis.get(CACHE_KEY);
          if (cached) {
            approvedUnis = JSON.parse(cached);
          }
        } catch (err) {
          console.error('[Redis] Failed to read approved universities:', err);
        }
      }

      // 2. Cache Miss -> Query Database
      if (approvedUnis.length === 0) {
        approvedUnis = await prisma.university_rankings.findMany({
          where: { status: 'APPROVED' },
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
          },
        });

        // Precompute fields for performance
        approvedUnis = approvedUnis.map((u) => ({
          ...u,
          _nName: normalizeText(u.name),
          _nCountry: normalizeText(u.country),
          _acronym: getAcronym(u.name)
        }));

        if (redis && approvedUnis.length > 0) {
          try {
            await redis.set(CACHE_KEY, JSON.stringify(approvedUnis), 'EX', CACHE_TTL);
          } catch (err) {
            console.error('[Redis] Failed to write approved universities cache:', err);
          }
        }
      } else if (approvedUnis.length > 0 && !approvedUnis[0]._nName) {
         // Precompute if loaded from an old Redis cache
         approvedUnis = approvedUnis.map((u) => ({
          ...u,
          _nName: normalizeText(u.name),
          _nCountry: normalizeText(u.country),
          _acronym: getAcronym(u.name)
        }));
      }
      
      globalApprovedUnis = approvedUnis;
      globalCacheTime = Date.now();
    }

    // 3. Merge with user's PENDING universities
    let allVisible = [...approvedUnis];
    if (sessionUserId) {
      try {
        const pendingUnis = await prisma.university_rankings.findMany({
          where: {
            status: 'PENDING',
            created_by_user_id: String(sessionUserId),
          },
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
          },
        });
        allVisible = [...allVisible, ...pendingUnis];
      } catch (dbErr) {
        console.error('[universities] Failed to load pending universities:', dbErr);
      }
    }

    const normalizedSearch = search ? normalizeText(search) : '';

    const filtered = allVisible.filter((u) => {
      if (region && u.region !== region) return false;
      if (country && u.country !== country) return false;
      if (!Number.isNaN(minRankNum) && (u.qs_rank == null || u.qs_rank < minRankNum)) return false;
      if (!Number.isNaN(maxRankNum) && (u.qs_rank == null || u.qs_rank > maxRankNum)) return false;
      if (!search) return true;
      
      const nName = u._nName || normalizeText(u.name);
      const nCountry = u._nCountry || normalizeText(u.country);
      const uAcronym = u._acronym || getAcronym(u.name);

      return (
        nName.includes(normalizedSearch) ||
        nCountry.includes(normalizedSearch) ||
        uAcronym === normalizedSearch
      );
    });

    filtered.sort((a, b) => {
      let aPriority = 5;
      let bPriority = 5;
      if (search) {
        const aName = a._nName || normalizeText(a.name);
        const aAcronym = a._acronym || getAcronym(a.name);
        if (aAcronym === normalizedSearch) aPriority = 1;
        else if (aName === normalizedSearch) aPriority = 2;
        else if (aName.startsWith(normalizedSearch)) aPriority = 3;
        else if (aName.includes(normalizedSearch)) aPriority = 4;

        const bName = b._nName || normalizeText(b.name);
        const bAcronym = b._acronym || getAcronym(b.name);
        if (bAcronym === normalizedSearch) bPriority = 1;
        else if (bName === normalizedSearch) bPriority = 2;
        else if (bName.startsWith(normalizedSearch)) bPriority = 3;
        else if (bName.includes(normalizedSearch)) bPriority = 4;
      }
      
      if (aPriority !== bPriority) return aPriority - bPriority;

      const aRank = a.qs_rank ?? Number.MAX_SAFE_INTEGER;
      const bRank = b.qs_rank ?? Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) return aRank - bRank;
      return a.name < b.name ? -1 : (a.name > b.name ? 1 : 0);
    });

    const total = filtered.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    if (totalPages > 0 && page > totalPages) page = totalPages;

    const skip = (page - 1) * pageSize;
    const list = filtered.slice(skip, skip + pageSize);

    return NextResponse.json({
      success: true,
      universities: list,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('❌ [GET /api/universities] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể tải danh sách trường' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;
    if (!sessionUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const websiteUrl = typeof body?.website_url === 'string' ? body.website_url.trim() : '';
    const region = typeof body?.region === 'string' ? body.region.trim() : '';
    const country = typeof body?.country === 'string' ? body.country.trim() : '';

    if (!name || !websiteUrl || !region || !country) {
      return NextResponse.json(
        { success: false, error: 'name, website_url, region, country là bắt buộc' },
        { status: 400 }
      );
    }

    if (!isValidHttpUrl(websiteUrl)) {
      return NextResponse.json(
        { success: false, error: 'website_url phải là URL HTTP/HTTPS hợp lệ' },
        { status: 400 }
      );
    }

    const existing = await prisma.university_rankings.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        country: { equals: country, mode: 'insensitive' },
        OR: [
          { status: 'APPROVED' },
          { status: 'PENDING', created_by_user_id: String(sessionUserId) },
        ],
      },
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
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'University already exists', university: existing },
        { status: 409 }
      );
    }

    const created = await prisma.university_rankings.create({
      data: {
        name,
        website_url: websiteUrl,
        region,
        country,
        status: 'PENDING',
        created_by_user_id: String(sessionUserId),
        qs_rank: null,
      },
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
      },
    });

    // Invalidate Redis Cache
    if (redis) {
      try {
        await redis.del('universities:approved');
      } catch (err) {
        console.error('[Redis] Failed to delete universities cache on POST:', err);
      }
    }

    return NextResponse.json({ success: true, university: created }, { status: 201 });
  } catch (error) {
    console.error('❌ [POST /api/universities] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể tạo trường mới' },
      { status: 500 }
    );
  }
}
