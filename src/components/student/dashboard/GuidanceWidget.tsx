"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  is_completed: boolean;
  href: string;
}

interface OnboardingData {
  steps: OnboardingStep[];
  progress_percentage: number;
  completed_count: number;
}

const STEP_ICONS = ["📋", "👤", "🧠", "📝", "🎯", "📄", "✍️"];

function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-slate-200 rounded-full w-full" />
      <div className="h-3 bg-slate-200 rounded w-24" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100">
          <div className="h-10 w-10 bg-slate-200 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-3 bg-slate-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GuidanceWidget() {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/student/onboarding-progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled) {
          setData(json);
        }
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const steps = data?.steps ?? [];
  const progress = data?.progress_percentage ?? 0;
  const completedCount = data?.completed_count ?? 0;
  const activeStepId = steps.find((s) => !s.is_completed)?.id;

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-border/60 overflow-hidden relative w-full mb-6">
      <div className="p-6 border-b border-border/50 bg-gradient-to-br from-slate-50 to-blue-50/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2 uppercase tracking-wide">
            <Sparkles className="h-3 w-3" /> Hành trình của bạn
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Làm quen với nền tảng
          </h3>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            {loading ? "..." : `${completedCount}/7 bước hoàn thành`}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary font-bold text-lg px-4 py-2 rounded-xl border border-primary/20 shrink-0">
          <Star className="h-5 w-5 fill-primary text-primary" />
          {loading ? "–" : `${progress}%`}
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <SkeletonCard />
        ) : (
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner mb-6">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-blue-400 to-indigo-500 transition-all duration-1000 ease-out relative"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {!loading && progress === 100 && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 shrink-0" />
            <p className="font-semibold text-sm">Tuyệt vời! Bạn đã hoàn thành tất cả các bước khởi tạo!</p>
          </div>
        )}

        <div className="divide-y divide-border/40 max-h-[300px] overflow-y-auto custom-scrollbar">
          {!loading && steps.map((step, idx) => {
            const isActive = step.id === activeStepId;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 py-4 transition-all duration-300 ${
                  isActive ? "bg-blue-50/50 rounded-xl px-2 -mx-2" : ""
                } ${step.is_completed ? "opacity-75" : ""}`}
              >
                <div
                  className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm border-2 ${
                    step.is_completed
                      ? "bg-emerald-100 border-emerald-300 text-emerald-600"
                      : isActive
                        ? "bg-white border-blue-400 text-blue-600"
                        : "bg-slate-50 border-slate-200 grayscale"
                  }`}
                >
                  {step.is_completed ? <CheckCircle2 className="h-5 w-5" /> : STEP_ICONS[idx]}
                </div>

                <div className="flex-1 min-w-0 pr-2">
                  <p className={`font-bold text-sm ${
                    step.is_completed ? "text-emerald-700 line-through" : isActive ? "text-blue-700" : "text-foreground"
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {step.description}
                  </p>
                </div>

                <div className="shrink-0">
                  {!step.is_completed && (
                    <Button
                      asChild
                      size="sm"
                      variant={isActive ? "default" : "outline"}
                      className="text-xs rounded-lg"
                    >
                      <Link href={step.href}>
                        Làm ngay
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
