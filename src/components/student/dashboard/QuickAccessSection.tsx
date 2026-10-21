"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User,
  ClipboardList,
  Sparkles,
  GraduationCap,
  MessageCircle,
  Target,
  FileUser,
  FileBarChart,
  Mic,
  Video,
  CalendarClock,
  CheckSquare,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

const STUDENT_BASE = "/student";

export type JourneyStage = "explore" | "build" | "choose" | "mentor";

type QuickLink = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const STAGE_META: Record<
  JourneyStage,
  { title: string; hint: string; links: QuickLink[] }
> = {
  explore: {
    title: "Bắt đầu hành trình",
    hint: "Hoàn thiện định hướng trước khi chọn trường",
    links: [
      { name: "Hồ sơ", href: `${STUDENT_BASE}/profile`, icon: User },
      { name: "Trắc nghiệm", href: `${STUDENT_BASE}/tests`, icon: ClipboardList },
      {
        name: "Danh sách trường",
        href: `${STUDENT_BASE}/universities`,
        icon: GraduationCap,
      },
      { name: "Mục tiêu", href: `${STUDENT_BASE}/target`, icon: Target },
      {
        name: "Phân tích hồ sơ",
        href: `${STUDENT_BASE}/profile-analysis`,
        icon: Sparkles,
      },
      {
        name: "Cải thiện CV",
        href: `${STUDENT_BASE}/cv-improve`,
        icon: FileUser,
      },
    ],
  },
  build: {
    title: "Xây hồ sơ ứng tuyển",
    hint: "Bạn đã có hướng đi — củng cố tài liệu và bài viết",
    links: [
      { name: "Hồ sơ", href: `${STUDENT_BASE}/profile`, icon: User },
      { name: "Cải thiện CV", href: `${STUDENT_BASE}/cv-improve`, icon: FileUser },
      {
        name: "Cải thiện luận",
        href: `${STUDENT_BASE}/essay-improve`,
        icon: Sparkles,
      },
      {
        name: "Phỏng vấn thử",
        href: `${STUDENT_BASE}/mock-interview`,
        icon: Mic,
      },
      { name: "Mục tiêu", href: `${STUDENT_BASE}/target`, icon: Target },
      { name: "Báo cáo", href: `${STUDENT_BASE}/reports`, icon: FileBarChart },
    ],
  },
  choose: {
    title: "Chọn trường & theo dõi",
    hint: "Ưu tiên nguyện vọng và xem lại kết quả phân loại",
    links: [
      {
        name: "Danh sách trường",
        href: `${STUDENT_BASE}/universities`,
        icon: GraduationCap,
      },
      { name: "Mục tiêu", href: `${STUDENT_BASE}/target`, icon: Target },
      { name: "Báo cáo", href: `${STUDENT_BASE}/reports`, icon: FileBarChart },
      {
        name: "Phân tích hồ sơ",
        href: `${STUDENT_BASE}/profile-analysis`,
        icon: Sparkles,
      },
      {
        name: "Cải thiện luận",
        href: `${STUDENT_BASE}/essay-improve`,
        icon: FileUser,
      },
      { name: "Hồ sơ", href: `${STUDENT_BASE}/profile`, icon: User },
    ],
  },
  mentor: {
    title: "Đồng hành với Cố vấn",
    hint: "Dùng quyền Premium để được hỗ trợ trực tiếp",
    links: [
      {
        name: "Trao đổi",
        href: `${STUDENT_BASE}/chat`,
        icon: MessageCircle,
      },
      { name: "Đặt lịch", href: `${STUDENT_BASE}/meeting`, icon: Video },
      { name: "Tiến độ", href: `${STUDENT_BASE}/checklist`, icon: CheckSquare },
      {
        name: "Hạn chót",
        href: `${STUDENT_BASE}/deadlines`,
        icon: CalendarClock,
      },
      { name: "Mục tiêu", href: `${STUDENT_BASE}/target`, icon: Target },
      { name: "Báo cáo", href: `${STUDENT_BASE}/reports`, icon: FileBarChart },
    ],
  },
};

export function resolveJourneyStage(input: {
  targetGoalsCount: number;
  hasOrientation: boolean;
  isPaid: boolean;
}): JourneyStage {
  const { targetGoalsCount, hasOrientation, isPaid } = input;
  if (isPaid && targetGoalsCount > 0) return "mentor";
  if (targetGoalsCount > 0) return "build";
  if (hasOrientation) return "choose";
  return "explore";
}

interface QuickAccessSectionProps {
  targetGoalsCount?: number;
  hasOrientation?: boolean;
  isPaid?: boolean;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
  },
};

const itemVariant = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export function QuickAccessSection({
  targetGoalsCount = 0,
  hasOrientation = false,
  isPaid = false,
}: QuickAccessSectionProps) {
  const stage = useMemo(
    () =>
      resolveJourneyStage({
        targetGoalsCount,
        hasOrientation,
        isPaid,
      }),
    [targetGoalsCount, hasOrientation, isPaid],
  );

  const meta = STAGE_META[stage];

  return (
    <motion.section
      initial="hidden"
      animate="show"
      variants={container}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      aria-label="Truy cập nhanh theo giai đoạn"
    >
      <div className="flex flex-col gap-1 border-b border-border bg-muted/30 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:bg-muted/20">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Truy cập nhanh
          </p>
          <h2 className="font-heading text-base font-bold text-foreground">
            {meta.title}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{meta.hint}</p>
        </div>
        {!isPaid && stage !== "mentor" ? (
          <Link
            href={`${STUDENT_BASE}/pricing`}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-amber-700 hover:underline dark:text-amber-400"
          >
            Xem gói Premium
            <ArrowRight className="size-3.5" />
          </Link>
        ) : null}
      </div>
      <nav className="grid grid-cols-3 gap-2.5 p-3 sm:grid-cols-6 sm:gap-3 sm:p-4" aria-label="Lối tắt giai đoạn">
        {meta.links.map((link, i) => {
          const Icon = link.icon;
          return (
            <motion.div
              key={`${stage}-${link.href}`}
              variants={itemVariant}
              transition={{ delay: i * 0.03 }}
            >
              <Link
                href={link.href}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary hover:text-primary-foreground hover:shadow-md sm:p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary transition-all duration-200 group-hover:bg-primary group-hover:text-primary-foreground sm:h-12 sm:w-12">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[11px] font-medium leading-tight text-foreground group-hover:text-primary-foreground sm:text-xs">
                  {link.name}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </nav>
    </motion.section>
  );
}
