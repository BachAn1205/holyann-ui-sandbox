'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type FeatureGateProps = {
  isLocked: boolean;
  children: React.ReactNode;
  message?: string;
  requiredPlan?: string;
  blurContent?: boolean;
};

export function FeatureGate({
  isLocked,
  children,
  message = 'Nâng cấp để xem nội dung này',
  requiredPlan,
  blurContent = true,
}: FeatureGateProps) {
  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div
        className={cn(
          blurContent && 'pointer-events-none opacity-50 blur-[1px]',
          !blurContent && 'pointer-events-none opacity-60',
        )}
      >
        {children}
      </div>

      <div className="pointer-events-auto absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            🔒
          </span>
          <span>{message}</span>
        </div>
        {requiredPlan && (
          <p className="text-xs text-muted-foreground">
            Gói yêu cầu: <span className="font-semibold text-foreground">{requiredPlan}</span>
          </p>
        )}
        <Link
          href="/student/pricing"
          className="mt-1 inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
        >
          Xem các gói nâng cấp
        </Link>
      </div>
    </div>
  );
}

type LockIconProps = {
  show?: boolean;
  className?: string;
};

export function LockIcon({ show, className }: LockIconProps) {
  if (!show) return null;
  return (
    <span
      className={cn(
        'ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-100 text-[10px] text-amber-700 align-middle',
        className,
      )}
      aria-hidden="true"
    >
      🔒
    </span>
  );
}

