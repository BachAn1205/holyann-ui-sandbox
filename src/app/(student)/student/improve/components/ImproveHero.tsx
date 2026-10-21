"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function firstSentence(text: string, maxWords = 12): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const words = trimmed.split(/\s+/).slice(0, maxWords);
  return words.join(" ");
}

export interface ImproveHeroProps {
  /** Overall score 0–100; null = no data */
  overallScore: number | null;
  /** e.g. +5 or -2; null = no trend */
  trendValue?: number | null;
  /** Short insight (max 12 words) */
  insight?: string | null;
  loading?: boolean;
}

export function ImproveHero({
  overallScore,
  trendValue,
  insight,
  loading,
}: ImproveHeroProps) {
  const score = overallScore != null ? Math.round(Math.min(100, Math.max(0, overallScore))) : null;
  const trend = trendValue != null ? trendValue : null;
  const shortInsight = insight ? firstSentence(insight, 12) : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative mb-6 w-full overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(135deg, var(--primary) 0%, var(--brand-deep) 50%, var(--brand-cyan) 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 right-1/4 h-40 w-80 rounded-full bg-(--brand-cyan)/20 blur-2xl" />

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative flex flex-col gap-8 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10 sm:py-10">
        <div className="min-w-0">
          <p className="text-[11px] font-sans font-semibold uppercase tracking-[0.22em] text-white/60">
            Trung tâm cải thiện hồ sơ
          </p>
          <h1 className="mt-2 font-heading text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
            Trung tâm cải thiện của bạn
          </h1>
          {shortInsight && !loading && (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75">
              {shortInsight}
              {insight && insight.split(/\s+/).length > 12 ? "…" : ""}
            </p>
          )}
          {loading && (
            <div className="mt-3 h-5 w-64 rounded bg-white/20 animate-pulse" />
          )}
        </div>

        <div className="flex items-center gap-6 shrink-0">
          {/* Radial progress */}
          <div className="relative h-24 w-24 sm:h-28 sm:w-28">
            {loading ? (
              <div className="h-full w-full rounded-full bg-white/20 animate-pulse" />
            ) : (
              <>
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/25"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="none"
                    d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                  />
                  <motion.path
                    className="text-white"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: score != null ? score / 100 : 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl font-bold tabular-nums text-white">
                    {score != null ? score : ":"}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Monthly trend */}
          {!loading && (
            <div className="text-center">
              <p className="text-xs font-medium text-white/70 uppercase tracking-wider">
                Xu hướng
              </p>
              {trend != null ? (
                <p
                  className={cn(
                    "mt-0.5 text-lg font-semibold tabular-nums",
                    trend >= 0 ? "text-emerald-200" : "text-rose-200"
                  )}
                >
                  {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
                </p>
              ) : (
                <p className="mt-0.5 text-sm text-white/70">:</p>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
