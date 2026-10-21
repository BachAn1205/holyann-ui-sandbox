'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import S3Uploader from '@/components/S3Uploader';
import { generateMarketingS3UploadSignature } from '@/actions/s3-upload';
import {
  MARKETING_CATEGORY_OPTIONS,
  MARKETING_PLACEMENT_OPTIONS,
  MARKETING_STATUS_OPTIONS,
} from '@/lib/marketing/constants';
import { marketingPostPayloadSchema } from '@/lib/marketing/schema';
import { slugifyVietnamese } from '@/lib/slug';
import type { MarketingPostDetail, MarketingPostFormValues } from '@/types/marketing';

export interface MarketingPostFormProps {
  mode: 'create' | 'edit';
  initialData?: MarketingPostDetail;
}

const EMPTY_SELECT_VALUE = '__NONE__';

function toDateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

function buildDefaultValues(initialData?: MarketingPostDetail): MarketingPostFormValues {
  return {
    title: initialData?.title ?? '',
    slug: initialData?.slug ?? '',
    excerpt: initialData?.excerpt ?? '',
    content: initialData?.content ?? '',
    category: initialData?.category ?? '',
    thumbnail_url: initialData?.thumbnail_url ?? '',
    cta_text: initialData?.cta_text ?? '',
    cta_link: initialData?.cta_link ?? '',
    deadline: toDateInputValue(initialData?.deadline),
    target_publish_date: toDateInputValue(initialData?.target_publish_date),
    status: initialData?.status ?? 'DRAFT',
    meta_title: initialData?.meta_title ?? '',
    meta_description: initialData?.meta_description ?? '',
    placement: initialData?.placement ?? '',
  };
}

async function getApiError(response: Response) {
  try {
    const data = await response.json();
    return typeof data?.error === 'string' ? data.error : 'Có lỗi xảy ra';
  } catch {
    return 'Co loi xay ra';
  }
}

