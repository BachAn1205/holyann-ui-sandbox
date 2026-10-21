"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { History, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizePillarScoreTo100 } from "@/lib/pillar-scores";

const PILLAR_KEYS = ["academic", "language", "extracurricular", "skills"] as const;
const PILLAR_LABELS: Record<string, string> = {
  academic: "Học thuật",
  language: "Ngoại ngữ",
  extracurricular: "HĐNK",
  skills: "Kỹ năng",
};

type PillarScores = {
  academic?: number;
  language?: number;
  extracurricular?: number;
  skills?: number;
};

type HistoryItem = {
  id: string;
  date: string | null;
  pillar_scores: PillarScores | null;
};

interface ProfileAnalysisHistorySectionProps {
  studentId: string;
  /** Tăng số này mỗi khi muốn reload lịch sử (vd. sau khi analyze/enhance thành công) */
  refreshKey?: number;
}

function formatDate(d: string | null): string {
  if (!d) return ":";
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
    return ":";
  }
}

function PillarChips({ scores }: { scores: PillarScores | null }) {
  if (!scores) return <span className="text-muted-foreground text-sm">:</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {PILLAR_KEYS.map((key) => {
        const v = scores[key];
        const num = typeof v === "number" ? normalizePillarScoreTo100(v) : null;
        if (num == null) return null;
        return (
          <span
            key={key}
            className="inline-flex rounded-md bg-muted/70 px-2 py-0.5 text-xs font-medium text-foreground"
          >
            {PILLAR_LABELS[key]}: {num}/100
          </span>
        );
      })}
    </div>
  );
}

export function ProfileAnalysisHistorySection({
  studentId,
  refreshKey,
}: ProfileAnalysisHistorySectionProps) {
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<HistoryItem[]>([]);
  const [enhances, setEnhances] = useState<HistoryItem[]>([]);
  const [showAll, setShowAll] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/profile-analysis/history`);
      if (!res.ok) return;
      const data = await res.json();
      setAnalyses(data.analyses ?? []);
      setEnhances(data.enhances ?? []);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, refreshKey]);

  const combinedHistory = useMemo(() => {
    const combined = [
      ...analyses.map((a) => ({ ...a, type: "analysis" as const })),
      ...enhances.map((e) => ({ ...e, type: "enhance" as const })),
    ];
    combined.sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    });
    return combined;
  }, [analyses, enhances]);

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-violet-500/40 bg-gradient-to-r from-violet-500/15 to-purple-500/10 px-4 py-2 shadow-sm">
          <History className="size-4 text-violet-600 dark:text-violet-400" />
          <span className="font-sans text-xs font-medium uppercase tracking-[0.15em] text-violet-700 dark:text-violet-300">
            Lịch sử
          </span>
        </div>
        <div className="rounded-2xl border-2 border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-transparent p-6">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            Đang tải lịch sử...
          </p>
        </div>
      </section>
    );
  }

  const hasAny = analyses.length > 0 || enhances.length > 0;
  if (!hasAny) {
    return (
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border-2 border-violet-500/40 bg-gradient-to-r from-violet-500/15 to-purple-500/10 px-4 py-2 shadow-sm">
          <History className="size-4 text-violet-600 dark:text-violet-400" />
          <span className="font-sans text-xs font-medium uppercase tracking-[0.15em] text-violet-700 dark:text-violet-300">
            Lịch sử
          </span>
        </div>
        <div className="rounded-2xl border-2 border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-transparent p-6">
          <p className="text-sm text-muted-foreground">Chưa có lịch sử đánh giá hoặc cải thiện.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="inline-flex items-center gap-2 rounded-full border-2 border-violet-500/40 bg-gradient-to-r from-violet-500/15 to-purple-500/10 px-4 py-2 shadow-sm">
        <History className="size-4 text-violet-600 dark:text-violet-400" />
        <span className="font-sans text-xs font-medium uppercase tracking-[0.15em] text-violet-700 dark:text-violet-300">
          Lịch sử đánh giá & cải thiện
        </span>
      </div>
      <p className="text-muted-foreground text-sm">
        Các lần đánh giá và cải thiện trước đây (chỉ hiển thị điểm 4 trụ cột và ngày thực hiện).
      </p>

      <div className="rounded-2xl border-2 border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-transparent p-4 sm:p-6 shadow-lg space-y-4">
        <ul className="space-y-3">
          {(showAll ? combinedHistory : combinedHistory.slice(0, 3)).map((item) => (
            <li
              key={item.id + item.type}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-md ${
                    item.type === "analysis"
                      ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {item.type === "analysis" ? "Đánh giá" : "Cải thiện"}
                </span>
                <span className="text-sm font-medium text-foreground tabular-nums">
                  {formatDate(item.date)}
                </span>
              </div>
              <PillarChips scores={item.pillar_scores} />
            </li>
          ))}
        </ul>

        {combinedHistory.length > 3 && (
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
                Xem thêm ({combinedHistory.length - 3} lần)
              </>
            )}
          </Button>
        )}
      </div>
    </section>
  );
}
