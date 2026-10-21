"use client";

import React, { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { StudentPageContainer } from "@/components/student";
import { useAuthSession } from "@/hooks/useAuthSession";
import { EssayAnalysisHero } from "@/components/student/essay-improve/EssayAnalysisHero";
import { EssayAnalysisFormSection } from "@/components/student/essay-improve/EssayAnalysisFormSection";
import { EssayEnhanceSection } from "@/components/student/essay-improve/EssayEnhanceSection";
import { EssayAnalysisHistorySection } from "@/components/student/essay-improve/EssayAnalysisHistorySection";
import type { EssayManageRow } from "@/types/essay-manage";
import { parseFeature4RunOutput } from "@/lib/essay-feature4";

/** Skeleton khi đang tải session + danh sách luận — bố cục gần hero + 3 khối (phân tích / cải thiện / lịch sử) */
function EssayImprovePageSkeleton() {
  const heroBar = "animate-pulse rounded-md bg-white/20";
  const block = "animate-pulse rounded-xl bg-muted/60";
  const sep = "h-1 rounded-full bg-gradient-to-r from-sky-500/30 via-primary/20 to-emerald-500/30";
  return (
    <StudentPageContainer noPadding className="min-w-[320px]">
      <span className="sr-only">Đang tải trang cải thiện luận…</span>
      <section
        aria-hidden
        className="relative mb-8 overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--primary) 0%, var(--brand-deep) 50%, var(--brand-cyan) 100%)",
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 right-1/4 h-40 w-80 rounded-full bg-[var(--brand-cyan)]/20 blur-2xl" />
        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-white/15" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className={`h-5 w-36 ${heroBar}`} />
                <div className={`h-8 w-full max-w-md sm:h-9 ${heroBar}`} />
                <div className={`h-4 w-full max-w-xl ${heroBar} opacity-90`} />
                <div className={`h-4 w-[88%] max-w-lg ${heroBar} opacity-75`} />
              </div>
            </div>
            <div className={`h-10 w-44 shrink-0 rounded-xl ${heroBar}`} />
          </div>
        </div>
      </section>

      <div
        className="mx-auto min-w-[320px] w-full space-y-8 px-4 pb-8 pt-6 sm:space-y-12 sm:px-6 sm:pb-10 sm:pt-8 lg:px-8"
        aria-busy="true"
        aria-label="Đang tải nội dung"
      >
        {/* Khối phân tích */}
        <div className="space-y-5">
          <div className={`h-8 w-56 max-w-[85%] rounded-lg ${block} bg-muted/50`} />
          <div className={`h-4 w-full max-w-2xl rounded ${block} bg-muted/35`} />
          <div className="rounded-2xl border-2 border-sky-500/20 bg-gradient-to-b from-sky-500/5 to-transparent p-4 shadow-lg sm:p-6">
            <div className="space-y-4">
              <div className={`h-4 w-28 rounded ${block}`} />
              <div className={`h-11 w-full max-w-md rounded-lg ${block}`} />
              <div className="flex flex-wrap gap-3">
                <div className={`h-10 w-36 rounded-xl ${block}`} />
                <div className={`h-10 w-32 rounded-xl ${block}`} />
              </div>
              <div className={`h-28 w-full rounded-xl ${block} bg-muted/45`} />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className={`h-20 rounded-xl ${block}`} />
                <div className={`h-20 rounded-xl ${block}`} />
              </div>
            </div>
          </div>
        </div>

        <div className={sep} role="separator" aria-hidden />

        {/* Khối cải thiện */}
        <div className="space-y-5">
          <div className={`h-8 w-52 max-w-[80%] rounded-lg ${block} bg-muted/50`} />
          <div className={`h-4 w-full max-w-xl rounded ${block} bg-muted/35`} />
          <div className="flex flex-wrap gap-3">
            <div className={`h-11 w-44 rounded-xl ${block}`} />
            <div className={`h-6 w-24 rounded-full ${block} bg-muted/40`} />
          </div>
          <div className="rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-4 shadow-lg sm:p-6">
            <div className="space-y-3">
              <div className={`h-4 w-40 rounded ${block}`} />
              <div className={`h-32 w-full rounded-xl ${block} bg-muted/45`} />
              <div className={`h-3 w-48 rounded ${block} bg-muted/35`} />
            </div>
          </div>
        </div>

        <div className={sep} role="separator" aria-hidden />

        {/* Lịch sử */}
        <div className="space-y-4">
          <div className={`inline-flex h-9 w-56 max-w-full rounded-full ${block} bg-violet-500/15`} />
          <div className="rounded-2xl border-2 border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-transparent p-4 shadow-lg sm:p-6">
            <ul className="space-y-3">
              {[1, 2, 3].map((i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className={`h-6 w-20 rounded-md ${block}`} />
                    <div className={`h-4 w-36 rounded ${block}`} />
                  </div>
                  <div className="flex gap-2">
                    <div className={`h-6 w-16 rounded-md ${block}`} />
                    <div className={`h-6 w-24 rounded-md ${block}`} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </StudentPageContainer>
  );
}

function EssayImprovePageContent() {
  const searchParams = useSearchParams();
  const {
    session,
    isLoading: sessionLoading,
    isAuthenticated,
  } = useAuthSession();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEssayId, setSelectedEssayId] = useState<string | null>(null);
  const [limits, setLimits] = useState<{
    analysisLimit: number | null;
    analysisUsed: number;
    analysisRemaining: number | null;
    enhanceLimit: number | null;
    enhanceUsed: number;
    enhanceRemaining: number | null;
  } | null>(null);
  const [latestAnalysisOutput, setLatestAnalysisOutput] = useState<unknown | null>(null);
  const [latestEnhanceOutput, setLatestEnhanceOutput] = useState<unknown | null>(null);
  /** Đang fetch `/essay-improve/latest` — độc lập với lịch sử; hiển thị skeleton kết quả */
  const [latestRunLoading, setLatestRunLoading] = useState(false);
  /** ISO string — lần cải thiện gần nhất (hiển thị kèm block chi tiết) */
  const [latestEnhanceCreatedAt, setLatestEnhanceCreatedAt] = useState<string | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [essayList, setEssayList] = useState<EssayManageRow[]>([]);

  const resolvedStudentId = useMemo(() => {
    const uid =
      (session?.user as { id?: string })?.id ??
      (session?.user as { user_id?: string })?.user_id ??
      (session?.user as { sub?: string })?.sub;
    if (uid) return uid;
    const email = session?.user?.email;
    if (email && !uid) return `email:${email}`;
    return null;
  }, [session?.user]);

  const fetchLatest = useCallback(async (sid: string, eid: string | null) => {
    if (!eid) {
      setLatestAnalysisOutput(null);
      setLatestEnhanceOutput(null);
      setLatestEnhanceCreatedAt(null);
      setLatestRunLoading(false);
      return;
    }
    setLatestRunLoading(true);
    setLatestAnalysisOutput(null);
    setLatestEnhanceOutput(null);
    setLatestEnhanceCreatedAt(null);
    try {
      const latestRes = await fetch(
        `/api/students/${sid}/essay-improve/latest?essay_id=${encodeURIComponent(eid)}`,
        { cache: "no-store" },
      );
      if (latestRes.ok) {
        const lat = await latestRes.json();
        setLatestAnalysisOutput(parseFeature4RunOutput(lat.analysis?.output_data));
        const enh = lat.enhance as
          | { output_data?: unknown; created_at?: string | Date }
          | null
          | undefined;
        if (enh) {
          const at = enh.created_at;
          setLatestEnhanceCreatedAt(
            typeof at === "string"
              ? at
              : at instanceof Date
                ? at.toISOString()
                : at
                  ? String(at)
                  : null,
          );
          setLatestEnhanceOutput(parseFeature4RunOutput(enh.output_data));
        } else {
          setLatestEnhanceCreatedAt(null);
          setLatestEnhanceOutput(null);
        }
      }
    } finally {
      setLatestRunLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading || !resolvedStudentId) return;
    if (!isAuthenticated && !resolvedStudentId) {
      setError("Vui lòng đăng nhập.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        let actualId = resolvedStudentId;
        if (resolvedStudentId.startsWith("email:")) {
          const email = resolvedStudentId.slice(6);
          const u = await fetch(`/api/users/by-email?email=${encodeURIComponent(email)}`);
          if (!u.ok) {
            if (!cancelled) setError("Không tìm thấy người dùng với email này");
            return;
          }
          const d = await u.json();
          actualId = d.id;
        }
        if (cancelled) return;
        setStudentId(actualId);

        const essaysRes = await fetch(`/api/students/${actualId}/manage-upload/essays`);

        if (essaysRes.ok) {
          const data = await essaysRes.json();
          const list = (data.essays ?? []) as EssayManageRow[];
          setEssayList(list);
          const fromUrl = searchParams.get("essay_id");
          const pick =
            fromUrl && list.some((x) => x.id === fromUrl)
              ? fromUrl
              : list[0]?.id ?? null;
          setSelectedEssayId((prev) => prev ?? pick);
        }

        setError(null);
      } catch {
        if (!cancelled) setError("Không thể tải dữ liệu");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resolvedStudentId, sessionLoading, isAuthenticated, searchParams]);

  useEffect(() => {
    if (!studentId || !selectedEssayId) return;
    void fetchLatest(studentId, selectedEssayId);
  }, [studentId, selectedEssayId, fetchLatest]);

  useEffect(() => {
    if (!studentId || !selectedEssayId) return;
    let cancelled = false;
    (async () => {
      const limitsRes = await fetch(
        `/api/students/${studentId}/essay-improve/limits?essay_id=${encodeURIComponent(selectedEssayId)}`,
      );
      if (!limitsRes.ok || cancelled) return;
      const lim = await limitsRes.json();
      setLimits({
        analysisLimit: lim.analysisLimit,
        analysisUsed: lim.analysisUsed ?? 0,
        analysisRemaining: lim.analysisRemaining ?? null,
        enhanceLimit: lim.enhanceLimit,
        enhanceUsed: lim.enhanceUsed ?? 0,
        enhanceRemaining: lim.enhanceRemaining ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, selectedEssayId]);

  const refreshAll = useCallback(async () => {
    if (!studentId) return;
    const [essaysRes, limRes] = await Promise.all([
      fetch(`/api/students/${studentId}/manage-upload/essays`),
      selectedEssayId
        ? fetch(
            `/api/students/${studentId}/essay-improve/limits?essay_id=${encodeURIComponent(selectedEssayId)}`,
          )
        : Promise.resolve(null as Response | null),
    ]);
    if (essaysRes.ok) {
      const data = await essaysRes.json();
      setEssayList((data.essays ?? []) as EssayManageRow[]);
    }
    if (limRes && limRes.ok) {
      const lim = await limRes.json();
      setLimits({
        analysisLimit: lim.analysisLimit,
        analysisUsed: lim.analysisUsed ?? 0,
        analysisRemaining: lim.analysisRemaining ?? null,
        enhanceLimit: lim.enhanceLimit,
        enhanceUsed: lim.enhanceUsed ?? 0,
        enhanceRemaining: lim.enhanceRemaining ?? null,
      });
    }
    await fetchLatest(studentId, selectedEssayId);
    setHistoryRefreshKey((k) => k + 1);
  }, [studentId, selectedEssayId, fetchLatest]);

  const handleSelectEssay = useCallback((id: string | null) => {
    setSelectedEssayId(id);
  }, []);

  if (loading || sessionLoading) {
    return <EssayImprovePageSkeleton />;
  }

  if (error || !studentId) {
    return (
      <StudentPageContainer>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
          <div className="w-full max-w-md rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
            <p className="font-semibold text-destructive">{error || "Không tìm thấy tài khoản"}</p>
            <Link
              href="/student"
              className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
            >
              Quay lại Dashboard
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </StudentPageContainer>
    );
  }

  return (
    <StudentPageContainer noPadding className="min-w-[320px]">
      <EssayAnalysisHero />
      <div className="min-w-[320px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10 pt-6 sm:pt-8">
        <div className="space-y-8 sm:space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <EssayAnalysisFormSection
              studentId={studentId}
              essays={essayList}
              selectedEssayId={selectedEssayId}
              onSelectEssay={handleSelectEssay}
              latestAnalysisOutput={latestAnalysisOutput}
              latestRunLoading={latestRunLoading}
              limits={{
                analysisLimit: limits?.analysisLimit ?? null,
                analysisUsed: limits?.analysisUsed ?? 0,
                analysisRemaining: limits?.analysisRemaining ?? null,
                enhanceRemaining: limits?.enhanceRemaining ?? null,
              }}
              onSuccess={refreshAll}
            />
          </motion.div>
          <div
            className="h-1 rounded-full bg-gradient-to-r from-sky-500/30 via-primary/20 to-emerald-500/30"
            role="separator"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            <EssayEnhanceSection
              studentId={studentId}
              essays={essayList}
              essayId={selectedEssayId}
              hasAnalysis={latestAnalysisOutput != null}
              latestEnhanceOutput={latestEnhanceOutput}
              enhanceCreatedAt={latestEnhanceCreatedAt}
              latestRunLoading={latestRunLoading}
              limits={{
                enhanceLimit: limits?.enhanceLimit ?? null,
                enhanceUsed: limits?.enhanceUsed ?? 0,
                enhanceRemaining: limits?.enhanceRemaining ?? null,
                analysisRemaining: limits?.analysisRemaining ?? null,
              }}
              onSuccess={refreshAll}
            />
          </motion.div>
          <div
            className="h-1 rounded-full bg-gradient-to-r from-sky-500/30 via-primary/20 to-emerald-500/30"
            role="separator"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <EssayAnalysisHistorySection
              studentId={studentId}
              essayId={selectedEssayId}
              refreshKey={historyRefreshKey}
            />
          </motion.div>
        </div>
      </div>
    </StudentPageContainer>
  );
}

export default function EssayImprovePage() {
  return (
    <Suspense fallback={<EssayImprovePageSkeleton />}>
      <EssayImprovePageContent />
    </Suspense>
  );
}
