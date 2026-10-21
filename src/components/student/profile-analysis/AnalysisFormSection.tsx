"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Loader2, FileText } from "lucide-react";
import type {
  Feature1AnalysisInput,
  Feature1AnalysisOutput,
} from "@/lib/schemas/profile-analysis-v2.schema";
import type { ProfileAnalysisPayloadBundle } from "@/lib/build-profile-payload";
import { ProfileAnalysisResultCharts } from "@/components/student/profile-analysis/ProfileAnalysisResultCharts";
import { ProfileAnalysisLockedOverlay } from "@/components/student/profile-analysis/ProfileAnalysisUpgradePrompt";
import { normalizeFeature1FullResult } from "@/lib/profile-analysis-normalize";
import { useSubscription } from "@/hooks/useSubscription";
import { FlappyWaitModal } from "@/components/shared/FlappyWaitModal";

interface AnalysisFormSectionProps {
  studentId: string;
  latestAnalysis: { full_result: Feature1AnalysisOutput } | null;
  limits: {
    analysisLimit: number | null;
    analysisUsed: number;
    analysisRemaining: number | null;
    enhanceRemaining: number | null;
  };
  onSuccess: () => void;
}

/** Skeleton khối tóm tắt hồ sơ — bố cục gần các card GPA / môn / ngoại ngữ */
function AnalysisFormProfileSummarySkeleton() {
  return (
    <div
      className="space-y-4 text-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">
        Đang tải thông tin hồ sơ dùng để phân tích
      </span>
      {/* GPA block */}
      <div className="rounded-lg border-l-4 border-l-muted bg-muted/25 dark:bg-muted/15 p-3 space-y-2">
        <div className="h-3.5 w-28 rounded-md bg-muted/70 dark:bg-muted/50 animate-pulse" />
        <div className="h-7 w-16 rounded-md bg-muted/55 dark:bg-muted/40 animate-pulse" />
      </div>
      {/* Subjects list */}
      <div className="rounded-lg border-l-4 border-l-muted bg-muted/25 dark:bg-muted/15 p-3 space-y-2">
        <div className="h-3.5 w-24 rounded-md bg-muted/70 dark:bg-muted/50 animate-pulse" />
        <div className="h-3 w-full max-w-md rounded bg-muted/45 dark:bg-muted/35 animate-pulse" />
        <div className="h-3 w-full max-w-lg rounded bg-muted/45 dark:bg-muted/35 animate-pulse" />
        <div className="h-3 w-[88%] max-w-md rounded bg-muted/40 dark:bg-muted/30 animate-pulse" />
      </div>
      {/* Languages + extras */}
      <div className="rounded-lg border-l-4 border-l-muted bg-muted/25 dark:bg-muted/15 p-3 space-y-2">
        <div className="h-3.5 w-32 rounded-md bg-muted/70 dark:bg-muted/50 animate-pulse" />
        <div className="h-3 w-full max-w-sm rounded bg-muted/45 dark:bg-muted/35 animate-pulse" />
        <div className="h-3 w-4/5 max-w-md rounded bg-muted/40 dark:bg-muted/30 animate-pulse" />
      </div>
    </div>
  );
}

function subjectGroupLabelVi(g: string): string {
  if (g === "natural") return "Tự nhiên";
  if (g === "language") return "Ngôn ngữ";
  if (g === "social") return "Xã hội";
  return g;
}

function projectGroupLabelVi(g: string): string {
  const m: Record<string, string> = {
    science_tech: "Khoa học – Công nghệ",
    research: "Nghiên cứu",
    social: "Xã hội",
    art: "Nghệ thuật",
    business: "Kinh doanh",
    general: "Chung",
  };
  return m[g] ?? g;
}

