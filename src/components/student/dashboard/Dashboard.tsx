"use client";

import React from "react";
import { motion } from "framer-motion";
import { DashboardHero } from "./DashboardHero";
import { QuickStatsGrid } from "./QuickStatsGrid";

import { TaskCompletionChart } from "./charts/TaskCompletionChart";
import { UpcomingDeadlines } from "./UpcomingDeadlines";
import { RecentActivityFeed } from "./RecentActivityFeed";
import { AIInsightsPanel } from "./AIInsightsPanel";
import { StudentUpcomingMeetings } from "./StudentUpcomingMeetings";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { TargetGoalsCard } from "./TargetGoalsCard";
import { MarketingPostsCard } from "./MarketingPostsCard";
import { GuidanceWidget } from "./GuidanceWidget";
import { CalendarWidget } from "./CalendarWidget";
import { QuickAccessSection } from "./QuickAccessSection";
import type { DashboardData } from "./types";
import Link from "next/link";



interface DashboardProps {
  userName: string;
  /** Data from GET /api/student/dashboard – no mock, only real data */
  data: DashboardData | null;
  isLoading?: boolean;
  error?: string | null;
  isFreePlan?: boolean;
}

export default function Dashboard({
  userName,
  data,
  isLoading,
  error,
  isFreePlan = false,
}: DashboardProps) {
  if (isLoading) {
    return (
      <div className="px-6 py-8 sm:px-8 lg:px-8 max-w-[1600px] mx-auto">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="px-6 py-8 max-w-[1600px] mx-auto flex flex-col items-center justify-center min-h-[40vh]">
        <p className="text-muted-foreground">
          {error || "Không tải được dữ liệu dashboard."}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const customKpiCards = data ? [
    data.quickStats.find((s) => s.id === "gpa") || { id: "gpa", label: "GPA hiện tại", value: "-", icon: "GraduationCap", accent: "blue" },
    { id: "orientation", label: "Định hướng", value: data.currentGoal?.targetFacultyName || "Chưa thiết lập", icon: "Compass", accent: "emerald" },
    { id: "target", label: "Mục tiêu (Trường)", value: data.targetGoals?.length || 0, icon: "Target", accent: "rose" },
    data.quickStats.find((s) => s.id === "meetings") || { id: "meetings", label: "Số buổi tư vấn", value: 0, icon: "Video", accent: "violet" },
  ] : [];

  return (
    <div>
      <DashboardHero userName={userName} stats={data.quickStats} />
      <div className="min-h-[60vh] mx-auto px-4 sm:px-6 py-6 space-y-6">
        <QuickAccessSection
          targetGoalsCount={data.targetGoals?.length ?? 0}
          hasOrientation={Boolean(data.currentGoal?.targetFacultyName)}
          isPaid={!isFreePlan}
        />

        {!isFreePlan && (
          <div id="progress-section">
            <QuickStatsGrid items={customKpiCards as any} />
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Cột trái (65%) */}
          <div className="w-full lg:w-[65%] space-y-6 flex flex-col min-w-0">
            <GuidanceWidget />
            
            {data.marketingPosts && data.marketingPosts.length > 0 && (
              <MarketingPostsCard posts={data.marketingPosts} />
            )}

            {!isFreePlan && <RecentActivityFeed items={data.activity} />}
          </div>

          {/* Cột phải (35%) */}
          <div className="w-full lg:w-[35%] space-y-6 flex flex-col min-w-0">
            {!isFreePlan && (
              <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-black text-sm">✓</span>
                    Tiến độ
                  </h3>
                  <Link href="/student/checklist" className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                    Chi tiết
                  </Link>
                </div>
                <div className="p-5">
                  <TaskCompletionChart data={data.taskCompletion} />
                </div>
              </div>
            )}

            {!isFreePlan && <CalendarWidget deadlines={data.deadlines} />}
            
            {!isFreePlan && <AIInsightsPanel items={data.aiInsights} />}
          </div>
        </div>
      </div>
    </div>
  );
}


