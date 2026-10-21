"use client";

import React from "react";
import { Loader2 } from "lucide-react";

const pulse = "animate-pulse rounded-md bg-muted/55 dark:bg-muted/40";

/** Skeleton kết quả phân tích gần nhất — tải song song với lịch sử, không phụ thuộc API history */
export function AnalysisLatestResultSkeleton() {
  return (
    <div
      className="rounded-2xl border-2 border-sky-500/25 bg-gradient-to-b from-sky-500/8 via-sky-500/3 to-transparent p-4 sm:p-6 shadow-lg"
      aria-busy="true"
      aria-label="Đang tải kết quả phân tích"
    >
      <div className="mb-4 flex items-center gap-2">
        <Loader2
          className="size-4 shrink-0 animate-spin text-sky-600 dark:text-sky-400"
          aria-hidden
        />
        <span className="text-sm font-medium text-sky-800 dark:text-sky-200">
          Đang tải kết quả phân tích gần nhất…
        </span>
      </div>
      <div className="space-y-3">
        <div className={`h-5 w-40 ${pulse}`} />
        <div className={`h-24 w-full rounded-xl ${pulse}`} />
        <div className="grid gap-2 sm:grid-cols-3">
          <div className={`h-16 rounded-lg ${pulse}`} />
          <div className={`h-16 rounded-lg ${pulse}`} />
          <div className={`h-16 rounded-lg ${pulse}`} />
        </div>
        <div className={`h-32 w-full rounded-xl ${pulse}`} />
      </div>
    </div>
  );
}

/** Skeleton khối cải thiện khi đang hydrate từ API latest */
export function EnhanceLatestResultSkeleton() {
  return (
    <div
      className="rounded-2xl border-2 border-emerald-500/25 bg-gradient-to-b from-emerald-500/8 via-emerald-500/3 to-transparent p-4 sm:p-6 shadow-lg"
      aria-busy="true"
      aria-label="Đang tải gợi ý cải thiện đã lưu"
    >
      <div className="mb-3 flex items-center gap-2">
        <Loader2
          className="size-4 shrink-0 animate-spin text-emerald-600 dark:text-emerald-400"
          aria-hidden
        />
        <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
          Đang tải gợi ý cải thiện…
        </span>
      </div>
      <div className="space-y-3">
        <div className={`h-4 w-48 ${pulse}`} />
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-20 w-full rounded-xl ${pulse}`} />
        ))}
      </div>
    </div>
  );
}

/** Skeleton danh sách lịch sử — tải độc lập, không chặn các khối phía trên */
export function HistoryListSkeleton() {
  return (
    <div
      className="rounded-2xl border-2 border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-transparent p-4 sm:p-6 shadow-inner"
      aria-busy="true"
      aria-label="Đang tải lịch sử"
    >
      <div className="mb-3 flex items-center gap-2 text-violet-800 dark:text-violet-200">
        <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
        <span className="text-sm font-medium">Đang tải lịch sử chạy phân tích &amp; cải thiện…</span>
      </div>
      <ul className="space-y-3">
        {[1, 2, 3].map((i) => (
          <li
            key={i}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/40 px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className={`h-6 w-20 rounded-md ${pulse}`} />
              <div className={`h-4 w-40 rounded ${pulse}`} />
            </div>
            <div className={`h-6 w-28 rounded-md ${pulse}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}
