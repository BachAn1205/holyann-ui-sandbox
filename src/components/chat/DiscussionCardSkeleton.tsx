"use client";

import React from "react";

/**
 * Skeleton matching the real discussion/conversation card layout.
 * Preserves card height to avoid CLS during loading.
 */
export const DiscussionCardSkeleton: React.FC = () => (
  <div className="p-3 md:p-4 border-b border-border">
    <div className="flex items-start gap-2 md:gap-3">
      {/* Avatar skeleton */}
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-muted animate-pulse shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        {/* Username + timestamp row */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="h-3 w-12 bg-muted/80 rounded animate-pulse shrink-0 ml-2" />
        </div>
        {/* Role badge */}
        <div className="h-5 w-16 bg-muted/80 rounded-full animate-pulse" />
        {/* Last message content */}
        <div className="h-3 w-full max-w-[180px] bg-muted/60 rounded animate-pulse" />
      </div>
    </div>
  </div>
);

/**
 * Renders multiple skeleton cards for the conversation list.
 */
export function ConversationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <DiscussionCardSkeleton key={i} />
      ))}
    </>
  );
}
