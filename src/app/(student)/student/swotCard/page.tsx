"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { SwotData, StudentProfile } from "@/components/types";
import { SwotCard } from "@/components/student/profile";
import { PageLoading } from "@/components/ui/PageLoading";
import { Feature1OutputData } from "@/lib/schemas/profile-analysis.schema";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  ShieldCheck,
  AlertOctagon,
  Zap,
  Target,
  Sparkles,
  Loader2,
  ArrowLeft,
  GraduationCap,
  Globe,
  Trophy,
  BrainCircuit,
} from "lucide-react";

/**
 * Map Feature1OutputData to SwotData format
 */
function mapFeature1ToSwotData(analysisData: Feature1OutputData): SwotData {
  const swot = analysisData["B. Phân tích SWOT"];
  const spike = analysisData["C. Nhận diện Spike (Yếu tố cốt lõi)"];
  const summary = analysisData.summary;

  // Map SWOT data
  const strengths = swot["Strengths (Điểm mạnh)"] || [];
  const weaknesses = swot["Weaknesses (Điểm yếu)"] || [];
  const opportunities = swot["Opportunities (Cơ hội)"] || [];
  const threats = swot["Threats (Thách thức)"] || [];

  // Generate strategic advice from SWOT and spike analysis
  const strategicAdvice = [];

  // Priority 1: Use Opportunities as strategic advice (they are actionable)
  if (opportunities.length > 0) {
    opportunities.slice(0, 2).forEach((opp, idx) => {
      strategicAdvice.push({
        title: `Cơ hội ${idx + 1}`,
        description: opp,
      });
    });
  }

  // Priority 2: Add spike analysis if available
  if (spike["Nhận xét"] && strategicAdvice.length < 3) {
    strategicAdvice.push({
      title: `Phát triển ${spike["Loại Spike hiện tại"]}`,
      description: spike["Nhận xét"].replace(/"/g, ""),
    });
  }

  // Priority 3: Add strength-based advice if still need more
  if (strengths.length > 0 && strategicAdvice.length < 3) {
    strategicAdvice.push({
      title: "Tận dụng điểm mạnh",
      description: strengths[0] || "",
    });
  }

  // Map scores from summary.total_pillar_scores (aca, lan, hdnk, skill)
  // These are already normalized values
  const totalScores = summary.total_pillar_scores;

  // Normalize to 0-100 scale if needed
  const normalizeScore = (score: number): number => {
    // If score > 100, assume it's on 0-1000 scale and divide by 10
    if (score > 100) {
      return Math.min(100, Math.round(score / 10));
    }
    return Math.min(100, Math.round(score));
  };

  const scores = {
    academic: normalizeScore(totalScores.aca),
    language: normalizeScore(totalScores.lan),
    skills: normalizeScore(totalScores.skill),
    extracurricular: normalizeScore(totalScores.hdnk),
    leadership: normalizeScore(totalScores.hdnk), // Use extracurricular as proxy for leadership (for backward compatibility)
  };

  return {
    strengths,
    weaknesses,
    opportunities,
    threats,
    strategicAdvice: strategicAdvice.slice(0, 3), // Limit to 3 items
    scores,
  };
}

export default function SwotCardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [swotData, setSwotData] = useState<SwotData | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Get student ID from session - memoized to prevent unnecessary recalculations
  const studentId = useMemo(() => {
    // Try NextAuth session first
    const sessionUserId =
      (session?.user as any)?.id || (session?.user as any)?.user_id;
    if (sessionUserId) {
      return sessionUserId as string;
    }

    return null;
  }, [session?.user]);

  // Fetch profile data
  useEffect(() => {
    if (!studentId) {
      setProfileLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const response = await fetch(`/api/students/${studentId}/profile`);

        if (!response.ok) {
          throw new Error("Không thể tải thông tin học sinh");
        }

        const data = await response.json();

        // Map API data to StudentProfile interface
        const mappedProfile: StudentProfile = {
          id: studentId.substring(0, 8).toUpperCase(),
          name: data.basicInfo.full_name || "Chưa cập nhật",
          email: data.basicInfo.email || "Chưa cập nhật",
          phone: data.basicInfo.phone_number || "Chưa cập nhật",
          address: data.basicInfo.current_address || "Chưa cập nhật",
          dob: data.basicInfo.date_of_birth
            ? new Date(data.basicInfo.date_of_birth).toLocaleDateString("vi-VN")
            : "Chưa cập nhật",
          avatarUrl: data.basicInfo.avatar_url || "",
          gpa: (() => {
            const gpaDetails = data.academicProfile?.gpa_transcript_details;
            if (!gpaDetails) return 0;
            if (gpaDetails.grade12)
              return parseFloat(String(gpaDetails.grade12)) || 0;
            if (gpaDetails.grade11)
              return parseFloat(String(gpaDetails.grade11)) || 0;
            if (gpaDetails.grade10)
              return parseFloat(String(gpaDetails.grade10)) || 0;
            if (gpaDetails.grade9)
              return parseFloat(String(gpaDetails.grade9)) || 0;
            return 0;
          })(),
          gpaScale: 10,
          englishLevel: data.academicProfile?.english_level || "Chưa cập nhật",
          targetMajor: data.studentInfo?.target_faculty_name && data.studentInfo?.target_university_name
            ? `${data.studentInfo.target_faculty_name} @ ${data.studentInfo.target_university_name}`
            : "Chưa cập nhật",
          targetCountry: ":",
          extracurriculars: [],
          achievements: [],
          documents: [],
        };

        setProfile(mappedProfile);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Không thể tải thông tin học sinh");
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [studentId]);

  const handleAnalysis = async () => {
    if (!studentId) {
      toast.error("Không tìm thấy thông tin học sinh", {
        description: "Vui lòng đăng nhập lại để tiếp tục",
      });
      return;
    }

    setLoading(true);
    toast.info("Đang phân tích SWOT", {
      description: "AI đang phân tích hồ sơ của bạn để tạo báo cáo SWOT...",
    });

    try {
      const response = await fetch(
        `/api/students/${studentId}/analyze-profile`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setSwotData(null);
        setAnalyzed(false);
        toast.error("Phân tích SWOT thất bại", {
          description: data.error || "Vui lòng thử lại sau",
        });
        return;
      }

      // Handle response format - có thể có wrapper success/data hoặc trả về trực tiếp
      let analysisData: Feature1OutputData;
      if (data && typeof data === "object" && "data" in data && data.data) {
        // Có wrapper
        analysisData = data.data as Feature1OutputData;
      } else {
        // Trả về trực tiếp
        analysisData = data as Feature1OutputData;
      }

      // Map Feature1OutputData to SwotData
      const mappedSwotData = mapFeature1ToSwotData(analysisData);
      setSwotData(mappedSwotData);
      setAnalyzed(true);

      toast.success("Phân tích SWOT hoàn tất", {
        description: "Đã tạo báo cáo phân tích SWOT chi tiết cho hồ sơ của bạn",
      });
    } catch (error) {
      console.error("Analysis failed", error);
      setSwotData(null);
      setAnalyzed(false);

      toast.error("Không thể kết nối API", {
        description:
          error instanceof Error ? error.message : "Lỗi không xác định",
      });
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data format - chỉ 4 mục: Học thuật, Ngoại ngữ, Hoạt động, Kỹ năng
  const chartData = swotData?.scores
    ? [
        {
          subject: "Học thuật",
          A: swotData.scores.academic || 0,
          fullMark: 100,
        },
        {
          subject: "Ngoại ngữ",
          A: swotData.scores.language || 0,
          fullMark: 100,
        },
        {
          subject: "Hoạt động",
          A: swotData.scores.extracurricular || 0,
          fullMark: 100,
        },
        {
          subject: "Kỹ năng",
          A: swotData.scores.skills || 0,
          fullMark: 100,
        },
      ]
    : [
        { subject: "Học thuật", A: 0, fullMark: 100 },
        { subject: "Ngoại ngữ", A: 0, fullMark: 100 },
        { subject: "Hoạt động", A: 0, fullMark: 100 },
        { subject: "Kỹ năng", A: 0, fullMark: 100 },
      ];

  // Loading state for profile
  if (profileLoading) {
    return (
      <div className="min-h-[calc(100vh-theme(spacing.14))] flex flex-col font-sans">
        <main className="flex-grow flex items-center justify-center p-6">
          <PageLoading fullPage={false} message="Đang tải thông tin..." />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-theme(spacing.14))] flex flex-col font-sans">
      <main className="container max-w-7xl mx-auto w-full flex-grow space-y-4 p-4 sm:p-6 sm:space-y-6">
        {/* Navigation & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <button
              onClick={() => router.back()}
              className="flex items-center text-sm text-gray-500 hover:text-[var(--brand-deep)] mb-2 transition-colors"
            >
              <ArrowLeft size={16} className="mr-1" /> Quay lại hồ sơ
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Phân tích SWOT & Định hướng
            </h2>
          </div>

          {!analyzed && !loading && (
            <button
              onClick={handleAnalysis}
              className="bg-[var(--brand-deep)] hover:bg-[var(--brand-deep-darker)] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium text-sm sm:text-base w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> Tạo phân tích AI
            </button>
          )}
        </div>

        {/* Profile Summary Card - Context for the Analysis */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:items-start">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden flex-shrink-0 border-2 border-white dark:border-slate-800 shadow-sm">
            <img
              src={
                profile?.avatarUrl ||
                "https://api.dicebear.com/9.x/notionists/svg?seed=Student"
              }
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-grow text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {profile?.name || "Chưa cập nhật"}
            </h3>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 mt-2">
              {profile?.gpa !== undefined && profile.gpa > 0 && (
                <span className="px-2 sm:px-3 py-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs font-semibold rounded-full flex items-center gap-1">
                  <GraduationCap size={12} /> GPA: {profile.gpa.toFixed(1)}
                </span>
              )}
              {profile?.englishLevel && (
                <span className="px-2 sm:px-3 py-1 bg-purple-50 dark:bg-purple-900 text-purple-700 dark:text-purple-200 text-xs font-semibold rounded-full flex items-center gap-1">
                  <Globe size={12} /> {profile.englishLevel}
                </span>
              )}
              {profile?.targetMajor && (
                <span className="px-2 sm:px-3 py-1 bg-orange-50 dark:bg-orange-900 text-orange-700 dark:text-orange-200 text-xs font-semibold rounded-full flex items-center gap-1">
                  <Trophy size={12} /> {profile.targetMajor}
                </span>
              )}
            </div>
          </div>
          {analyzed && swotData && (
            <div className="text-center sm:text-right w-full sm:w-auto">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Điểm đánh giá chung
              </p>
              <div className="text-2xl sm:text-3xl font-bold text-[var(--brand-deep)]">
                {swotData?.scores
                  ? Math.round(
                      (swotData.scores.academic +
                        swotData.scores.language +
                        swotData.scores.extracurricular +
                        swotData.scores.skills) /
                        4
                    )
                  : "--"}
                <span className="text-base sm:text-lg text-gray-400 dark:text-gray-500 font-normal">
                  /100
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 sm:p-12">
            <PageLoading fullPage={false} size="lg" message="Đang phân tích hồ sơ..." className="py-0" />
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 text-center">
              Hệ thống đang tổng hợp dữ liệu và so sánh với tiêu chuẩn du học.
            </p>
          </div>
        )}

        {/* Results Dashboard */}
        {analyzed && swotData && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-700">
            {/* Top Row: Chart + Strategy */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Radar Chart */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-3 sm:p-4 lg:col-span-1 flex flex-col items-center">
                <h4 className="w-full font-bold text-sm sm:text-base text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2 sm:pb-3">
                  <BrainCircuit
                    size={16}
                    className="sm:w-[18px] sm:h-[18px] text-[#0f6093]"
                  />
                  <span className="truncate">Biểu đồ năng lực</span>
                </h4>
                <div className="w-full h-[250px] sm:h-[300px] -ml-2 sm:-ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="75%"
                      data={chartData}
                    >
                      <PolarGrid stroke="#E2E8F0" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{
                          fill: "#64748B",
                          fontSize: 10,
                          fontWeight: 500,
                        }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        tick={{
                          fill: "#94A3B8",
                          fontSize: 9,
                        }}
                      />
                      <Radar
                        name="Điểm số"
                        dataKey="A"
                        stroke="#0f6093"
                        fill="#0f6093"
                        fillOpacity={0.6}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #E2E8F0",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Strategic Advice Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 sm:p-6 lg:col-span-2">
                <h4 className="font-bold text-sm sm:text-base text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-3">
                  <Target
                    size={16}
                    className="sm:w-[18px] sm:h-[18px] text-[#0f6093]"
                  />
                  <span>Định hướng chiến lược</span>
                </h4>
                <div className="space-y-3">
                  {swotData.strategicAdvice.map((advice, idx) => (
                    <div
                      key={idx}
                      className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50"
                    >
                      <h5 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-1">
                        {advice.title}
                      </h5>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                        {advice.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SWOT Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Strengths */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 sm:p-6">
                <h4 className="font-bold text-sm sm:text-base text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-3">
                  <ShieldCheck
                    size={16}
                    className="sm:w-[18px] sm:h-[18px] text-green-600"
                  />
                  <span>Điểm mạnh</span>
                </h4>
                <ul className="space-y-2">
                  {swotData.strengths.map((raw, idx) => {
                    const strength = (raw ?? '') as string;
                    const [before, after] = strength.split(/⇒\s*Kết luận:/);
                    let pillar: string | null = null;
                    let tier: string | null = null;
                    let evidence: string | null = null;
                    let conclusion = (after ?? strength).trim();
                    if (before && /Tier/i.test(before) && /Evidence:/i.test(before)) {
                      const segs = before.split(':').map((s) => s.trim());
                      pillar = segs[0] || null;
                      const tierSeg = segs.find((s) => /Tier/i.test(s));
                      tier = tierSeg ? tierSeg.replace(/Tier/i, '').trim() : null;
                      const evidSeg = segs.find((s) => /Evidence:/i.test(s));
                      evidence = evidSeg ? evidSeg.replace(/Evidence:/i, '').trim() : null;
                    }
                    return (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-green-600 mt-1">•</span>
                        <div className="space-y-0.5">
                          {(pillar || tier) && (
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {pillar && <span className="font-semibold text-foreground">{pillar}</span>}
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
                  })}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 sm:p-6">
                <h4 className="font-bold text-sm sm:text-base text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-3">
                  <AlertOctagon
                    size={16}
                    className="sm:w-[18px] sm:h-[18px] text-red-600"
                  />
                  <span>Điểm yếu</span>
                </h4>
                <ul className="space-y-2">
                  {swotData.weaknesses.map((raw, idx) => {
                    const weakness = (raw ?? '') as string;
                    const [before, after] = weakness.split(/⇒\s*Kết luận:/);
                    let pillar: string | null = null;
                    let tier: string | null = null;
                    let evidence: string | null = null;
                    let conclusion = (after ?? weakness).trim();
                    if (before && /Tier/i.test(before) && /Evidence:/i.test(before)) {
                      const segs = before.split(':').map((s) => s.trim());
                      pillar = segs[0] || null;
                      const tierSeg = segs.find((s) => /Tier/i.test(s));
                      tier = tierSeg ? tierSeg.replace(/Tier/i, '').trim() : null;
                      const evidSeg = segs.find((s) => /Evidence:/i.test(s));
                      evidence = evidSeg ? evidSeg.replace(/Evidence:/i, '').trim() : null;
                    }
                    return (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-red-600 mt-1">•</span>
                        <div className="space-y-0.5">
                          {(pillar || tier) && (
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {pillar && <span className="font-semibold text-foreground">{pillar}</span>}
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
                  })}
                </ul>
              </div>

              {/* Opportunities */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 sm:p-6">
                <h4 className="font-bold text-sm sm:text-base text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-3">
                  <Zap
                    size={16}
                    className="sm:w-[18px] sm:h-[18px] text-yellow-600"
                  />
                  <span>Cơ hội</span>
                </h4>
                <ul className="space-y-2">
                  {swotData.opportunities.map((raw, idx) => {
                    const opportunity = (raw ?? '') as string;
                    const [before, after] = opportunity.split(/⇒\s*Kết luận:/);
                    let pillar: string | null = null;
                    let tier: string | null = null;
                    let evidence: string | null = null;
                    let conclusion = (after ?? opportunity).trim();

                    if (before && /Tier/i.test(before) && /Evidence:/i.test(before)) {
                      const segs = before.split(':').map((s) => s.trim());
                      pillar = segs[0] || null;
                      const tierSeg = segs.find((s) => /Tier/i.test(s));
                      tier = tierSeg ? tierSeg.replace(/Tier/i, '').trim() : null;
                      const evidSeg = segs.find((s) => /Evidence:/i.test(s));
                      evidence = evidSeg ? evidSeg.replace(/Evidence:/i, '').trim() : null;
                    }

                    return (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-yellow-600 mt-1">•</span>
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
                  })}
                </ul>
              </div>

              {/* Threats */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 sm:p-6">
                <h4 className="font-bold text-sm sm:text-base text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-3">
                  <Target
                    size={16}
                    className="sm:w-[18px] sm:h-[18px] text-orange-600"
                  />
                  <span>Thách thức</span>
                </h4>
                <ul className="space-y-2">
                  {swotData.threats.map((raw, idx) => {
                    const threat = (raw ?? '') as string;
                    const [before, after] = threat.split(/⇒\s*Kết luận:/);
                    let pillar: string | null = null;
                    let tier: string | null = null;
                    let evidence: string | null = null;
                    let conclusion = (after ?? threat).trim();

                    if (before && /Tier/i.test(before) && /Evidence:/i.test(before)) {
                      const segs = before.split(':').map((s) => s.trim());
                      pillar = segs[0] || null;
                      const tierSeg = segs.find((s) => /Tier/i.test(s));
                      tier = tierSeg ? tierSeg.replace(/Tier/i, '').trim() : null;
                      const evidSeg = segs.find((s) => /Evidence:/i.test(s));
                      evidence = evidSeg ? evidSeg.replace(/Evidence:/i, '').trim() : null;
                    }

                    return (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                      >
                        <span className="text-orange-600 mt-1">•</span>
                        <div className="space-y-0.5">
                          {(pillar || tier) && (
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {pillar && (
                                <span className="font-semibold text-foreground">
                                  {pillar}
                                </span>
                              )}
                              {tier && (
                                <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/40 text-[10px] font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

