"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

interface ProfileCollapsibleSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  summary: string;
  isComplete: boolean;
  defaultOpen?: boolean;
  /** Nút phụ (ví dụ Cập nhật) — click không toggle accordion. */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const ProfileCollapsibleSection: React.FC<
  ProfileCollapsibleSectionProps
> = ({
  id,
  title,
  icon,
  summary,
  isComplete,
  defaultOpen = false,
  actions,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `profile-collapse-${id}`;

  return (
    <section className="pc-panel">
      <div className="pc-panel-header px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <button
            type="button"
            className="flex min-w-0 flex-1 items-start gap-2.5 text-left"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls={panelId}
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,#0f4c81_10%,transparent)] text-[#0f4c81] dark:bg-sky-500/15 dark:text-sky-300">
              {icon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="pc-display flex items-center gap-2 text-base text-foreground sm:text-lg">
                {title}
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {summary}
              </span>
            </span>
          </button>
          <div
            className="flex flex-wrap items-center gap-2 sm:shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
            <StatusBadge isComplete={isComplete} />
          </div>
        </div>
      </div>
      {open ? (
        <div id={panelId} className="border-t border-[color-mix(in_srgb,#0f4c81_8%,transparent)] dark:border-white/10">
          {children}
        </div>
      ) : null}
    </section>
  );
};
