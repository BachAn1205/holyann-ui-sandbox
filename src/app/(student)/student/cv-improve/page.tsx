"use client";

import React, { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { StudentPageContainer } from "@/components/student";
import { useAuthSession } from "@/hooks/useAuthSession";
import { CvAnalysisHero } from "@/components/student/cv-improve/CvAnalysisHero";
import { CvAnalysisFormSection } from "@/components/student/cv-improve/CvAnalysisFormSection";
import { CvEnhanceSection } from "@/components/student/cv-improve/CvEnhanceSection";
import { CvAnalysisHistorySection } from "@/components/student/cv-improve/CvAnalysisHistorySection";
import type { CvManageRow } from "@/types/cv-manage";
import { parseFeature4RunOutput } from "@/lib/essay-feature4";
import { parseCvEnhanceStoredOutput } from "@/lib/cv-feature7";

function CvImprovePageSkeleton() {
  const block = "animate-pulse rounded-xl bg-muted/60";
  const sep = "h-1 rounded-full bg-gradient-to-r from-orange-500/30 via-primary/20 to-cyan-500/30";
  return (
    <StudentPageContainer noPadding className="min-w-[320px]">
      <span className="sr-only">Đang tải trang cải thiện CV…</span>
      <section
        aria-hidden
        className="relative mb-8 overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--primary) 0%, var(--brand-deep) 50%, var(--brand-cyan) 100%)",
        }}
      >
        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-xl bg-white/15" />
              <div className="min-w-0 flex-1 space-y-3">
                <div className="h-5 w-40 animate-pulse rounded-md bg-white/20" />
                <div className="h-8 w-full max-w-md animate-pulse rounded-md bg-white/20 sm:h-9" />
                <div className="h-4 w-full max-w-xl animate-pulse rounded-md bg-white/15" />
              </div>
            </div>
            <div className="h-10 w-44 shrink-0 animate-pulse rounded-xl bg-white/15" />
          </div>
        </div>
      </section>

      <div
        className="mx-auto min-w-[320px] w-full space-y-8 px-4 pb-8 pt-6 sm:space-y-12 sm:px-6 sm:pb-10 sm:pt-8 lg:px-8"
        aria-busy="true"
        aria-label="Đang tải nội dung"
      >
        <div className="space-y-5">
          <div className={`h-8 w-48 max-w-[85%] rounded-lg ${block} bg-muted/50`} />
          <div className={`h-4 w-full max-w-2xl rounded ${block} bg-muted/35`} />
          <div className="rounded-2xl border-2 border-orange-500/20 bg-gradient-to-b from-orange-500/5 to-transparent p-4 shadow-lg sm:p-6">
            <div className="space-y-4">
              <div className={`h-11 w-full max-w-md rounded-lg ${block}`} />
              <div className={`h-10 w-36 rounded-xl ${block}`} />
            </div>
          </div>
        </div>
        <div className={sep} role="separator" aria-hidden />
        <div className="space-y-5">
          <div className={`h-8 w-44 max-w-[80%] rounded-lg ${block} bg-muted/50`} />
          <div className={`h-24 w-full rounded-xl ${block} bg-muted/45`} />
        </div>
        <div className={sep} role="separator" aria-hidden />
        <div className="space-y-4">
          <div className={`inline-flex h-9 w-40 max-w-full rounded-full ${block} bg-violet-500/15`} />
        </div>
      </div>
    </StudentPageContainer>
  );
}

