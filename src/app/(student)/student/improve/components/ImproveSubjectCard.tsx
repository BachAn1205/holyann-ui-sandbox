"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SubjectStatus = "strong" | "on_track" | "needs_work" | "no_data";

export interface ImproveSubjectCardProps {
  title: string;
  /** Primary score 0–100; null = no data */
  score: number | null;
  /** e.g. +5, -2; null = no trend */
  trend?: number | null;
  status: SubjectStatus;
  /** Level 2: max ~12 words */
  insight?: string | null;
  /** 0–100 for mini bar */
  progressPercent?: number | null;
  /** Small supporting metric label */
  metricLabel?: string;
  metricValue?: string | number | null;
  /** Level 3: expandable content */
  details?: React.ReactNode;
  loading?: boolean;
  onAnalyze?: () => void;
  onEnhance?: () => void;
  analyzeLoading?: boolean;
  enhanceLoading?: boolean;
  /** Optional icon (e.g. UserCircle, FileText, PenLine) */
  icon?: React.ReactNode;
}

const STATUS_MAP: Record<
  SubjectStatus,
  { label: string; className: string }
> = {
  strong: {
    label: "Tốt",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  on_track: {
    label: "Đúng hướng",
    className: "bg-primary/15 text-primary border-primary/30",
  },
  needs_work: {
    label: "Cần cải thiện",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  no_data: {
    label: "Chưa có dữ liệu",
    className: "bg-muted text-muted-foreground border-border",
  },
};

export function ImproveSubjectCard({
  title,
  score,
  trend,
  status,
  insight,
  progressPercent,
  metricLabel,
  metricValue,
  details,
  loading,
  onAnalyze,
  onEnhance,
  analyzeLoading,
  enhanceLoading,
  icon,
}: ImproveSubjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = STATUS_MAP[status];
  const displayScore = score != null ? Math.round(Math.min(100, Math.max(0, score))) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden",
        "hover:shadow-md hover:border-border/80 transition-all duration-200"
      )}
    >
      <div className="p-5 sm:p-6">
        {/* Level 1: Primary signal */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-muted-foreground truncate">
                {title}
              </h3>
              {loading ? (
                <div className="mt-1 h-8 w-14 rounded bg-muted/60 animate-pulse" />
              ) : (
                <div className="mt-0.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                    {displayScore != null ? displayScore : ":"}
                  </span>
                  {displayScore != null && (
                    <span className="text-sm font-medium text-muted-foreground">
                      / 100
                    </span>
                  )}
                  {trend != null && !loading && (
                    <span
                      className={cn(
                        "flex items-center gap-0.5 text-sm font-medium",
                        trend >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {trend >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {trend >= 0 ? "+" : ""}
                      {trend}%
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          {!loading && (
            <span
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                statusConfig.className
              )}
            >
              {statusConfig.label}
            </span>
          )}
        </div>

        {/* Level 2: Context */}
        {(insight || progressPercent != null || (metricLabel && metricValue != null)) && !loading && (
          <div className="mt-4 space-y-3">
            {insight && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {insight}
              </p>
            )}
            {progressPercent != null && (
              <div className="space-y-1">
                <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
              </div>
            )}
            {metricLabel && metricValue != null && (
              <p className="text-xs text-muted-foreground">
                {metricLabel}: <span className="font-medium text-foreground">{metricValue}</span>
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        {(onAnalyze || onEnhance) && !loading && (
          <div className="mt-4 flex flex-wrap gap-2">
            {onAnalyze && (
              <button
                type="button"
                onClick={onAnalyze}
                disabled={analyzeLoading || enhanceLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 disabled:opacity-50 transition-colors"
              >
                {analyzeLoading ? (
                  <span className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                ) : null}
                Phân tích
              </button>
            )}
            {onEnhance && (
              <button
                type="button"
                onClick={onEnhance}
                disabled={analyzeLoading || enhanceLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
              >
                {enhanceLoading ? (
                  <span className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                ) : null}
                Cải thiện
              </button>
            )}
          </div>
        )}

        {/* Level 3: Expandable details */}
        {details && (
          <div className="mt-4 border-t border-border/60 pt-4">
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="flex w-full items-center justify-between gap-2 rounded-lg py-1.5 text-left text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{expanded ? "Ẩn chi tiết" : "Xem chi tiết"}</span>
              <ChevronDown
                className={cn("h-4 w-4 shrink-0 transition-transform", expanded && "rotate-180")}
              />
            </button>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-3 text-sm text-muted-foreground [&_.whitespace-pre-line]:text-foreground">
                    {details}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
