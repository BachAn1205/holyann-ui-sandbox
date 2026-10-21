"use client";

import React from "react";
import Link from "next/link";
import { FileText, ArrowRight } from "lucide-react";

export function EssayAnalysisHero() {
  return (
    <section
      aria-label="Cải thiện bài luận"
      className="relative mb-8 overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(135deg, var(--primary) 0%, var(--brand-deep) 50%, var(--brand-cyan) 100%)",
      }}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 right-1/4 h-40 w-80 rounded-full bg-[var(--brand-cyan)]/20 blur-2xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative px-6 py-8 sm:px-10 sm:py-10">
        <div className="max-w-6xl mx-auto flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white shadow-sm">
              <FileText className="size-6" aria-hidden />
            </div>
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-sans font-semibold uppercase tracking-[0.22em] text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-300 animate-pulse" />
                Cải thiện luận
              </p>
              <h1 className="mt-2 font-university-display text-2xl font-bold leading-tight text-white sm:text-3xl">
                <span className="relative inline-block">Phân tích &amp; cải thiện</span>
                <span className="block mt-1 bg-gradient-to-r from-[#FFD56A] via-white to-[#8BE9FF] bg-clip-text text-transparent">
                  bài luận ứng tuyển
                </span>
              </h1>
              <p className="mt-3 max-w-[800px] text-sm leading-relaxed text-white/80">
                Chọn bài luận từ tài liệu đã lưu, chạy phân tích theo tiêu chí học thuật, sau đó nhận gợi ý chỉnh sửa cụ thể.
              </p>
            </div>
          </div>
          <Link
            href="/student/manage-upload"
            className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/5 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/15 shrink-0"
          >
            Quản lý tài liệu
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
