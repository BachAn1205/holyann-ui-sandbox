'use client';

import dynamic from 'next/dynamic';
import type { MarketingPostFormProps } from './MarketingPostForm';

// Tắt SSR để tránh Radix UI sinh ID ngẫu nhiên khác nhau giữa server và client
// (dynamic ssr:false chỉ được dùng trong Client Component)
const MarketingPostForm = dynamic(
  () => import('./MarketingPostForm'),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 rounded-md bg-muted w-full" />
        <div className="h-40 rounded-md bg-muted w-full" />
        <div className="h-10 rounded-md bg-muted w-1/3" />
      </div>
    ),
  }
);

export default function MarketingPostFormClient(props: MarketingPostFormProps) {
  return <MarketingPostForm {...props} />;
}
