"use client";

import React from "react";

export function ChecklistSkeleton() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300" aria-hidden>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar skeleton - matches StageNavigation card */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-border dark:border-border/80 bg-card shadow-sm overflow-hidden sticky top-6">
            <div className="border-b border-border px-5 py-4 bg-muted/30 dark:bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-muted/60 dark:bg-muted/50 animate-pulse shrink-0" />
                <div className="h-4 w-28 bg-muted/60 dark:bg-muted/50 rounded animate-pulse" />
              </div>
            </div>
            <div className="p-5 pt-4 space-y-0">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4 pb-8 last:pb-0">
                  <div className="h-8 w-8 rounded-full bg-muted/60 dark:bg-muted/50 animate-pulse shrink-0" />
                  <div className="pt-1 flex-1 space-y-1">
                    <div className="h-3 w-16 bg-muted/60 dark:bg-muted/50 rounded animate-pulse" />
                    <div className="h-4 w-24 bg-muted/50 dark:bg-muted/40 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main content skeleton - matches Card + filters + tasks + advice */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            {/* Card header */}
            <div className="border-b border-border px-6 py-5 bg-muted/20 dark:bg-muted/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-muted/60 dark:bg-muted/50 animate-pulse shrink-0" />
                  <div className="space-y-2">
                    <div className="h-6 w-48 bg-muted/60 dark:bg-muted/50 rounded animate-pulse" />
                    <div className="h-4 w-64 bg-muted/50 dark:bg-muted/40 rounded animate-pulse hidden md:block" />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 w-28 bg-muted/50 dark:bg-muted/40 rounded animate-pulse" />
                  <div className="h-4 w-8 bg-muted/50 dark:bg-muted/40 rounded animate-pulse" />
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted/60 dark:bg-muted/50 animate-pulse" />
              </div>
            </div>

            {/* Card content - filters + tasks */}
            <div className="p-6 space-y-6">
              {/* Filters row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="h-10 flex-1 rounded-xl bg-muted/50 dark:bg-muted/40 animate-pulse" />
                <div className="h-10 w-full sm:w-[180px] rounded-xl bg-muted/50 dark:bg-muted/40 animate-pulse" />
                <div className="h-10 w-full sm:w-[160px] rounded-xl bg-muted/50 dark:bg-muted/40 animate-pulse" />
              </div>

              {/* Task cards */}
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-2xl bg-muted/30 dark:bg-muted/20 border border-border/40 animate-pulse"
                    style={{ animationDelay: `${i * 80}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Advice card skeleton */}
          <div className="rounded-2xl border border-border border-l-4 border-l-amber-500/60 bg-muted/20 dark:bg-muted/30 overflow-hidden">
            <div className="flex items-start gap-3 p-5">
              <div className="h-10 w-10 rounded-xl bg-muted/50 dark:bg-muted/40 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-muted/50 dark:bg-muted/40 rounded animate-pulse" />
                <div className="h-4 w-full bg-muted/40 dark:bg-muted/30 rounded animate-pulse" />
                <div className="h-4 w-[75%] bg-muted/40 dark:bg-muted/30 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
