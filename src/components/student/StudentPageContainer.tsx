'use client';

import React from 'react';

interface StudentPageContainerProps {
  children: React.ReactNode;
  /** No horizontal padding when true (e.g. full-bleed dashboard) */
  noPadding?: boolean;
  /** Full width: no max-width constraint (e.g. student profile) */
  fullWidth?: boolean;
  /** Custom class for the inner container */
  className?: string;
}

/**
 * Reusable container for student pages: consistent max-width and padding.
 * Use inside student layout for a professional, consistent look.
 */
export function StudentPageContainer({ children, noPadding, fullWidth, className = '' }: StudentPageContainerProps) {
  const innerClass = noPadding
    ? 'w-full'
    : fullWidth
      ? 'w-full px-4 py-6 sm:px-6 md:px-8 md:py-8'
      : 'container max-w-screen-2xl px-4 py-6 sm:px-6 md:px-8 md:py-8';
  return (
    <div className={`min-h-[calc(100vh-theme(spacing.14))] ${className}`}>
      <div className={innerClass}>
        {children}
      </div>
    </div>
  );
}
