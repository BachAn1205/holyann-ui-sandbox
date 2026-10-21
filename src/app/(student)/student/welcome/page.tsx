"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudentPageContainer } from "@/components/student";
import RoleGuard from "@/components/auth/RoleGuard";

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

// Đảm bảo icon đúng ý nghĩa từng bước checklist:
// 1: Nhập thông tin, 2: Hồ sơ cá nhân, 3: Phân tích hồ sơ, 4: Làm bài kiểm tra, 5: Phân tích ngành học, 6: Đăng tải CV, 7: Đăng tải Bài luận
const STEP_ICONS = [
  "📋", // 1. Nhập thông tin
  "👤", // 2. Hồ sơ cá nhân
  "🧠", // 3. Phân tích hồ sơ
  "📝", // 4. Làm bài kiểm tra
  "🎯", // 5. Phân tích ngành học
  "📄", // 6. Đăng tải CV
  "✍️"  // 7. Đăng tải Bài luận
];

function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-4">
      {/* Progress bar skeleton */}
      <div className="h-4 bg-slate-200 rounded-full w-full" />
      <div className="h-3 bg-slate-200 rounded w-24" />
      {/* Steps skeletons */}
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-xl border border-slate-100"
        >
          <div className="h-12 w-12 bg-slate-200 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-3 bg-slate-200 rounded w-2/3" />
          </div>
          <div className="h-9 w-28 bg-slate-200 rounded-lg flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

function useWindowSizeSafe() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return size;
}

