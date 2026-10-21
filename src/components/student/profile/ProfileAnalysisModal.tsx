"use client";

import React, { useState } from "react";

// Interface matching the actual API response
interface RegionScore {
  Vùng: string;
  "Điểm số (Score)": number;
  "Xếp loại (Rating)": string;
  "Chi tiết": {
    "Học thuật (Aca)": number;
    "Ngôn ngữ (Lan)": number;
    "Hoạt động ngoại khóa (HDNK)": number;
    "Kỹ năng (Skill)": number;
  };
}

interface SpikeDetail {
  name: string;
  score: number;
  sharpness: string;
  evidence_count: number;
  breakdown: Record<string, number>;
}

interface AnalysisData {
  "A. Đánh giá điểm số (Weighted Score Evaluation)": {
    "Khu vực": RegionScore[];
  };
  "B. Phân tích SWOT": {
    "Strengths (Điểm mạnh)": string[];
    "Weaknesses (Điểm yếu)": string[];
    "Opportunities (Cơ hội)": string[];
    "Threats (Thách thức)": string[];
  };
  "C. Nhận diện Spike (Yếu tố cốt lõi)": {
    "Loại Spike hiện tại": string;
    "Spike ID": string;
    "Điểm số": number;
    "Bằng chứng định hình": string[];
    "Độ sắc (Sharpness)": string;
    "Chi tiết điểm (Breakdown)": Record<string, number>;
    "Nhận xét": string;
    "Tất cả Spike Scores": Record<string, SpikeDetail>;
  };
  "D. Điểm số gốc (Pillar Scores)": {
    "Học thuật (Aca)": number;
    "Ngôn ngữ (Lan)": number;
    "Hoạt động ngoại khóa (HDNK)": number;
    "Kỹ năng (Skill)": number;
  };
  summary: {
    success: boolean;
    total_pillar_scores: {
      aca: number;
      lan: number;
      hdnk: number;
      skill: number;
    };
    main_spike: string;
    sharpness: string;
  };
}

interface AnalysisResult {
  success?: boolean;
  data?: AnalysisData;
  validation_warnings?: string[];
  error?: string;
  details?: any;
}

interface ProfileAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AnalysisResult | null;
  loading: boolean;
  onRetry?: () => void;
}

// Helper function to get rating color
function getRatingColor(rating: string) {
  switch (rating?.toLowerCase()) {
    case "high":
      return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30";
    case "med":
      return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30";
    case "low":
      return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30";
    default:
      return "text-muted-foreground bg-muted";
  }
}

// Helper function to get sharpness color and icon
function getSharpnessInfo(sharpness: string) {
  switch (sharpness?.toLowerCase()) {
    case "exceptional":
      return {
        color: "text-purple-600",
        bg: "bg-purple-100 dark:bg-purple-900/30",
        icon: "🌟",
        label: "Xuất sắc",
      };
    case "high":
      return {
        color: "text-green-600",
        bg: "bg-green-100 dark:bg-green-900/30",
        icon: "⭐",
        label: "Cao",
      };
    case "med":
      return {
        color: "text-yellow-600",
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        icon: "📈",
        label: "Trung bình",
      };
    case "low":
      return {
        color: "text-orange-600",
        bg: "bg-orange-100 dark:bg-orange-900/30",
        icon: "📊",
        label: "Thấp",
      };
    default:
      return {
        color: "text-gray-600",
        bg: "bg-muted",
        icon: "📋",
        label: sharpness,
      };
  }
}

