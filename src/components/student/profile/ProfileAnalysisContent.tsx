'use client';

import React, { useState } from 'react';
import { PageLoading } from '@/components/ui/PageLoading';

export interface RegionScore {
  Vùng: string;
  'Điểm số (Score)': number;
  'Xếp loại (Rating)': string;
  'Chi tiết': {
    'Học thuật (Aca)': number;
    'Ngôn ngữ (Lan)': number;
    'Hoạt động ngoại khóa (HDNK)': number;
    'Kỹ năng (Skill)': number;
  };
  /** Lý do phù hợp / không phù hợp vùng đó */
  'Lý do'?: string;
}

export interface SpikeDetail {
  name: string;
  score: number;
  sharpness: string;
  evidence_count: number;
  breakdown: Record<string, number>;
}

export interface AnalysisData {
  'A. Đánh giá điểm số (Weighted Score Evaluation)': {
    'Khu vực': RegionScore[];
  };
  'B. Phân tích SWOT': {
    'Strengths (Điểm mạnh)': string[];
    'Weaknesses (Điểm yếu)': string[];
    'Opportunities (Cơ hội)': string[];
    'Threats (Thách thức)': string[];
  };
  'C. Nhận diện Spike (Yếu tố cốt lõi)': {
    'Loại Spike hiện tại': string;
    'Spike ID': string;
    'Điểm số': number;
    'Bằng chứng định hình': string[];
    'Độ sắc (Sharpness)': string;
    'Chi tiết điểm (Breakdown)': Record<string, number>;
    'Nhận xét': string;
    'Tất cả Spike Scores': Record<string, SpikeDetail>;
  };
  'D. Điểm số gốc (Pillar Scores)': {
    'Học thuật (Aca)': number;
    'Ngôn ngữ (Lan)': number;
    'Hoạt động ngoại khóa (HDNK)': number;
    'Kỹ năng (Skill)': number;
  };
  'E. Điểm từng trụ (Pillar Tiers)'?: Array<{
    'Trụ cột': string;
    'Điểm số': number;
    'Tier': string;
    'Nhận xét': string;
  }>;
  summary: {
    success: boolean;
    total_pillar_scores: { aca: number; lan: number; hdnk: number; skill: number };
    main_spike: string;
    sharpness: string;
  };
}

export interface AnalysisResult {
  success?: boolean;
  data?: AnalysisData;
  validation_warnings?: string[];
  error?: string;
  details?: unknown;
}

function getRatingColor(rating: string) {
  switch (rating?.toLowerCase()) {
    case 'high': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
    case 'med': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30';
    case 'low': return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30';
    default: return 'text-muted-foreground bg-muted';
  }
}

