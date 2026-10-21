"use client";

import React from "react";

type Props = {
  rows?: number;
  className?: string;
};

/** Skeleton giống danh sách nguyện vọng (số thứ tự + dòng text). */
export function WishlistCardBodySkeleton({ rows = 4, className = "" }: Props) {
  return (
    <ul className={`space-y-2.5 ${className}`} aria-busy="true" aria-label="Đang tải">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-2.5">
          <div
            className="h-6 w-6 shrink-0 rounded-full bg-slate-200/90 dark:bg-muted animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          />
          <div
            className="h-3.5 flex-1 rounded-md bg-slate-100 dark:bg-muted/80 animate-pulse"
            style={{ maxWidth: `${68 + (i % 4) * 7}%`, animationDelay: `${i * 80}ms` }}
          />
        </li>
      ))}
    </ul>
  );
}