// Progress bar component
function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
      <div
        className={`h-2.5 rounded-full ${color}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export default function ProfileAnalysisModal({
  isOpen,
  onClose,
  result,
  loading,
  onRetry,
}: ProfileAnalysisModalProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "swot" | "spike" | "regions"
  >("overview");

  if (!isOpen) return null;

  const data = result?.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>🎯</span> Kết Quả Phân Tích Hồ Sơ AI
              </h2>
              {data?.summary && (
                <p className="text-white/80 text-sm mt-1">
                  Spike chính:{" "}
                  <span className="font-semibold text-white">
                    {data.summary.main_spike}
                  </span>
                  {" • "}Độ sắc:{" "}
                  <span className="font-semibold text-white">
                    {data.summary.sharpness}
                  </span>
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-20 w-20 border-4 border-purple-200 border-t-purple-600"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-4 text-lg">
              Đang phân tích hồ sơ của bạn...
            </p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-1">
              AI đang đánh giá các yếu tố trong hồ sơ
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && (result?.error || !data) && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 px-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">❌</span>
            </div>
            <h3 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
              Có lỗi xảy ra
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
              {result?.error ||
                "Không thể phân tích hồ sơ. Vui lòng thử lại sau."}
            </p>
          </div>
        )}

        {/* Success Content */}
        {!loading && data && (
          <>
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 dark:border-gray-700 px-6">
              <nav className="flex gap-1 -mb-px overflow-x-auto">
                {[
                  { id: "overview", label: "Tổng quan", icon: "📊" },
                  { id: "regions", label: "Khu vực", icon: "🌍" },
                  { id: "swot", label: "SWOT", icon: "🎯" },
                  { id: "spike", label: "Spike", icon: "⚡" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-all border-b-2 ${
                      activeTab === tab.id
                        ? "border-purple-600 text-purple-600 dark:text-purple-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                  >
                    <span className="mr-1.5">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(data["D. Điểm số gốc (Pillar Scores)"]).map(
                      ([key, value]) => {
                        const icons: Record<string, string> = {
                          "Học thuật (Aca)": "📚",
                          "Ngôn ngữ (Lan)": "🌐",
                          "Hoạt động ngoại khóa (HDNK)": "🏆",
                          "Kỹ năng (Skill)": "💡",
                        };
                        const colors: Record<string, string> = {
                          "Học thuật (Aca)": "from-blue-500 to-blue-600",
                          "Ngôn ngữ (Lan)": "from-green-500 to-green-600",
                          "Hoạt động ngoại khóa (HDNK)":
                            "from-orange-500 to-orange-600",
                          "Kỹ năng (Skill)": "from-purple-500 to-purple-600",
                        };
                        return (
                          <div
                            key={key}
                            className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl">
                                {icons[key] || "📋"}
                              </span>
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                                {key
                                  .replace(" (Aca)", "")
                                  .replace(" (Lan)", "")
                                  .replace(" (HDNK)", "")
                                  .replace(" (Skill)", "")}
                              </span>
                            </div>
                            <div
                              className={`text-2xl font-bold bg-gradient-to-r ${colors[key] || "from-gray-500 to-gray-600"} bg-clip-text text-transparent`}
                            >
                              {typeof value === "number"
                                ? value.toFixed(1)
                                : value}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>

                  {/* Main Spike Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 flex items-center gap-2">
                          <span>⚡</span> Spike Chính
                        </h3>
                        <p className="text-2xl font-bold text-purple-700 dark:text-purple-400 mt-2">
                          {
                            data["C. Nhận diện Spike (Yếu tố cốt lõi)"][
                              "Loại Spike hiện tại"
                            ]
                          }
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1.5 rounded-full text-sm font-medium ${getSharpnessInfo(data["C. Nhận diện Spike (Yếu tố cốt lõi)"]["Độ sắc (Sharpness)"]).bg} ${getSharpnessInfo(data["C. Nhận diện Spike (Yếu tố cốt lõi)"]["Độ sắc (Sharpness)"]).color}`}
                      >
                        {
                          getSharpnessInfo(
                            data["C. Nhận diện Spike (Yếu tố cốt lõi)"][
                              "Độ sắc (Sharpness)"
                            ],
                          ).icon
                        }{" "}
                        {
                          getSharpnessInfo(
                            data["C. Nhận diện Spike (Yếu tố cốt lõi)"][
                              "Độ sắc (Sharpness)"
                            ],
                          ).label
                        }
                      </div>
                    </div>
                    {data["C. Nhận diện Spike (Yếu tố cốt lõi)"][
                      "Bằng chứng định hình"
                    ]?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">
                          Bằng chứng:
                        </p>
                        <ul className="space-y-1">
                          {data["C. Nhận diện Spike (Yếu tố cốt lõi)"][
                            "Bằng chứng định hình"
                          ].map((evidence, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-purple-700 dark:text-purple-400 flex items-start gap-2"
                            >
                              <span className="text-purple-500">•</span>
                              {evidence}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Best Region */}
                  {data["A. Đánh giá điểm số (Weighted Score Evaluation)"][
                    "Khu vực"
                  ]?.length > 0 && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800">
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 flex items-center gap-2">
                        <span>🌍</span> Khu Vực Phù Hợp Nhất
                      </h3>
                      {(() => {
                        const regions =
                          data[
                            "A. Đánh giá điểm số (Weighted Score Evaluation)"
                          ]["Khu vực"];
                        const best = regions.reduce((prev, curr) =>
                          curr["Điểm số (Score)"] > prev["Điểm số (Score)"]
                            ? curr
                            : prev,
                        );
                        return (
                          <div className="flex items-center justify-between mt-3">
                            <div>
                              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                                {best["Vùng"]}
                              </p>
                              <p className="text-sm text-green-600 dark:text-green-500">
                                Điểm: {best["Điểm số (Score)"].toFixed(1)}
                              </p>
                            </div>
                            <div
                              className={`px-3 py-1.5 rounded-full text-sm font-medium ${getRatingColor(best["Xếp loại (Rating)"])}`}
                            >
                              {best["Xếp loại (Rating)"]}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Regions Tab */}
              {activeTab === "regions" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>🌍</span> Đánh Giá Theo Khu Vực
                  </h3>
                  <div className="grid gap-4">
                    {data["A. Đánh giá điểm số (Weighted Score Evaluation)"][
                      "Khu vực"
                    ].map((region, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                      >
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">
                                {region["Vùng"] === "Mỹ"
                                  ? "🇺🇸"
                                  : region["Vùng"] === "Châu Á"
                                    ? "🌏"
                                    : "🌐"}
                              </span>
                              <div>
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                                  {region["Vùng"]}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  Weighted Score Evaluation
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                {region["Điểm số (Score)"].toFixed(1)}
                              </div>
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRatingColor(region["Xếp loại (Rating)"])}`}
                              >
                                {region["Xếp loại (Rating)"]}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {Object.entries(region["Chi tiết"]).map(
                              ([key, value]) => {
                                const colors: Record<string, string> = {
                                  "Học thuật (Aca)": "bg-blue-500",
                                  "Ngôn ngữ (Lan)": "bg-green-500",
                                  "Hoạt động ngoại khóa (HDNK)":
                                    "bg-orange-500",
                                  "Kỹ năng (Skill)": "bg-purple-500",
                                };
                                const maxValue =
                                  Math.max(
                                    ...Object.values(region["Chi tiết"]),
                                  ) || 100;
                                return (
                                  <div
                                    key={key}
                                    className="flex items-center gap-3"
                                  >
                                    <span className="text-sm text-gray-600 dark:text-gray-400 w-32 truncate">
                                      {key.split(" (")[0]}
                                    </span>
                                    <div className="flex-1">
                                      <ProgressBar
                                        value={value}
                                        max={maxValue}
                                        color={colors[key] || "bg-gray-500"}
                                      />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                                      {value.toFixed(1)}
                                    </span>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SWOT Tab */}
              {activeTab === "swot" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>🎯</span> Phân Tích SWOT
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-5 border border-green-200 dark:border-green-800">
                      <h4 className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2 mb-3">
                        <span className="w-8 h-8 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center">
                          💪
                        </span>
                        Điểm Mạnh (Strengths)
                      </h4>
                      <ul className="space-y-2">
                        {data["B. Phân tích SWOT"]["Strengths (Điểm mạnh)"].map(
                          (raw, idx) => {
                            const item = (raw ?? "") as string;
                            const [before, after] = item.split(/⇒\s*Kết luận:/);
                            let pillar: string | null = null;
                            let tier: string | null = null;
                            let evidence: string | null = null;
                            let conclusion = (after ?? item).trim();
                            if (
                              before &&
                              /Tier/i.test(before) &&
                              /Evidence:/i.test(before)
                            ) {
                              const segs = before
                                .split(":")
                                .map((s) => s.trim());
                              pillar = segs[0] || null;
                              const tierSeg = segs.find((s) => /Tier/i.test(s));
                              tier = tierSeg
                                ? tierSeg.replace(/Tier/i, "").trim()
                                : null;
                              const evidSeg = segs.find((s) =>
                                /Evidence:/i.test(s),
                              );
                              evidence = evidSeg
                                ? evidSeg.replace(/Evidence:/i, "").trim()
                                : null;
                            }
                            return (
                              <li
                                key={idx}
                                className="text-sm text-green-700 dark:text-green-400 flex items-start gap-2"
                              >
                                <span className="text-green-500 mt-0.5">✓</span>
                                <div className="space-y-0.5">
                                  {(pillar || tier) && (
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                      {pillar && (
                                        <span className="font-semibold text-foreground">
                                          {pillar}
                                        </span>
                                      )}
                                      {tier && (
                                        <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-[10px] font-semibold uppercase tracking-wide text-green-700 dark:text-green-300">
                                          Tier {tier}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {evidence && (
                                    <p className="text-xs text-muted-foreground">
                                      Evidence: {evidence}
                                    </p>
                                  )}
                                  <p>{conclusion}</p>
                                </div>
                              </li>
                            );
                          },
                        )}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-5 border border-red-200 dark:border-red-800">
                      <h4 className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-2 mb-3">
                        <span className="w-8 h-8 rounded-full bg-red-200 dark:bg-red-800 flex items-center justify-center">
                          ⚠️
                        </span>
                        Điểm Yếu (Weaknesses)
                      </h4>
                      <ul className="space-y-2">
                        {data["B. Phân tích SWOT"]["Weaknesses (Điểm yếu)"].map(
                          (raw, idx) => {
                            const item = ((raw ?? "") as string)
                              .replace(/\[X\]/g, ":")
                              .trim();
                            const [before, after] = item.split(/⇒\s*Kết luận:/);
                            let pillar: string | null = null;
                            let tier: string | null = null;
                            let evidence: string | null = null;
                            let conclusion = (after ?? item).trim();
                            if (
                              before &&
                              /Tier/i.test(before) &&
                              /Evidence:/i.test(before)
                            ) {
                              const segs = before
                                .split(":")
                                .map((s) => s.trim());
                              pillar = segs[0] || null;
                              const tierSeg = segs.find((s) => /Tier/i.test(s));
                              tier = tierSeg
                                ? tierSeg.replace(/Tier/i, "").trim()
                                : null;
                              const evidSeg = segs.find((s) =>
                                /Evidence:/i.test(s),
                              );
                              evidence = evidSeg
                                ? evidSeg.replace(/Evidence:/i, "").trim()
                                : null;
                            }
                            return (
                              <li
                                key={idx}
                                className="text-sm text-red-700 dark:text-red-400 flex items-start gap-2"
                              >
                                <span className="text-red-500 mt-0.5">•</span>
                                <div className="space-y-0.5">
                                  {(pillar || tier) && (
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                      {pillar && (
                                        <span className="font-semibold text-foreground">
                                          {pillar}
                                        </span>
                                      )}
                                      {tier && (
                                        <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                                          Tier {tier}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {evidence && (
                                    <p className="text-xs text-muted-foreground">
                                      Evidence: {evidence}
                                    </p>
                                  )}
                                  <p>{conclusion}</p>
                                </div>
                              </li>
                            );
                          },
                        )}
                      </ul>
                    </div>

                    {/* Opportunities */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-3">
                        <span className="w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center">
                          🌟
                        </span>
                        Cơ Hội (Opportunities)
                      </h4>
                      <ul className="space-y-2">
                        {data["B. Phân tích SWOT"][
                          "Opportunities (Cơ hội)"
                        ].map((raw, idx) => {
                          const item = (raw ?? "") as string;
                          const [before, after] = item.split(/⇒\s*Kết luận:/);
                          let pillar: string | null = null;
                          let tier: string | null = null;
                          let evidence: string | null = null;
                          let conclusion = (after ?? item).trim();

                          if (
                            before &&
                            /Tier/i.test(before) &&
                            /Evidence:/i.test(before)
                          ) {
                            const segs = before.split(":").map((s) => s.trim());
                            pillar = segs[0] || null;
                            const tierSeg = segs.find((s) => /Tier/i.test(s));
                            tier = tierSeg
                              ? tierSeg.replace(/Tier/i, "").trim()
                              : null;
                            const evidSeg = segs.find((s) =>
                              /Evidence:/i.test(s),
                            );
                            evidence = evidSeg
                              ? evidSeg.replace(/Evidence:/i, "").trim()
                              : null;
                          }

                          return (
                            <li
                              key={idx}
                              className="text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2"
                            >
                              <span className="text-blue-500 mt-0.5">★</span>
                              <div className="space-y-0.5">
                                {(pillar || tier) && (
                                  <div className="flex flex-wrap items-center gap-2 text-xs">
                                    {pillar && (
                                      <span className="font-semibold text-foreground">
                                        {pillar}
                                      </span>
                                    )}
                                    {tier && (
                                      <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                                        Tier {tier}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {evidence && (
                                  <p className="text-xs text-muted-foreground">
                                    Evidence: {evidence}
                                  </p>
                                )}
                                <p>{conclusion}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Threats */}
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-5 border border-yellow-200 dark:border-yellow-800">
                      <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 flex items-center gap-2 mb-3">
                        <span className="w-8 h-8 rounded-full bg-yellow-200 dark:bg-yellow-800 flex items-center justify-center">
                          ⚡
                        </span>
                        Thách Thức (Threats)
                      </h4>
                      <ul className="space-y-2">
                        {data["B. Phân tích SWOT"]["Threats (Thách thức)"].map(
                          (raw, idx) => {
                            const item = (raw ?? "") as string;
                            const [before, after] = item.split(/⇒\s*Kết luận:/);
                            let pillar: string | null = null;
                            let tier: string | null = null;
                            let evidence: string | null = null;
                            let conclusion = (after ?? item).trim();

                            if (
                              before &&
                              /Tier/i.test(before) &&
                              /Evidence:/i.test(before)
                            ) {
                              const segs = before
                                .split(":")
                                .map((s) => s.trim());
                              pillar = segs[0] || null;
                              const tierSeg = segs.find((s) => /Tier/i.test(s));
                              tier = tierSeg
                                ? tierSeg.replace(/Tier/i, "").trim()
                                : null;
                              const evidSeg = segs.find((s) =>
                                /Evidence:/i.test(s),
                              );
                              evidence = evidSeg
                                ? evidSeg.replace(/Evidence:/i, "").trim()
                                : null;
                            }

                            return (
                              <li
                                key={idx}
                                className="text-sm text-yellow-700 dark:text-yellow-400 flex items-start gap-2"
                              >
                                <span className="text-yellow-500 mt-0.5">
                                  !
                                </span>
                                <div className="space-y-0.5">
                                  {(pillar || tier) && (
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                      {pillar && (
                                        <span className="font-semibold text-foreground">
                                          {pillar}
                                        </span>
                                      )}
                                      {tier && (
                                        <span className="px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-[10px] font-semibold uppercase tracking-wide text-yellow-700 dark:text-yellow-300">
                                          Tier {tier}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {evidence && (
                                    <p className="text-xs text-muted-foreground">
                                      Evidence: {evidence}
                                    </p>
                                  )}
                                  <p>{conclusion}</p>
                                </div>
                              </li>
                            );
                          },
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Spike Tab */}
              {activeTab === "spike" && (
                <div className="space-y-6">
                  {/* Current Spike */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-purple-900 dark:text-purple-300">
                          {
                            data["C. Nhận diện Spike (Yếu tố cốt lõi)"][
                              "Loại Spike hiện tại"
                            ]
                          }
                        </h3>
                        <p className="text-sm text-purple-600 dark:text-purple-400">
                          Spike ID: #
                          {
                            data["C. Nhận diện Spike (Yếu tố cốt lõi)"][
                              "Spike ID"
                            ]
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">
                          {
                            data["C. Nhận diện Spike (Yếu tố cốt lõi)"][
                              "Điểm số"
                            ]
                          }
                        </div>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${getSharpnessInfo(data["C. Nhận diện Spike (Yếu tố cốt lõi)"]["Độ sắc (Sharpness)"]).bg} ${getSharpnessInfo(data["C. Nhận diện Spike (Yếu tố cốt lõi)"]["Độ sắc (Sharpness)"]).color}`}
                        >
                          {
                            getSharpnessInfo(
                              data["C. Nhận diện Spike (Yếu tố cốt lõi)"][
                                "Độ sắc (Sharpness)"
                              ],
                            ).icon
                          }{" "}
                          {
                            getSharpnessInfo(
                              data["C. Nhận diện Spike (Yếu tố cốt lõi)"][
                                "Độ sắc (Sharpness)"
                              ],
                            ).label
                          }
                        </span>
                      </div>
                    </div>

                    {/* Evidence */}
                    {data["C. Nhận diện Spike (Yếu tố cốt lõi)"][
                      "Bằng chứng định hình"
                    ]?.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2">
                          📋 Bằng chứng định hình:
                        </h4>
                        <ul className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 space-y-1">
                          {data["C. Nhận diện Spike (Yếu tố cốt lõi)"][
                            "Bằng chứng định hình"
                          ].map((ev, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-purple-700 dark:text-purple-400 flex items-center gap-2"
                            >
                              <span>•</span> {ev}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Breakdown */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2">
                        📊 Chi tiết điểm:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(
                          data["C. Nhận diện Spike (Yếu tố cốt lõi)"][
                            "Chi tiết điểm (Breakdown)"
                          ],
                        ).map(([key, value]) => (
                          <span
                            key={key}
                            className="px-3 py-1 bg-white/50 dark:bg-gray-800/50 rounded-full text-sm text-purple-700 dark:text-purple-400"
                          >
                            {key}: <strong>{value}</strong>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Comment */}
                    {data["C. Nhận diện Spike (Yếu tố cốt lõi)"][
                      "Nhận xét"
                    ] && (
                      <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2">
                          💬 Nhận xét:
                        </h4>
                        <p className="text-sm text-purple-700 dark:text-purple-400 italic">
                          {data["C. Nhận diện Spike (Yếu tố cốt lõi)"][
                            "Nhận xét"
                          ].replace(/"/g, "")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* All Spikes */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <span>📈</span> Tất Cả Spike Scores
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(
                        data["C. Nhận diện Spike (Yếu tố cốt lõi)"][
                          "Tất cả Spike Scores"
                        ],
                      ).map(([id, spike]) => (
                        <div
                          key={id}
                          className={`rounded-lg p-4 border transition-all ${
                            spike.score > 0
                              ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {spike.name}
                            </span>
                            <span
                              className={`text-lg font-bold ${spike.score > 0 ? "text-purple-600 dark:text-purple-400" : "text-gray-400"}`}
                            >
                              {spike.score}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={`px-2 py-0.5 rounded ${getSharpnessInfo(spike.sharpness).bg} ${getSharpnessInfo(spike.sharpness).color}`}
                            >
                              {spike.sharpness}
                            </span>
                            <span className="text-gray-500">
                              {spike.evidence_count} evidence
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
          <p className="text-xs text-gray-500">
            Phân tích bởi AI • {new Date().toLocaleDateString("vi-VN")}
          </p>
          <div className="flex gap-3">
            {/* Nút Thử lại - hiển thị khi có lỗi */}
            {onRetry && (result?.error || (!data && !loading)) && (
              <button
                onClick={() => {
                  onClose();
                  onRetry();
                }}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Thử lại
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-lg shadow-purple-500/25"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
