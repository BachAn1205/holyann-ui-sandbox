"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Target, Loader2, AlertTriangle, RotateCcw, Trash2, GripVertical, Search, ChevronDown, ChevronUp, Check, Square, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ACCENT = "#0f4c81";

export const SHOW_TARGET_REDO_BUTTON = false;

export type TargetGoalOption = {
  faculty_name: string;
  university_id: number | null;
  university_name: string;
  value: string;
};

export type TargetGoalRow = {
  id: string;
  faculty_name: string;
  university_id: number | null;
  university_name: string;
  sort_order: number;
  created_at: string;
};

// ── Unified item in the draggable list ──
type UnifiedItem =
  | { kind: "saved"; goal: TargetGoalRow }
  | { kind: "pending"; opt: TargetGoalOption; tempId: string };

interface TargetGoalSectionProps {
  studentId: string | null;
  options: TargetGoalOption[];
  goals: TargetGoalRow[];
  maxGoals: number;
  planLabel: string;
  onSaved?: () => void;
}

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function TargetGoalSection({
  studentId,
  options,
  goals,
  maxGoals,
  planLabel,
  onSaved,
}: TargetGoalSectionProps) {
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [redoOpen, setRedoOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Single unified list (saved + pending mixed, draggable)
  const [unifiedList, setUnifiedList] = useState<UnifiedItem[]>([]);
  const [expandedUnis, setExpandedUnis] = useState<Set<string>>(new Set());

  // Drag state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Init unified list from props (saved goals only; pending start empty)
  useEffect(() => {
    setUnifiedList(
      [...goals]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((g) => ({ kind: "saved" as const, goal: g }))
    );
  }, [goals]);

  // ── Matrix derived data ──
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(
      (o) =>
        o.faculty_name.toLowerCase().includes(q) ||
        o.university_name.toLowerCase().includes(q)
    );
  }, [options, searchQuery]);

  const filteredUniversities = useMemo(
    () => [...new Set(filteredOptions.map((o) => o.university_name))].sort(),
    [filteredOptions]
  );
  const filteredFaculties = useMemo(
    () => [...new Set(filteredOptions.map((o) => o.faculty_name))].sort(),
    [filteredOptions]
  );

  const optionsByUniversity = useMemo(() => {
    const groups: Record<string, TargetGoalOption[]> = {};
    filteredOptions.forEach((o) => {
      if (!groups[o.university_name]) groups[o.university_name] = [];
      groups[o.university_name].push(o);
    });
    return groups;
  }, [filteredOptions]);

  const toggleUni = (uni: string) => {
    setExpandedUnis((prev) => {
      const next = new Set(prev);
      if (next.has(uni)) next.delete(uni);
      else next.add(uni);
      return next;
    });
  };

  const getOption = (faculty: string, university: string) =>
    options.find((o) => o.faculty_name === faculty && o.university_name === university);

  // Check if a combo is already in the unified list
  const isInList = (faculty: string, university: string) =>
    unifiedList.some((item) =>
      item.kind === "saved"
        ? item.goal.faculty_name === faculty && item.goal.university_name === university
        : item.opt.faculty_name === faculty && item.opt.university_name === university
    );

  const isSavedItem = (faculty: string, university: string) =>
    unifiedList.some(
      (item) =>
        item.kind === "saved" &&
        item.goal.faculty_name === faculty &&
        item.goal.university_name === university
    );

  const isPendingItem = (faculty: string, university: string) =>
    unifiedList.some(
      (item) =>
        item.kind === "pending" &&
        item.opt.faculty_name === faculty &&
        item.opt.university_name === university
    );

  const hasPending = unifiedList.some((i) => i.kind === "pending");
  const totalSelected = unifiedList.length;

  // ── Cell click: toggle item in unified list ──
  const handleCellClick = useCallback(
    (faculty: string, university: string) => {
      const opt = getOption(faculty, university);
      if (!opt) return;

      setUnifiedList((prev) => {
        const existIdx = prev.findIndex((item) =>
          item.kind === "saved"
            ? item.goal.faculty_name === faculty && item.goal.university_name === university
            : item.opt.faculty_name === faculty && item.opt.university_name === university
        );

        // If already in list (saved → remove via API later; pending → remove immediately)
        if (existIdx >= 0) {
          const item = prev[existIdx];
          if (item.kind === "saved") {
            // Trigger API delete outside setState
            removeGoalById(item.goal.id);
            return prev.filter((_, i) => i !== existIdx);
          }
          // pending → just remove
          return prev.filter((_, i) => i !== existIdx);
        }

        // Not in list → add as pending (if under limit)
        if (prev.length >= maxGoals) return prev;
        const tempId = `pending-${Date.now()}-${Math.random()}`;
        return [...prev, { kind: "pending" as const, opt, tempId }];
      });

      setError(null);
    },
    [maxGoals, options]
  );

  // Remove a saved goal via API (does NOT touch unifiedList — that's handled in handleCellClick)
  const removeGoalById = useCallback(
    async (goalId: string) => {
      if (!studentId) return;
      setRemovingId(goalId);
      try {
        const res = await fetch(
          `/api/students/${studentId}/target-goal?goalId=${encodeURIComponent(goalId)}`,
          { method: "DELETE" }
        );
        const data = await res.json();
        if (!res.ok) setError(data.error ?? "Lỗi xóa");
        else onSaved?.();
      } catch {
        setError("Lỗi kết nối");
      } finally {
        setRemovingId(null);
      }
    },
    [studentId, onSaved]
  );

  // Remove via trash button (works for both saved and pending)
  const handleRemoveItem = useCallback(
    (idx: number) => {
      const item = unifiedList[idx];
      if (item.kind === "saved") {
        removeGoalById(item.goal.id);
      }
      setUnifiedList((prev) => prev.filter((_, i) => i !== idx));
    },
    [unifiedList, removeGoalById]
  );

  // ── Save pending items then patch order ──
  const handleSavePending = useCallback(async () => {
    if (!studentId) return;
    setSaving(true);
    setError(null);

    const pendingItems = unifiedList.filter((i): i is Extract<UnifiedItem, { kind: "pending" }> => i.kind === "pending");

    try {
      // POST each pending item
      const newGoalIds: { tempId: string; id: string }[] = [];
      for (const item of pendingItems) {
        const res = await fetch(`/api/students/${studentId}/target-goal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            faculty_name: item.opt.faculty_name,
            university_id: item.opt.university_id,
            university_name: item.opt.university_name,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Lỗi lưu mục tiêu");
          return;
        }
        // data may include new goal id — we'll re-fetch via onSaved
      }

      // After saving, re-fetch goals via parent so we get the real IDs
      onSaved?.();
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  }, [studentId, unifiedList, onSaved]);

  // ── Drag and drop ──
  const handleDragStart = useCallback((idx: number) => {
    dragIndexRef.current = idx;
  }, []);

  const handleDragEnter = useCallback((idx: number) => {
    setDragOverIndex(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragEnd = useCallback(async () => {
    const from = dragIndexRef.current;
    const to = dragOverIndex;
    dragIndexRef.current = null;
    setDragOverIndex(null);

    if (from === null || to === null || from === to) return;

    // Reorder local list
    setUnifiedList((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

    // Persist order of saved items to API
    if (!studentId) return;
    setReordering(true);
    try {
      const reordered = [...unifiedList];
      const [item] = reordered.splice(from, 1);
      reordered.splice(to, 0, item);
      const savedIds = reordered
        .filter((i): i is Extract<UnifiedItem, { kind: "saved" }> => i.kind === "saved")
        .map((i) => i.goal.id);

      if (savedIds.length > 0) {
        const res = await fetch(`/api/students/${studentId}/target-goal`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedIds: savedIds }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "Lỗi cập nhật thứ tự");
        }
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setReordering(false);
    }
  }, [dragOverIndex, unifiedList, studentId]);

  // ── Redo all ──
  const redoAll = useCallback(async () => {
    if (!studentId) return;
    setRedoOpen(false);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/target-goal`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Lỗi xóa mục tiêu");
        return;
      }
      setUnifiedList([]);
      onSaved?.();
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  }, [studentId, onSaved]);

  if (!studentId) return null;

  const hasOptions = options.length > 0;

  return (
    <>
      <motion.section
        className="pc-panel overflow-hidden"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        aria-labelledby="target-goals-heading"
      >
        <div className="pc-panel-header flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,#0f4c81_10%,transparent)] text-[#0f4c81] dark:bg-sky-500/15 dark:text-sky-300">
              <Target className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <h2 id="target-goals-heading" className="pc-display text-base text-foreground sm:text-lg">
                Thiết lập mục tiêu
              </h2>
              <p className="text-xs text-muted-foreground">
                Gói <strong className="text-foreground">{planLabel}</strong> · tối đa{" "}
                <strong className="text-foreground">{maxGoals}</strong> mục tiêu
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground tabular-nums">
              Đã chọn{" "}
              <span className="font-semibold text-foreground">{totalSelected}</span>/{maxGoals}
            </span>
            {SHOW_TARGET_REDO_BUTTON && unifiedList.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => setRedoOpen(true)}
                disabled={saving || reordering}
              >
                <RotateCcw className="size-3.5" />
                Làm lại
              </Button>
            )}
          </div>
        </div>

        <div className="px-4 py-4 sm:px-5 sm:py-5">
        <p className="mb-4 text-sm text-muted-foreground">
          Chọn ngành tại trường bạn nhắm tới từ kết quả Reach / Match / Safety. Kéo để sắp xếp ưu tiên.
        </p>

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4">
            {error}
          </div>
        )}

        {!hasOptions ? (
          <p className="text-sm text-muted-foreground py-2">
            Chạy đánh giá Reach / Match / Safety trước để mở khóa chọn mục tiêu (ngành @ trường).
          </p>
        ) : (
          <>
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm ngành hoặc trường..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f4c81]/30"
              />
            </div>

            {/* Matrix */}
            {/* Matrix (Desktop only) */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-border mb-5">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="sticky left-0 z-10 bg-muted/60 px-4 py-3 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap min-w-[140px] border-b border-border">
                      Trường \ Ngành
                    </th>
                    {filteredFaculties.map((faculty) => (
                      <th
                        key={faculty}
                        className="px-3 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap border-b border-border text-center min-w-[120px]"
                      >
                        {faculty}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUniversities.map((university, uIdx) => (
                    <tr
                      key={university}
                      className={uIdx % 2 === 0 ? "bg-background" : "bg-muted/10"}
                    >
                      <td className="sticky left-0 z-10 px-4 py-3 text-xs font-medium text-foreground whitespace-nowrap border-r border-border bg-inherit">
                        {university}
                      </td>
                      {filteredFaculties.map((faculty) => {
                        const opt = getOption(faculty, university);
                        const saved = isSavedItem(faculty, university);
                        const pending = isPendingItem(faculty, university);
                        const inList = isInList(faculty, university);
                        const atLimit = totalSelected >= maxGoals && !inList;

                        return (
                          <td key={faculty} className="px-2 py-2 text-center">
                            {opt ? (
                              <button
                                type="button"
                                disabled={atLimit || removingId !== null}
                                onClick={() => handleCellClick(faculty, university)}
                                className={`inline-flex items-center justify-center rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 w-full max-w-[110px] ${
                                  saved
                                    ? "bg-[#0f4c81] text-white border border-[#0f4c81] shadow-sm hover:bg-[#0c3d68]"
                                    : pending
                                    ? "bg-[#0f4c81]/15 text-[#0f4c81] border border-[#0f4c81]/50 hover:bg-[#0f4c81]/25"
                                    : atLimit
                                    ? "bg-muted/30 text-muted-foreground border border-border/50 cursor-not-allowed opacity-50"
                                    : "bg-white dark:bg-card border border-border hover:border-[#0f4c81]/50 hover:bg-[#0f4c81]/5 text-foreground"
                                }`}
                                title={
                                  saved ? "Đã lưu — bấm để xóa"
                                  : pending ? "Chờ lưu — bấm để bỏ"
                                  : atLimit ? "Đã đạt giới hạn"
                                  : "Bấm để chọn"
                                }
                              >
                                {saved ? "✓ Đã lưu" : pending ? "Chờ lưu" : "Chọn"}
                              </button>
                            ) : (
                              <span className="text-muted-foreground/30 text-xs">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Selection View (Accordion) */}
            <div className="md:hidden space-y-3 mb-5">
              {Object.entries(optionsByUniversity).map(([uni, uniOptions]) => {
                const isExpanded = expandedUnis.has(uni);
                const selectedInUni = uniOptions.filter(o => isInList(o.faculty_name, o.university_name)).length;

                return (
                  <div key={uni} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() => toggleUni(uni)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-foreground leading-tight">{uni}</span>
                        {selectedInUni > 0 && (
                          <span className="text-[10px] font-medium text-[#0f4c81]">
                            Đã chọn {selectedInUni} ngành
                          </span>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border bg-muted/10 px-2 py-2 space-y-1">
                        {uniOptions.map((opt) => {
                          const saved = isSavedItem(opt.faculty_name, opt.university_name);
                          const pending = isPendingItem(opt.faculty_name, opt.university_name);
                          const inList = isInList(opt.faculty_name, opt.university_name);
                          const atLimit = totalSelected >= maxGoals && !inList;

                          return (
                            <button
                              key={opt.faculty_name}
                              type="button"
                              disabled={atLimit || removingId !== null}
                              onClick={() => handleCellClick(opt.faculty_name, opt.university_name)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                                inList
                                  ? "bg-[#0f4c81]/10 border border-[#0f4c81]/20"
                                  : atLimit
                                  ? "opacity-40 grayscale cursor-not-allowed"
                                  : "hover:bg-white dark:hover:bg-card/50"
                              }`}
                            >
                              {inList ? (
                                <CheckSquare className="size-5 text-[#0f4c81] shrink-0" />
                              ) : (
                                <Square className="size-5 text-muted-foreground/30 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium leading-tight ${inList ? "text-[#0f4c81]" : "text-foreground"}`}>
                                  {opt.faculty_name}
                                </p>
                                {saved && <span className="text-[10px] text-emerald-600 font-semibold uppercase">✓ Đã lưu</span>}
                                {pending && <span className="text-[10px] text-primary/70 font-semibold uppercase italic">Chờ lưu</span>}
                              </div>
                              <div className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                                inList
                                  ? "bg-[#0f4c81] border-[#0f4c81] text-white"
                                  : "border-border text-muted-foreground"
                              }`}>
                                {inList ? "Bỏ chọn" : "Chọn"}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Unified draggable list */}
            {unifiedList.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  Mục tiêu đã chọn
                  <span className="ml-auto font-normal normal-case text-[10px] text-slate-400 dark:text-muted-foreground/60 flex items-center gap-1">
                    <GripVertical className="size-3" /> Kéo để sắp xếp ưu tiên
                  </span>
                </p>
                {unifiedList.map((item, idx) => {
                  const isSaved = item.kind === "saved";
                  const label = isSaved
                    ? { faculty: item.goal.faculty_name, university: item.goal.university_name }
                    : { faculty: item.opt.faculty_name, university: item.opt.university_name };
                  const isRemoving = isSaved && removingId === item.goal.id;

                  return (
                    <div
                      key={isSaved ? item.goal.id : item.tempId}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragEnter={() => handleDragEnter(idx)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
                        dragOverIndex === idx && dragIndexRef.current !== idx
                          ? "border-[#0f4c81]/50 bg-[#0f4c81]/10 scale-[1.01]"
                          : isSaved
                          ? "border-border bg-muted/20"
                          : "border-[#0f4c81]/25 bg-[#0f4c81]/5"
                      }`}
                    >
                      <GripVertical className="size-4 shrink-0 text-muted-foreground/50" />
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white font-bold text-[10px] bg-[#0f4c81]">
                        {idx + 1}
                      </span>
                      <p className="flex-1 text-sm font-medium text-foreground min-w-0">
                        <span className="text-[#0f4c81]">{label.faculty}</span>
                        <span className="text-muted-foreground"> tại </span>
                        {label.university}
                        {!isSaved && (
                          <span className="ml-2 text-xs text-muted-foreground italic">(chưa lưu)</span>
                        )}
                      </p>
                      <button
                        type="button"
                        aria-label="Xóa"
                        disabled={isRemoving || reordering}
                        onClick={() => handleRemoveItem(idx)}
                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50 transition-colors"
                      >
                        {isRemoving ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Save pending button */}
            {hasPending && (
              <Button
                onClick={handleSavePending}
                disabled={saving}
                className="rounded-xl bg-[#0f4c81] hover:bg-[#0c3d68] gap-2"
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                Lưu {unifiedList.filter((i) => i.kind === "pending").length} mục tiêu mới
              </Button>
            )}

            {totalSelected >= maxGoals && !hasPending && (
              <p className="text-sm text-amber-700 dark:text-amber-300 py-1">
                Đã đạt số mục tiêu tối đa. Nâng cấp gói để thêm mục tiêu.
              </p>
            )}
          </>
        )}
        </div>
      </motion.section>

      <Dialog open={redoOpen} onOpenChange={setRedoOpen}>
        <DialogContent className="gap-4 p-6 sm:p-6 max-w-lg">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="size-5 shrink-0" />
              <DialogTitle className="text-lg font-semibold leading-none tracking-tight">
                Làm lại thiết lập mục tiêu
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Xóa toàn bộ mục tiêu đã chọn. Bạn có thể thêm lại sau (theo giới hạn gói).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRedoOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={redoAll} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Xóa hết và làm lại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
