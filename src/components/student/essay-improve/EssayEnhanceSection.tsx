"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Loader2 } from "lucide-react";
import { EssayEnhanceResultDetail } from "@/components/student/essay-improve/EssayFeature4ResultViews";
import { useSubscription } from "@/hooks/useSubscription";
import { validateEssayFeature4Inputs } from "@/lib/essay-feature4";
import type { EssayManageRow } from "@/types/essay-manage";
import { FlappyWaitModal } from "@/components/shared/FlappyWaitModal";
import { EnhanceLatestResultSkeleton } from "@/components/student/essay-improve/essay-improve-skeletons";

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

interface EssayEnhanceSectionProps {
  studentId: string;
  essays: EssayManageRow[];
  essayId: string | null;
  hasAnalysis: boolean;
  latestEnhanceOutput: unknown | null;
  /** Thời điểm lần cải thiện gần nhất (từ DB) — hiển thị kèm kết quả */
  enhanceCreatedAt: string | null;
  /** Đang hydrate từ API latest */
  latestRunLoading?: boolean;
  limits: {
    enhanceLimit: number | null;
    enhanceUsed: number;
    enhanceRemaining: number | null;
    analysisRemaining: number | null;
  };
  onSuccess: () => void;
}

export function EssayEnhanceSection({
  studentId,
  essays,
  essayId,
  hasAnalysis,
  latestEnhanceOutput,
  enhanceCreatedAt,
  latestRunLoading = false,
  limits,
  onSuccess,
}: EssayEnhanceSectionProps) {
  const { isFree } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [waitOpen, setWaitOpen] = useState(false);

  const runEnhance = useCallback(async () => {
    if (!essayId) return;
    setConfirmOpen(false);
    setLoading(true);
    setWaitOpen(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/essay-improve/enhance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essay_id: essayId }),
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
  }, [studentId, essayId, onSuccess]);

  const selected = essays.find((e) => e.id === essayId) ?? null;
  const inputsOk = selected ? validateEssayFeature4Inputs(selected).ok : false;

  const handleClick = () => {
    if (latestRunLoading) return;
    if (!essayId || !hasAnalysis) {
      setError("Cần phân tích bài luận trước khi cải thiện.");
      return;
    }
    if (!inputsOk) {
      setError("Bài luận này chưa có nội dung để cải thiện. Hãy kiểm tra lại tại Quản lý tài liệu.");
      return;
    }
    if (limits.enhanceLimit !== null && limits.enhanceUsed >= limits.enhanceLimit) {
      setError("Bài luận này đã hết lượt cải thiện theo gói.");
      return;
    }
    setConfirmOpen(true);
  };

  const remaining =
    limits.enhanceLimit == null
      ? "không giới hạn"
      : Math.max(0, limits.enhanceLimit - limits.enhanceUsed);

  return (
    <section className="space-y-5">
      <h2 className="font-heading text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
        Cải thiện bài luận
      </h2>
      <p className="text-muted-foreground text-sm">
        Dựa trên phân tích gần nhất để tạo gợi ý chỉnh sửa dạng nội dung — không chấm điểm, không hiển thị tiêu chí
        kỹ thuật; không sinh bài viết sẵn (bạn tự áp dụng).
      </p>

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}

      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <Button
          onClick={handleClick}
          disabled={
            loading ||
            latestRunLoading ||
            !essayId ||
            !hasAnalysis ||
            !inputsOk
          }
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
          <span className="text-sm text-muted-foreground">Còn {remaining} lần cải thiện (theo bài này)</span>
        )}
      </div>

      {loading && (
        <div className="rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-6 shadow-lg">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin shrink-0" />
            Đang tạo gợi ý cải thiện...
          </p>
        </div>
      )}

      {!loading && latestRunLoading && essayId && <EnhanceLatestResultSkeleton />}

      {!loading &&
        !latestRunLoading &&
        (latestEnhanceOutput != null || enhanceCreatedAt) && (
        <div className="rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-4 sm:p-6 shadow-lg space-y-3">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="h-1 w-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
              {isFree ? "Gợi ý chỉnh sửa" : "Gợi ý chỉnh sửa chi tiết"}
            </h3>
            {enhanceCreatedAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Lần chạy gần nhất: {formatRunDate(enhanceCreatedAt)}
              </p>
            ) : null}
          </div>
          {latestEnhanceOutput != null ? (
            <EssayEnhanceResultDetail
              output={latestEnhanceOutput}
              showFullDetail={!isFree}
            />
          ) : (
            <p className="text-sm text-amber-800 dark:text-amber-200 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
              Có bản ghi cải thiện nhưng không đọc được nội dung đã lưu. Cuộn xuống{" "}
              <strong>Lịch sử phân tích &amp; cải thiện</strong> hoặc chạy &quot;Cải thiện lại&quot;.
            </p>
          )}
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md p-6 sm:p-6 gap-4">
          <DialogHeader>
            <DialogTitle>Xác nhận cải thiện</DialogTitle>
            <DialogDescription>
              Mỗi lần cải thiện tính vào hạn mức gói. Tiếp tục?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={runEnhance} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FlappyWaitModal
        open={waitOpen && loading}
        onOpenChange={setWaitOpen}
        title="Đang cải thiện bài luận"
        subtitle="Hệ thống đang soạn gợi ý nội dung (không điểm số, không viết lại toàn bài). Chơi Flappy Hollies trong lúc đợi nhé."
      />
    </section>
  );
}
