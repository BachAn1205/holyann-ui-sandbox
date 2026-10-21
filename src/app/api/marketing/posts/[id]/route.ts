import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { requireMarketingApiAccess } from '@/lib/marketing/auth';
import {
  buildMarketingPostWriteData,
  marketingPostDetailSelect,
  serializeMarketingPostDetail,
} from '@/lib/marketing/posts';
import { marketingPostPayloadSchema } from '@/lib/marketing/schema';
import { redis } from '@/lib/redis';

const idSchema = z.string().uuid('ID bài viết không hợp lệ');

function getValidationErrorMessage(error: ReturnType<typeof marketingPostPayloadSchema.safeParse>) {
  if (error.success) return null;
  return error.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ';
}

async function getValidatedId(params: Promise<{ id: string }>) {
  const { id } = await params;
  return idSchema.safeParse(id);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireMarketingApiAccess();
    if (access.response) {
      return access.response;
    }

    const parsedId = await getValidatedId(params);
    if (!parsedId.success) {
      return NextResponse.json(
        { error: parsedId.error.issues[0]?.message ?? 'ID không hợp lệ' },
        { status: 400 },
      );
    }

    const post = await prisma.marketing_posts.findUnique({
      where: { id: parsedId.data },
      select: marketingPostDetailSelect,
    });

    if (!post) {
      return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 });
    }

    return NextResponse.json({ post: serializeMarketingPostDetail(post) });
  } catch (error) {
    console.error('[GET /api/marketing/posts/:id]', error);
    return NextResponse.json(
      { error: 'Không thể tải bài viết' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireMarketingApiAccess();
    if (access.response) {
      return access.response;
    }

    const parsedId = await getValidatedId(params);
    if (!parsedId.success) {
      return NextResponse.json(
        { error: parsedId.error.issues[0]?.message ?? 'ID không hợp lệ' },
        { status: 400 },
      );
    }

    const existing = await prisma.marketing_posts.findUnique({
      where: { id: parsedId.data },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = marketingPostPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: getValidationErrorMessage(parsed) },
        { status: 400 },
      );
    }

    const data = await buildMarketingPostWriteData(
      parsed.data,
      access.user.id,
      parsedId.data,
    );

    const updated = await prisma.marketing_posts.update({
      where: { id: parsedId.data },
      data,
      select: marketingPostDetailSelect,
    });

    // Invalidate Redis Cache
    if (redis) {
      try {
        await redis.del('marketing:posts:active');
      } catch (err) {
        console.error('[Redis] Failed to clear marketing posts cache on PUT:', err);
      }
    }

    return NextResponse.json({ post: serializeMarketingPostDetail(updated) });
  } catch (error) {
    console.error('[PUT /api/marketing/posts/:id]', error);

    if (error instanceof Error && error.message.startsWith('INVALID_DATE:')) {
      return NextResponse.json(
        { error: 'Ngày không hợp lệ' },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Không thể cập nhật bài viết' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireMarketingApiAccess();
    if (access.response) {
      return access.response;
    }

    const parsedId = await getValidatedId(params);
    if (!parsedId.success) {
      return NextResponse.json(
        { error: parsedId.error.issues[0]?.message ?? 'ID không hợp lệ' },
        { status: 400 },
      );
    }

    const existing = await prisma.marketing_posts.findUnique({
      where: { id: parsedId.data },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy bài viết' }, { status: 404 });
    }

    await prisma.marketing_posts.delete({
      where: { id: parsedId.data },
    });

    // Invalidate Redis Cache
    if (redis) {
      try {
        await redis.del('marketing:posts:active');
      } catch (err) {
        console.error('[Redis] Failed to clear marketing posts cache on DELETE:', err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/marketing/posts/:id]', error);
    return NextResponse.json(
      { error: 'Không thể xóa bài viết' },
      { status: 500 },
    );
  }
}

