"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Heart, Loader2, ChevronRight, Sparkles, X, Lock, GripVertical, ArrowRight } from "lucide-react";
import { WishlistCardBodySkeleton } from "@/components/student/profile/components/WishlistCardBodySkeleton";
import Link from "next/link";
import { useSubscription } from "@/hooks/useSubscription";

/** Số ngành ưu tiên cao nhất hiện trên profile (tóm tắt). */
const EMBEDDED_PREVIEW_LIMIT = 5;

interface FacultyWishlistCardProps {
  studentId: string | null;
  readOnly?: boolean;
  manageHref?: string;
  /** Chỉ phần nội dung (danh sách / skeleton), không bọc card + header — dùng khi đã có khung ngoài. */
  embedded?: boolean;
  /** Gọi một lần khi fetch gợi ý + wishlist xong (thành công hoặc lỗi). */
  onLoadComplete?: () => void;
}

type FacultyItem = { faculty_name: string; match_score: number };
type WishlistSavedItem = { faculty_name: string; sort_order: number };

export const FacultyWishlistCard: React.FC<FacultyWishlistCardProps> = ({
  studentId,
  readOnly = false,
  manageHref = "/student/universities?tab=faculty",
  embedded = false,
  onLoadComplete,
}) => {
  const { isFree } = useSubscription();
  const onLoadCompleteRef = useRef(onLoadComplete);
  onLoadCompleteRef.current = onLoadComplete;

  // Data states
  const [faculties, setFaculties] = useState<FacultyItem[]>([]);
  const [wishlistLimit, setWishlistLimit] = useState(2);
  const [wishlistSaved, setWishlistSaved] = useState<WishlistSavedItem[]>([]);

  // Selection states
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);
  const [wishlistSaving, setWishlistSaving] = useState(false);
  const [wishlistError, setWishlistError] = useState<string | null>(null);

  // Loading states
  const [loading, setLoading] = useState(!!studentId);
  const [error, setError] = useState<string | null>(null);

  // Drag state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Fetch all data in parallel
  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/students/${studentId}/recommend-faculty/latest`),
      fetch(`/api/students/${studentId}/faculty-wishlist/limits`),
      fetch(`/api/students/${studentId}/faculty-wishlist`),
    ])
      .then(async ([recRes, limRes, listRes]) => {
        if (cancelled) return;

        if (recRes.ok) {
          const d = await recRes.json();
          const rec = d.recommendation;
          if (rec?.faculties && Array.isArray(rec.faculties) && rec.faculties.length > 0) {
            setFaculties(rec.faculties);
          }
        }

        if (limRes.ok) {
          const d = await limRes.json();
          setWishlistLimit(typeof d.limit === "number" ? d.limit : 2);
        }

        if (listRes.ok) {
          const d = await listRes.json();
          const items = (d.items ?? []) as WishlistSavedItem[];
          setWishlistSaved(items);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          onLoadCompleteRef.current?.();
        }
      });

    return () => { cancelled = true; };
  }, [studentId]);

  // Sync selectedOrder from saved nguyện vọng once faculties are loaded
  const facultiesKey = useMemo(
    () => faculties.map((f) => f.faculty_name).sort().join(","),
    [faculties]
  );
  useEffect(() => {
    if (faculties.length === 0) return;
    const names = wishlistSaved
      .filter((w) => faculties.some((f) => f.faculty_name === w.faculty_name))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((w) => w.faculty_name);
    setSelectedOrder(names);
  }, [wishlistSaved, facultiesKey, faculties]);

  const toggleSelect = useCallback((name: string) => {
    setSelectedOrder((prev) => {
      const idx = prev.indexOf(name);
      if (idx >= 0) return prev.filter((n) => n !== name);
      if (prev.length >= wishlistLimit) return prev;
      return [...prev, name];
    });
    setWishlistError(null);
  }, [wishlistLimit]);

  // ── Drag and drop handlers ──
  const handleDragStart = useCallback((idx: number) => {
    dragIndexRef.current = idx;
  }, []);

  const handleDragEnter = useCallback((idx: number) => {
    setDragOverIndex(idx);
  }, []);

  const handleDragEnd = useCallback(() => {
    const from = dragIndexRef.current;
    const to = dragOverIndex;
    if (from !== null && to !== null && from !== to) {
      setSelectedOrder((prev) => {
        const next = [...prev];
        const [item] = next.splice(from, 1);
        next.splice(to, 0, item);
        return next;
      });
    }
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }, [dragOverIndex]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); // Required to allow drop
  }, []);

  const handleSave = useCallback(async () => {
    if (!studentId) return;
    setWishlistSaving(true);
    setWishlistError(null);
    try {
      const res = await fetch(`/api/students/${studentId}/faculty-wishlist`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedOrder.map((faculty_name, sort_order) => ({ faculty_name, sort_order })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWishlistError(data?.error || "Không lưu được nguyện vọng");
        return;
      }
      setWishlistSaved(data.items ?? []);
    } catch (e) {
      setWishlistError(e instanceof Error ? e.message : "Lỗi lưu nguyện vọng");
    } finally {
      setWishlistSaving(false);
    }
  }, [studentId, selectedOrder]);

  const isSaveDisabled = wishlistSaving || (() => {
    const savedNames = wishlistSaved
      .filter((w) => faculties.some((f) => f.faculty_name === w.faculty_name))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((w) => w.faculty_name);
    return (
      selectedOrder.length === savedNames.length &&
      selectedOrder.every((name, i) => savedNames[i] === name)
    );
  })();

  // Unselected faculties (those not in selectedOrder)
  const unselectedFaculties = faculties.filter(
    (f) => !selectedOrder.includes(f.faculty_name)
  );

  if (!studentId) return null;

  const body = (
    <>
      {loading ? (
        <WishlistCardBodySkeleton rows={embedded ? 5 : 6} />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : faculties.length === 0 && !readOnly ? (
          /* ── Case 1: Chưa có AI recommendation ── */
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-500">
              <Sparkles className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-foreground mb-1">
                Bạn chưa có gợi ý ngành từ AI
              </p>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">
                Hãy làm bài trắc nghiệm và chạy tính năng &quot;Xem gợi ý ngành&quot; để khám phá ngành học phù hợp với bạn.
              </p>
            </div>
            <Link
              href="/student/tests"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold px-4 py-2 transition-colors"
            >
              <Sparkles className="size-4" />
              Xem gợi ý ngành
            </Link>
          </div>
        ) : readOnly ? (
          wishlistSaved.length === 0 ? (
            embedded ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                Chưa có ngành nào. Dùng nút{" "}
                <span className="font-medium text-foreground">Chỉnh sửa</span> ở trên
                để thêm và sắp xếp tại tab Ngành.
              </p>
            ) : (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-500 dark:bg-violet-900/30">
                  <Sparkles className="size-6" />
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-slate-800 dark:text-foreground">
                    Chưa có ngành trong nguyện vọng
                  </p>
                  <p className="text-xs text-slate-500 dark:text-muted-foreground">
                    Hãy chọn ngành tại trang Danh sách trường, tab Ngành.
                  </p>
                </div>
                <Link
                  href={manageHref}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-600"
                >
                  Mở danh sách ngành
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            )
          ) : (
            (() => {
              const sorted = [...wishlistSaved].sort(
                (a, b) => a.sort_order - b.sort_order,
              );
              const shouldCap = embedded && sorted.length > EMBEDDED_PREVIEW_LIMIT;
              const visible = shouldCap
                ? sorted.slice(0, EMBEDDED_PREVIEW_LIMIT)
                : sorted;
              const hiddenCount = sorted.length - EMBEDDED_PREVIEW_LIMIT;
              return (
                <div>
                  <ul className="m-0 list-none p-0">
                    {visible.map((item, idx) => (
                      <li
                        key={`${item.faculty_name}-${idx}`}
                        className="pc-rank-row text-sm"
                      >
                        <span className="pc-rank-num" aria-hidden>
                          {idx + 1}
                        </span>
                        <span className="min-w-0 flex-1 font-medium text-foreground">
                          {item.faculty_name}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {shouldCap ? (
                    <div className="mt-3 space-y-2 border-t border-[color-mix(in_srgb,#0f4c81_8%,transparent)] pt-3 dark:border-white/10">
                      <p className="text-center text-xs text-muted-foreground">
                        +{hiddenCount} ngành khác
                      </p>
                      <Link
                        href={manageHref}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-[#0f4c81] transition-colors hover:bg-[color-mix(in_srgb,#0f4c81_6%,transparent)] dark:text-sky-300 dark:hover:bg-sky-500/10"
                      >
                        Quản lý danh sách
                        <ArrowRight className="size-3.5" aria-hidden />
                      </Link>
                    </div>
                  ) : null}
                </div>
              );
            })()
          )
        ) : (
          /* ── Case 2: Có AI recommendation → Stepper Selection with Drag ── */
          <div className="space-y-4">
            {/* Selected faculties — drag-and-drop reorder */}
            {selectedOrder.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  Ngành đã chọn
                  <span className="font-normal normal-case">({selectedOrder.length}/{wishlistLimit})</span>
                  <span className="ml-auto font-normal normal-case text-[10px] text-slate-400 dark:text-muted-foreground/60 flex items-center gap-1">
                    <GripVertical className="size-3" /> Kéo để sắp xếp
                  </span>
                </p>
                <ul className="space-y-1.5">
                  {selectedOrder.map((name, idx) => (
                    <li
                      key={name}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragEnter={() => handleDragEnter(idx)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
                        dragOverIndex === idx && dragIndexRef.current !== idx
                          ? "border-violet-400 dark:border-violet-500 bg-violet-100/80 dark:bg-violet-900/40 scale-[1.01]"
                          : "border-violet-200 dark:border-violet-800/50 bg-violet-50/60 dark:bg-violet-900/20"
                      }`}
                    >
                      {/* Drag handle */}
                      <GripVertical className="size-4 shrink-0 text-violet-400 dark:text-violet-500" />
                      {/* Priority badge */}
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="flex-1 font-medium text-slate-800 dark:text-foreground truncate">
                        {name}
                      </span>
                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => toggleSelect(name)}
                        className="shrink-0 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        title="Bỏ chọn"
                      >
                        <X className="size-3.5 text-red-500" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Unselected faculty badges */}
            {unselectedFaculties.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wider">
                  {selectedOrder.length === 0 ? "Ngành gợi ý" : "Ngành chưa chọn"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {unselectedFaculties
                    .slice(0, isFree ? 5 : undefined)
                    .map((f) => {
                      const atLimit = selectedOrder.length >= wishlistLimit;
                      return (
                        <button
                          key={f.faculty_name}
                          type="button"
                          disabled={atLimit}
                          onClick={() => !atLimit && toggleSelect(f.faculty_name)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            atLimit
                              ? "border-slate-200 dark:border-border bg-slate-50 dark:bg-muted/20 text-slate-400 dark:text-muted-foreground cursor-not-allowed opacity-60"
                              : "border-slate-200 dark:border-border bg-white dark:bg-card hover:border-violet-400 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-slate-700 dark:text-foreground cursor-pointer"
                          }`}
                        >
                          {f.faculty_name}
                        </button>
                      );
                    })}
                  {isFree && faculties.length > 5 && (
                    <Link
                      href="/student/pricing"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                    >
                      <Lock className="size-3" />
                      +{faculties.length - 5} ngành bị ẩn — Nâng cấp để xem
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Save button + error */}
            {wishlistError && (
              <p className="text-xs text-red-500">{wishlistError}</p>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaveDisabled}
              className="w-full rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-2 transition-colors flex items-center justify-center gap-2"
            >
              {wishlistSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Lưu nguyện vọng ngành"
              )}
            </button>
          </div>
        )}
    </>
  );

  if (embedded) {
    return <div className="min-w-0">{body}</div>;
  }

  return (
    <section className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-violet-500/60 bg-white dark:bg-card dark:border-border dark:border-l-violet-500/60">
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 dark:border-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-linear-to-r from-blue-100 via-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/10 transition-colors duration-300">
        <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-foreground flex items-center gap-2">
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-500 shrink-0 dark:bg-purple-900/30">
            <Heart className="size-4" aria-hidden />
          </span>
          Nguyện vọng ngành
        </h3>
        <Link
          href={manageHref}
          className="text-sm font-medium text-purple-500 hover:underline flex items-center gap-1"
        >
          {readOnly ? "Mở trang chọn ngành" : "Quản lý"}
          <ChevronRight className="size-4" />
        </Link>
      </div>
      <div className="p-4 sm:p-5">{body}</div>
    </section>
  );
};
