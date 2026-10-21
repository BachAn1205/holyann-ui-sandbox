"use client";

import React from "react";

/**
 * Skeleton for a message bubble - matches MessageBubble layout.
 * Used when messages are loading.
 */
export const MessageSkeleton: React.FC<{
  isMine?: boolean;
  width?: number;
}> = ({ isMine = false, width = 160 }) => (
  <div
    className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}
    aria-hidden
  >
    {/* Avatar (only for received messages) */}
    {!isMine && (
      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-muted animate-pulse shrink-0" />
    )}
    <div className="max-w-[75%] md:max-w-[70%] space-y-2">
      {/* Bubble */}
      <div
        className={`rounded-xl md:rounded-2xl overflow-hidden h-12 md:h-14 ${
          isMine ? "bg-muted/60" : "bg-muted/40"
        } animate-pulse`}
        style={{ width }}
      />
      {/* Timestamp */}
      <div className="h-3 w-10 bg-muted/40 rounded animate-pulse" />
    </div>
  </div>
);

const WIDTHS = [140, 180, 120, 200, 160];

export function MessagesListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3 md:gap-4 p-3 md:p-6">
      {Array.from({ length: count }).map((_, i) => (
        <MessageSkeleton
          key={i}
          isMine={i % 3 === 0}
          width={WIDTHS[i % WIDTHS.length]}
        />
      ))}
    </div>
  );
}
