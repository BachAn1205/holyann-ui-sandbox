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
} from "recharts";
import { StudentProfile } from "../../../types";

interface RadarChartCardProps {
  profile: StudentProfile;
  chartData: Array<{ subject: string; A: number; fullMark: number }>;
}

export const RadarChartCard: React.FC<RadarChartCardProps> = ({
  profile,
  chartData,
}) => {
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

  const strokeFill = isDark ? "#60a5fa" : "#0f6093";
  const gridStroke = isDark ? "#475569" : "#e2e8f0";
  const tickFill = isDark ? "#94a3b8" : "#64748b";

  return (
    <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-emerald-500/60 bg-white">
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 bg-gradient-to-r from-blue-100 via-blue-50 to-cyan-50 flex flex-row items-center gap-2 sm:gap-3">
        <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-500  shrink-0">
          <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
        </div>
        <h3 className="text-sm sm:text-base font-semibold text-slate-900 m-0">
          Đánh giá tổng quan
        </h3>
      </div>
      <div className="p-4 sm:p-5">
        <div className="h-44 sm:h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke={gridStroke} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: tickFill, fontSize: 11, fontWeight: 500 }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name={profile.name}
              dataKey="A"
              stroke={strokeFill}
              strokeWidth={2}
              fill={strokeFill}
              fillOpacity={0.4}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload?.[0]) {
                  const v =
                    typeof payload[0].value === "number"
                      ? payload[0].value.toFixed(0)
                      : payload[0].value;
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
                      <p className="text-sm font-medium text-slate-900">
                        {payload[0].payload.subject}
                      </p>
                      <p className="text-sm text-blue-500 font-medium">{v}%</p>
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
    </div>
  );
};
