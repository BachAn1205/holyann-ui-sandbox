"use client";

import React, { useEffect, useRef, useState } from "react";
import { Building2, ChevronRight, ArrowRight } from "lucide-react";
import { WishlistCardBodySkeleton } from "@/components/student/profile/components/WishlistCardBodySkeleton";
import Link from "next/link";

/** Số trường ưu tiên cao nhất hiện trên profile (tóm tắt). */
const EMBEDDED_PREVIEW_LIMIT = 5;

interface SchoolWishlistCardProps {
  studentId: string | null;
  /** Chỉ nội dung danh sách / skeleton, không bọc card + header. */
  embedded?: boolean;
  manageHref?: string;
  /** Gọi một lần khi fetch danh sách xong (thành công hoặc lỗi). */
  onLoadComplete?: () => void;
}

type WishlistItem = { university_id: number; name: string; sort_order: number };

export const SchoolWishlistCard: React.FC<SchoolWishlistCardProps> = ({
  studentId,
  embedded = false,
  manageHref = "/student/universities",
  onLoadComplete,
}) => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(!!studentId);
  const [error, setError] = useState<string | null>(null);
  const onLoadCompleteRef = useRef(onLoadComplete);
  onLoadCompleteRef.current = onLoadComplete;

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/students/${studentId}/school-wishlist`)
      .then((res) => {
        if (!res.ok) throw new Error("Lỗi tải nguyện vọng");
        return res.json();
      })
      .then((data: { items?: WishlistItem[] }) => {
        if (!cancelled) {
          setItems(Array.isArray(data.items) ? data.items : []);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Lỗi");
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          onLoadCompleteRef.current?.();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (!studentId) return null;

  const body = (
    <>
      {loading ? (
        <WishlistCardBodySkeleton rows={5} />
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : items.length === 0 ? (
        embedded ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            Chưa có trường nào. Dùng nút{" "}
            <span className="font-medium text-foreground">Chỉnh sửa</span> ở trên
            để thêm và sắp xếp tại trang Danh sách trường.
          </p>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-500 dark:bg-violet-900/30">
              <Building2 className="size-6" />
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-slate-800 dark:text-foreground">
                Chưa có trường trong nguyện vọng
              </p>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">
                Khám phá Danh sách trường và lưu lại lựa chọn của bạn.
              </p>
            </div>
            <Link
              href={manageHref}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-600"
            >
              <Building2 className="size-4" aria-hidden />
              Mở danh sách trường
            </Link>
          </div>
        )
      ) : (
        (() => {
          const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
          const shouldCap = embedded && sorted.length > EMBEDDED_PREVIEW_LIMIT;
          const visible = shouldCap
            ? sorted.slice(0, EMBEDDED_PREVIEW_LIMIT)
            : sorted;
          const hiddenCount = sorted.length - EMBEDDED_PREVIEW_LIMIT;
          return (
            <div>
              <ul className="m-0 list-none p-0">
                {visible.map((item, index) => (
                  <li
                    key={`${item.university_id}-${item.sort_order}-${index}`}
                    className="pc-rank-row text-sm"
                  >
                    <span className="pc-rank-num" aria-hidden>
                      {index + 1}
                    </span>
                    <Link
                      href={`/student/universities/${item.university_id}?from=${encodeURIComponent("/student/profile")}`}
                      className="min-w-0 flex-1 truncate text-left font-medium text-foreground hover:underline"
                    >
                      {item.name || `Trường #${item.university_id}`}
                    </Link>
                  </li>
                ))}
              </ul>
              {shouldCap ? (
                <div className="mt-3 space-y-2 border-t border-[color-mix(in_srgb,#0f4c81_8%,transparent)] pt-3 dark:border-white/10">
                  <p className="text-center text-xs text-muted-foreground">
                    +{hiddenCount} trường khác
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
      )}
    </>
  );

  if (embedded) {
    return <div className="min-w-0">{body}</div>;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-l-4 border-slate-200 border-l-violet-500/60 bg-white shadow-sm dark:border-border dark:border-l-violet-500/60 dark:bg-card">
      <div className="flex flex-col gap-3 border-b border-slate-200 bg-linear-to-r from-blue-100 via-blue-50 to-cyan-50 px-4 py-3 transition-colors duration-300 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4 dark:border-border dark:from-blue-900/30 dark:to-cyan-900/10">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 sm:text-base dark:text-foreground">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-500 sm:h-9 sm:w-9 dark:bg-purple-900/30">
            <Building2 className="size-4" aria-hidden />
          </span>
          Nguyện vọng trường
        </h3>
        <Link
          href={manageHref}
          className="flex items-center gap-1 text-sm font-medium text-purple-500 hover:underline"
        >
          Quản lý
          <ChevronRight className="size-4" />
        </Link>
      </div>
      <div className="p-4 sm:p-5">{body}</div>
    </section>
  );
};
