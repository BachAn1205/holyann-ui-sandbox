"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { History, Loader2, ChevronDown, ChevronUp } from "lucide-react";

const ACCENT = "#0f4c81";

type HistoryItem = {
  id: string;
  created_at: string | null;
  summary?: Record<string, unknown> | null;
  faculties?: { reach?: unknown[]; match?: unknown[]; safety?: unknown[] } | null;
};

interface TargetHistorySectionProps {
  studentId: string | null;
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  try {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "—";
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

function parseSummary(summary: unknown): {
  pillars?: { academic?: number; language?: number; extracurricular?: number; skills?: number };
  wishlist_counts?: { faculties?: number; universities?: number };
  student_score?: number;
  spike_score?: number;
} {
  if (!summary || typeof summary !== "object") return {};
  const s = summary as Record<string, unknown>;
  const pillars = s.pillars;
  const wishlist_counts = s.wishlist_counts;
  return {
    pillars:
      pillars && typeof pillars === "object"
        ? (pillars as {
            academic?: number;
            language?: number;
            extracurricular?: number;
            skills?: number;
          })
        : undefined,
    wishlist_counts:
      wishlist_counts && typeof wishlist_counts === "object"
        ? (wishlist_counts as { faculties?: number; universities?: number })
        : undefined,
    student_score: typeof s.student_score === "number" ? s.student_score : undefined,
    spike_score: typeof s.spike_score === "number" ? s.spike_score : undefined,
  };
}

function countBuckets(faculties: unknown): { reach: number; match: number; safety: number } {
  const f = faculties as
    | { reach?: unknown[]; match?: unknown[]; safety?: unknown[] }
    | null
    | undefined;
  return {
    reach: Array.isArray(f?.reach) ? f.reach.length : 0,
    match: Array.isArray(f?.match) ? f.match.length : 0,
    safety: Array.isArray(f?.safety) ? f.safety.length : 0,
  };
}

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function TargetHistorySection({ studentId }: TargetHistorySectionProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/admission-chance/history`);
      if (!res.ok) return;
      const data = await res.json();
      const raw = data.items;
      setItems(Array.isArray(raw) ? raw : []);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (!studentId) return null;

  const summaryLine = loading
    ? "Đang tải..."
    : items.length === 0
      ? "Chưa có lần chạy nào"
      : `${items.length} lần đánh giá gần đây`;

  return (
    <motion.section
      className="pc-panel overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      aria-labelledby="target-history-heading"
    >
      <div className="pc-panel-header px-4 py-3.5 sm:px-5">
        <button
          type="button"
          className="flex w-full items-start gap-2.5 text-left"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,#0f4c81_10%,transparent)] text-[#0f4c81] dark:bg-sky-500/15 dark:text-sky-300">
            <History className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span
              id="target-history-heading"
              className="pc-display flex items-center gap-2 text-base text-foreground sm:text-lg"
            >
              Lịch sử đánh giá
              {open ? (
                <ChevronUp className="size-4 text-muted-foreground" aria-hidden />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
              )}
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {summaryLine}
            </span>
          </span>
        </button>
      </div>

      {open ? (
        <div className="px-4 py-4 sm:px-5 sm:py-5">
          {loading ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3">
              <Loader2 className="size-5 animate-spin text-[#0f4c81]" />
              <span className="text-sm text-muted-foreground">Đang tải lịch sử...</span>
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có lịch sử đánh giá.</p>
          ) : (
            <>
              <ul className="divide-y divide-[color-mix(in_srgb,#0f4c81_8%,transparent)] dark:divide-white/8">
                {items.slice(0, expanded ? undefined : 3).map((item, i) => {
                  const sum = parseSummary(item.summary);
                  const buckets = countBuckets(item.faculties);
                  const key =
                    item.id && String(item.id).length > 0
                      ? item.id
                      : `hist-${i}-${item.created_at ?? "x"}`;
                  return (
                    <li key={key} className="pc-rank-row !px-1 sm:!px-2">
                      <span className="pc-rank-num" style={{ color: ACCENT }}>
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold tabular-nums text-foreground">
                          {formatDate(item.created_at)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Reach {buckets.reach} · Match {buckets.match} · Safety{" "}
                          {buckets.safety}
                        </p>
                        {sum.pillars ? (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Trụ cột: HT {sum.pillars.academic ?? "—"} · NN{" "}
                            {sum.pillars.language ?? "—"} · NK{" "}
                            {sum.pillars.extracurricular ?? "—"} · KN{" "}
                            {sum.pillars.skills ?? "—"}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {items.length > 3 ? (
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setExpanded((o) => !o)}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-[#0f4c81] hover:bg-[color-mix(in_srgb,#0f4c81_6%,transparent)] dark:text-sky-300"
                  >
                    {expanded ? (
                      <>
                        Thu gọn <ChevronUp className="size-4" />
                      </>
                    ) : (
                      <>
                        Xem tất cả ({items.length}) <ChevronDown className="size-4" />
                      </>
                    )}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </motion.section>
  );
}
