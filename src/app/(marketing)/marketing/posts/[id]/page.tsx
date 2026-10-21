import { notFound } from 'next/navigation';
import { z } from 'zod';

import MarketingPostFormClient from '@/components/marketing/MarketingPostFormClient';
import {
  marketingPostDetailSelect,
  serializeMarketingPostDetail,
} from '@/lib/marketing/posts';
import { prisma } from '@/lib/prisma';

export default async function EditMarketingPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsedId = z.string().uuid().safeParse(id);

  if (!parsedId.success) {
    notFound();
  }

  const post = await prisma.marketing_posts.findUnique({
    where: { id: parsedId.data },
    select: marketingPostDetailSelect,
  });

  if (!post) {
    notFound();
  }

  return <MarketingPostFormClient mode="edit" initialData={serializeMarketingPostDetail(post)} />;
}