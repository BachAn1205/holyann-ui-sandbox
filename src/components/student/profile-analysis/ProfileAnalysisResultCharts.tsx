"use client";

import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { ProfileAnalysisLockedOverlay } from "@/components/student/profile-analysis/ProfileAnalysisUpgradePrompt";
import type {
  Feature1AnalysisOutput,
  Feature1AreaBlock,
} from "@/lib/schemas/profile-analysis-v2.schema";
import { normalizePillarScoreTo100 } from "@/lib/pillar-scores";

const PILLAR_LABELS: Record<
  "academic" | "language" | "extracurricular" | "skills",
  string
> = {
  academic: "Học thuật",
  language: "Ngoại ngữ",
  extracurricular: "Ngoại khóa",
  skills: "Kỹ năng",
};

const PILLAR_KEYS = [
  "academic",
  "language",
  "extracurricular",
  "skills",
] as const;

const BAR_COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b"];

/** @deprecated Dùng normalizePillarScoreTo100 từ @/lib/pillar-scores */
export function normalizeScoreTo100(v: number | undefined): number {
  return normalizePillarScoreTo100(v);
}

function pillarScoresToRadar(
  pillar_scores: Feature1AnalysisOutput["pillar_scores"],
): Array<{ subject: string; score: number }> {
  return PILLAR_KEYS.map((key) => ({
    subject: PILLAR_LABELS[key],
    score: normalizePillarScoreTo100(pillar_scores[key]),
  }));
}

function areaScoresToBar(area: Feature1AreaBlock): Array<{ name: string; value: number }> {
  const sc = area.score;
  return PILLAR_KEYS.map((key) => ({
    name: PILLAR_LABELS[key],
    value: normalizePillarScoreTo100(sc[key]),
  }));
}

function suitabilityLevelBadgeClass(level: string): string {
  const l = level.toLowerCase();
  if (l === "high")
    return "border-emerald-500/40 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200";
  if (l === "medium")
    return "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-200";
  return "border-slate-400/40 bg-slate-500/10 text-slate-800 dark:text-slate-200";
}

const AREA_KEYS = ["A", "B", "C"] as const;

function useChartTheme() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);
  return {
    isDark,
    gridStroke: isDark ? "#475569" : "#e2e8f0",
    tickFill: isDark ? "#94a3b8" : "#64748b",
    radarStroke: isDark ? "#38bdf8" : "#0284c7",
  };
}

interface ProfileAnalysisResultChartsProps {
  pillar_scores: Feature1AnalysisOutput["pillar_scores"];
  areas: Feature1AnalysisOutput["areas"];
  /** Gói Free: giữ nguyên layout biểu đồ vùng, làm mờ + nút nâng cấp */
  regionalLocked?: boolean;
}

