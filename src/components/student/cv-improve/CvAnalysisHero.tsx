"use client";

import React from "react";
import Link from "next/link";
import { FileUser, ArrowRight } from "lucide-react";

export function CvAnalysisHero() {
  return (
    <section
      aria-label="Cải thiện CV"
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
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white shadow-sm">
              <FileUser className="size-6" aria-hidden />
            </div>
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-sans font-semibold uppercase tracking-[0.22em] text-white/80">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-300" />
                Cải thiện CV
              </p>
              <h1 className="mt-2 font-university-display text-2xl font-bold leading-tight text-white sm:text-3xl">
                <span className="relative inline-block">Phân tích &amp; nâng cấp</span>
                <span className="mt-1 block bg-gradient-to-r from-[#FFD56A] via-white to-[#8BE9FF] bg-clip-text text-transparent">
                  CV du học
                </span>
              </h1>
              <p className="mt-3 max-w-[800px] text-sm leading-relaxed text-white/80">
                Verify CV tại đây hoặc tại Quản lý tài liệu, sau đó phân tích theo rubric và nhận bản cải thiện gợi ý.
              </p>
            </div>
          </div>
          <Link
            href="/student/manage-upload"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/40 bg-white/5 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/15"
          >
            Quản lý tài liệu
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
