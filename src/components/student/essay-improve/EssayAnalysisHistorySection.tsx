"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { History, ChevronDown, ChevronUp } from "lucide-react";
import { HistoryListSkeleton } from "@/components/student/essay-improve/essay-improve-skeletons";
import { Button } from "@/components/ui/button";

type HistoryRow = {
  id: string;
  type: "analysis" | "enhance";
  date: string;
  summary: { label: string; detail?: string } | null;
};

interface EssayAnalysisHistorySectionProps {
  studentId: string;
  essayId: string | null;
  refreshKey?: number;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  try {
    const date = new Date(d);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function SummaryChips({ summary }: { summary: HistoryRow["summary"] }) {
  if (!summary?.label && !summary?.detail) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5 justify-end">
      {summary.label ? (
        <span className="inline-flex rounded-md bg-muted/70 px-2 py-0.5 text-xs font-medium text-foreground">
          {summary.label}
        </span>
      ) : null}
      {summary.detail ? (
        <span className="inline-flex rounded-md bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-800 dark:text-violet-200">
          {summary.detail}
        </span>
      ) : null}
    </div>
  );
}

export function EssayAnalysisHistorySection({
  studentId,
  essayId,
  refreshKey,
}: EssayAnalysisHistorySectionProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<HistoryRow[]>([]);
  const [showAll, setShowAll] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!essayId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/students/${studentId}/essay-improve/history?essay_id=${encodeURIComponent(essayId)}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [studentId, essayId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshKey]);

  const combined = useMemo(() => {
    return [...items].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [items]);

  const visible = showAll ? combined : combined.slice(0, 3);

  if (!essayId) {
    return (
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-violet-500/40 bg-gradient-to-r from-violet-500/15 to-purple-500/10 px-4 py-2 shadow-sm">
          <History className="size-4 text-violet-600 dark:text-violet-400" />
          <span className="font-sans text-xs font-medium uppercase tracking-[0.15em] text-violet-700 dark:text-violet-300">
            Lịch sử
          </span>
        </div>
        <div className="rounded-2xl border-2 border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-transparent p-6">
          <p className="text-sm text-muted-foreground">
            Chọn bài luận ở phần trên để xem lịch sử.
          </p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-violet-500/40 bg-gradient-to-r from-violet-500/15 to-purple-500/10 px-4 py-2 shadow-sm">
          <History className="size-4 text-violet-600 dark:text-violet-400" />
          <span className="font-sans text-xs font-medium uppercase tracking-[0.15em] text-violet-700 dark:text-violet-300">
            Lịch sử
          </span>
        </div>
        <HistoryListSkeleton />
      </section>
    );
  }

  if (combined.length === 0) {
    return (
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-violet-500/40 bg-gradient-to-r from-violet-500/15 to-purple-500/10 px-4 py-2 shadow-sm">
          <History className="size-4 text-violet-600 dark:text-violet-400" />
          <span className="font-sans text-xs font-medium uppercase tracking-[0.15em] text-violet-700 dark:text-violet-300">
            Lịch sử
          </span>
        </div>
        <div className="rounded-2xl border-2 border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-transparent p-6">
          <p className="text-sm text-muted-foreground">
            Chưa có lịch sử phân tích hoặc cải thiện cho bài này.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="inline-flex items-center gap-2 rounded-full border-2 border-violet-500/40 bg-gradient-to-r from-violet-500/15 to-purple-500/10 px-4 py-2 shadow-sm">
        <History className="size-4 text-violet-600 dark:text-violet-400" />
        <span className="font-sans text-xs font-medium uppercase tracking-[0.15em] text-violet-700 dark:text-violet-300">
          Lịch sử phân tích &amp; cải thiện
        </span>
      </div>

      <div className="rounded-2xl border-2 border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-transparent p-4 sm:p-6 shadow-lg space-y-4">
        <ul className="space-y-3">
          {visible.map((row) => (
            <li
              key={`${row.type}-${row.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-md ${
                    row.type === "analysis"
                      ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {row.type === "analysis" ? "Phân tích" : "Cải thiện"}
                </span>
                <span className="text-sm font-medium text-foreground tabular-nums">
                  {formatDate(row.date)}
                </span>
              </div>
              <SummaryChips summary={row.summary} />
            </li>
          ))}
        </ul>

        {combined.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-500/10"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? (
              <>
                <ChevronUp className="size-4 mr-1" />
                Thu gọn
              </>
            ) : (
              <>
                <ChevronDown className="size-4 mr-1" />
                Xem thêm ({combined.length - 3} lần)
              </>
            )}
          </Button>
        )}
      </div>
    </section>
  );
}