export default function WelcomePage() {
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const { width, height } = useWindowSizeSafe();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/student/onboarding-progress")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (!cancelled) {
          setData(json);
          if (json?.progress_percentage === 100) {
            setShowConfetti(true);
          }
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

  // Find the first uncompleted step to highlight
  const activeStepId = steps.find((s) => !s.is_completed)?.id;

  return (
    <RoleGuard allowedRoles={["user", "student", "STUDENT"]}>
      <StudentPageContainer
        noPadding
        className="bg-gradient-to-br from-[#e0f2fe] via-white to-[#e0e7ff] transition-colors duration-500"
      >
        <div className="min-h-[calc(100vh-theme(spacing.14))] py-8 px-4 relative flex flex-col">
          {showConfetti && (
            <div
              className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
              aria-hidden
            >
              {Array.from({ length: Math.max(40, Math.floor(width / 30)) }).map(
                (_, idx) => (
                  <span
                    key={idx}
                    className="absolute top-[-10%] text-lg animate-[fall_3.8s_linear_forwards]"
                    style={{
                      left: `${(idx * 37) % Math.max(width, 1)}px`,
                      animationDelay: `${(idx % 12) * 0.12}s`,
                    }}
                  >
                    {idx % 2 === 0 ? "🎉" : "✨"}
                  </span>
                )
              )}
            </div>
          )}

          {/* Back button */}
          <div className="absolute top-6 left-4 md:top-6 md:left-8 z-10">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <Link href="/student/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Quay lại Dashboard
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="max-w-screen-2xl w-full mx-auto text-center mb-10 pt-10 md:pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              Bắt đầu hành trình của bạn
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 leading-tight">
              Chào mừng đến với{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
                Holyann Explore!
              </span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
              Hoàn thành 7 bước đơn giản dưới đây để làm quen với nền tảng và mở
              khóa toàn bộ tính năng hỗ trợ hành trình du học của bạn. 🚀
            </p>
          </div>

          {/* Main Layout Area */}
          <div className="max-w-screen-2xl w-full mx-auto flex flex-col md:flex-row justify-center items-start gap-12 px-4 md:px-8">
            {/* Left Column: Mascot & Chat Bubble */}
            <div className="w-full md:w-[350px] hidden md:flex flex-col items-center justify-center sticky top-24 pt-8 shrink-0">
              <div className="relative mb-6 mt-[100px] transform hover:scale-105 transition-transform duration-500">
                {/* Chat Bubble */}
                <div
                  className="absolute -top-16 -right-12 bg-white px-6 py-4 rounded-3xl rounded-bl-none shadow-xl border border-blue-100 z-10 animate-bounce"
                  style={{ animationDuration: "3s" }}
                >
                  <p className="text-lg font-medium text-slate-700 whitespace-nowrap">
                    {progress === 100
                      ? "Chúc mừng bạn nha! 🎉"
                      : "Cùng hoàn thành nhé! 💪"}
                  </p>
                </div>
                {/* Mascot Image Placeholder */}
                <div className="relative w-64 h-64 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-50 border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden">
                  <Image
                    src="/holy/Holie_tri_thức-removebg-preview.png"
                    alt="Holie Mascot"
                    fill
                    className="object-contain p-2 hover:scale-110 transition-transform duration-300"
                    priority
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Tiến độ Card */}
            <div className="w-full md:max-w-[700px] lg:max-w-[850px] flex-1">
              <div className="bg-white rounded-2xl shadow-2xl shadow-blue-900/10 border border-border/60 overflow-hidden relative">
                {/* Card Header — Progress */}
                <div className="p-6 border-b border-border/50 bg-gradient-to-br from-slate-50 to-blue-50/40">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Tiến trình làm quen
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-0.5">
                        {loading ? "..." : `${completedCount}/7`}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          bước hoàn thành
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-primary/10 text-primary font-bold text-lg px-4 py-2 rounded-xl border border-primary/20">
                      <Star className="h-5 w-5 fill-primary text-primary animate-pulse" />
                      {loading ? "–" : `${progress}%`}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary via-blue-400 to-indigo-500 transition-all duration-1000 ease-out relative"
                      style={{ width: loading ? "0%" : `${progress}%` }}
                    >
                      <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                  {!loading && progress === 100 && (
                    <p className="text-emerald-600 text-sm font-semibold mt-3 animate-fade-in flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> Tuyệt vời! Bạn đã
                      hoàn thành tất cả các bước!
                    </p>
                  )}
                </div>

                {/* Steps List */}
                <div className="divide-y divide-border/40">
                  {loading ? (
                    <div className="p-6">
                      <SkeletonCard />
                    </div>
                  ) : (
                    steps.map((step, idx) => {
                      const isActive = step.id === activeStepId;
                      return (
                        <div
                          key={step.id}
                          className={`flex items-center gap-4 px-6 py-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:bg-slate-50 relative bg-white ${
                            isActive
                              ? "z-10 ring-2 ring-[#0f4c81] ring-offset-2 m-2 rounded-xl"
                              : ""
                          } ${
                            step.is_completed
                              ? "bg-emerald-50/20 hover:bg-emerald-50"
                              : ""
                          }`}
                        >
                          {/* Icon / Number */}
                          <div
                            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-sm border-2 transition-all duration-500 ${
                              step.is_completed
                                ? "bg-emerald-100 border-emerald-300 scale-110"
                                : isActive
                                  ? "bg-blue-50 border-blue-400 text-blue-600 scale-110 shadow-blue-200"
                                  : "bg-white border-slate-200"
                            }`}
                          >
                            {step.is_completed ? (
                              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                            ) : (
                              <span>{STEP_ICONS[idx]}</span>
                            )}
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p
                                className={`font-semibold text-sm sm:text-base transition-colors ${
                                  step.is_completed
                                    ? "text-emerald-700 line-through decoration-emerald-400/60"
                                    : isActive
                                      ? "text-blue-900"
                                      : "text-foreground"
                                }`}
                              >
                                {step.id}. {step.title}
                              </p>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                              {step.description}
                            </p>
                          </div>

                          {/* Action */}
                          <div className="flex-shrink-0 ml-2">
                            {step.is_completed ? (
                              <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold text-sm px-3 py-1.5 bg-emerald-100 rounded-lg shadow-sm border border-emerald-200">
                                <CheckCircle2 className="h-4 w-4" />
                                Hoàn thành
                              </span>
                            ) : (
                              <Button
                                asChild
                                size={isActive ? "default" : "sm"}
                                variant={isActive ? "default" : "outline"}
                                className={`group gap-1 rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-all duration-300 ${
                                  isActive
                                    ? "animate-pulse shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105"
                                    : "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                                }`}
                              >
                                <Link href={step.href}>
                                  Thực hiện ngay
                                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </StudentPageContainer>
    </RoleGuard>
  );
}
