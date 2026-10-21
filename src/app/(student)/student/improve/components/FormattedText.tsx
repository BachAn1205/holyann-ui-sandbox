'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/** Hiển thị text đúng cách dòng: xuống dòng \n được giữ, đoạn cách bằng \n\n */
export function FormattedText({ text, className }: { text: string; className?: string }) {
  if (!text?.trim()) return null;
  const paragraphs = text.trim().split(/\n\n+/).filter(Boolean);
  if (paragraphs.length <= 1) {
    return <div className={cn('whitespace-pre-line text-sm leading-relaxed', className)}>{text.trim()}</div>;
  }
  return (
    <div className={cn('space-y-3', className)}>
      {paragraphs.map((p, i) => (
        <p key={i} className="text-sm leading-relaxed text-foreground whitespace-pre-line">{p.trim()}</p>
      ))}
    </div>
  );
}
