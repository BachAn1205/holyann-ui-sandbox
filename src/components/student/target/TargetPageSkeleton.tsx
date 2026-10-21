"use client";

import React from "react";

export function TargetPageSkeleton() {
  return (
    <div className="profile-creative-scope animate-in fade-in space-y-5 duration-300 sm:space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="pc-panel lg:col-span-7">
          <div className="pc-panel-header px-4 py-3.5 sm:px-5">
            <div className="h-5 w-36 animate-pulse rounded bg-muted/70" />
            <div className="mt-2 h-3 w-48 animate-pulse rounded bg-muted/50" />
          </div>
          <div className="space-y-3 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 w-28 animate-pulse rounded-xl bg-muted/50" />
              ))}
            </div>
            <div className="h-10 w-52 animate-pulse rounded-xl bg-muted/60" />
          </div>
        </div>
        <div className="pc-panel lg:col-span-5">
          <div className="pc-panel-header px-4 py-3.5 sm:px-5">
            <div className="h-5 w-32 animate-pulse rounded bg-muted/70" />
          </div>
          <div className="space-y-3 px-4 py-4 sm:px-5">
            <div className="h-14 animate-pulse rounded-xl bg-muted/40" />
            <div className="h-14 animate-pulse rounded-xl bg-muted/40" />
          </div>
        </div>
      </div>

      <div className="pc-panel">
        <div className="pc-panel-header px-4 py-3.5 sm:px-5">
          <div className="h-5 w-40 animate-pulse rounded bg-muted/70" />
        </div>
        <div className="space-y-3 px-4 py-4 sm:px-5">
          <div className="mb-2 flex gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-11 flex-1 animate-pulse rounded-lg bg-muted/50" />
            ))}
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/30" />
          ))}
        </div>
      </div>
    </div>
  );
}
