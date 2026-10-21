'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const MODAL_ACCENTS = {
  emerald: 'border-l-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20',
  violet: 'border-l-violet-500 bg-violet-500/10 dark:bg-violet-500/20',
  amber: 'border-l-amber-500 bg-amber-500/10 dark:bg-amber-500/20',
  sky: 'border-l-sky-500 bg-sky-500/10 dark:bg-sky-500/20',
  rose: 'border-l-rose-500 bg-rose-500/10 dark:bg-rose-500/20',
  primary: 'border-l-primary bg-primary/10 dark:bg-primary/20',
} as const;

export type ModalAccent = keyof typeof MODAL_ACCENTS;

export function ModalSection({
  title,
  children,
  accent = 'primary',
  className,
}: {
  title?: string;
  children: React.ReactNode;
  accent?: ModalAccent;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/50 dark:border-border/70 p-6 border-l-4 shadow-sm',
        MODAL_ACCENTS[accent],
        className
      )}
    >
      {title && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          {title}
        </p>
      )}
      <div className="text-sm leading-relaxed [&_.whitespace-pre-line]:text-foreground">{children}</div>
    </div>
  );
}

export function CollapsibleSection({
  title,
  summary,
  children,
  accent = 'primary',
  defaultOpen = false,
}: {
  title: string;
  summary?: string;
  children: React.ReactNode;
  accent?: ModalAccent;
  defaultOpen?: boolean;
}) {
  return (
    <details
      className={cn(
        'group rounded-2xl border border-border/50 dark:border-border/70 border-l-4 overflow-hidden shadow-sm transition-shadow hover:shadow-md',
        MODAL_ACCENTS[accent]
      )}
      open={defaultOpen}
    >
      <summary className="list-none cursor-pointer select-none outline-none">
        <span className="flex items-center justify-between gap-4 py-4 px-5 hover:bg-muted/50 active:bg-muted/70 transition-colors rounded-2xl">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          <span className="flex items-center gap-2 shrink-0">
            {summary && (
              <span className="text-sm text-muted-foreground truncate max-w-[50%] sm:max-w-[60%]">
                {summary}
              </span>
            )}
            <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
          </span>
        </span>
      </summary>
      <div className="px-5 pb-6 pt-0 text-sm leading-relaxed [&_.whitespace-pre-line]:text-foreground">
        {children}
      </div>
    </details>
  );
}
