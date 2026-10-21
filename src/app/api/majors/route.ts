import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

const CACHE_KEY = "majors:approved";
const CACHE_TTL = 86400; // 24 hours

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const industryGroup = searchParams.get('industryGroup')?.trim() || '';
    const pageRaw = searchParams.get('page');
    const pageSizeRaw = searchParams.get('pageSize');
    const groupsOnly = searchParams.get('groupsOnly') === 'true';

    // 1. Try to read APPROVED majors from Redis cache
    let approvedMajors: any[] = [];
    if (redis) {
      try {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
          approvedMajors = JSON.parse(cached);
        }
      } catch (err) {
        console.error('[Redis] Failed to read approved majors:', err);
      }
    }

    // 2. Cache Miss -> Query Database
    if (approvedMajors.length === 0) {
      approvedMajors = await prisma.major_faculty_catalog.findMany({
        where: { status: 'APPROVED' },
        select: {
          id: true,
          occupation_name: true,
          industry_group: true,
          occupation_code: true,
          major_score: true,
          job_zone: true,
          status: true,
        },
        orderBy: [
          { industry_group: 'asc' },
          { occupation_name: 'asc' }
        ]
      });

      if (redis && approvedMajors.length > 0) {
        try {
          await redis.set(CACHE_KEY, JSON.stringify(approvedMajors), 'EX', CACHE_TTL);
        } catch (err) {
          console.error('[Redis] Failed to write approved majors cache:', err);
        }
      }
    }

    // If only requesting unique industry groups
    if (groupsOnly) {
      const groups = Array.from(new Set(approvedMajors.map(m => m.industry_group).filter(Boolean))).sort();
      return NextResponse.json({
        success: true,
        groups
      });
    }

    let page = parseInt(pageRaw ?? '1', 10);
    if (isNaN(page) || page < 1) page = 1;
    let pageSize = parseInt(pageSizeRaw ?? '20', 10);
    if (isNaN(pageSize) || pageSize < 1) pageSize = 20;
    pageSize = Math.min(pageSize, 100);

    // 3. Combine with user-specific PENDING majors
    let combined = [...approvedMajors];
    if (sessionUserId) {
      try {
        const pendingMajors = await prisma.major_faculty_catalog.findMany({
          where: {
            status: 'PENDING',
            created_by_user_id: sessionUserId
          },
          select: {
            id: true,
            occupation_name: true,
            industry_group: true,
            occupation_code: true,
            major_score: true,
            job_zone: true,
            status: true,
          }
        });
        combined = [...combined, ...pendingMajors];
      } catch (dbErr) {
        console.error('[majors] Failed to load pending majors:', dbErr);
      }
    }

    // 4. In-memory Filtering
    let filtered = combined;
    if (industryGroup) {
      filtered = filtered.filter(m => m.industry_group?.toLowerCase() === industryGroup.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(m => 
        m.occupation_name.toLowerCase().includes(q) || 
        (m.industry_group && m.industry_group.toLowerCase().includes(q))
      );
    }

    // 5. Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize);
    if (page > totalPages && totalPages > 0) page = totalPages;
    const startIdx = (page - 1) * pageSize;
    const paginated = filtered.slice(startIdx, startIdx + pageSize);

    return NextResponse.json({
      success: true,
      majors: paginated,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
      }
    });
  } catch (e) {
    console.error("[majors] GET", e);
    return NextResponse.json(
      { success: false, error: "Không tải được danh sách ngành." },
      { status: 500 },
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
    const occupation_name = typeof body?.occupation_name === 'string' ? body.occupation_name.trim() : '';
    const industry_group = typeof body?.industry_group === 'string' ? body.industry_group.trim() : '';
    
    if (!occupation_name || !industry_group) {
      return NextResponse.json(
        { success: false, error: 'Tên ngành và Nhóm ngành là bắt buộc' },
        { status: 400 }
      );
    }

    const existing = await prisma.major_faculty_catalog.findFirst({
      where: {
        occupation_name: { equals: occupation_name, mode: 'insensitive' },
        industry_group: { equals: industry_group },
        OR: [
          { status: 'APPROVED' },
          { status: 'PENDING', created_by_user_id: String(sessionUserId) },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: true, major: existing },
        { status: 409 }
      );
    }

    const created = await prisma.major_faculty_catalog.create({
      data: {
        occupation_name,
        industry_group,
        status: 'PENDING',
        created_by_user_id: String(sessionUserId),
      },
    });

    // Invalidate the cache just in case
    if (redis) {
      try {
        await redis.del(CACHE_KEY);
      } catch (err) {
        console.error('[Redis] Failed to delete cache on POST:', err);
      }
    }

    return NextResponse.json({ success: true, major: created }, { status: 201 });
  } catch (error) {
    console.error('❌ [POST /api/majors] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể đề xuất ngành mới' },
      { status: 500 }
    );
  }
}
