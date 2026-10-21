"use client";

import React from "react";

function PanelSkeleton({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`pc-panel ${className}`}>{children}</div>;
}

export function ProfilePageSkeleton() {
  return (
    <div className="profile-creative-scope w-full overflow-x-hidden pb-8 animate-in fade-in duration-200">
      <div className="relative mb-5 overflow-hidden pc-hero-surface pc-sticker-shadow sm:mb-6 lg:mb-8">
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:px-6 sm:py-5 lg:px-7">
          <div className="flex min-w-0 flex-1 items-center gap-3.5">
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-muted/70 sm:h-14 sm:w-14" />
            <div className="space-y-2">
              <div className="h-6 w-40 animate-pulse rounded-md bg-muted/70 sm:w-52" />
              <div className="h-3.5 w-52 animate-pulse rounded bg-muted/50 sm:w-64" />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="h-10 w-32 animate-pulse rounded-xl bg-muted/70" />
            <div className="h-10 w-28 animate-pulse rounded-xl bg-muted/70 sm:w-36" />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full space-y-5 sm:space-y-6 lg:space-y-6">
        {/* Hàng chính */}
        <div className="grid grid-cols-1 items-start gap-5 sm:gap-6 lg:grid-cols-12 lg:gap-6">
          <PanelSkeleton className="lg:col-span-4">
            <div className="px-4 py-5 sm:px-5 sm:py-6">
              <div className="mb-5 flex items-start gap-3.5">
                <div className="h-16 w-16 shrink-0 animate-pulse rounded-2xl bg-slate-100 sm:h-[4.5rem] sm:w-[4.5rem]" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-50" />
                  <div className="h-6 w-20 animate-pulse rounded-lg bg-slate-100" />
                </div>
              </div>
              <div className="space-y-3 border-t border-slate-100 pt-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-slate-100" />
                    <div
                      className="h-4 flex-1 animate-pulse rounded bg-slate-50"
                      style={{ maxWidth: i === 4 ? "85%" : "70%" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </PanelSkeleton>

          {[1, 2].map((col) => (
            <PanelSkeleton key={col} className="lg:col-span-4">
              <div className="pc-panel-header flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 animate-pulse rounded-xl bg-slate-100" />
                  <div className="h-5 w-36 animate-pulse rounded bg-slate-100" />
                </div>
                <div className="h-4 w-16 animate-pulse rounded bg-slate-50" />
              </div>
              <div className="space-y-0 px-4 py-3 sm:px-5">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 border-b border-slate-50 py-2.5 last:border-0"
                  >
                    <div className="h-5 w-5 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 flex-1 animate-pulse rounded bg-slate-50" />
                  </div>
                ))}
              </div>
            </PanelSkeleton>
          ))}
        </div>

        {/* Accordion headers only */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <PanelSkeleton key={i}>
              <div className="pc-panel-header flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-slate-100" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-56 max-w-full animate-pulse rounded bg-slate-50" />
                  </div>
                </div>
                <div className="h-6 w-20 shrink-0 animate-pulse rounded-lg bg-slate-100" />
              </div>
            </PanelSkeleton>
          ))}
        </div>
      </div>
    </div>
  );
}