function CvImprovePageContent() {
  const searchParams = useSearchParams();
  const {
    session,
    isLoading: sessionLoading,
    isAuthenticated,
  } = useAuthSession();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
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
  const [latestEnhanceCreatedAt, setLatestEnhanceCreatedAt] = useState<string | null>(null);
  /** Kết quả phân tích / cải thiện gần nhất — đang fetch từ API (tránh nhấp nháy trống lúc vào trang). */
  const [latestRunsLoading, setLatestRunsLoading] = useState(false);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [cvList, setCvList] = useState<CvManageRow[]>([]);

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

  const fetchLatest = useCallback(async (sid: string, cvId: string | null) => {
    if (!cvId) {
      setLatestAnalysisOutput(null);
      setLatestEnhanceOutput(null);
      setLatestEnhanceCreatedAt(null);
      setLatestRunsLoading(false);
      return;
    }
    setLatestRunsLoading(true);
    try {
      const latestRes = await fetch(
        `/api/students/${sid}/cv-improve/latest?cv_document_id=${encodeURIComponent(cvId)}`,
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
          const parsedEnh = parseCvEnhanceStoredOutput(enh.output_data);
          setLatestEnhanceOutput(parsedEnh ?? enh.output_data ?? null);
        } else {
          setLatestEnhanceCreatedAt(null);
          setLatestEnhanceOutput(null);
        }
      }
    } finally {
      setLatestRunsLoading(false);
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

        const cvRes = await fetch(`/api/students/${actualId}/manage-upload/cv-documents`);
        if (cvRes.ok) {
          const data = await cvRes.json();
          const list = (data.documents ?? []) as CvManageRow[];
          setCvList(list);
          const fromUrl = searchParams.get("cv_document_id");
          const pick =
            fromUrl && list.some((x) => x.id === fromUrl)
              ? fromUrl
              : list[0]?.id ?? null;
          setSelectedCvId((prev) => prev ?? pick);
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
    if (!selectedCvId) {
      setLatestAnalysisOutput(null);
      setLatestEnhanceOutput(null);
      setLatestEnhanceCreatedAt(null);
      setLatestRunsLoading(false);
      return;
    }
    setLatestAnalysisOutput(null);
    setLatestEnhanceOutput(null);
    setLatestEnhanceCreatedAt(null);
  }, [selectedCvId]);

  useEffect(() => {
    if (!studentId) return;
    if (!selectedCvId) {
      setLatestRunsLoading(false);
      return;
    }
    void fetchLatest(studentId, selectedCvId);
  }, [studentId, selectedCvId, fetchLatest]);

  useEffect(() => {
    if (!studentId || !selectedCvId) return;
    let cancelled = false;
    (async () => {
      const limitsRes = await fetch(
        `/api/students/${studentId}/cv-improve/limits?cv_document_id=${encodeURIComponent(selectedCvId)}`,
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
  }, [studentId, selectedCvId]);

  const refreshAll = useCallback(async () => {
    if (!studentId) return;
    const [cvRes, limRes] = await Promise.all([
      fetch(`/api/students/${studentId}/manage-upload/cv-documents`),
      selectedCvId
        ? fetch(
            `/api/students/${studentId}/cv-improve/limits?cv_document_id=${encodeURIComponent(selectedCvId)}`,
          )
        : Promise.resolve(null as Response | null),
    ]);
    if (cvRes.ok) {
      const data = await cvRes.json();
      setCvList((data.documents ?? []) as CvManageRow[]);
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
    await fetchLatest(studentId, selectedCvId);
    setHistoryRefreshKey((k) => k + 1);
  }, [studentId, selectedCvId, fetchLatest]);

  const handleSelectCv = useCallback((id: string | null) => {
    setSelectedCvId(id);
  }, []);

  if (loading || sessionLoading) {
    return <CvImprovePageSkeleton />;
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
      <CvAnalysisHero />
      <div className="mx-auto min-w-[320px] w-full px-4 pb-8 pt-6 sm:px-6 sm:pb-10 sm:pt-8 lg:px-8">
        <div className="space-y-8 sm:space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <CvAnalysisFormSection
              studentId={studentId}
              cvList={cvList}
              selectedCvId={selectedCvId}
              onSelectCv={handleSelectCv}
              latestAnalysisOutput={latestAnalysisOutput}
              latestRunsLoading={latestRunsLoading}
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
            <CvEnhanceSection
              studentId={studentId}
              cvList={cvList}
              cvId={selectedCvId}
              hasAnalysis={latestAnalysisOutput != null}
              latestEnhanceOutput={latestEnhanceOutput}
              enhanceCreatedAt={latestEnhanceCreatedAt}
              latestRunsLoading={latestRunsLoading}
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
            <CvAnalysisHistorySection
              studentId={studentId}
              cvId={selectedCvId}
              refreshKey={historyRefreshKey}
            />
          </motion.div>
        </div>
      </div>
    </StudentPageContainer>
  );
}

export default function CvImprovePage() {
  return (
    <Suspense fallback={<CvImprovePageSkeleton />}>
      <CvImprovePageContent />
    </Suspense>
  );
}
