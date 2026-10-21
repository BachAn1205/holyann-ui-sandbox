"use client";

import React from "react";

export function ImproveSkeleton() {
  return (
    <div className="space-y-10 animate-in fade-in duration-300 min-h-[480px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
          >
            <div className="flex justify-between gap-4">
              <div className="h-10 w-10 rounded-xl bg-muted/60 animate-pulse" />
              <div className="h-6 w-16 rounded-full bg-muted/50 animate-pulse" />
            </div>
            <div className="mt-4 h-9 w-20 rounded bg-muted/60 animate-pulse" />
            <div className="mt-3 h-2 w-full rounded-full bg-muted/40 animate-pulse" />
            <div className="mt-4 flex gap-2">
              <div className="h-8 w-20 rounded-lg bg-muted/50 animate-pulse" />
              <div className="h-8 w-20 rounded-lg bg-muted/50 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="h-5 w-36 rounded bg-muted/60 animate-pulse mb-4" />
          <div className="h-[220px] rounded-lg bg-muted/40 animate-pulse" />
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <div className="h-5 w-40 rounded bg-muted/60 animate-pulse mb-4" />
          <div className="h-[220px] rounded-lg bg-muted/40 animate-pulse" />
        </div>
      </div>
      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <div className="h-5 w-28 rounded bg-muted/60 animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-full rounded bg-muted/40 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
