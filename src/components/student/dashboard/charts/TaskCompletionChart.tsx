"use client";

import React from "react";
import { motion } from "framer-motion";

interface TaskCompletionChartProps {
  data: { name: string; value: number }[];
}

const CIRCLE_SIZE = 148;
const STROKE = 12;
const R = (CIRCLE_SIZE - STROKE) / 2;
const C = CIRCLE_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

// Gợi ý học tập theo mức tiến độ
const TIPS_BY_LEVEL: Record<
  "low" | "mid" | "high",
  { icon: string; text: string }[]
> = {
  low: [
    {
      icon: "🎯",
      text: "Đặt mục tiêu nhỏ mỗi ngày: hoàn thành 1 nhiệm vụ là một chiến thắng.",
    },
    {
      icon: "⏰",
      text: "Dành 25 phút tập trung (Pomodoro) thay vì học dài mà mất tập trung.",
    },
    {
      icon: "📋",
      text: "Xem lại danh sách nhiệm vụ mỗi sáng để biết nên bắt đầu từ đâu.",
    },
    { icon: "💡", text: "Ưu tiên nhiệm vụ có hạn chót gần nhất trước." },
    {
      icon: "🤝",
      text: "Trao đổi với tư vấn viên nếu bạn cần hỗ trợ lên kế hoạch học tập.",
    },
  ],
  mid: [
    {
      icon: "🚀",
      text: "Bạn đang đi đúng hướng! Duy trì nhịp độ hiện tại mỗi ngày.",
    },
    {
      icon: "📖",
      text: "Ôn lại các nhiệm vụ đã hoàn thành để củng cố kiến thức.",
    },
    {
      icon: "🗓️",
      text: "Lên lịch cụ thể cho từng nhiệm vụ còn lại để tránh dồn việc.",
    },
    {
      icon: "🧠",
      text: "Thử giải thích lại kiến thức vừa học theo cách của bạn: rất hiệu quả.",
    },
    {
      icon: "⭐",
      text: "Ghi lại những gì học được mỗi ngày, dù chỉ 2–3 dòng.",
    },
  ],
  high: [
    {
      icon: "🏆",
      text: "Xuất sắc! Hãy giúp đỡ bạn học hoặc chia sẻ kinh nghiệm của bạn.",
    },
    {
      icon: "🔍",
      text: "Đào sâu hơn vào các chủ đề bạn thấy thú vị để nâng tầm hiểu biết.",
    },
    {
      icon: "📝",
      text: "Chuẩn bị sớm cho các bài kiểm tra tiếp theo để duy trì phong độ.",
    },
    {
      icon: "🌱",
      text: "Đặt mục tiêu mới cao hơn: bạn đã sẵn sàng cho thử thách lớn hơn.",
    },
    {
      icon: "💪",
      text: "Tiếp tục nhịp độ này, bạn đang rất gần với mục tiêu du học!",
    },
  ],
};

function getTipsForPercent(percent: number) {
  if (percent >= 80) return TIPS_BY_LEVEL.high;
  if (percent >= 50) return TIPS_BY_LEVEL.mid;
  return TIPS_BY_LEVEL.low;
}

// Map percent → label + color token
function getStatus(percent: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (percent >= 80)
    return {
      label: "Xuất sắc",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
    };
  if (percent >= 50)
    return {
      label: "Đang tiến tới",
      color: "text-[var(--secondary)]",
      bg: "bg-[var(--secondary)]/10",
    };
  return {
    label: "Cần cố gắng",
    color: "text-[var(--accent)]",
    bg: "bg-[var(--accent)]/10",
  };
}

export function TaskCompletionChart({ data }: TaskCompletionChartProps) {
  const doneEntry = data.find((d) => d.name === "Done") ?? data[0];
  const totalEntry = data.find((d) => d.name === "Total");
  const doneCount = doneEntry?.value ?? 0;
  const totalCount = totalEntry?.value ?? null;
  const percent = totalCount && totalCount > 0 
    ? Math.max(0, Math.min(100, (doneCount / totalCount) * 100))
    : 0;
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
  const status = getStatus(percent);
  const tips = getTipsForPercent(percent);

  if (!data || data.length === 0) {
    return (
      <div className="flex h-[220px] w-full items-center justify-center rounded-2xl bg-muted/40 text-sm text-muted-foreground">
        Chưa có dữ liệu tiến độ.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="flex w-full flex-col items-center gap-5"
    >
      {/* Ring */}
      <div className="relative">
        <svg
          width={CIRCLE_SIZE}
          height={CIRCLE_SIZE}
          className="-rotate-90"
          aria-hidden
        >
          {/* Track */}
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-muted"
          />
          {/* Progress: gradient via linearGradient */}
          <defs>
            <linearGradient
              id="ring-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--brand-cyan)" />
            </linearGradient>
          </defs>
          <motion.circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            stroke="url(#ring-gradient)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.p
            className="font-heading text-3xl font-bold text-primary dark:text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {Math.round(percent)}%
          </motion.p>
          <p className="mt-0.5 text-[11px] font-sans text-muted-foreground">
            Hoàn thành
          </p>
        </div>
      </div>

      {/* Status badge */}
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold font-sans ${status.bg} ${status.color}`}
      >
        {status.label}
      </span>

      {/* Progress bar */}
      <div className="w-full space-y-1.5">
        <div className="flex justify-between text-[11px] font-sans text-muted-foreground">
          <span>Tiến độ</span>
          <span>
            {totalCount != null
              ? `${doneCount} / ${totalCount} nhiệm vụ`
              : `${doneCount} nhiệm vụ hoàn thành`}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                "linear-gradient(to right, var(--primary), var(--brand-cyan))",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(4, percent)}%` }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
          />
        </div>
      </div>

    </motion.div>
  );
}
