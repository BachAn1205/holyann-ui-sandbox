"use client";

import React, { useState, useCallback, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Loader2,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  resolveEssayTargetMajor,
  validateEssayFeature4Inputs,
} from "@/lib/essay-feature4";
import type { EssayManageRow } from "@/types/essay-manage";
import { EssayAnalysisResultDetail } from "@/components/student/essay-improve/EssayFeature4ResultViews";
import { AnalysisLatestResultSkeleton } from "@/components/student/essay-improve/essay-improve-skeletons";
import { useSubscription } from "@/hooks/useSubscription";
import { FlappyWaitModal } from "@/components/shared/FlappyWaitModal";

interface EssayAnalysisFormSectionProps {
  studentId: string;
  essays: EssayManageRow[];
  selectedEssayId: string | null;
  onSelectEssay: (id: string | null) => void;
  latestAnalysisOutput: unknown | null;
  /** Đang hydrate kết quả từ API latest (song song với lịch sử) */
  latestRunLoading?: boolean;
  limits: {
    analysisLimit: number | null;
    analysisUsed: number;
    analysisRemaining: number | null;
    enhanceRemaining: number | null;
  };
  onSuccess: () => void;
}

function formatCulture(c: string | null): string {
  if (!c) return "—";
  const u = c.trim().toUpperCase();
  if (u === "A" || u.includes("VÙNG A")) return "Vùng A";
  if (u === "B" || u.includes("VÙNG B")) return "Vùng B";
  if (u === "C" || u.includes("VÙNG C")) return "Vùng C";
  return c;
}

