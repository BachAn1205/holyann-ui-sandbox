"use client";

import React, { useEffect, useState } from "react";
import { Star, X, Loader2 } from "lucide-react";
import Link from "next/link";

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

let globalCachedData: OnboardingData | null = null;
let globalFetchPromise: Promise<OnboardingData | null> | null = null;

interface TaskGuideModalProps {
  onClose: () => void;
}

export function TaskGuideModal({ onClose }: TaskGuideModalProps) {
  const [data, setData] = useState<OnboardingData | null>(globalCachedData);
  const [loading, setLoading] = useState(!globalCachedData);

  useEffect(() => {
    let cancelled = false;

    const doFetch = () => {
      const promise = fetch("/api/student/onboarding-progress")
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          globalCachedData = json;
          return json;
        })
        .catch(() => null);
      
      globalFetchPromise = promise;
      return promise;
    };

    // If we have no promise, or we want to revalidate in background
    const promise = globalFetchPromise || doFetch();

    promise.then((json) => {
      if (!cancelled) {
        setData(json);
        setLoading(false);
      }
    });

    // Force a background revalidation to keep data fresh
    if (globalCachedData) {
      doFetch().then((json) => {
        if (!cancelled && json) setData(json);
      });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const steps = data?.steps ?? [];
  const completedCount = data?.completed_count ?? 0;
  const progress = data?.progress_percentage ?? 0;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[70] flex items-end justify-end p-4 pb-28 pr-6"
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className="
          relative w-80 rounded-2xl shadow-2xl border border-border
          bg-background/95 backdrop-blur-md
          animate-in slide-in-from-bottom-4 fade-in-0 duration-300
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h3 className="font-semibold text-sm text-foreground">
              Task Khởi Đầu
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {loading ? "..." : `${completedCount}/${steps.length} đã hoàn thành`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-4 pt-3 pb-1">
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Task list */}
        <ul className="px-3 pb-3 pt-1 space-y-1 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            steps.map((task) => (
              <li key={task.id}>
                <Link
                  href={task.href}
                  onClick={onClose}
                  className={`
                    flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl
                    transition-colors duration-200
                    ${task.is_completed
                      ? "bg-green-50 dark:bg-green-950/30"
                      : "bg-muted/40 hover:bg-muted/70"
                    }
                  `}
                >
                  {/* Task number + name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`
                        flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                        ${task.is_completed
                          ? "bg-emerald-500 text-white"
                          : "bg-muted text-muted-foreground"
                        }
                      `}
                    >
                      {task.id}
                    </span>
                    <span
                      className={`text-sm truncate ${
                        task.is_completed
                          ? "text-emerald-700 dark:text-emerald-400 line-through"
                          : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  {/* Star indicator */}
                  <span
                    className={`
                      flex-shrink-0 flex items-center justify-center
                      w-7 h-7 rounded-lg transition-colors duration-200
                      ${task.is_completed ? "bg-green-100 dark:bg-green-900/50" : ""}
                    `}
                  >
                    <Star
                      className={`w-4 h-4 transition-all duration-200 ${
                        task.is_completed
                          ? "fill-yellow-400 text-yellow-500"
                          : "text-muted-foreground/50"
                      }`}
                    />
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-border bg-muted/30 rounded-b-2xl">
          <p className="text-xs text-muted-foreground text-center">
            Hoàn thành task để mở khóa tính năng ✨
          </p>
        </div>
      </div>
    </div>
  );
}

export default TaskGuideModal;
