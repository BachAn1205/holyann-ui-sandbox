'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Next.js route error boundary — kích hoạt khi render hoặc server component
 * trong segment này ném lỗi. Không phải lúc nào cũng là “bảo trì”.
 */
export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  const isDev = process.env.NODE_ENV === 'development';
  const detail = error?.message?.trim();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex flex-col items-center text-center max-w-lg"
      >
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
          <AlertCircle className="h-10 w-10" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-foreground">
          Không tải được trang
        </h1>

        <p className="mt-3 text-base text-muted-foreground leading-relaxed">
          Đã xảy ra lỗi khi hiển thị nội dung. Đây thường là lỗi tạm thời hoặc cấu hình (mạng, cơ sở dữ liệu, mã nguồn),{' '}
          <strong className="text-foreground font-medium">không hẳn là bảo trì có kế hoạch</strong>.
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          Bạn có thể thử tải lại. Nếu vẫn lặp lại, kiểm tra console/server log hoặc liên hệ người phụ trách kỹ thuật.
        </p>

        {isDev && detail ? (
          <pre className="mt-6 w-full max-w-full overflow-x-auto rounded-xl border border-border bg-muted/50 p-4 text-left text-xs text-foreground whitespace-pre-wrap break-words">
            {detail}
          </pre>
        ) : null}

        {isDev && error?.digest ? (
          <p className="mt-3 text-xs text-muted-foreground font-mono">digest: {error.digest}</p>
        ) : null}

        <button
          type="button"
          onClick={reset}
          className="mt-8 flex items-center justify-center gap-2 min-h-[48px] px-8 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all duration-200"
        >
          Thử lại
        </button>
      </motion.div>
    </div>
  );
}