function spikeTypeLabelVi(type: string, typeVi?: string): string {
  if (typeVi && typeVi.trim()) return typeVi.trim();
  const map: Record<string, string> = {
    academic_excellence: "Học thuật nổi bật",
    research: "Nghiên cứu",
    olympiad___competition: "Olympic / Cuộc thi học thuật",
    leadership: "Lãnh đạo",
    social_impact___community_service: "Tác động xã hội / Cộng đồng",
    entrepreneurship: "Khởi nghiệp",
    artistic: "Nghệ thuật",
    athletic: "Thể thao",
    media___content: "Truyền thông / Nội dung",
    tech: "Công nghệ",
    financial_hardship___resilience: "Nghị lực vượt khó",
    personal_story___identity: "Câu chuyện cá nhân",
  };
  return map[type] ?? type.replace(/_/g, " ");
}

function spikeTierLabelVi(tier: string, tierVi?: string): string {
  if (tierVi && tierVi.trim()) return tierVi.trim();
  const map: Record<string, string> = {
    T1: "Rất nổi bật",
    T2: "Nổi bật",
    T3: "Trung bình",
    T4: "Cần cải thiện",
  };
  return map[tier] ?? "Chưa phân loại";
}

function splitEvidence(evidence?: string): string[] {
  if (!evidence) return [];
  return evidence
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Có ít nhất một dữ liệu thực sự để hiển thị / chạy phân tích có nghĩa */
function profilePayloadHasMeaningfulData(p: Feature1AnalysisInput): boolean {
  if (p.gpa != null && p.gpa.value_10 > 0) return true;
  if ((p.subjects?.length ?? 0) > 0) return true;
  if (
    (p.languages?.length ?? 0) > 0 &&
    p.languages!.some(
      (l) =>
        (l.language_name || "").trim().length > 0 ||
        l.value > 0 ||
        ((l.score_name || "").trim() && l.score_name !== "—"),
    )
  )
    return true;
  if ((p.standardized_tests?.length ?? 0) > 0) return true;
  if ((p.academic_awards?.length ?? 0) > 0) return true;
  if ((p.other_awards?.length ?? 0) > 0) return true;
  if ((p.academic_extracurricular?.length ?? 0) > 0) return true;
  if ((p.experiments?.length ?? 0) > 0) return true;
  if ((p.projects?.length ?? 0) > 0) return true;
  if ((p.hard_skills?.length ?? 0) > 0) return true;
  if ((p.soft_skills?.length ?? 0) > 0) return true;
  return false;
}

export function AnalysisFormSection({
  studentId,
  latestAnalysis,
  limits,
  onSuccess,
}: AnalysisFormSectionProps) {
  const { isFree } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [waitOpen, setWaitOpen] = useState(false);
  const [profileBundle, setProfileBundle] =
    useState<ProfileAnalysisPayloadBundle | null>(null);
  const [payloadLoading, setPayloadLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setPayloadLoading(true);
    fetch(`/api/students/${studentId}/profile-analysis/payload`)
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (data: ProfileAnalysisPayloadBundle | Feature1AnalysisInput | null) => {
          if (cancelled || data == null) {
            if (!cancelled) setProfileBundle(null);
            return;
          }
          if (
            typeof data === "object" &&
            data !== null &&
            "payload" in data &&
            typeof (data as ProfileAnalysisPayloadBundle).profileListsGated ===
              "boolean"
          ) {
            if (!cancelled)
              setProfileBundle(data as ProfileAnalysisPayloadBundle);
          } else {
            if (!cancelled)
              setProfileBundle({
                payload: data as Feature1AnalysisInput,
                profileListsGated: false,
              });
          }
        },
      )
      .catch(() => {
        if (!cancelled) setProfileBundle(null);
      })
      .finally(() => {
        if (!cancelled) setPayloadLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const runAnalyze = useCallback(async () => {
    setConfirmOpen(false);
    setLoading(true);
    setWaitOpen(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/students/${studentId}/profile-analysis/analyze`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Phân tích thất bại");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setLoading(false);
      setWaitOpen(false);
    }
  }, [studentId, onSuccess]);

  const handleAnalyzeClick = () => {
    if (
      limits.analysisLimit !== null &&
      limits.analysisUsed >= limits.analysisLimit
    ) {
      setError("Bạn đã dùng hết số lần đánh giá. Vui lòng nâng cấp gói.");
      return;
    }
    setConfirmOpen(true);
  };

  const remaining =
    limits.analysisLimit == null
      ? "không giới hạn"
      : Math.max(0, limits.analysisLimit - limits.analysisUsed);

  const payload = profileBundle?.payload ?? null;
  const hasPayload = Boolean(
    payload && profilePayloadHasMeaningfulData(payload),
  );

  const computingMessage =
    "Vui lòng đợi chút, hệ thống đang tính toán cho bạn.";

  /** Luôn chuẩn hóa trước khi vẽ (đủ areas A/B/C cho biểu đồ cột). */
  const analysisView = useMemo(() => {
    if (!latestAnalysis?.full_result) return null;
    return (
      normalizeFeature1FullResult(latestAnalysis.full_result) ??
      (latestAnalysis.full_result as Feature1AnalysisOutput)
    );
  }, [latestAnalysis?.full_result]);

  return (
    <section className="space-y-5">
      <h2 className="font-heading text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
        Đánh giá profile
      </h2>
      <p className="text-muted-foreground text-sm">
        Dữ liệu phân tích được lấy từ hồ sơ đã lưu. Hãy{" "}
        <Link
          href="/student/profile"
          className="text-sky-600 dark:text-sky-400 font-medium underline hover:no-underline"
        >
          cập nhật hồ sơ
        </Link>{" "}
        nếu cần chỉnh sửa. Trước khi phân tích, xác nhận bạn đã chắc chắn với hồ
        sơ hiện tại.
      </p>

      {/* Thông tin hồ sơ (profile summary) */}
      <div className="rounded-2xl border-2 border-teal-500/30 bg-gradient-to-br from-teal-500/10 via-card to-emerald-500/5 p-4 sm:p-6 shadow-md border-l-4 border-l-teal-500">
        <h3 className="text-sm font-semibold text-teal-800 dark:text-teal-200 flex items-center gap-2 mb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20">
            <FileText className="size-4 text-teal-600 dark:text-teal-400" />
          </span>
          Thông tin hồ sơ sẽ dùng để phân tích
        </h3>
        {payloadLoading ? (
          <AnalysisFormProfileSummarySkeleton />
        ) : !payload || !hasPayload ? (
          <p className="text-sm text-muted-foreground">
            Chưa có đủ thông tin. Vui lòng{" "}
            <Link href="/student/profile" className="text-primary underline">
              cập nhật hồ sơ
            </Link>{" "}
            (GPA, môn học, ngoại ngữ, hoạt động, kỹ năng...).
          </p>
        ) : (
          <div className="space-y-4 text-sm">
            {payload.gpa?.value_10 != null && (
              <div className="rounded-lg border-l-4 border-l-amber-500 bg-amber-500/10 dark:bg-amber-500/5 p-3">
                <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                  GPA (thang 10)
                </p>
                <p className="text-amber-900/90 dark:text-amber-100/90 text-lg font-bold">
                  {payload.gpa.value_10 > 0
                    ? payload.gpa.value_10
                    : "— (chưa nhập hoặc 0)"}
                </p>
              </div>
            )}
            {(payload.subjects?.length ?? 0) > 0 && (
              <div className="rounded-lg border-l-4 border-l-violet-500 bg-violet-500/10 dark:bg-violet-500/5 p-3">
                <p className="font-semibold text-violet-800 dark:text-violet-200 mb-1">
                  Môn học
                </p>
                <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                  {payload.subjects!.map((s, i) => (
                    <li key={i}>
                      <span className="text-foreground font-medium">
                        {s.name}
                      </span>
                      {": "}
                      <span className="tabular-nums font-semibold">
                        {s.score_10}
                      </span>
                      {" — "}
                      <span className="text-muted-foreground">
                        {subjectGroupLabelVi(s.group)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(payload.languages?.length ?? 0) > 0 && (
              <div className="rounded-lg border-l-4 border-l-sky-500 bg-sky-500/10 dark:bg-sky-500/5 p-3">
                <p className="font-semibold text-sky-800 dark:text-sky-200 mb-1">
                  Ngoại ngữ
                </p>
                <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                  {payload.languages!.map((l, i) => (
                    <li key={i}>
                      <span className="text-foreground font-medium">
                        {(l.language_name || "").trim() || "Chứng chỉ"}
                      </span>
                      {l.score_name && l.score_name !== "—" ? (
                        <>
                          {" · "}
                          <span>{l.score_name}</span>
                        </>
                      ) : null}
                      {l.value > 0 ? (
                        <>
                          {": "}
                          <span className="tabular-nums font-semibold text-foreground">
                            {l.value}
                          </span>
                        </>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(payload.standardized_tests?.length ?? 0) > 0 && (
              <div className="rounded-lg border-l-4 border-l-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/5 p-3">
                <p className="font-semibold text-indigo-800 dark:text-indigo-200 mb-1">
                  Bài chuẩn hóa
                </p>
                <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                  {payload.standardized_tests!.map((t, i) => (
                    <li key={i}>
                      {t.name}: {t.value}
                      {t.max_value ? ` / ${t.max_value}` : ""}{" "}
                      {t.group ? `(${t.group})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(payload?.academic_awards?.length ?? 0) > 0 && (
              <div className="rounded-lg border-l-4 border-l-amber-500 bg-amber-500/10 dark:bg-amber-500/5 p-3">
                <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">
                  Giải thưởng học thuật
                </p>
                <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                  {payload.academic_awards!.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            {(payload.other_awards?.length ?? 0) > 0 && (
              <div className="rounded-lg border-l-4 border-l-rose-500 bg-rose-500/10 dark:bg-rose-500/5 p-3">
                <p className="font-semibold text-rose-800 dark:text-rose-200 mb-1">
                  Giải thưởng khác
                </p>
                <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                  {payload.other_awards!.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            {(payload.academic_extracurricular?.length ?? 0) > 0 && (
              <div className="rounded-lg border-l-4 border-l-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/5 p-3">
                <p className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1">
                  Hoạt động ngoại khóa (học thuật và phi học thuật)
                </p>
                <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                  {payload.academic_extracurricular!.map((e, i) => (
                    <li key={i}>
                      <span className="text-foreground font-medium">
                        {e.name}
                      </span>
                      {e.role?.trim() ? ` — vai trò: ${e.role}` : ""}
                      {typeof e.impact_tier === "number"
                        ? ` · mức ảnh hưởng: ${e.impact_tier}`
                        : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(payload.experiments?.length ?? 0) > 0 && (
              <div className="rounded-lg border-l-4 border-l-cyan-500 bg-cyan-500/10 dark:bg-cyan-500/5 p-3">
                <p className="font-semibold text-cyan-800 dark:text-cyan-200 mb-1">
                  Thí nghiệm
                </p>
                <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                  {payload.experiments!.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
            {(payload.projects?.length ?? 0) > 0 && (
              <div className="rounded-lg border-l-4 border-l-fuchsia-500 bg-fuchsia-500/10 dark:bg-fuchsia-500/5 p-3">
                <p className="font-semibold text-fuchsia-800 dark:text-fuchsia-200 mb-1">
                  Dự án
                </p>
                <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                  {payload.projects!.map((p, i) => (
                    <li key={i}>
                      <span className="text-foreground font-medium">
                        {p.name}
                      </span>
                      {" — "}
                      {projectGroupLabelVi(p.group)}, mức {p.tier}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(payload.hard_skills?.length ?? 0) > 0 && (
              <div className="rounded-lg border-l-4 border-l-orange-500 bg-orange-500/10 dark:bg-orange-500/5 p-3">
                <p className="font-semibold text-orange-800 dark:text-orange-200 mb-1">
                  Kỹ năng cứng
                </p>
                <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                  {payload.hard_skills!.map((s, i) => (
                    <li key={i}>
                      {s.name}
                      {s.level ? ` (${s.level})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(payload.soft_skills?.length ?? 0) > 0 && (
              <div className="rounded-lg border-l-4 border-l-lime-500 bg-lime-500/10 dark:bg-lime-500/5 p-3">
                <p className="font-semibold text-lime-800 dark:text-lime-200 mb-1">
                  Kỹ năng mềm
                </p>
                <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                  {payload.soft_skills!.map((s, i) => (
                    <li key={i}>
                      {s.name}
                      {s.level ? ` (${s.level})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nút bên ngoài card */}
      {error && <p className="text-sm text-destructive font-medium">{error}</p>}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <Button
          onClick={handleAnalyzeClick}
          disabled={loading || !hasPayload}
          className="rounded-xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:from-sky-600 hover:via-blue-600 hover:to-indigo-600 transition-all"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {latestAnalysis ? "Phân tích lại" : "Phân tích"}
        </Button>
        {loading && !waitOpen && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setWaitOpen(true)}
            className="rounded-xl"
          >
            Chơi Flappy Hollies
          </Button>
        )}
        {limits.analysisLimit != null && (
          <span className="text-sm text-muted-foreground">
            Còn {remaining} lần đánh giá
          </span>
        )}
      </div>

      {/* Skeleton khi đang phân tích lại */}
      {loading && (
        <div className="rounded-2xl border-2 border-sky-500/20 bg-gradient-to-b from-sky-500/5 to-transparent p-6 sm:p-8 shadow-lg space-y-4">
          <div className="space-y-3">
            <div className="h-4 w-3/4 rounded bg-muted/60 animate-pulse" />
            <div className="h-4 w-full rounded bg-muted/40 animate-pulse" />
            <div className="h-4 w-4/5 rounded bg-muted/40 animate-pulse" />
            <div className="h-32 rounded-xl bg-muted/30 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-sky-700 dark:text-sky-300 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin shrink-0" />
            {computingMessage}
          </p>
        </div>
      )}

      {/* Kết quả chi tiết */}
      {!loading && latestAnalysis?.full_result && (
        <div className="rounded-2xl border-2 border-sky-500/20 bg-gradient-to-b from-sky-500/5 to-transparent p-4 sm:p-6 shadow-lg space-y-6">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="h-1 w-8 rounded-full bg-gradient-to-r from-sky-500 to-blue-500" />
            Kết quả đánh giá
          </h3>

          {analysisView?.pillar_scores && analysisView.areas && (
            <ProfileAnalysisResultCharts
              pillar_scores={analysisView.pillar_scores}
              areas={analysisView.areas}
              regionalLocked={isFree}
            />
          )}

          {latestAnalysis.full_result.pillar_scores &&
            (latestAnalysis.full_result.swot ||
              (latestAnalysis.full_result.spikes?.length ?? 0) > 0) && (
              <div
                className="border-t border-border my-2"
                role="separator"
                aria-hidden
              />
            )}

          {/* SWOT — Free: cùng lưới 2×2, làm mờ + overlay */}
          {latestAnalysis.full_result.swot && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Phân tích SWOT
              </h4>
              <div
                className={
                  isFree ? "relative overflow-hidden rounded-xl" : undefined
                }
              >
                <div
                  className={
                    isFree
                      ? "blur-[4px] select-none opacity-[0.72] pointer-events-none"
                      : undefined
                  }
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(["S", "W", "O", "T"] as const).map((k) => {
                      const labels = {
                        S: "Điểm mạnh",
                        W: "Điểm yếu",
                        O: "Cơ hội",
                        T: "Thách thức",
                      };
                      const colors = {
                        S: "border-l-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
                        W: "border-l-rose-500 bg-rose-500/10 dark:bg-rose-500/10 text-rose-800 dark:text-rose-200",
                        O: "border-l-sky-500 bg-sky-500/10 dark:bg-sky-500/10 text-sky-800 dark:text-sky-200",
                        T: "border-l-violet-500 bg-violet-500/10 dark:bg-violet-500/10 text-violet-800 dark:text-violet-200",
                      };
                      const list = latestAnalysis.full_result.swot![k] || [];
                      return (
                        <div
                          key={k}
                          className={`rounded-xl border-l-4 p-4 ${colors[k]}`}
                        >
                          <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-90">
                            {labels[k]}
                          </p>
                          <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                            {list.length > 0 ? (
                              list.map((t, i) => <li key={i}>{t}</li>)
                            ) : (
                              <li className="opacity-60">:</li>
                            )}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {isFree && (
                  <ProfileAnalysisLockedOverlay
                    tone="sky"
                    label="Nâng cấp Plus/Premium để xem rõ SWOT"
                  />
                )}
              </div>
            </div>
          )}

          {latestAnalysis.full_result.swot &&
            (latestAnalysis.full_result.spikes?.length ?? 0) > 0 && (
              <div
                className="border-t border-border my-2"
                role="separator"
                aria-hidden
              />
            )}

          {/* Spikes: Free = hiện loại+tier; chi tiết cùng khối/size cũ, làm mờ + overlay */}
          {latestAnalysis.full_result.spikes &&
            latestAnalysis.full_result.spikes.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  Spikes (điểm nổi bật)
                </h4>
                <ul className="space-y-3">
                  {latestAnalysis.full_result.spikes.map((s, i) => (
                    <li
                      key={i}
                      className="rounded-xl border-l-4 border-l-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/10 p-3"
                    >
                      <p className="font-semibold text-indigo-800 dark:text-indigo-200">
                        {spikeTypeLabelVi(s.type, s.type_vi)}
                      </p>
                      {isFree ? (
                        <div className="relative mt-1 min-h-18 overflow-hidden rounded-lg">
                          <div className="blur-[4px] select-none opacity-[0.72] pointer-events-none space-y-1">
                            {s.evidence && (
                              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                {splitEvidence(s.evidence).map((ev, idx) => (
                                  <li key={idx}>{ev}</li>
                                ))}
                              </ul>
                            )}
                            {s.comment && (
                              <p className="text-sm text-foreground">
                                {s.comment}
                              </p>
                            )}
                            {!s.evidence && !s.comment && (
                              <>
                                <p className="text-sm text-muted-foreground">
                                  ·
                                </p>
                                <p className="text-sm text-foreground">·</p>
                              </>
                            )}
                          </div>
                          <ProfileAnalysisLockedOverlay
                            tone="indigo"
                            label="Nâng cấp Plus/Premium để xem chi tiết spike"
                          />
                        </div>
                      ) : (
                        <>
                          {s.evidence && (
                            <div className="mt-2">
                              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                {splitEvidence(s.evidence).map((ev, idx) => (
                                  <li key={idx}>{ev}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {s.comment && (
                            <p className="text-sm text-foreground mt-1">
                              {s.comment}
                            </p>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="p-6 sm:p-6 gap-4">
          <DialogHeader>
            <DialogTitle>
              {latestAnalysis
                ? "Phân tích lại"
                : "Xác nhận trước khi phân tích"}
            </DialogTitle>
            <DialogDescription>
              Kết quả phân tích dựa trên hồ sơ hiện tại của bạn. Bạn đã chắc
              chắn với thông tin hồ sơ chưa? Nếu chưa, hãy cập nhật hồ sơ trước
              khi chạy phân tích.
              <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
                <p className="font-medium text-foreground mb-1">
                  Số lần còn lại trong gói:
                </p>
                <ul className="space-y-0.5 text-muted-foreground">
                  <li>
                    Phân tích lại:{" "}
                    {limits.analysisRemaining != null
                      ? `${limits.analysisRemaining} lần`
                      : "không giới hạn"}
                  </li>
                  <li>
                    Cải thiện lại:{" "}
                    {limits.enhanceRemaining != null
                      ? `${limits.enhanceRemaining} lần`
                      : "không giới hạn"}
                  </li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Hủy
            </Button>
            <Button onClick={runAnalyze} disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Đã chắc chắn, phân tích"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FlappyWaitModal
        open={waitOpen && loading}
        onOpenChange={setWaitOpen}
        title="Đang phân tích profile"
        subtitle="Hệ thống đang tính toán dựa trên hồ sơ đã lưu. Chơi Flappy Hollies trong lúc đợi nhé."
      />
    </section>
  );
}
