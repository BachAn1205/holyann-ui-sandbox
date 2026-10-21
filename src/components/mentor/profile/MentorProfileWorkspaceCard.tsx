"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  LayoutDashboard,
  MessageCircle,
  Users,
} from "lucide-react";

const links = [
  {
    href: "/mentor/dashboard",
    label: "Bảng điều khiển",
    sub: "Tổng quan & lối tắt",
    icon: LayoutDashboard,
    chipClass:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200",
  },
  {
    href: "/mentor/students",
    label: "Học viên",
    sub: "Danh sách & chi tiết",
    icon: Users,
    chipClass:
      "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200",
  },
  {
    href: "/mentor/deadlines",
    label: "Hạn chót",
    sub: "Deadline đa học viên",
    icon: CalendarClock,
    chipClass:
      "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
  },
  {
    href: "/mentor/chat",
    label: "Trao đổi",
    sub: "Chat với học viên",
    icon: MessageCircle,
    chipClass:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  },
] as const;
