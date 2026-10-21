import MarketingPostsTable from '@/components/marketing/MarketingPostsTable';
import {
  marketingPostListSelect,
  serializeMarketingPostListItem,
} from '@/lib/marketing/posts';
import { prisma } from '@/lib/prisma';

export default async function MarketingPostsPage() {
  const posts = await prisma.marketing_posts.findMany({
    select: marketingPostListSelect,
    orderBy: [{ updated_at: 'desc' }],
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Content pipeline</h2>
        <p className="text-sm text-muted-foreground">
          Theo dõi tiến độ bài viết, banner và nội dung landing theo lịch xuất bản.
        </p>
      </div>
      <MarketingPostsTable initialPosts={posts.map(serializeMarketingPostListItem)} />
    </div>
  );
}

