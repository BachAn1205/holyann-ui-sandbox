'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { ProfileAnalysisContent, type AnalysisResult } from './ProfileAnalysisContent';

interface ProfileEvaluationSectionProps {
  analysisResult: AnalysisResult | null;
  analysisLoading: boolean;
  onAnalyze: () => void;
}

export function ProfileEvaluationSection({
  analysisResult,
  analysisLoading,
  onAnalyze,
}: ProfileEvaluationSectionProps) {
  const hasResult = analysisResult?.data != null;
  const hasError = analysisResult?.error != null || (!analysisResult?.data && analysisResult != null);

  return (
    <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate">
              Đánh giá profile
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Phân tích AI: điểm mạnh, điểm yếu, spike và khu vực phù hợp
            </p>
          </div>
        </div>
      </div>
      <div className="p-5">
        {!hasResult && !analysisLoading && !hasError && (
          <div className="flex flex-col items-center justify-center py-10 px-4 rounded-xl bg-muted/20 border border-dashed border-border/60 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50 text-muted-foreground mb-4">
              <Sparkles className="size-7" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              Chưa có kết quả phân tích
            </p>
            <p className="text-xs text-muted-foreground max-w-[280px] mb-5">
              Chạy phân tích AI để xem đánh giá chi tiết về điểm mạnh, điểm yếu, spike và gợi ý khu vực du học. Đánh giá tổng quan bên cạnh sẽ cập nhật theo 4 trụ.
            </p>
            <button
              type="button"
              onClick={onAnalyze}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Sparkles size={16} />
              Phân tích hồ sơ
            </button>
          </div>
        )}
        {(analysisLoading || hasResult || hasError) && (
          <ProfileAnalysisContent
            result={analysisResult}
            loading={analysisLoading}
            onRetry={onAnalyze}
          />
        )}
        {hasResult && !analysisLoading && (
          <div className="mt-4 pt-4 border-t border-border/60 flex justify-end">
            <button
              type="button"
              onClick={onAnalyze}
              className="text-sm font-medium text-primary hover:underline"
            >
              Phân tích lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
