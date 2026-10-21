'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type PageLoadingProps = {
  /** Thông báo hiển thị dưới spinner */
  message?: string;
  /** Full màn hình (min-h-screen), mặc định true khi không dùng inline */
  fullPage?: boolean;
  /** Inline trong section (không chiếm full, dùng cho table/section) */
  inline?: boolean;
  /** Kích thước spinner: sm 8, md 10, lg 12 */
  size?: 'sm' | 'md' | 'lg';
  /** Class cho wrapper */
  className?: string;
};

const sizeMap = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' };

/**
 * Loading thống nhất cho toàn app: dùng cho full page hoặc section.
 * Màu dùng theme (text-primary), có thể tùy message.
 */
export function PageLoading({
  message,
  fullPage = true,
  inline = false,
  size = 'lg',
  className,
}: PageLoadingProps) {
  const iconClass = sizeMap[size];
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        inline ? 'py-12' : fullPage ? 'min-h-screen' : 'min-h-[60vh]',
        className
      )}
    >
      <Loader2 className={cn(iconClass, 'animate-spin text-primary')} />
      {message != null && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
