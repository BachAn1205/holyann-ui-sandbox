"use client";

import React from "react";
import { RotateCcw, RefreshCw } from "lucide-react";
import { TestResult, TestType } from "@/components/types";
import ResultChart from "./ResultChart";

interface ResultViewProps {
  result: TestResult | null;
  onBackToDashboard: () => void;
  remainingTests?: TestType[];
  onStartNextTest?: (type: TestType) => void;
  allTestsCompleted?: boolean;
  /** Mở xác nhận làm lại bài hiện tại (xóa kết quả cũ) */
  onRetryTest?: () => void;
  showRetryTest?: boolean;
}

const ResultView: React.FC<ResultViewProps> = ({
  result,
  onBackToDashboard,
  remainingTests: _remainingTests = [],
  onStartNextTest: _onStartNextTest,
  allTestsCompleted: _allTestsCompleted = false,
  onRetryTest,
  showRetryTest = false,
}) => {
  if (!result) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="text-gray-500 hover:text-gray-900 flex items-center gap-2 text-sm font-medium"
        >
          <RotateCcw size={16} /> Quay về trang chủ
        </button>
        {showRetryTest && onRetryTest && (
          <button
            type="button"
            onClick={onRetryTest}
            className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 flex items-center gap-2 text-sm font-medium border border-orange-200 dark:border-orange-800 rounded-lg px-3 py-1.5 bg-orange-50/80 dark:bg-orange-950/40"
          >
            <RefreshCw size={16} /> Thử lại
          </button>
        )}
      </div>

      {/* Chart Section - Full Width */}
      <div className="w-full">
        <ResultChart result={result} />
      </div>
    </div>
  );
};

export default ResultView;
