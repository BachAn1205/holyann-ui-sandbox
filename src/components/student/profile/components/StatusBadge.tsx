"use client";

import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  isComplete: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ isComplete, className }) => (
  <div
    className={cn(
      "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
      isComplete
        ? "bg-[color-mix(in_srgb,#0f4c81_8%,transparent)] text-[#0f4c81] dark:bg-sky-500/15 dark:text-sky-200"
        : "bg-slate-100 text-slate-600 dark:bg-muted dark:text-muted-foreground",
      className,
    )}
  >
    {isComplete ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
    {isComplete ? "Hoàn tất" : "Cần bổ sung"}
  </div>
);