export function EssayAnalysisFormSection({
  studentId,
  essays,
  selectedEssayId,
  onSelectEssay,
  latestAnalysisOutput,
  latestRunLoading = false,
  limits,
  onSuccess,
}: EssayAnalysisFormSectionProps) {
  const { isFree } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [waitOpen, setWaitOpen] = useState(false);

  const selected = useMemo(
    () => essays.find((e) => e.id === selectedEssayId) ?? null,
    [essays, selectedEssayId],
  );

  const validation = useMemo(() => {
    if (!selected) return { ok: false as const, missingLabels: [] as string[] };
    return validateEssayFeature4Inputs(selected);
  }, [selected]);

  const runAnalyze = useCallback(async () => {
    if (!selectedEssayId) return;
    setConfirmOpen(false);
    setLoading(true);
    setWaitOpen(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/students/${studentId}/essay-improve/analyze`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ essay_id: selectedEssayId }),
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
  }, [studentId, selectedEssayId, onSuccess]);

  const handleAnalyzeClick = () => {
    if (!selectedEssayId) {
      setError("Vui lòng chọn một bài luận.");
      return;
    }
    if (!validation.ok) {
      setError("Bài luận này chưa có nội dung để phân tích. Hãy kiểm tra lại tại Quản lý tài liệu.");
      return;
    }
    if (
      limits.analysisLimit !== null &&
      limits.analysisUsed >= limits.analysisLimit
    ) {
      setError("Bài luận này đã hết lượt phân tích theo gói.");
      return;
    }
    setConfirmOpen(true);
  };

  const remaining =
    limits.analysisLimit == null
      ? "không giới hạn"
      : Math.max(0, limits.analysisLimit - limits.analysisUsed);

  return (
    <section className="space-y-5">
      <h2 className="font-heading text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 dark:from-sky-400 dark:to-blue-400 bg-clip-text text-transparent">
        Phân tích bài luận
      </h2>
      <p className="text-muted-foreground text-sm">
        Chỉ cần có nội dung bài luận (essay) là đủ để hệ thống phân tích.
        Nếu bạn đã nhập thêm (đề bài, vùng mục tiêu, thế mạnh, thực thể
        chương trình, ngành…) trong{" "}
        <Link
          href="/student/manage-upload"
          className="text-sky-600 dark:text-sky-400 font-medium underline hover:no-underline"
        >
          Quản lý tài liệu
        </Link>
        . Hệ thống sẽ tận dụng để kết quả sát hơn.
      </p>

      <div className="rounded-2xl border-2 border-teal-500/30 bg-gradient-to-br from-teal-500/10 via-card to-emerald-500/5 p-4 sm:p-6 shadow-md border-l-4 border-l-teal-500 space-y-4">
        <h3 className="text-sm font-semibold text-teal-800 dark:text-teal-200 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/20">
            <FileText className="size-4 text-teal-600 dark:text-teal-400" />
          </span>
          Chọn bài luận
        </h3>
        {essays.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Chưa có bài luận nào.{" "}
            <Link
              href="/student/manage-upload"
              className="text-primary underline"
            >
              Thêm bài luận
            </Link>
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="essay-slot">Bài luận (theo slot)</Label>
              <Select
                value={selectedEssayId ?? ""}
                onValueChange={(v) => onSelectEssay(v || null)}
              >
                <SelectTrigger id="essay-slot" className="w-full max-w-xl">
                  <SelectValue placeholder="Chọn bài luận..." />
                </SelectTrigger>
                <SelectContent>
                  {essays.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      Slot {e.slot_index}
                      {e.title ? ` — ${e.title}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selected && (
              <div className="rounded-xl border border-border bg-background/80 p-4 space-y-3 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  {validation.ok ? (
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="size-4 text-amber-600 shrink-0" />
                  )}
                  {validation.ok
                    ? "Có nội dung để phân tích"
                    : "Chưa có nội dung bài luận"}
                </div>
                <dl className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Đề bài / yêu cầu
                    </dt>
                    <dd className="mt-0.5 whitespace-pre-wrap break-words">
                      {selected.essay_prompt?.trim() || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Số từ mục tiêu
                    </dt>
                    <dd className="mt-0.5">{selected.target_words ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Vùng mục tiêu
                    </dt>
                    <dd className="mt-0.5">
                      {formatCulture(selected.target_culture)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      Ngành học mục tiêu
                    </dt>
                    <dd className="mt-0.5">
                      {resolveEssayTargetMajor(selected) || "—"}
                      {selected.target_goal?.university_name ? (
                        <span className="block text-xs text-muted-foreground mt-1">
                          {selected.target_goal.university_name}
                        </span>
                      ) : null}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">
                      Thế mạnh cốt lõi
                    </dt>
                    <dd className="mt-0.5 whitespace-pre-wrap">
                      {Array.isArray(selected.applicant_core_strengths)
                        ? (selected.applicant_core_strengths as string[]).join(
                            ", ",
                          )
                        : "—"}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-muted-foreground">
                      Thực thể chương trình / trường
                    </dt>
                    <dd className="mt-0.5 whitespace-pre-wrap">
                      {Array.isArray(selected.target_program_entities)
                        ? (selected.target_program_entities as string[]).join(
                            ", ",
                          )
                        : "—"}
                    </dd>
                  </div>
                </dl>
                {validation.ok === false && (
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    Thiếu: {validation.missingLabels.join(" · ")}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {error && <p className="text-sm text-destructive font-medium">{error}</p>}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <Button
          onClick={handleAnalyzeClick}
          disabled={
            loading ||
            latestRunLoading ||
            !selectedEssayId ||
            essays.length === 0 ||
            !validation.ok
          }
          className="rounded-xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:from-sky-600 hover:via-blue-600 hover:to-indigo-600 transition-all"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {latestAnalysisOutput ? "Phân tích lại" : "Phân tích"}
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
            Còn {remaining} lần phân tích (theo bài này)
          </span>
        )}
      </div>

      {loading && (
        <div className="rounded-2xl border-2 border-sky-500/20 bg-gradient-to-b from-sky-500/5 to-transparent p-6 sm:p-8 shadow-lg space-y-4">
          <div className="space-y-3">
            <div className="h-4 w-3/4 rounded bg-muted/60 animate-pulse" />
            <div className="h-4 w-full rounded bg-muted/40 animate-pulse" />
            <div className="h-32 rounded-xl bg-muted/30 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-sky-700 dark:text-sky-300 flex items-center gap-2">
            <Loader2 className="size-4 animate-spin shrink-0" />
            Vui lòng đợi, hệ thống đang phân tích bài luận...
          </p>
        </div>
      )}

      {!loading && latestRunLoading && selectedEssayId && (
        <AnalysisLatestResultSkeleton />
      )}

      {!loading && !latestRunLoading && latestAnalysisOutput != null && (
        <div className="rounded-2xl border-2 border-sky-500/20 bg-gradient-to-b from-sky-500/5 to-transparent p-4 sm:p-6 shadow-lg space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <span className="h-1 w-8 rounded-full bg-gradient-to-r from-sky-500 to-blue-500" />
            {isFree ? "Kết quả phân tích" : "Kết quả phân tích chi tiết"}
          </h3>
          <EssayAnalysisResultDetail
            output={latestAnalysisOutput}
            showFullDetail={!isFree}
          />
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md p-6 sm:p-6 gap-4">
          <DialogHeader>
            <DialogTitle>Xác nhận phân tích</DialogTitle>
            <DialogDescription>
              Mỗi lần phân tích tính vào hạn mức theo bài luận này. Tiếp tục?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={runAnalyze} disabled={loading}>
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FlappyWaitModal
        open={waitOpen && loading}
        onOpenChange={setWaitOpen}
        title="Đang phân tích bài luận"
        subtitle="Hệ thống đang đánh giá cấu trúc và nội dung bài luận. Chơi Flappy Hollies trong lúc đợi nhé."
      />
    </section>
  );
}