export default function MarketingPostForm({ mode, initialData }: MarketingPostFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSlugManual, setIsSlugManual] = useState(Boolean(initialData?.slug));

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MarketingPostFormValues>({
    resolver: zodResolver(marketingPostPayloadSchema),
    defaultValues: buildDefaultValues(initialData),
  });

  const watchedTitle = watch('title');

  useEffect(() => {
    if (isSlugManual) {
      return;
    }

    const nextSlug = watchedTitle.trim() ? slugifyVietnamese(watchedTitle) : '';
    setValue('slug', nextSlug, { shouldDirty: false, shouldValidate: true });
  }, [isSlugManual, setValue, watchedTitle]);

  const onSubmit = async (values: MarketingPostFormValues) => {
    setIsSubmitting(true);

    try {
      const endpoint = mode === 'create'
        ? '/api/marketing/posts'
        : `/api/marketing/posts/${initialData?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        toast.error(await getApiError(response));
        return;
      }

      const data = (await response.json()) as { post: MarketingPostDetail };
      toast.success(mode === 'create' ? 'Đã tạo bài viết' : 'Đã cập nhật bài viết');

      if (mode === 'create') {
        router.push(`/marketing/posts/${data.post.id}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('[MarketingPostForm]', error);
      toast.error('Không thể lưu bài viết');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {mode === 'create' ? 'Tạo bài viết marketing' : 'Chỉnh sửa bài viết'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý nội dung, SEO, CTA và lịch xuất bản trong cùng một form.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/marketing/posts">Quay lại danh sách</Link>
          </Button>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {mode === 'create' ? 'Tạo bài viết' : 'Lưu thay đổi'}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nội dung</CardTitle>
              <CardDescription>Tiêu đề, đường dẫn tĩnh, mô tả ngắn và nội dung chính.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Ví dụ: Bí quyết săn học bổng 2026"
                  {...register('title')}
                  disabled={isSubmitting}
                />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="tu-dong-sinh-tu-title"
                  {...register('slug', {
                    onChange: (event) => {
                      const nextValue = event.target.value;
                      setIsSlugManual(nextValue.trim().length > 0);
                    },
                  })}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Slug sẽ tự sinh từ tiêu đề cho đến khi bạn nhập tay. Xóa trống để bật lại chế độ auto.
                </p>
                {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Mô tả ngắn cho bài viết hoặc sapo giới thiệu."
                  rows={4}
                  {...register('excerpt')}
                  disabled={isSubmitting}
                />
                {errors.excerpt && <p className="text-sm text-destructive">{errors.excerpt.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Nhập nội dung chi tiết hoặc dán HTML rich text tại đây..."
                  rows={18}
                  {...register('content')}
                  disabled={isSubmitting}
                />
                {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Media & SEO</CardTitle>
              <CardDescription>Thông tin ảnh bìa và metadata cho SEO.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <Label htmlFor="thumbnail_url">Thumbnail</Label>
                <Tabs defaultValue="url" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url">Nhập URL</TabsTrigger>
                    <TabsTrigger value="upload">Upload ảnh</TabsTrigger>
                  </TabsList>
                  <TabsContent value="url" className="mt-4 space-y-2">
                    <Input id="thumbnail_url" placeholder="https://..." {...register('thumbnail_url')} disabled={isSubmitting} />
                  </TabsContent>
                  <TabsContent value="upload" className="mt-4 space-y-4">
                    <S3Uploader
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      uploadAction={generateMarketingS3UploadSignature}
                      onUploadSuccess={(url) => {
                        setValue('thumbnail_url', url, { shouldValidate: true, shouldDirty: true });
                      }}
                    />
                    <div className="space-y-2">
                      <Label className="text-muted-foreground">URL hiện tại / Sau khi upload:</Label>
                      <Input placeholder="https://..." {...register('thumbnail_url')} disabled={isSubmitting} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input id="meta_title" placeholder="SEO title" {...register('meta_title')} disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  placeholder="Mô tả SEO ngắn gọn"
                  rows={4}
                  {...register('meta_description')}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cấu hình</CardTitle>
              <CardDescription>Nhóm phân loại, trạng thái và mốc thời gian.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Category</Label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select
                      disabled={isSubmitting}
                      value={field.value && field.value.length > 0 ? field.value : EMPTY_SELECT_VALUE}
                      onValueChange={(value) => field.onChange(value === EMPTY_SELECT_VALUE ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EMPTY_SELECT_VALUE}>Không chọn</SelectItem>
                        {MARKETING_CATEGORY_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select disabled={isSubmitting} value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        {MARKETING_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Placement</Label>
                <Controller
                  name="placement"
                  control={control}
                  render={({ field }) => (
                    <Select
                      disabled={isSubmitting}
                      value={field.value && field.value.length > 0 ? field.value : EMPTY_SELECT_VALUE}
                      onValueChange={(value) => field.onChange(value === EMPTY_SELECT_VALUE ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn vị trí hiển thị" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EMPTY_SELECT_VALUE}>Không chọn</SelectItem>
                        {MARKETING_PLACEMENT_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Hạn chót</Label>
                  <Input id="deadline" type="date" {...register('deadline')} disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_publish_date">Target Publish Date</Label>
                  <Input
                    id="target_publish_date"
                    type="date"
                    {...register('target_publish_date')}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CTA</CardTitle>
              <CardDescription>Nút kêu gọi hành động cho bài viết hoặc chiến dịch.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="cta_text">CTA Text</Label>
                <Input id="cta_text" placeholder="Đăng ký ngay" {...register('cta_text')} disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cta_link">CTA Link</Label>
                <Input id="cta_link" placeholder="https://..." {...register('cta_link')} disabled={isSubmitting} />
              </div>
            </CardContent>
          </Card>

          {initialData && (
            <Card>
              <CardHeader>
                <CardTitle>Thông tin bài viết</CardTitle>
                <CardDescription>Chi tiết người phụ trách hiện tại và mốc cập nhật.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p><span className="font-medium text-foreground">Người phụ trách:</span> {initialData.author.full_name}</p>
                <p><span className="font-medium text-foreground">Email:</span> {initialData.author.email}</p>
                <p><span className="font-medium text-foreground">Tạo lúc:</span> {new Date(initialData.created_at).toLocaleString('vi-VN')}</p>
                <p><span className="font-medium text-foreground">Cập nhật:</span> {new Date(initialData.updated_at).toLocaleString('vi-VN')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  );
}