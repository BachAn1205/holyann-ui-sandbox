"use client";

import React from "react";
import { motion } from "framer-motion";

interface ChecklistHeaderProps {
  /** 0–100 overall completion */
  progressPercent: number;
  /** e.g. "68% completed this week" */
  subtitle?: string;
}

export function ChecklistHeader({
  progressPercent,
  subtitle = "Hoàn thành các đầu việc để tiến gần hơn tới hồ sơ du học.",
}: ChecklistHeaderProps) {
  const clamped = Math.min(100, Math.max(0, progressPercent));

  return (
    <section
      aria-label="Tiến độ hồ sơ du học"
      className="relative mb-6 overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(135deg, var(--primary) 0%, var(--brand-deep) 50%, var(--brand-cyan) 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 right-1/4 h-40 w-80 rounded-full bg-[var(--brand-cyan)]/20 blur-2xl" />

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative px-6 py-8 sm:px-10 sm:py-10">
        <div className="max-w-6xl mx-auto">
          {/* Label */}
          <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.22em] text-white/60">
            Lộ trình tiến độ
          </p>

          {/* Heading */}
          <h1 className="mt-2 font-heading text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
            Tiến độ hồ sơ du học
          </h1>

          {/* Subtitle */}
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/70">
            {subtitle}
          </p>

          {/* Progress bar + percent */}
          <div className="mt-6 max-w-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-sans text-white/70">
              <span>Tiến độ tổng thể</span>
              <motion.span
                className="font-semibold text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {Math.round(clamped)}%
              </motion.span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
              <motion.div
                className="h-full rounded-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(4, clamped)}%` }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
