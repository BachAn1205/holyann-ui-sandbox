import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

const DEBUG_ENDPOINT = 'http://127.0.0.1:7531/ingest/26e7cef7-6404-4091-9692-fb85f8338cc0';
const DEBUG_SESSION_ID = '25e340';

const CACHE_KEY = 'universities:countries:approved';
const CACHE_TTL = 86400; // 24 hours

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;
    // #region agent log
    fetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': DEBUG_SESSION_ID },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION_ID,
        runId: 'universities-countries-get',
        hypothesisId: 'H4_COUNTRIES_VISIBILITY_QUERY',
        location: 'src/app/api/universities/countries/route.ts:GET:start',
        message: 'GET countries start',
        data: { hasSessionUser: Boolean(sessionUserId) },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    // 1. Try reading APPROVED countries from Redis cache
    let approvedCountries: { country: string; region: string | null }[] = [];
    if (redis) {
      try {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
          approvedCountries = JSON.parse(cached);
        }
      } catch (err) {
        console.error('[Redis] Failed to read approved countries:', err);
      }
    }

    // 2. Cache Miss -> Query Database
    if (approvedCountries.length === 0) {
      const dbApproved = await prisma.university_rankings.findMany({
        where: { status: 'APPROVED' },
        select: { country: true, region: true },
        distinct: ['country'],
        orderBy: { country: 'asc' },
      });
      approvedCountries = dbApproved.map(u => ({
        country: u.country,
        region: u.region,
      }));

      if (redis && approvedCountries.length > 0) {
        try {
          await redis.set(CACHE_KEY, JSON.stringify(approvedCountries), 'EX', CACHE_TTL);
        } catch (err) {
          console.error('[Redis] Failed to write approved countries cache:', err);
        }
      }
    }

    // 3. Merge with user's PENDING countries
    let list = [...approvedCountries];
    if (sessionUserId) {
      try {
        const pendingUnis = await prisma.university_rankings.findMany({
          where: {
            status: 'PENDING',
            created_by_user_id: String(sessionUserId),
          },
          select: { country: true, region: true },
          distinct: ['country'],
        });
        
        // Add pending countries that are not already in list
        for (const pu of pendingUnis) {
          if (!list.some(c => c.country.toLowerCase() === pu.country.toLowerCase())) {
            list.push({
              country: pu.country,
              region: pu.region,
            });
          }
        }
        
        // Sort list alphabetically
        list.sort((a, b) => a.country.localeCompare(b.country));
      } catch (dbErr) {
        console.error('[countries] Failed to load pending countries:', dbErr);
      }
    }

    // #region agent log
    fetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': DEBUG_SESSION_ID },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION_ID,
        runId: 'universities-countries-get',
        hypothesisId: 'H4_COUNTRIES_VISIBILITY_QUERY',
        location: 'src/app/api/universities/countries/route.ts:GET:after-findMany',
        message: 'GET countries success',
        data: { count: list.length },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json({ success: true, countries: list });
  } catch (error) {
    // #region agent log
    fetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': DEBUG_SESSION_ID },
      body: JSON.stringify({
        sessionId: DEBUG_SESSION_ID,
        runId: 'universities-countries-get',
        hypothesisId: 'H5_COUNTRIES_EXCEPTION',
        location: 'src/app/api/universities/countries/route.ts:GET:catch',
        message: 'GET countries failed',
        data: {
          errorMessage: error instanceof Error ? error.message : String(error),
          errorName: error instanceof Error ? error.name : 'UnknownError',
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    console.error('❌ [GET /api/universities/countries] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể tải danh sách quốc gia' },
      { status: 500 },
    );
  }
}
