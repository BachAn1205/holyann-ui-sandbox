import type { Prisma } from '@prisma/client';

import { SAFE_USER_SELECT } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { slugifyVietnamese } from '@/lib/slug';
import type {
  MarketingPostDetail,
  MarketingPostListItem,
  MarketingPostPayload,
} from '@/types/marketing';

export const marketingPostListSelect = {
  id: true,
  title: true,
  slug: true,
  category: true,
  placement: true,
  status: true,
  target_publish_date: true,
  updated_at: true,
  created_at: true,
  users: {
    select: SAFE_USER_SELECT,
  },
} satisfies Prisma.marketing_postsSelect;

export const marketingPostDetailSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  content: true,
  category: true,
  thumbnail_url: true,
  cta_text: true,
  cta_link: true,
  deadline: true,
  target_publish_date: true,
  status: true,
  meta_title: true,
  meta_description: true,
  author_id: true,
  placement: true,
  created_at: true,
  updated_at: true,
  users: {
    select: SAFE_USER_SELECT,
  },
} satisfies Prisma.marketing_postsSelect;

function toIsoString(value?: Date | null) {
  return value ? value.toISOString() : null;
}

function normalizeOptionalString(value?: string | null) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseDateInput(value?: string | null) {
  const normalized = normalizeOptionalString(value);
  if (!normalized) return null;

  const parsed = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`INVALID_DATE:${normalized}`);
  }

  return parsed;
}

export async function generateUniqueMarketingPostSlug(
  source: string,
  excludeId?: string,
) {
  const baseSlug = slugifyVietnamese(source);
  let nextSlug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.marketing_posts.findFirst({
      where: {
        slug: nextSlug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return nextSlug;
    }

    nextSlug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function buildMarketingPostWriteData(
  payload: MarketingPostPayload,
  authorId: string,
  excludeId?: string,
) {
  const title = payload.title.trim();
  const slugSource = normalizeOptionalString(payload.slug) ?? title;

  return {
    title,
    slug: await generateUniqueMarketingPostSlug(slugSource, excludeId),
    excerpt: normalizeOptionalString(payload.excerpt),
    content: payload.content.trim(),
    category: normalizeOptionalString(payload.category),
    thumbnail_url: normalizeOptionalString(payload.thumbnail_url),
    cta_text: normalizeOptionalString(payload.cta_text),
    cta_link: normalizeOptionalString(payload.cta_link),
    deadline: parseDateInput(payload.deadline),
    target_publish_date: parseDateInput(payload.target_publish_date),
    status: payload.status,
    meta_title: normalizeOptionalString(payload.meta_title),
    meta_description: normalizeOptionalString(payload.meta_description),
    author_id: authorId,
    placement: normalizeOptionalString(payload.placement),
  } satisfies Omit<Prisma.marketing_postsUncheckedCreateInput, 'id'>;
}

export function serializeMarketingPostListItem(
  post: Prisma.marketing_postsGetPayload<{ select: typeof marketingPostListSelect }>,
): MarketingPostListItem {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    category: post.category,
    placement: post.placement,
    status: post.status,
    target_publish_date: toIsoString(post.target_publish_date),
    updated_at: post.updated_at.toISOString(),
    created_at: post.created_at.toISOString(),
    author: {
      id: post.users.id,
      full_name: post.users.full_name,
      email: post.users.email,
      avatar_url: post.users.avatar_url ?? null,
      role: post.users.role,
    },
  };
}

export function serializeMarketingPostDetail(
  post: Prisma.marketing_postsGetPayload<{ select: typeof marketingPostDetailSelect }>,
): MarketingPostDetail {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    category: post.category,
    thumbnail_url: post.thumbnail_url,
    cta_text: post.cta_text,
    cta_link: post.cta_link,
    deadline: toIsoString(post.deadline),
    target_publish_date: toIsoString(post.target_publish_date),
    status: post.status,
    meta_title: post.meta_title,
    meta_description: post.meta_description,
    author_id: post.author_id,
    placement: post.placement,
    created_at: post.created_at.toISOString(),
    updated_at: post.updated_at.toISOString(),
    author: {
      id: post.users.id,
      full_name: post.users.full_name,
      email: post.users.email,
      avatar_url: post.users.avatar_url ?? null,
      role: post.users.role,
    },
  };
}

