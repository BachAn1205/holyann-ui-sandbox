'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MARKETING_STATUS_OPTIONS } from '@/lib/marketing/constants';
import type { MarketingPostListItem } from '@/types/marketing';

interface MarketingPostsTableProps {
  initialPosts: MarketingPostListItem[];
}

function formatStatus(status: MarketingPostListItem['status']) {
  return MARKETING_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? status;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN');
}

async function getApiError(response: Response) {
  try {
    const data = await response.json();
    return typeof data?.error === 'string' ? data.error : 'Có lỗi xảy ra';
  } catch {
    return 'Có lỗi xảy ra';
  }
}

export default function MarketingPostsTable({ initialPosts }: MarketingPostsTableProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (post: MarketingPostListItem) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa bài viết "${post.title}"?`);
    if (!confirmed) {
      return;
    }

    setDeletingId(post.id);

    try {
      const response = await fetch(`/api/marketing/posts/${post.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        toast.error(await getApiError(response));
        return;
      }

      setPosts((current) => current.filter((item) => item.id !== post.id));
      toast.success('Đã xóa bài viết');
      router.refresh();
    } catch (error) {
      console.error('[MarketingPostsTable]', error);
      toast.error('Không thể xóa bài viết');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Danh sách bài viết</CardTitle>
          <CardDescription>
            Theo dõi trạng thái, lịch xuất bản và thao tác nhanh trên từng nội dung.
          </CardDescription>
        </div>
        <Button asChild>
          <Link href="/marketing/posts/new">
            <Plus className="h-4 w-4" />
            Tạo bài viết
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
            <p className="text-lg font-medium text-foreground">Chưa có bài viết marketing nào.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Tạo bài đầu tiên để bắt đầu quản lý landing content, banner hoặc chiến dịch.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Tiêu đề</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Placement</th>
                  <th className="px-4 py-3 font-medium">Publish date</th>
                  <th className="px-4 py-3 font-medium">Cập nhật</th>
                  <th className="px-4 py-3 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {posts.map((post) => (
                  <tr key={post.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{post.title}</p>
                        <p className="text-xs text-muted-foreground">/{post.slug}</p>
                        <p className="text-xs text-muted-foreground">Phụ trách: {post.author.full_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-foreground">{formatStatus(post.status)}</td>
                    <td className="px-4 py-4 text-foreground">{post.category ?? '—'}</td>
                    <td className="px-4 py-4 text-foreground">{post.placement ?? '—'}</td>
                    <td className="px-4 py-4 text-foreground">{formatDate(post.target_publish_date)}</td>
                    <td className="px-4 py-4 text-foreground">{formatDate(post.updated_at)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline" title="Xem trước trang học viên">
                          <Link href={`/student/posts/${post.slug}`}>
                            <Eye className="h-4 w-4" />
                            Xem
                          </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/marketing/posts/${post.id}`}>
                            <Pencil className="h-4 w-4" />
                            Sửa
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deletingId === post.id}
                          onClick={() => void handleDelete(post)}
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === post.id ? 'Đang xóa...' : 'Xóa'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

