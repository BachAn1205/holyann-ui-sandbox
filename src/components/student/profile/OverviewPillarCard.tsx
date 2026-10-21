"use client";

import React, { useState, useEffect } from "react";
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
  CartesianGrid,
  Cell,
} from "recharts";
import { BarChart3, Sparkles } from "lucide-react";
import { PageLoading } from "@/components/ui/PageLoading";

export type PillarScores = {
  aca: number;
  lan: number;
  hdnk: number;
  skill: number;
};

interface OverviewPillarCardProps {
  /** 4 trụ từ kết quả Đánh giá profile (Feature1). Khi null → hiển thị empty state. */
  pillarScores: PillarScores | null;
  /** Tên hiển thị (optional) */
  userName?: string;
  /** Gợi ý khi chưa có dữ liệu */
  onRunAnalysis?: () => void;
  analysisLoading?: boolean;
}

const PILLAR_LABELS: Record<keyof PillarScores, string> = {
  aca: "Học thuật",
  lan: "Ngoại ngữ",
  hdnk: "HDNK",
  skill: "Kỹ năng",
};

export function OverviewPillarCard({
  pillarScores,
  userName,
  onRunAnalysis,
  analysisLoading,
}: OverviewPillarCardProps) {
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

  const chartData =
    pillarScores &&
    (Object.keys(PILLAR_LABELS) as (keyof PillarScores)[]).map((key) => ({
      subject: PILLAR_LABELS[key],
      A: Math.min(100, Math.max(0, Number(pillarScores[key]) ?? 0)),
      fullMark: 100,
    }));

  const hasData = chartData && chartData.some((d) => d.A > 0);

  return (
    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <BarChart3 className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">
              Đánh giá tổng quan
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Theo 4 trụ từ kết quả phân tích profile
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {analysisLoading && (
          <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-border/60 bg-muted/30">
            <PageLoading inline size="lg" message="Đang phân tích hồ sơ của bạn..." className="py-0" />
            <p className="text-muted-foreground text-sm mt-2">AI đang đánh giá các yếu tố trong hồ sơ</p>
          </div>
        )}
        {!analysisLoading && !hasData && (
          <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl bg-muted/20 border border-dashed border-border/60 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground mb-4">
              <Sparkles className="size-7" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Chưa có dữ liệu tổng quan
            </p>
            <p className="text-xs text-muted-foreground max-w-[240px] mb-5">
              Chạy &quot;Đánh giá profile&quot; bên cạnh để phân tích hồ sơ. Đánh giá tổng quan sẽ hiển thị theo 4 trụ: Học thuật, Ngoại ngữ, HDNK, Kỹ năng.
            </p>
            {onRunAnalysis && (
              <button
                type="button"
                onClick={onRunAnalysis}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Sparkles className="size-4" />
                Phân tích hồ sơ
              </button>
            )}
          </div>
        )}

        {hasData && chartData && (
          <div className="space-y-6">
            {/* Biểu đồ 1: Radar: tạm tắt
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Biểu đồ radar</p>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={chartData}
                    margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                  >
                    <PolarGrid
                      stroke={isDark ? "hsl(var(--border))" : "#e2e8f0"}
                      strokeOpacity={0.8}
                    />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={false}
                      axisLine={false}
                    />
                    <Radar
                      name={userName || "Hồ sơ"}
                      dataKey="A"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="hsl(var(--primary))"
                      fillOpacity={0.35}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.[0]) {
                          const v =
                            typeof payload[0].value === "number"
                              ? payload[0].value.toFixed(1)
                              : payload[0].value;
                          return (
                            <div className="rounded-xl border border-border bg-card px-3 py-2.5 shadow-lg text-sm">
                              <p className="font-medium text-foreground">
                                {payload[0].payload.subject}
                              </p>
                              <p className="text-primary font-semibold">{v} / 100</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            */}
            {/* Biểu đồ 2: Cột */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Biểu đồ cột 4 trụ</p>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis type="category" dataKey="subject" width={90} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.[0]) {
                          const v =
                            typeof payload[0].value === "number"
                              ? payload[0].value.toFixed(1)
                              : payload[0].value;
                          return (
                            <div className="rounded-xl border border-border bg-card px-3 py-2.5 shadow-lg text-sm">
                              <p className="font-medium text-foreground">{payload[0].payload.subject}</p>
                              <p className="text-primary font-semibold">{v} / 100</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="A" name="Điểm" radius={[0, 4, 4, 0]} maxBarSize={32}>
                      {chartData.map((entry, index) => {
                        const colors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];
                        const fallback = ["hsl(var(--primary))", "hsl(142 76% 36%)", "hsl(262 83% 58%)", "hsl(38 92% 50%)"];
                        const color = colors[index] ?? fallback[index] ?? "hsl(var(--primary))";
                        return <Cell key={entry.subject} fill={color} fillOpacity={0.9} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Pillar pills */}
            <div className="flex flex-wrap gap-2 justify-center border-t border-border/60 pt-4">
              {chartData.map((d) => (
                <span
                  key={d.subject}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-foreground"
                >
                  <span className="text-muted-foreground">{d.subject}:</span>
                  <span className="text-primary font-semibold">{d.A.toFixed(0)}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
