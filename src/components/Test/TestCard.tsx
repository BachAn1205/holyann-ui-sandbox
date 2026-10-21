import React from "react";
import {
  ArrowRight,
  Brain,
  Briefcase,
  Activity,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { TestResult } from "../types";

interface TestCardProps {
  title: string;
  description: string;
  colorClass: string;
  iconType: "MBTI" | "RIASEC" | "GRIT";
  onClick: () => void;
  onViewResult?: () => void;
  onReset?: () => void;
  isCompleted?: boolean;
  result?: TestResult;
}

const accentByType = {
  MBTI: {
    border: "border-l-violet-500/60",
    bg: "from-violet-500/5 to-transparent",
    badge: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  GRIT: {
    border: "border-l-amber-500/60",
    bg: "from-amber-500/5 to-transparent",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  RIASEC: {
    border: "border-l-emerald-500/60",
    bg: "from-emerald-500/5 to-transparent",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
};

const TestCard: React.FC<TestCardProps> = ({
  title,
  description,
  colorClass,
  iconType,
  onClick,
  onViewResult,
  onReset,
  isCompleted,
  result,
}) => {
  const accent = accentByType[iconType] || accentByType.MBTI;

  const getIcon = () => {
    switch (iconType) {
      case "MBTI":
        return <Brain className="w-6 h-6 text-white" />;
      case "RIASEC":
        return <Briefcase className="w-6 h-6 text-white" />;
      case "GRIT":
        return <Activity className="w-6 h-6 text-white" />;
      default:
        return <Brain className="w-6 h-6 text-white" />;
    }
  };

  return (
    <div
      className={`rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col h-full transition-all duration-200 border-l-4 ${accent.border} bg-gradient-to-br ${accent.bg} ${
        isCompleted
          ? "border-primary/30"
          : "bg-card hover:border-primary/30 hover:shadow-md"
      }`}
    >
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center shrink-0 shadow-sm`}
          >
            {getIcon()}
          </div>
          {isCompleted && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${accent.badge}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã hoàn thành
            </div>
          )}
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed flex-1">
          {description}
        </p>

        {isCompleted && result && (
          <div className="mb-4 p-3 rounded-xl border border-border/60 bg-muted/20">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Kết quả
            </span>
            <p className="text-base font-bold text-primary mt-1">
              {result.rawLabel}
            </p>
            {result.type === "GRIT" && result.scores["Grit"] != null && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Điểm: {result.scores["Grit"]}/5.0
              </p>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2">
          <button
            type="button"
            onClick={isCompleted && onViewResult ? onViewResult : onClick}
            className={`w-full py-2.5 px-4 font-medium rounded-xl border transition-colors flex items-center justify-center gap-2 group ${
              isCompleted
                ? "bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
                : "bg-muted/50 hover:bg-muted text-foreground border-border/60 hover:border-primary/40"
            }`}
          >
            {isCompleted ? "Xem kết quả" : "Làm bài test"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
          {/* Nút "Làm lại" RIASEC đã comment lại theo yêu cầu
          {isCompleted && onReset && (
            <button
              type="button"
              onClick={onReset}
              className="w-full py-2 px-4 text-sm font-medium rounded-xl border border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Làm lại
            </button>
          )}
          */}
        </div>
      </div>
    </div>
  );
};

export default TestCard;
