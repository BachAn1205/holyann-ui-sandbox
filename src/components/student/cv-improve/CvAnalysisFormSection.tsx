"use client";

import React, { useMemo, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { CvAnalysisResultDetail } from "@/components/student/cv-improve/CvFeature7ResultViews";
import { useSubscription } from "@/hooks/useSubscription";
import type { CvManageRow } from "@/types/cv-manage";
import { FlappyWaitModal } from "@/components/shared/FlappyWaitModal";
import { toast } from "sonner";

interface CvAnalysisFormSectionProps {
  studentId: string;
  cvList: CvManageRow[];
  selectedCvId: string | null;
  onSelectCv: (id: string | null) => void;
  latestAnalysisOutput: unknown | null;
  /** Đang tải kết quả chạy gần nhất từ server (vào trang / đổi CV). */
  latestRunsLoading?: boolean;
  limits: {
    analysisLimit: number | null;
    analysisUsed: number;
    analysisRemaining: number | null;
    enhanceRemaining: number | null;
  };
  onSuccess: () => void;
}

export function CvAnalysisFormSection({
  studentId,
  cvList,
  selectedCvId,
  onSelectCv,
  latestAnalysisOutput,
  latestRunsLoading = false,
  limits,
  onSuccess,
}: CvAnalysisFormSectionProps) {
  const toFriendlyVerifyError = (raw: unknown): string => {
    const msg = typeof raw === "string" ? raw : "Verify thất bại";
    if (msg.includes("chưa bật OCR") || msg.includes("thiếu pytesseract") || msg.includes("Tesseract")) {
      return "Hệ thống OCR đang chưa sẵn sàng trên server. Vui lòng thử lại sau hoặc dùng file PDF/DOCX có text.";
    }
    if (msg.includes("OCR không đọc được chữ")) {
      return "Không đọc được chữ trong ảnh CV. Vui lòng dùng ảnh/PDF rõ nét hơn hoặc thử file DOCX.";
    }
    if (msg.includes("PDF không có lớp text")) {
      return "PDF này có thể là bản scan không có lớp text. Hãy thử PDF text hoặc file DOCX.";
    }
    return msg;
  };

  const { isFree } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
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

  const selected = useMemo(
    () => cvList.find((c) => c.id === selectedCvId) ?? null,
    [cvList, selectedCvId],
  );

  const runVerify = useCallback(async () => {
    if (!selectedCvId) return;
    setVerifyLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/cv-improve/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv_document_id: selectedCvId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("CV chưa đạt kiểm tra", {
          description: toFriendlyVerifyError(data.error),
        });
        return;
      }
      toast.success("Verify CV thành công", {
        description: "CV đạt kiểm tra. Bạn có thể chạy Phân tích/Cải thiện.",
      });
      onSuccess();
    } catch (e) {
      toast.error("Không thể verify CV", {
        description: toFriendlyVerifyError(e instanceof Error ? e.message : "Lỗi"),
      });
    } finally {
      setVerifyLoading(false);
    }
  }, [studentId, selectedCvId, onSuccess]);

  const runAnalyze = useCallback(async () => {
    if (!selectedCvId) return;
    setConfirmOpen(false);
    setLoading(true);
    setWaitOpen(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/cv-improve/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cv_document_id: selectedCvId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Phân tích thất bại");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi");
    } finally {
      setLoading(false);
      setWaitOpen(false);
    }
  }, [studentId, selectedCvId, onSuccess]);

  const remaining =
    limits.analysisLimit == null
      ? "không giới hạn"
      : Math.max(0, (limits.analysisLimit ?? 0) - limits.analysisUsed);

  return (
    <section className="space-y-5">
      <h2 className="font-heading bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-2xl font-bold text-transparent dark:from-sky-400 dark:to-blue-400">
        Phân tích CV
      </h2>
      <p className="text-sm text-muted-foreground">
        Chọn CV đã tải ở{" "}
        <Link href="/student/manage-upload" className="text-primary underline underline-offset-2">
          Quản lý tài liệu
        </Link>
        . Cần <strong>verify CV thành công</strong> trước khi phân tích.
      </p>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <div className="space-y-2 max-w-md">
        <Label>CV đã lưu</Label>
        <Select
          value={selectedCvId ?? ""}
          onValueChange={(v) => onSelectCv(v || null)}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Chọn một CV" />
          </SelectTrigger>
          <SelectContent>
            {cvList.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                Slot {c.slot_index}: {c.file_name}
                {c.cv_verified_at ? " ✓" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <p className="text-xs text-muted-foreground">
          Trạng thái verify:{" "}
          {selected.cv_verified_at ? (
            <span className="font-medium text-emerald-600 dark:text-emerald-400">Đã xác nhận</span>
          ) : (
            <span className="font-medium text-amber-700 dark:text-amber-300">Chưa verify</span>
          )}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={!selectedCvId || verifyLoading}
          onClick={() => void runVerify()}
        >
          {verifyLoading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <ShieldCheck className="mr-2 size-4" />
          )}
          Verify CV
        </Button>
        <Button
          type="button"
          onClick={() => {
            if (!selectedCvId) {
              setError("Vui lòng chọn một CV.");
              return;
            }
            if (!selected?.cv_verified_at) {
              setError("Cần verify CV thành công trước.");
              return;
            }
            if (
              limits.analysisLimit !== null &&
              limits.analysisUsed >= limits.analysisLimit
            ) {
              setError("Đã hết lượt phân tích cho CV này.");
              return;
            }
            setConfirmOpen(true);
          }}
          disabled={loading || !selectedCvId || !selected?.cv_verified_at}
          className="rounded-xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white shadow-lg shadow-sky-500/25"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Phân tích
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
          <span className="text-sm text-muted-foreground">Còn {remaining} lần (theo CV này)</span>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader className="pr-8 text-left">
            <DialogTitle>Chạy phân tích CV?</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Hệ thống sẽ gửi file CV và mục tiêu hồ sơ để phân tích. Mỗi lần chạy tính một lượt theo gói.
          </p>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void runAnalyze()}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FlappyWaitModal
        open={waitOpen && loading}
        onOpenChange={setWaitOpen}
        title="Đang phân tích CV"
        subtitle="Hệ thống đang đánh giá CV theo rubric và mục tiêu hồ sơ. Chơi Flappy Hollies trong lúc đợi nhé."
      />

      {loading && (
        <div
          ref={loadingAnchorRef}
          role="status"
          aria-live="polite"
          aria-busy="true"
          className="scroll-mt-24 rounded-2xl border-2 border-sky-500/30 bg-gradient-to-b from-sky-500/8 to-transparent p-6 shadow-lg"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-sky-800 dark:text-sky-200">
            <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
            Đang phân tích CV…
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Vui lòng chờ, quá trình có thể mất vài chục giây tùy độ dài file.
          </p>
        </div>
      )}

      {!loading && latestRunsLoading && selectedCvId && (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label="Đang tải kết quả phân tích đã lưu"
          className="rounded-2xl border border-sky-500/20 bg-muted/30 p-5"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="size-5 shrink-0 animate-spin text-sky-600 dark:text-sky-400" aria-hidden />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-4 w-40 max-w-[70%] animate-pulse rounded-md bg-muted-foreground/20" />
              <div className="h-3 w-full max-w-xl animate-pulse rounded-md bg-muted-foreground/15" />
              <div className="h-3 w-full max-w-lg animate-pulse rounded-md bg-muted-foreground/10" />
            </div>
          </div>
        </div>
      )}

      {!loading && !latestRunsLoading && latestAnalysisOutput != null && (
        <div className="rounded-2xl border-2 border-sky-500/20 bg-gradient-to-b from-sky-500/5 to-transparent p-4 shadow-lg sm:p-6">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-lg">
            <span className="h-1 w-8 rounded-full bg-gradient-to-r from-sky-500 to-blue-500" />
            {isFree ? "Tóm tắt phân tích" : "Kết quả phân tích chi tiết"}
          </h3>
          <CvAnalysisResultDetail output={latestAnalysisOutput} showFullDetail={!isFree} />
        </div>
      )}
    </section>
  );
}
