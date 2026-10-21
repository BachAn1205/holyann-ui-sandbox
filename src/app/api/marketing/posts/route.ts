import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { requireMarketingApiAccess } from '@/lib/marketing/auth';
import {
  buildMarketingPostWriteData,
  marketingPostDetailSelect,
  marketingPostListSelect,
  serializeMarketingPostDetail,
  serializeMarketingPostListItem,
} from '@/lib/marketing/posts';
import { marketingPostPayloadSchema } from '@/lib/marketing/schema';
import { redis } from '@/lib/redis';

const CACHE_KEY = 'marketing:posts:active';
const CACHE_TTL = 14400; // 4 hours

function getValidationErrorMessage(error: ReturnType<typeof marketingPostPayloadSchema.safeParse>) {
  if (error.success) return null;
  return error.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ';
}

export async function GET() {
  try {
    const access = await requireMarketingApiAccess();
    if (access.response) {
      return access.response;
    }

    let posts: any[] = [];

    // 1. Try reading from cache
    if (redis) {
      try {
        const cached = await redis.get(CACHE_KEY);
        if (cached) {
          posts = JSON.parse(cached);
        }
      } catch (err) {
        console.error('[Redis] Failed to read marketing posts cache:', err);
      }
    }

    // 2. Cache Miss -> Query Database
    if (posts.length === 0) {
      const dbPosts = await prisma.marketing_posts.findMany({
        select: marketingPostListSelect,
        orderBy: [{ updated_at: 'desc' }],
      });
      posts = dbPosts.map(serializeMarketingPostListItem);

      if (redis && posts.length > 0) {
        try {
          await redis.set(CACHE_KEY, JSON.stringify(posts), 'EX', CACHE_TTL);
        } catch (err) {
          console.error('[Redis] Failed to write marketing posts cache:', err);
        }
      }
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('[GET /api/marketing/posts]', error);
    return NextResponse.json(
      { error: 'Không thể tải danh sách bài viết' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireMarketingApiAccess();
    if (access.response) {
      return access.response;
    }

    const body = await request.json();
    const parsed = marketingPostPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: getValidationErrorMessage(parsed) },
        { status: 400 },
      );
    }

    const data = await buildMarketingPostWriteData(parsed.data, access.user.id);
    const created = await prisma.marketing_posts.create({
      data: {
        id: crypto.randomUUID(),
        ...data,
      },
      select: marketingPostDetailSelect,
    });

    // Invalidate Redis Cache
    if (redis) {
      try {
        await redis.del(CACHE_KEY);
      } catch (err) {
        console.error('[Redis] Failed to delete marketing posts cache on POST:', err);
      }
    }

    return NextResponse.json({ post: serializeMarketingPostDetail(created) }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/marketing/posts]', error);

    if (error instanceof Error && error.message.startsWith('INVALID_DATE:')) {
      return NextResponse.json(
        { error: 'Ngày không hợp lệ' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Không thể tạo bài viết' },
      { status: 500 },
    );
  }
}

