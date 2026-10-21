"use client";

import React, { useEffect, useState } from "react";
import { Loader2, History, ChevronDown, ChevronUp } from "lucide-react";
import type { CvManageRow } from "@/types/cv-manage";

type HistoryItem = {
  id: string;
  type: "analysis" | "enhance";
  date: string;
  summary: { label: string; detail?: string } | null;
};

export function CvAnalysisHistorySection({
  studentId,
  cvId,
  refreshKey,
}: {
  studentId: string;
  cvId: string | null;
  refreshKey: number;
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [cvMeta, setCvMeta] = useState<CvManageRow | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!studentId || !cvId) {
      setItems([]);
      setCvMeta(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/students/${studentId}/cv-improve/history?cv_document_id=${encodeURIComponent(cvId)}`,
          { cache: "no-store" },
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setCvMeta(data.cv ?? null);
        setItems(Array.isArray(data.items) ? data.items : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, cvId, refreshKey]);

  if (!cvId) {
    return (
      <section className="space-y-3">
        <h2 className="font-heading flex items-center gap-2 text-xl font-bold text-violet-900 dark:text-violet-100">
          <History className="size-5" />
          Lịch sử
        </h2>
        <p className="text-sm text-muted-foreground">Chọn một CV để xem lịch sử phân tích / cải thiện.</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="font-heading flex items-center gap-2 text-xl font-bold text-violet-900 dark:text-violet-100">
        <History className="size-5" />
        Lịch sử
      </h2>
      {cvMeta && (
        <p className="text-xs text-muted-foreground">
          CV slot {cvMeta.slot_index}: {cvMeta.file_name}
        </p>
      )}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Đang tải...
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có lần phân tích hoặc cải thiện nào.</p>
      ) : (
        <div className="space-y-3">
          <ul className="space-y-2 rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-transparent p-4">
            {(isExpanded ? items : items.slice(0, 3)).map((it) => (
              <li
                key={it.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/50 px-3 py-2 text-sm"
              >
                <span className="font-medium capitalize text-foreground">{it.type}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(it.date).toLocaleString("vi-VN")}
                </span>
                {it.summary && (
                  <span className="w-full text-xs text-muted-foreground">
                    {it.summary.label}
                    {it.summary.detail ? ` — ${it.summary.detail}` : ""}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {items.length > 3 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="size-4" />
                  Thu gọn
                </>
              ) : (
                <>
                  <ChevronDown className="size-4" />
                  Xem thêm ({items.length - 3} bản ghi khác)
                </>
              )}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
