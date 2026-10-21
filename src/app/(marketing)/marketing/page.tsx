import Link from "next/link";
import { Clock3, FileText, PenSquare, Rocket, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { marketingPostListSelect } from "@/lib/marketing/posts";
import { prisma } from "@/lib/prisma";

export default async function MarketingIndexPage() {
  const posts = await prisma.marketing_posts.findMany({
    select: marketingPostListSelect,
    orderBy: [{ updated_at: "desc" }],
  });

  const total = posts.length;
  const published = posts.filter((post) => post.status === "PUBLISHED").length;
  const draft = posts.filter((post) => post.status === "DRAFT").length;
  const upcoming = posts.filter((post) => {
    if (!post.target_publish_date) return false;
    return new Date(post.target_publish_date).getTime() >= Date.now();
  }).length;
  const recentPosts = posts.slice(0, 5);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Marketing workspace</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Tổng quan vận hành nội dung</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Theo dõi tiến độ xuất bản và quản lý toàn bộ bài viết marketing theo cùng chuẩn với student area.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/marketing/posts">
                <FileText className="h-4 w-4 mr-2" />
                Xem danh sách
              </Link>
            </Button>
            <Button asChild>
              <Link href="/marketing/posts/new">
                <PenSquare className="h-4 w-4 mr-2" />
                Tạo bài mới
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Tổng bài viết</p>
          <p className="text-2xl font-bold text-foreground">{total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Đã xuất bản</p>
          <p className="text-2xl font-bold text-foreground">{published}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Đang chuẩn bị</p>
          <p className="text-2xl font-bold text-foreground">{draft}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Sắp publish</p>
          <p className="text-2xl font-bold text-foreground">{upcoming}</p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Bài viết cập nhật gần đây</p>
          <Button asChild variant="ghost" size="sm">
            <Link href="/marketing/posts">Xem tất cả</Link>
          </Button>
        </div>
        {recentPosts.length === 0 ? (
          <div className="px-4 py-10 text-center text-muted-foreground">
            <Sparkles className="mx-auto h-6 w-6 mb-2 opacity-70" />
            Chưa có bài viết nào, bắt đầu tạo bài đầu tiên.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentPosts.map((post) => (
              <div key={post.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground">
                    /{post.slug} • {post.users.full_name} • {new Date(post.updated_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                      post.status === "PUBLISHED"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {post.status === "PUBLISHED" ? (
                      <>
                        <Rocket className="h-3 w-3 mr-1" />
                        Published
                      </>
                    ) : (
                      <>
                        <Clock3 className="h-3 w-3 mr-1" />
                        Draft
                      </>
                    )}
                  </span>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/marketing/posts/${post.id}`}>Sửa</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

