"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap,
  BookOpen,
  CheckSquare,
  Clock,
  Calendar,
  UserCheck,
  Brain,
  CalendarClock,
  ListTodo,
  Video,
  Target,
  LucideIcon,
} from "lucide-react";
import { QuickStatItem } from "./types";

const ICON_MAP: Record<string, LucideIcon> = {
  GraduationCap,
  BookOpen,
  CheckSquare,
  Clock,
  Calendar,
  UserCheck,
  Brain,
  Video,
  Target,
};

type AccentStyle = {
  iconBg: string;
  iconText: string;
  borderLeft: string;
  trendUp: string;
  trendDown: string;
};

const BASE_ACCENT_STYLES: Record<QuickStatItem["accent"], AccentStyle> = {
  blue: {
    iconBg: "bg-primary/10",
    iconText: "text-primary dark:text-sky-400",
    borderLeft: "border-l-primary dark:border-l-sky-500",
    trendUp: "text-primary dark:text-sky-400",
    trendDown: "text-destructive",
  },
  emerald: {
    iconBg: "bg-secondary/10 dark:bg-cyan-500/10",
    iconText: "text-secondary dark:text-cyan-400",
    borderLeft: "border-l-secondary dark:border-l-cyan-500",
    trendUp: "text-secondary dark:text-cyan-400",
    trendDown: "text-destructive",
  },
  amber: {
    iconBg: "bg-accent/10",
    iconText: "text-accent dark:text-amber-400",
    borderLeft: "border-l-accent",
    trendUp: "text-accent dark:text-amber-400",
    trendDown: "text-destructive",
  },
  violet: {
    iconBg: "bg-accent/10 dark:bg-violet-500/10",
    iconText: "text-accent dark:text-violet-400",
    borderLeft: "border-l-accent dark:border-l-violet-500",
    trendUp: "text-accent dark:text-violet-400",
    trendDown: "text-destructive",
  },
  rose: {
    iconBg: "bg-secondary/10 dark:bg-rose-500/10",
    iconText: "text-secondary dark:text-rose-400",
    borderLeft: "border-l-secondary dark:border-l-rose-500",
    trendUp: "text-secondary dark:text-rose-400",
    trendDown: "text-destructive",
  },
  sky: {
    iconBg: "bg-primary/10 dark:bg-sky-500/10",
    iconText: "text-primary dark:text-sky-400",
    borderLeft: "border-l-primary dark:border-l-sky-500",
    trendUp: "text-primary dark:text-sky-400",
    trendDown: "text-destructive",
  },
};

function getAccentStyle(item: QuickStatItem): AccentStyle {
  const base = BASE_ACCENT_STYLES[item.accent];

  if (item.id === "gpa") {
    return {
      ...base,
      iconBg: "bg-primary/10 dark:bg-sky-500/10",
      iconText: "text-primary dark:text-sky-400",
      borderLeft: "border-l-primary dark:border-l-sky-500",
    };
  }

  if (item.id === "courses") {
    return {
      ...base,
      iconBg: "bg-secondary/10 dark:bg-cyan-500/10",
      iconText: "text-secondary dark:text-cyan-400",
      borderLeft: "border-l-secondary dark:border-l-cyan-500",
    };
  }

  if (item.id === "tasks") {
    return {
      ...base,
      iconBg: "bg-accent/10",
      iconText: "text-accent dark:text-amber-400",
      borderLeft: "border-l-accent",
    };
  }

  if (item.id === "meetings") {
    return {
      ...base,
      iconBg: "bg-violet-500/10",
      iconText: "text-violet-600 dark:text-violet-400",
      borderLeft: "border-l-violet-500",
    };
  }

  if (item.id === "goal") {
    return {
      ...base,
      iconBg: "bg-rose-500/10",
      iconText: "text-rose-600 dark:text-rose-400",
      borderLeft: "border-l-rose-500",
    };
  }

  return base;
}

function getIconOverride(item: QuickStatItem): LucideIcon | null {
  if (item.id === "tasks") return ListTodo;
  if (item.id === "meetings") return Video;
  if (item.id === "goal") return Target;
  return null;
}

interface QuickStatCardProps {
  item: QuickStatItem;
  index: number;
}

export function QuickStatCard({ item, index }: QuickStatCardProps) {
  const iconOverride = getIconOverride(item);
  const Icon = iconOverride ?? ICON_MAP[item.icon] ?? GraduationCap;
  const style = getAccentStyle(item);

  const [displayNumber, setDisplayNumber] = useState<number | null>(
    typeof item.value === "number" ? 0 : null,
  );

  useEffect(() => {
    if (typeof item.value !== "number") {
      setDisplayNumber(null);
      return;
    }

    const target = item.value;
    const duration = 800;
    const start = performance.now();

    let frameId: number;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      setDisplayNumber(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [item.value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className={`card-holyann flex min-h-[120px] w-full flex-col gap-3 border-l-4 ${style.borderLeft}`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.iconBg} ${style.iconText}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-xs font-sans text-muted-foreground">
          {item.label}
        </span>
      </div>
      <p
        className={`font-heading font-bold tracking-tight text-primary dark:text-foreground ${
          item.id === "goal" ? "text-lg line-clamp-2" : "text-3xl tabular-nums"
        }`}
      >
        {displayNumber != null ? displayNumber : item.value}
      </p>
      {item.trend && (
        <p
          className={`text-xs text-muted-foreground ${
            item.trend.value >= 0 ? style.trendUp : style.trendDown
          }`}
        >
          {item.trend.label}
        </p>
      )}
    </motion.div>
  );
}
