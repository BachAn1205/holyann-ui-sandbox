"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { StudentPageContainer } from "@/components/student";
import { useAuthSession } from "@/hooks/useAuthSession";
import { ProfileAnalysisHero } from "@/components/student/profile/ProfileAnalysisHero";
import { AnalysisFormSection } from "@/components/student/profile-analysis/AnalysisFormSection";
import { EnhanceSection } from "@/components/student/profile-analysis/EnhanceSection";
import { ProfileAnalysisHistorySection } from "@/components/student/profile-analysis/ProfileAnalysisHistorySection";
import type { Feature1AnalysisOutput } from "@/lib/schemas/profile-analysis-v2.schema";
import type { Feature1EnhanceOutput } from "@/lib/schemas/profile-analysis-v2.schema";
import { normalizeFeature1FullResult } from "@/lib/profile-analysis-normalize";

export default function ProfileAnalysisPage() {
  const {
    session,
    isLoading: sessionLoading,
    isAuthenticated,
  } = useAuthSession();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limits, setLimits] = useState<{
    analysisLimit: number | null;
    analysisUsed: number;
    analysisRemaining: number | null;
    enhanceLimit: number | null;
    enhanceUsed: number;
    enhanceRemaining: number | null;
  } | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<{
    full_result: Feature1AnalysisOutput;
    input_data?: unknown;
    analysis_date?: Date;
  } | null>(null);
  const [latestEnhance, setLatestEnhance] = useState<{
    enhance_result: Feature1EnhanceOutput;
    enhance_at?: Date;
  } | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

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

  const fetchData = useCallback(async (sid: string) => {
    try {
      setLoading(true);
      let actualId = sid;
      if (sid.startsWith("email:")) {
        const email = sid.slice(6);
        const u = await fetch(
          `/api/users/by-email?email=${encodeURIComponent(email)}`,
        );
        if (u.ok) {
          const d = await u.json();
          actualId = d.id;
        } else {
          setError("Không tìm thấy người dùng với email này");
          return;
        }
      }
      setStudentId(actualId);

      const [limitsRes, latestRes] = await Promise.all([
        fetch(`/api/students/${actualId}/profile-analysis/limits`),
        fetch(`/api/students/${actualId}/profile-analysis/latest`),
      ]);
      if (limitsRes.ok) {
        const lim = await limitsRes.json();
        setLimits({
          analysisLimit: lim.analysisLimit,
          analysisUsed: lim.analysisUsed ?? 0,
          analysisRemaining: lim.analysisRemaining ?? null,
          enhanceLimit: lim.enhanceLimit,
          enhanceUsed: lim.enhanceUsed ?? 0,
          enhanceRemaining: lim.enhanceRemaining ?? null,
        });
      }
      if (latestRes.ok) {
        const lat = await latestRes.json();
        const fr = lat.analysis?.full_result;
        const normalized =
          normalizeFeature1FullResult(fr) ??
          (fr as Feature1AnalysisOutput | undefined);
        setLatestAnalysis(
          lat.analysis
            ? {
                full_result: normalized ?? (fr as Feature1AnalysisOutput),
                input_data: lat.analysis.input_data,
                analysis_date: lat.analysis.analysis_date,
              }
            : null,
        );
        setLatestEnhance(
          lat.enhance
            ? {
                enhance_result: lat.enhance.enhance_result,
                enhance_at: lat.enhance.enhance_at,
              }
            : null,
        );
      }
      setError(null);
    } catch {
      setError("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionLoading || !resolvedStudentId) return;
    if (!isAuthenticated && !resolvedStudentId) {
      setError("Vui lòng đăng nhập để sử dụng đánh giá hồ sơ.");
      setLoading(false);
      return;
    }
    fetchData(resolvedStudentId);
  }, [resolvedStudentId, sessionLoading, isAuthenticated, fetchData]);

  const refreshLatest = useCallback(() => {
    if (studentId) {
      fetch(`/api/students/${studentId}/profile-analysis/latest`)
        .then((r) => r.json())
        .then((lat) => {
          const fr = lat.analysis?.full_result;
          const normalized =
            normalizeFeature1FullResult(fr) ??
            (fr as Feature1AnalysisOutput | undefined);
          setLatestAnalysis(
            lat.analysis
              ? {
                  full_result: normalized ?? (fr as Feature1AnalysisOutput),
                  input_data: lat.analysis.input_data,
                  analysis_date: lat.analysis.analysis_date,
                }
              : null,
          );
          setLatestEnhance(
            lat.enhance
              ? {
                  enhance_result: lat.enhance.enhance_result,
                  enhance_at: lat.enhance.enhance_at,
                }
              : null,
          );
        });
      fetch(`/api/students/${studentId}/profile-analysis/limits`)
        .then((r) => r.json())
        .then((lim) => {
          setLimits({
            analysisLimit: lim.analysisLimit,
            analysisUsed: lim.analysisUsed ?? 0,
            analysisRemaining: lim.analysisRemaining ?? null,
            enhanceLimit: lim.enhanceLimit,
            enhanceUsed: lim.enhanceUsed ?? 0,
            enhanceRemaining: lim.enhanceRemaining ?? null,
          });
        });
      setHistoryRefreshKey((k) => k + 1);
    }
  }, [studentId]);

  if (loading || sessionLoading) {
    return (
      <StudentPageContainer noPadding className="min-w-[320px]">
        <ProfileAnalysisHero />
        <div className="min-w-[320px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10 pt-6 sm:pt-8">
          <div className="space-y-8 sm:space-y-12 animate-in fade-in duration-300">
            <div className="rounded-2xl border-2 border-primary/20 bg-linear-to-b from-primary/5 to-transparent p-6 sm:p-8 shadow-lg space-y-4">
              <div className="h-6 w-32 rounded-full bg-muted/60 animate-pulse" />
              <div className="h-7 w-48 rounded bg-muted/50 animate-pulse" />
              <div className="space-y-3 pt-2">
                <div className="h-4 w-full rounded bg-muted/40 animate-pulse" />
                <div className="h-4 w-4/5 rounded bg-muted/40 animate-pulse" />
                <div className="h-24 rounded-xl bg-muted/30 animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground pt-2">
                {sessionLoading ? "Đang xác thực..." : "Đang tải..."}
              </p>
            </div>
            <div
              className="h-1 rounded-full bg-linear-to-r from-primary/30 via-secondary/20 to-primary/30"
              aria-hidden
            />
            <div className="rounded-2xl border-2 border-secondary/20 bg-linear-to-b from-secondary/5 to-transparent p-6 sm:p-8 shadow-lg space-y-4">
              <div className="h-6 w-36 rounded-full bg-muted/60 animate-pulse" />
              <div className="h-7 w-52 rounded bg-muted/50 animate-pulse" />
              <div className="space-y-3 pt-2">
                <div className="h-4 w-full rounded bg-muted/40 animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-muted/40 animate-pulse" />
                <div className="h-24 rounded-xl bg-muted/30 animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground pt-2">
                {sessionLoading ? "Đang xác thực..." : "Đang tải..."}
              </p>
            </div>
          </div>
        </div>
      </StudentPageContainer>
    );
  }

  if (error || !studentId) {
    return (
      <StudentPageContainer>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
          <div className="w-full max-w-md rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center">
            <p className="font-semibold text-destructive">
              {error || "Không tìm thấy hồ sơ"}
            </p>
            <Link
              href="/student/profile"
              className="mt-4 inline-flex items-center gap-2 text-primary hover:underline"
            >
              Quay lại Hồ sơ cá nhân
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </StudentPageContainer>
    );
  }

  return (
    <StudentPageContainer noPadding className="min-w-[320px]">
      <ProfileAnalysisHero />
      <div className="min-w-[320px] w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10 pt-6 sm:pt-8">
        <div className="space-y-8 sm:space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AnalysisFormSection
              studentId={studentId}
              latestAnalysis={latestAnalysis}
              limits={{
                analysisLimit: limits?.analysisLimit ?? null,
                analysisUsed: limits?.analysisUsed ?? 0,
                analysisRemaining: limits?.analysisRemaining ?? null,
                enhanceRemaining: limits?.enhanceRemaining ?? null,
              }}
              onSuccess={refreshLatest}
            />
          </motion.div>
          <div
            className="h-1 rounded-full bg-linear-to-r from-primary/30 via-secondary/20 to-primary/30"
            role="separator"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <EnhanceSection
              studentId={studentId}
              latestAnalysis={latestAnalysis}
              latestEnhance={latestEnhance}
              limits={{
                enhanceLimit: limits?.enhanceLimit ?? null,
                enhanceUsed: limits?.enhanceUsed ?? 0,
                enhanceRemaining: limits?.enhanceRemaining ?? null,
                analysisRemaining: limits?.analysisRemaining ?? null,
              }}
              onSuccess={refreshLatest}
            />
          </motion.div>
          <div
            className="h-1 rounded-full bg-linear-to-r from-primary/30 via-secondary/20 to-primary/30"
            role="separator"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <ProfileAnalysisHistorySection
              studentId={studentId}
              refreshKey={historyRefreshKey}
            />
          </motion.div>
        </div>
      </div>
    </StudentPageContainer>
  );
}