export function ProfileAnalysisResultCharts({
  pillar_scores,
  areas,
  regionalLocked = false,
}: ProfileAnalysisResultChartsProps) {
  const { gridStroke, tickFill, radarStroke } = useChartTheme();
  const radarData = pillarScoresToRadar(pillar_scores);

  return (
    <div className="space-y-10">
      {/* Radar: điểm tổng 4 trụ (pillar_scores) */}
      <div className="rounded-xl border border-sky-500/20 bg-white/50 dark:bg-white/5 p-4 sm:p-5">
        <h4 className="text-sm font-semibold text-sky-700 dark:text-sky-300 mb-1">
          Bốn trụ cột tổng thể
        </h4>
        <p className="text-xs text-muted-foreground mb-4 max-w-xl">
          So sánh học thuật, ngoại ngữ, hoạt động ngoại khóa và kỹ năng trên cùng thang 0–100 (API có thể trả 0–1,
          đã quy đổi để hiển thị).
        </p>
        <div className="h-[min(300px,65vw)] w-full max-w-md mx-auto [&_.recharts-text]:fill-foreground">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="78%" data={radarData}>
              <PolarGrid stroke={gridStroke} />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: tickFill, fontSize: 11, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: tickFill, fontSize: 10 }}
                tickCount={5}
              />
              <Radar
                name="Điểm trụ"
                dataKey="score"
                stroke={radarStroke}
                strokeWidth={2}
                fill={radarStroke}
                fillOpacity={0.35}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const row = payload[0].payload as { subject: string; score: number };
                  return (
                    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-sm">
                      <p className="font-medium text-foreground">{row.subject}</p>
                      <p className="text-primary font-semibold tabular-nums">
                        {typeof row.score === "number" ? row.score.toFixed(1) : row.score}
                        /100
                      </p>
                    </div>
                  );
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ba vùng A/B/C — Free: cùng layout/size, làm mờ + overlay nâng cấp */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-1">
          Theo từng vùng địa lý (A, B, C)
        </h4>
        <p className="text-xs text-muted-foreground mb-5 max-w-2xl">
          Mỗi vùng có <span className="font-medium text-foreground">đóng góp có trọng số</span> theo 4 trụ (giá trị gốc
          0–1; biểu đồ hiển thị ×100). Dưới đây là mức phù hợp và nhận xét theo API.
        </p>
        <div
          className={
            regionalLocked
              ? "relative overflow-hidden rounded-xl"
              : undefined
          }
        >
          <div
            className={
              regionalLocked
                ? "blur-[4px] select-none opacity-[0.72] pointer-events-none"
                : undefined
            }
          >
            <div className="grid gap-8 lg:grid-cols-3">
              {AREA_KEYS.map((key) => {
                const area = areas[key];
                const barData = areaScoresToBar(area);
                const maxVal = Math.max(...barData.map((d) => d.value), 5);
                const safeMax = Number.isFinite(maxVal) ? maxVal : 5;
                const yMax = Math.min(
                  100,
                  Math.max(
                    8,
                    Math.ceil((safeMax * 1.12) / 5) * 5 + (safeMax > 30 ? 5 : 0),
                  ),
                );

                return (
                  <div
                    key={key}
                    className="flex flex-col rounded-xl border border-border/80 bg-card/60 p-4 shadow-sm ring-1 ring-border/40"
                  >
                    <div className="mb-3 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                        Vùng {key}
                      </p>
                      <p className="text-base font-semibold text-foreground leading-snug">{area.name}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">Độ phù hợp</span>
                        <span className="text-sm font-bold tabular-nums text-foreground">
                          {(area.suitability * 100).toFixed(0)}%
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold uppercase tracking-wide ${suitabilityLevelBadgeClass(area.suitability_level)}`}
                        >
                          {area.suitability_level}
                        </Badge>
                      </div>
                    </div>

                    <div className="h-52 min-h-52 w-full min-w-0 flex-1 [&_.recharts-text]:fill-foreground">
                      <ResponsiveContainer width="100%" height="100%" minHeight={208}>
                        <BarChart data={barData} margin={{ top: 8, right: 6, left: 4, bottom: 4 }}>
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 9 }}
                            interval={0}
                            angle={-30}
                            textAnchor="end"
                            height={54}
                          />
                          <YAxis
                            hide
                            domain={[0, yMax]}
                            width={36}
                            tick={{ fontSize: 9 }}
                            tickFormatter={(v) => `${v}`}
                          />
                          <Tooltip
                            cursor={{ fill: "var(--muted)" }}
                            contentStyle={{
                              borderRadius: "0.75rem",
                              border: "1px solid var(--border)",
                              backgroundColor: "var(--card)",
                              fontSize: "0.8125rem",
                            }}
                            formatter={(value: number) => [
                              `${typeof value === "number" ? value.toFixed(1) : value} (×100)`,
                              "Đóng góp trụ",
                            ]}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {barData.map((_, i) => (
                              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {area.reason?.trim() && (
                      <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                          Nhận xét
                        </p>
                        <p className="text-sm leading-relaxed text-foreground">{area.reason}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {regionalLocked && (
            <ProfileAnalysisLockedOverlay
              tone="sky"
              label="Nâng cấp Plus/Premium để xem rõ phân tích theo vùng"
            />
          )}
        </div>
      </div>
    </div>
  );
}
