"use client";

import React, { useEffect, useState } from "react";
import { Target, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";

interface TargetGoalCardProps {
  studentId: string | null;
}

type GoalItem = {
  id: string;
  faculty_name: string;
  university_name: string;
  sort_order: number;
};

export const TargetGoalCard: React.FC<TargetGoalCardProps> = ({ studentId }) => {
  const [items, setItems] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(!!studentId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/students/${studentId}/target-goal`)
      .then((res) => {
        if (!res.ok) throw new Error("Lỗi tải mục tiêu");
        return res.json();
      })
      .then((data: { goals?: GoalItem[] }) => {
        if (!cancelled) {
          setItems(
            Array.isArray(data.goals)
              ? [...data.goals].sort((a, b) => a.sort_order - b.sort_order)
              : []
          );
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Lỗi");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (!studentId) return null;

  return (
    <section className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden border-l-4 border-l-red-500/60 bg-white dark:bg-card dark:border-border dark:border-l-red-500/60">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 dark:border-border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-gradient-to-r from-blue-100 via-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/10 transition-colors duration-300">
        <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-foreground flex items-center gap-2">
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-red-50 text-red-500 shrink-0 dark:bg-red-900/30">
            <Target className="size-4" aria-hidden />
          </span>
          Mục tiêu của tôi
        </h3>
        <Link
          href="/student/target"
          className="text-sm font-medium text-red-500 hover:underline flex items-center gap-1"
        >
          Quản lý
          <ChevronRight className="size-4" />
        </Link>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-slate-500 dark:text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-sm text-slate-500 dark:text-muted-foreground">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-muted-foreground">
            Chưa có mục tiêu nào.{" "}
            <Link href="/student/target" className="text-red-500 hover:underline font-medium">
              Thiết lập mục tiêu
            </Link>{" "}
            ngay để định hướng lộ trình học tập của bạn!
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={item.id}
                className="flex items-start gap-2.5 text-sm text-slate-900 dark:text-foreground"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-900/30 font-medium text-xs mt-0.5">
                  {index + 1}
                </span>
                <span>
                  <span className="font-medium text-[#0052FF]">{item.faculty_name}</span>
                  <span className="text-slate-500 dark:text-muted-foreground"> tại </span>
                  <span className="text-slate-800 dark:text-foreground">{item.university_name}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
