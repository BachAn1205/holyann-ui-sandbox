"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { History, Loader2, ChevronDown, ChevronUp } from "lucide-react";

const ACCENT = "#0052FF";
const ACCENT_SEC = "#4D7CFF";

type AssessmentSummary = {
  mbti_type?: string;
  riasec_code?: string;
};

type FacultyItem = { faculty_name?: string; industry_group?: string; match_score?: number };

type HistoryItem = {
  id: string;
  created_at: string | null;
  assessment_summary?: AssessmentSummary | null;
  faculties?: FacultyItem[] | null;
};

interface RecommendFacultyHistorySectionProps {
  studentId: string | null;
  onSelectItem?: (item: HistoryItem) => void;
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

function PreviewChips({ item }: { item: HistoryItem }) {
  const s = item.assessment_summary;
  const faculties = Array.isArray(item.faculties) ? item.faculties : [];
  const topNames = faculties.slice(0, 3).map((f) => f?.faculty_name).filter(Boolean);
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {s?.mbti_type && (
        <span
          className="inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold"
          style={{
            background: `linear-gradient(135deg, ${ACCENT}15, ${ACCENT_SEC}10)`,
            color: ACCENT,
            border: `1px solid ${ACCENT}30`,
          }}
        >
          MBTI: {s.mbti_type}
        </span>
      )}
      {s?.riasec_code && (
        <span
          className="inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold"
          style={{
            background: `linear-gradient(135deg, ${ACCENT}15, ${ACCENT_SEC}10)`,
            color: ACCENT,
            border: `1px solid ${ACCENT}30`,
          }}
        >
          RIASEC: {s.riasec_code}
        </span>
      )}
      {topNames.length > 0 && (
        <span className="text-xs text-muted-foreground truncate max-w-[220px]" title={topNames.join(", ")}>
          {topNames.join(", ")}
        </span>
      )}
    </div>
  );
}

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function RecommendFacultyHistorySection({
  studentId,
  onSelectItem,
}: RecommendFacultyHistorySectionProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [expanded, setExpanded] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/recommend-faculty/history`);
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (!studentId) return null;

  if (loading) {
    return (
      <motion.div
        className="mt-8 rounded-2xl border border-[#0052FF]/20 bg-gradient-to-br from-[#0052FF]/5 to-transparent p-6"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="inline-flex items-center gap-3 rounded-full border border-[#0052FF]/30 bg-[#0052FF]/5 px-4 py-2 mb-4">
          <History className="size-4 text-[#0052FF]" />
          <span className="font-sans font-medium text-xs uppercase tracking-[0.15em] text-[#0052FF]">
            Lịch sử xem gợi ý ngành
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-card/50 p-4 border border-border">
          <Loader2 className="size-5 animate-spin text-[#0052FF]" />
          <span className="text-sm text-muted-foreground">Đang tải lịch sử...</span>
        </div>
      </motion.div>
    );
  }

  if (items.length === 0) {
    return (
      <motion.div
        className="mt-8 rounded-2xl border border-border bg-muted/10 p-6"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="inline-flex items-center gap-3 rounded-full border border-[#0052FF]/30 bg-[#0052FF]/5 px-4 py-2 mb-4">
          <History className="size-4 text-[#0052FF]" />
          <span className="font-sans font-medium text-xs uppercase tracking-[0.15em] text-[#0052FF]">
            Lịch sử xem gợi ý ngành
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Chưa có lịch sử xem gợi ý ngành.</p>
      </motion.div>
    );
  }

  return (
    <motion.section
      className="mt-8 rounded-2xl border border-border bg-muted/5 p-6 shadow-md"
      initial="hidden"
      animate="visible"
      variants={fadeIn}
    >
      <div className="inline-flex items-center gap-3 rounded-full border border-[#0052FF]/30 bg-[#0052FF]/5 px-4 py-2 mb-4">
        <span className="h-2 w-2 rounded-full bg-[#0052FF]" />
        <History className="size-4 text-[#0052FF]" />
        <span className="font-sans font-medium text-xs uppercase tracking-[0.15em] text-[#0052FF]">
          Lịch sử xem gợi ý ngành
        </span>
      </div>
      <p className="text-muted-foreground text-sm mb-5">
        Các lần xem gợi ý trước đây.
      </p>
      <ul className="space-y-3">
        {items.slice(0, expanded ? undefined : 3).map((item, i) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm hover:shadow-lg hover:border-[#0052FF]/25 transition-all duration-300 border-l-4"
            style={{ borderLeftColor: ACCENT }}
          >
            <span className="text-sm font-semibold text-foreground tabular-nums shrink-0">
              {formatDate(item.created_at)}
            </span>
            <PreviewChips item={item} />
          </motion.li>
        ))}
      </ul>
      {items.length > 3 && (
        <div className="flex justify-center mt-5">
          <button
            type="button"
            onClick={() => setExpanded((o) => !o)}
            className="group flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-[#0052FF] transition-all hover:bg-[#0052FF]/10 active:scale-95 border border-transparent shadow hover:shadow-md"
          >
            {expanded ? (
              <>Thu gọn <ChevronUp className="size-4 group-hover:-translate-y-0.5 transition-transform" /></>
            ) : (
              <>Xem tất cả lịch sử ({items.length}) <ChevronDown className="size-4 group-hover:translate-y-0.5 transition-transform" /></>
            )}
          </button>
        </div>
      )}
    </motion.section>
  );
}