function getSharpnessInfo(sharpness: string | undefined | null) {
  switch (String(sharpness ?? '').toLowerCase()) {
    case 'exceptional': return { color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', icon: '🌟', label: 'Xuất sắc' };
    case 'high': return { color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', icon: '⭐', label: 'Cao' };
    case 'med': return { color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: '📈', label: 'Trung bình' };
    case 'low': return { color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30', icon: '📊', label: 'Thấp' };
    default: return { color: 'text-muted-foreground', bg: 'bg-muted', icon: '📋', label: String(sharpness ?? ':') };
  }
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${percentage}%` }} />
    </div>
  );
}

interface ProfileAnalysisContentProps {
  result: AnalysisResult | null;
  loading: boolean;
  onRetry?: () => void;
}

export function ProfileAnalysisContent({ result, loading, onRetry }: ProfileAnalysisContentProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'swot' | 'spike' | 'regions'>('overview');
  const data = result?.data;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 rounded-xl border border-border/60 bg-muted/30">
        <PageLoading inline size="lg" message="Đang phân tích hồ sơ của bạn..." className="py-0" />
        <p className="text-muted-foreground text-sm mt-2">AI đang đánh giá các yếu tố trong hồ sơ</p>
      </div>
    );
  }

  if (result?.error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 rounded-xl border border-border/60 bg-muted/30">
        <div className="w-14 h-14 rounded-full bg-destructive/10 border border-border/60 flex items-center justify-center mb-4">
          <span className="text-2xl text-destructive">!</span>
        </div>
        <h3 className="text-base font-semibold text-foreground mb-2">Có lỗi xảy ra</h3>
        <p className="text-muted-foreground text-sm text-center max-w-md">
          {result?.error || 'Không thể phân tích hồ sơ. Vui lòng thử lại sau.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            type="button"
            className="mt-4 px-4 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Thử lại
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-border/60 -mx-1">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {[
            { id: 'overview', label: 'Tổng quan', icon: '📊' },
            { id: 'regions', label: 'Khu vực', icon: '🌍' },
            { id: 'swot', label: 'SWOT', icon: '🎯' },
            { id: 'spike', label: 'Spike', icon: '⚡' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-2.5 font-medium text-sm whitespace-nowrap transition-all border-b-2 rounded-t ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-muted/30'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto pt-4">
        {activeTab === 'overview' && (() => {
          const pillarScores = (data && data['D. Điểm số gốc (Pillar Scores)']) && typeof data['D. Điểm số gốc (Pillar Scores)'] === 'object' ? data['D. Điểm số gốc (Pillar Scores)'] as Record<string, number> : {};
          const spikeSection = (data && data['C. Nhận diện Spike (Yếu tố cốt lõi)']) && typeof data['C. Nhận diện Spike (Yếu tố cốt lõi)'] === 'object' ? data['C. Nhận diện Spike (Yếu tố cốt lõi)'] as Record<string, unknown> : {};
          const weightedSection = (data && data['A. Đánh giá điểm số (Weighted Score Evaluation)']) && typeof data['A. Đánh giá điểm số (Weighted Score Evaluation)'] === 'object' ? data['A. Đánh giá điểm số (Weighted Score Evaluation)'] as { 'Khu vực'?: Array<{ 'Vùng': string; 'Điểm số (Score)': number; 'Xếp loại (Rating)': string }> } : {};
          const regions = Array.isArray(weightedSection['Khu vực']) ? weightedSection['Khu vực'] : [];
          const sharpnessInfo = getSharpnessInfo(spikeSection['Độ sắc (Sharpness)'] as string);
          return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(pillarScores).map(([key, value]) => {
                const icons: Record<string, string> = {
                  'Học thuật (Aca)': '📚', 'Ngôn ngữ (Lan)': '🌐',
                  'Hoạt động ngoại khóa (HDNK)': '🏆', 'Kỹ năng (Skill)': '💡',
                };
                return (
                  <div key={key} className="rounded-xl p-4 border border-border/60 bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{icons[key] || '📋'}</span>
                      <span className="text-xs font-medium text-muted-foreground truncate">
                        {key.replace(' (Aca)', '').replace(' (Lan)', '').replace(' (HDNK)', '').replace(' (Skill)', '')}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {typeof value === 'number' ? value.toFixed(1) : String(value)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-xl p-5 border border-border/60 bg-muted/30">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span>⚡</span> Spike Chính
                  </h3>
                  <p className="text-lg font-bold text-foreground mt-1">
                    {String(spikeSection['Loại Spike hiện tại'] ?? (data as any)?.summary?.main_spike ?? ':')}
                  </p>
                </div>
                <div className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium ${sharpnessInfo.bg} ${sharpnessInfo.color}`}>
                  {sharpnessInfo.icon} {sharpnessInfo.label}
                </div>
              </div>
              {Array.isArray(spikeSection['Bằng chứng định hình']) && spikeSection['Bằng chứng định hình'].length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Bằng chứng:</p>
                  <ul className="space-y-1">
                    {(spikeSection['Bằng chứng định hình'] as string[]).map((evidence, idx) => (
                      <li key={idx} className="text-sm text-foreground flex items-start gap-2">
                        <span className="text-muted-foreground">•</span> {evidence}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {regions.length > 0 && (
              <div className="rounded-xl p-5 border border-border/60 bg-muted/30">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <span>🌍</span> Khu Vực Phù Hợp Nhất
                </h3>
                {(() => {
                  const best = regions.reduce((prev, curr) =>
                    curr['Điểm số (Score)'] > prev['Điểm số (Score)'] ? curr : prev
                  );
                  return (
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <p className="text-lg font-bold text-foreground">{best['Vùng']}</p>
                        <p className="text-sm text-muted-foreground">Điểm: {best['Điểm số (Score)'].toFixed(1)}</p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg text-sm font-medium ${getRatingColor(best['Xếp loại (Rating)'])}`}>
                        {best['Xếp loại (Rating)']}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
          );
        })()}

        {activeTab === 'regions' && (() => {
          const weighted = data?.['A. Đánh giá điểm số (Weighted Score Evaluation)'];
          const regionsList: Record<string, unknown>[] = Array.isArray(weighted?.['Khu vực']) ? ((weighted!['Khu vực']) as unknown as Record<string, unknown>[]) : [];
          const pillarTiers: Record<string, unknown>[] = Array.isArray(data?.['E. Điểm từng trụ (Pillar Tiers)']) ? (data!['E. Điểm từng trụ (Pillar Tiers)'] as Record<string, unknown>[]) : [];
          return (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span>🌍</span> Đánh Giá Theo Khu Vực
            </h3>
            <div className="grid gap-3">
              {regionsList.map((region, idx) => (
                <div key={idx} className="rounded-xl border border-border/60 bg-muted/30 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {region['Vùng'] === 'Mỹ' ? '🇺🇸' : region['Vùng'] === 'Châu Á' ? '🌏' : '🌐'}
                        </span>
                        <div>
                          <h4 className="text-base font-bold text-foreground">{String(region['Vùng'] ?? '')}</h4>
                          <p className="text-xs text-muted-foreground">Weighted Score Evaluation</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-foreground">
                          {typeof region['Điểm số (Score)'] === 'number' ? (region['Điểm số (Score)'] as number).toFixed(1) : ':'}
                        </div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium ${getRatingColor(region['Xếp loại (Rating)'] as string)}`}>
                          {String(region['Xếp loại (Rating)'] ?? ':')}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(typeof region['Chi tiết'] === 'object' && region['Chi tiết'] != null ? (region['Chi tiết'] as Record<string, number>) : {}).map(([key, value]) => {
                        const colors: Record<string, string> = {
                          'Học thuật (Aca)': 'bg-primary', 'Ngôn ngữ (Lan)': 'bg-primary',
                          'Hoạt động ngoại khóa (HDNK)': 'bg-primary', 'Kỹ năng (Skill)': 'bg-primary',
                        };
                        const detail = typeof region['Chi tiết'] === 'object' && region['Chi tiết'] != null ? (region['Chi tiết'] as Record<string, number>) : {};
                        const maxValue = Math.max(...Object.values(detail)) || 100;
                        return (
                          <div key={key} className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground w-28 truncate">{key.split(' (')[0]}</span>
                            <div className="flex-1">
                              <ProgressBar value={value} max={maxValue} color={colors[key] || 'bg-primary'} />
                            </div>
                            <span className="text-sm font-medium text-foreground w-10 text-right">{value.toFixed(1)}</span>
                          </div>
                        );
                      })}
                    </div>
                    {region['Lý do'] != null && region['Lý do'] !== '' && (
                      <p className="mt-3 text-sm text-muted-foreground border-t border-border/60 pt-3">
                        <span className="font-medium text-foreground">Lý do: </span>
                        {String(region['Lý do'])}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {pillarTiers.length > 0 && (
              <div className="mt-6">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2 mb-3">
                  <span>🏆</span> Tier từng trụ cột
                </h3>
                <div className="grid gap-3">
                  {pillarTiers.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-border/60 bg-muted/30 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{String(item['Trụ cột'] ?? '')}</span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                          item['Tier'] === 'Hero' ? 'text-green-600 bg-green-100 dark:bg-green-900/30' :
                          item['Tier'] === 'Excellent' ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' :
                          item['Tier'] === 'Very Good' ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' :
                          item['Tier'] === 'Good' ? 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' :
                          'text-muted-foreground bg-muted'
                        }`}>
                          {String(item['Tier'] ?? '')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{String(item['Nhận xét'] ?? '')}</p>
                      <p className="text-xs text-muted-foreground mt-1">Điểm: {typeof item['Điểm số'] === 'number' ? (item['Điểm số'] as number).toFixed(1) : ':'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {activeTab === 'swot' && (() => {
          const swot = (data && data['B. Phân tích SWOT']) && typeof data['B. Phân tích SWOT'] === 'object' ? data['B. Phân tích SWOT'] as Record<string, string[]> : {};
          const strengths = Array.isArray(swot['Strengths (Điểm mạnh)']) ? swot['Strengths (Điểm mạnh)'] : [];
          const weaknesses = Array.isArray(swot['Weaknesses (Điểm yếu)']) ? swot['Weaknesses (Điểm yếu)'] : [];
          const opportunities = Array.isArray(swot['Opportunities (Cơ hội)']) ? swot['Opportunities (Cơ hội)'] : [];
          const threats = Array.isArray(swot['Threats (Thách thức)']) ? swot['Threats (Thách thức)'] : [];
          return (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <span>🎯</span> Phân Tích SWOT
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-border/60 dark:border-green-800/50">
                <h4 className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-lg bg-green-200 dark:bg-green-800 flex items-center justify-center text-sm">💪</span>
                  Điểm Mạnh (Strengths)
                </h4>
                <ul className="space-y-2">
                  {strengths.map((item, idx) => (
                    <li key={idx} className="text-sm text-green-700 dark:text-green-400 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span> <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-border/60 dark:border-red-800/50">
                <h4 className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-lg bg-red-200 dark:bg-red-800 flex items-center justify-center text-sm">⚠️</span>
                  Điểm Yếu (Weaknesses)
                </h4>
                <ul className="space-y-2">
                  {weaknesses.map((item, idx) => (
                    <li key={idx} className="text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span> <span>{item.replace(/\[X\]/g, ':')}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-border/60 dark:border-blue-800/50">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-lg bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-sm">🌟</span>
                  Cơ Hội (Opportunities)
                </h4>
                <ul className="space-y-2">
                  {opportunities.map((item, idx) => (
                    <li key={idx} className="text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">★</span> <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-border/60 dark:border-yellow-800/50">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-lg bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center text-sm">⚡</span>
                  Thách Thức (Threats)
                </h4>
                <ul className="space-y-2">
                  {threats.map((item, idx) => (
                    <li key={idx} className="text-sm text-yellow-700 dark:text-yellow-400 flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">!</span> <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          );
        })()}

        {activeTab === 'spike' && (() => {
          const spikeData = (data && data['C. Nhận diện Spike (Yếu tố cốt lõi)']) && typeof data['C. Nhận diện Spike (Yếu tố cốt lõi)'] === 'object' ? data['C. Nhận diện Spike (Yếu tố cốt lõi)'] as Record<string, unknown> : {};
          const evidenceList = Array.isArray(spikeData['Bằng chứng định hình']) ? (spikeData['Bằng chứng định hình'] as string[]) : [];
          const breakdown = (spikeData['Chi tiết điểm (Breakdown)'] && typeof spikeData['Chi tiết điểm (Breakdown)'] === 'object') ? (spikeData['Chi tiết điểm (Breakdown)'] as Record<string, number>) : {};
          const allSpikes = (spikeData['Tất cả Spike Scores'] && typeof spikeData['Tất cả Spike Scores'] === 'object') ? (spikeData['Tất cả Spike Scores'] as Record<string, { name?: string; score?: number; sharpness?: string; evidence_count?: number }>) : {};
          const spikeSharpInfo = getSharpnessInfo(spikeData['Độ sắc (Sharpness)'] as string);
          return (
          <div className="space-y-4">
            <div className="rounded-xl p-5 border border-border/60 bg-muted/30">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {String(spikeData['Loại Spike hiện tại'] ?? (data as any)?.summary?.main_spike ?? ':')}
                  </h3>
                  {spikeData['Spike ID'] != null && (
                    <p className="text-xs text-muted-foreground mt-0.5">Spike ID: #{String(spikeData['Spike ID'])}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold text-foreground">{spikeData['Điểm số'] != null ? String(spikeData['Điểm số']) : ':'}</div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium mt-1 ${spikeSharpInfo.bg} ${spikeSharpInfo.color}`}>
                    {spikeSharpInfo.icon} {spikeSharpInfo.label}
                  </span>
                </div>
              </div>
              {evidenceList.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">📋 Bằng chứng định hình</h4>
                  <ul className="rounded-lg p-3 space-y-1 bg-card border border-border/60">
                    {evidenceList.map((ev, idx) => (
                      <li key={idx} className="text-sm text-foreground flex items-center gap-2"><span className="text-muted-foreground">•</span> {ev}</li>
                    ))}
                  </ul>
                </div>
              )}
              {Object.keys(breakdown).length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">📊 Chi tiết điểm</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(breakdown).map(([key, value]) => (
                      <span key={key} className="px-2.5 py-1 bg-card border border-border/60 rounded-lg text-sm text-foreground">
                        {key}: <strong>{value}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {spikeData['Nhận xét'] != null && String(spikeData['Nhận xét']).trim() !== '' && (
                <div className="rounded-lg p-4 bg-card border border-border/60">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">💬 Nhận xét</h4>
                  <p className="text-sm text-foreground italic">
                    {String(spikeData['Nhận xét']).replace(/"/g, '')}
                  </p>
                </div>
              )}
            </div>
            {Object.keys(allSpikes).length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <span>📈</span> Tất Cả Spike Scores
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(allSpikes).map(([id, spike]) => (
                  <div
                    key={id}
                    className={`rounded-xl p-4 border transition-all ${
                      (spike?.score ?? 0) > 0 ? 'bg-muted/30 border-border/60' : 'bg-muted/20 border-border/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground truncate">{spike?.name ?? id}</span>
                      <span className={`text-base font-bold shrink-0 ml-2 ${(spike?.score ?? 0) > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{spike?.score ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className={`px-2 py-0.5 rounded ${getSharpnessInfo(spike?.sharpness ?? '').bg} ${getSharpnessInfo(spike?.sharpness ?? '').color}`}>{spike?.sharpness ?? ':'}</span>
                      <span>{spike?.evidence_count ?? 0} evidence</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
          );
        })()}
      </div>
    </>
  );
}
