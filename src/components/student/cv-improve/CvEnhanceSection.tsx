"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Loader2 } from "lucide-react";
import { CvEnhanceResultDetail } from "@/components/student/cv-improve/CvFeature7ResultViews";
import { useSubscription } from "@/hooks/useSubscription";
import type { CvManageRow } from "@/types/cv-manage";
import { FlappyWaitModal } from "@/components/shared/FlappyWaitModal";

function formatRunDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

interface CvEnhanceSectionProps {
  studentId: string;
  cvList: CvManageRow[];
  cvId: string | null;
  hasAnalysis: boolean;
  latestEnhanceOutput: unknown | null;
  enhanceCreatedAt: string | null;
  latestRunsLoading?: boolean;
  limits: {
    enhanceLimit: number | null;
    enhanceUsed: number;
    enhanceRemaining: number | null;
    analysisRemaining: number | null;
  };
  onSuccess: () => void;
}

export function CvEnhanceSection({
  studentId,
  cvList,
  cvId,
  hasAnalysis,
  latestEnhanceOutput,
  enhanceCreatedAt,
  latestRunsLoading = false,
  limits,
  onSuccess,
}: CvEnhanceSectionProps) {
  const { isFree } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [waitOpen, setWaitOpen] = useState(false);
  const loadingAnchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading && loadingAnchorRef.current) {
      loadingAnchorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [loading]);

  useEffect(() => {
    setError(null);
  }, [cvId]);

  const selected = cvList.find((c) => c.id === cvId) ?? null;

  const runEnhance = useCallback(async () => {
    if (!cvId) return;
    setConfirmOpen(false);
    setLoading(true);
    setWaitOpen(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/cv-improve/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv_document_id: cvId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cải thiện thất bại");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setLoading(false);
      setWaitOpen(false);
    }
  }, [studentId, cvId, onSuccess]);

  const handleClick = () => {
    if (!cvId || !hasAnalysis) {
      setError("Cần phân tích CV trước khi cải thiện.");
      return;
    }
    if (!selected?.cv_verified_at) {
      setError("CV cần được verify.");
      return;
    }
    if (limits.enhanceLimit !== null && limits.enhanceUsed >= limits.enhanceLimit) {
      setError("Đã hết lượt cải thiện cho CV này.");
      return;
    }
    setConfirmOpen(true);
  };

  const remaining =
    limits.enhanceLimit == null
      ? "không giới hạn"
      : Math.max(0, (limits.enhanceLimit ?? 0) - limits.enhanceUsed);

  return (
    <section className="space-y-5">
      <h2 className="font-heading bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-2xl font-bold text-transparent dark:from-emerald-400 dark:to-teal-400">
        Cải thiện CV
      </h2>
      <p className="text-sm text-muted-foreground">
        Dùng kết quả phân tích gần nhất để tạo bản CV cải thiện (achievement-first, rubric benchmark).
      </p>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <Button
          onClick={handleClick}
          disabled={loading || !cvId || !hasAnalysis || !selected?.cv_verified_at}
          className="rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {latestEnhanceOutput != null || enhanceCreatedAt ? "Chạy cải thiện lại" : "Cải thiện"}
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
        {limits.enhanceLimit != null && (
          <span className="text-sm text-muted-foreground">Còn {remaining} lần (theo CV này)</span>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader className="pr-8 text-left">
            <DialogTitle>Chạy cải thiện CV?</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Mỗi lần chạy tính một lượt cải thiện theo gói. Sau khi xác nhận, kết quả sẽ hiển thị khi xử lý xong.
          </p>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void runEnhance()}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FlappyWaitModal
        open={waitOpen && loading}
        onOpenChange={setWaitOpen}
        title="Đang cải thiện CV"
        subtitle="Hệ thống đang tạo bản CV cải thiện dựa trên phân tích gần nhất. Chơi Flappy Hollies trong lúc đợi nhé."
      />

      {loading && (
        <div
          ref={loadingAnchorRef}
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="scroll-mt-24 rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-500/8 to-transparent p-6 shadow-lg"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
            Đang tạo bản cải thiện…
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Vui lòng chờ — phân tích lại rubric và ma trận gợi ý có thể mất một lúc.
          </p>
        </div>
      )}

      {!loading && latestRunsLoading && cvId && (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="Đang tải kết quả cải thiện đã lưu"
          className="rounded-2xl border border-emerald-500/20 bg-muted/30 p-5"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 shrink-0 animate-spin text-emerald-600 dark:text-emerald-400" aria-hidden />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-36 max-w-[65%] animate-pulse rounded-md bg-muted-foreground/20" />
              <div className="h-3 w-full max-w-md animate-pulse rounded-md bg-muted-foreground/15" />
              <div className="h-3 w-full max-w-sm animate-pulse rounded-md bg-muted-foreground/10" />
            </div>
          </div>
        </div>
      )}

      {!loading &&
        !latestRunsLoading &&
        (latestEnhanceOutput != null || enhanceCreatedAt) && (
        <div className="space-y-3 rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-4 shadow-lg sm:p-6">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <span className="h-1 w-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
              {isFree ? "Kết quả cải thiện" : "Kết quả cải thiện chi tiết"}
            </h3>
            {enhanceCreatedAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                Lần chạy gần nhất: {formatRunDate(enhanceCreatedAt)}
              </p>
            )}
          </div>
          {latestEnhanceOutput != null ? (
            <CvEnhanceResultDetail output={latestEnhanceOutput} showFullDetail={!isFree} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Có lịch sử cải thiện nhưng không đọc được dữ liệu kết quả (JSON lưu trữ). Hãy tải lại
              trang hoặc chạy «Cải thiện CV» lại một lần.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
