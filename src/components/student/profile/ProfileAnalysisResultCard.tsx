/**
 * ProfileAnalysisResultCard
 *
 * Component hiển thị tóm tắt kết quả phân tích hồ sơ AI
 * Dùng trong dashboard hoặc profile page
 */

'use client';

import React from 'react';

interface PillarScores {
  aca: number | null;
  lan: number | null;
  hdnk: number | null;
  skill: number | null;
}

interface RegionalScores {
  usa: number | null;
  asia: number | null;
  europe: number | null;
}

interface AnalysisResultCardProps {
  analysisDate?: Date | string;
  pillarScores?: PillarScores | null;
  regionalScores?: RegionalScores | null;
  mainSpike?: string | null;
  spikeSharpness?: string | null;
  onViewDetails?: () => void;
  onReanalyze?: () => void;
  loading?: boolean;
  compact?: boolean;
}

function getSharpnessColor(sharpness: string | null | undefined) {
  switch (sharpness?.toLowerCase()) {
    case 'exceptional': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/30';
    case 'high': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
    case 'med': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
    case 'low': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
    default: return 'text-muted-foreground bg-muted';
  }
}

function getSharpnessLabel(sharpness: string | null | undefined) {
  switch (sharpness?.toLowerCase()) {
    case 'exceptional': return 'Xuất sắc';
    case 'high': return 'Cao';
    case 'med': return 'Trung bình';
    case 'low': return 'Thấp';
    default: return sharpness || 'N/A';
  }
}

function formatDate(date: Date | string | undefined) {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function ProfileAnalysisResultCard({
  analysisDate,
  pillarScores,
  regionalScores,
  mainSpike,
  spikeSharpness,
  onViewDetails,
  onReanalyze,
  loading = false,
  compact = false,
}: AnalysisResultCardProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="grid grid-cols-4 gap-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!pillarScores) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        <div className="text-center py-4">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Phân tích hồ sơ AI
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            Chưa có kết quả phân tích. Hãy phân tích hồ sơ để xem điểm mạnh, điểm yếu và cơ hội của bạn.
          </p>
          {onReanalyze && (
            <button
              onClick={onReanalyze}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Phân tích ngay
            </button>
          )}
        </div>
      </div>
    );
  }

  const pillars = [
    { key: 'aca', label: 'Học thuật', icon: '📚', value: pillarScores.aca, color: 'blue' },
    { key: 'lan', label: 'Ngôn ngữ', icon: '🌐', value: pillarScores.lan, color: 'green' },
    { key: 'hdnk', label: 'Hoạt động', icon: '🏆', value: pillarScores.hdnk, color: 'orange' },
    { key: 'skill', label: 'Kỹ năng', icon: '💡', value: pillarScores.skill, color: 'purple' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-4 py-3">
        <div className="flex justify-between items-center">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <span>🎯</span> Kết quả phân tích AI
          </h3>
          <span className="text-white/80 text-xs">
            {formatDate(analysisDate)}
          </span>
        </div>
      </div>

      <div className={`p-4 ${compact ? 'space-y-3' : 'space-y-4'}`}>
        {/* Spike Info */}
        <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Spike chính</div>
            <div className="font-semibold text-purple-700 dark:text-purple-400">
              ⚡ {mainSpike || 'Chưa xác định'}
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSharpnessColor(spikeSharpness)}`}>
            {getSharpnessLabel(spikeSharpness)}
          </span>
        </div>

        {/* Pillar Scores */}
        <div className={`grid ${compact ? 'grid-cols-4 gap-2' : 'grid-cols-2 gap-3'}`}>
          {pillars.map((pillar) => (
            <div key={pillar.key} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
              <div className="text-xl mb-1">{pillar.icon}</div>
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {pillar.value?.toFixed(0) || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{pillar.label}</div>
            </div>
          ))}
        </div>

        {/* Regional Scores */}
        {regionalScores && !compact && (
          <div className="flex justify-between text-sm">
            <div className="text-center">
              <div className="text-gray-500 dark:text-gray-400 text-xs">🇺🇸 Mỹ</div>
              <div className="font-semibold">{regionalScores.usa?.toFixed(1) || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 dark:text-gray-400 text-xs">🌏 Châu Á</div>
              <div className="font-semibold">{regionalScores.asia?.toFixed(1) || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 dark:text-gray-400 text-xs">🌍 Âu/Úc</div>
              <div className="font-semibold">{regionalScores.europe?.toFixed(1) || 0}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex-1 text-center py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              Xem chi tiết
            </button>
          )}
          {onReanalyze && (
            <button
              onClick={onReanalyze}
              className="flex-1 text-center py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
            >
              Phân tích lại
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileAnalysisResultCard;
