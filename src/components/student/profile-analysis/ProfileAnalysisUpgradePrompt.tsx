"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

const TONE = {
  sky: {
    wrap: "border-sky-500/45 bg-gradient-to-r from-sky-500/10 via-card to-blue-500/5 hover:border-sky-500/70 hover:bg-sky-500/15",
    icon: "bg-sky-500/20 dark:bg-sky-500/15",
    lock: "text-sky-600 dark:text-sky-400",
  },
  indigo: {
    wrap: "border-indigo-500/45 bg-gradient-to-r from-indigo-500/10 via-card to-violet-500/5 hover:border-indigo-500/70 hover:bg-indigo-500/15",
    icon: "bg-indigo-500/20 dark:bg-indigo-500/15",
    lock: "text-indigo-600 dark:text-indigo-400",
  },
} as const;

type ProfileAnalysisUpgradePromptProps = {
  title: string;
  description: string;
  className?: string;
  tone?: keyof typeof TONE;
};

export function ProfileAnalysisUpgradePrompt({
  title,
  description,
  className = "",
  tone = "sky",
}: ProfileAnalysisUpgradePromptProps) {
  const t = TONE[tone];
  return (
    <Link
      href="/student/pricing"
      className={`flex items-start gap-3 rounded-xl border-2 border-dashed p-4 transition-colors ${t.wrap} ${className}`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${t.icon}`}
      >
        <Lock className={`h-5 w-5 ${t.lock}`} />
      </span>
      <div className="min-w-0 text-left">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}

const OVERLAY_PILL = {
  sky: "border-sky-300 dark:border-sky-700 bg-sky-100 dark:bg-sky-900/80 text-sky-800 dark:text-sky-200 hover:bg-sky-200 dark:hover:bg-sky-800/80",
  indigo:
    "border-indigo-300 dark:border-indigo-700 bg-indigo-100 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-800/80",
} as const;

const OVERLAY_LOCK = {
  sky: "text-sky-600 dark:text-sky-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
} as const;

/** Lớp phủ giữa khối đã blur (giống enhance profile): pill + link pricing */
export function ProfileAnalysisLockedOverlay({
  label,
  tone = "sky",
}: {
  label: string;
  tone?: keyof typeof OVERLAY_PILL;
}) {
  return (
    <Link
      href="/student/pricing"
      className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center p-3"
    >
      <span
        className={`inline-flex max-w-[min(100%,20rem)] items-center gap-2 rounded-full border px-4 py-2 text-center shadow-sm transition-colors sm:max-w-none ${OVERLAY_PILL[tone]}`}
      >
        <Lock className={`h-4 w-4 shrink-0 ${OVERLAY_LOCK[tone]}`} />
        <span className="text-sm font-medium leading-snug">{label}</span>
      </span>
    </Link>
  );
}
