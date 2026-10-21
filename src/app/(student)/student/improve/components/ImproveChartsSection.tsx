"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrendDataPoint {
  label: string;
  value: number;
}

export interface ImproveChartsSectionProps {
  /** Performance over time (e.g. last 6 weeks) */
  trendData?: TrendDataPoint[];
  /** Subject comparison: name + score */
  comparisonData?: { name: string; score: number }[];
  /** Short AI insight bullets (max 5–6) */
  insights?: string[];
  loading?: boolean;
}

const CHART_COLOR = "var(--primary)";
const MUTED = "var(--muted-foreground)";

export function ImproveChartsSection({
  trendData = [],
  comparisonData = [],
  insights = [],
  loading,
}: ImproveChartsSectionProps) {
  const hasTrend = trendData.length > 0;
  const hasComparison = comparisonData.length > 0;
  const hasInsights = insights.length > 0;

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="h-5 w-32 rounded bg-muted/60 animate-pulse mb-4" />
            <div className="h-[220px] rounded-lg bg-muted/40 animate-pulse" />
          </div>
          <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="h-5 w-40 rounded bg-muted/60 animate-pulse mb-4" />
            <div className="h-[220px] rounded-lg bg-muted/40 animate-pulse" />
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="h-5 w-28 rounded bg-muted/60 animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-full rounded bg-muted/40 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend line chart */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Xu hướng hiệu suất
          </h3>
          {hasTrend ? (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={trendData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: MUTED }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: MUTED }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--card-foreground)",
                    }}
                    formatter={(value: number) => [value, "Score"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={CHART_COLOR}
                    strokeWidth={2}
                    dot={{ fill: CHART_COLOR, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center rounded-lg bg-muted/30 text-sm text-muted-foreground">
              Chạy phân tích để xem xu hướng.
            </div>
          )}
        </motion.div>

        {/* Subject comparison bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Subject comparison
          </h3>
          {hasComparison ? (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={comparisonData}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: MUTED }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: MUTED }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--card-foreground)",
                    }}
                    formatter={(value: number) => [value, "Score"]}
                  />
                  <Bar
                    dataKey="score"
                    fill={CHART_COLOR}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center rounded-lg bg-muted/30 text-sm text-muted-foreground">
              Chưa có điểm để so sánh.
            </div>
          )}
        </motion.div>
      </div>

      {/* AI insights panel */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI insights
        </h3>
        {hasInsights ? (
          <ul className="space-y-2 list-none">
            {insights.slice(0, 6).map((line, i) => (
              <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70 mt-1.5" />
                <span className="min-w-0">{line}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Chạy phân tích Hồ sơ, CV hoặc Luận để xem gợi ý AI tại đây.
          </p>
        )}
      </motion.div>
    </section>
  );
}
