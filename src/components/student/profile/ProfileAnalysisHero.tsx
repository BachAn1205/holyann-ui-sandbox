"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, ArrowRight } from "lucide-react";

export function ProfileAnalysisHero() {
  return (
    <section
      aria-label="Đánh giá hồ sơ"
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
              <BarChart3 className="size-6" aria-hidden />
            </div>
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-university-display font-semibold uppercase tracking-[0.2em] text-white/85">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                Phân tích hồ sơ
              </p>
              <h1 className="mt-2 font-university-display text-2xl font-extrabold tracking-wide leading-tight text-white sm:text-3xl">
                <span className="relative inline-block">
                  Đánh giá & cải thiện
                </span>
                <span className="block mt-1 bg-linear-to-r from-[#FFD56A] via-white to-[#8BE9FF] bg-clip-text text-transparent">
                  hồ sơ du học
                </span>
              </h1>
              <p className="mt-3 max-w-[800px] text-sm font-medium leading-relaxed text-white/85">
                Dữ liệu từ hồ sơ của bạn sẽ được dùng để phân tích 4 trụ cột,
                SWOT, vùng phù hợp, spikes và gợi ý cải thiện.
              </p>
            </div>
          </div>
          <Link
            href="/student/profile"
            className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/5 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/15 shrink-0"
          >
            Quay lại Hồ sơ
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
