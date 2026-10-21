"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  GraduationCap,
  ArrowRight,
  Sparkles,
  Target,
  Heart,
  Lightbulb,
  Lock,
  Gamepad2,
  MousePointerClick,
  Keyboard,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecommendFacultyHistorySection } from "./RecommendFacultyHistorySection";
import { useRouter } from "next/navigation";
import { FlappyHollies } from "@/components/games/FlappyHollies";

type AssessmentSummary = {
  mbti_type?: string;
  mbti_confidence?: number;
  grit_score?: number;
  grit_level?: string;
  riasec_code?: string;
};

type FacultyItem = {
  faculty_name: string;
  industry_group?: string;
  match_score: number;
  /** Chuỗi nghề tiêu biểu (fast-api) */
  recommend_career?: string;
  detail_reason?: string;
  explain_faculty?: string;
  /** Tên cũ / fallback */
  reason?: string;
};

type RecommendationData = {
  assessment_summary?: AssessmentSummary | null;
  faculties?: FacultyItem[] | null;
  created_at?: string;
};

type Limits = {
  limit: number | null;
  used: number;
  remaining: number | null;
};

interface RecommendFacultySectionProps {
  studentId: string | null;
  allCompleted: boolean;
  id?: string;
  selectedHistoryItem?: any;
  onRunSuccess?: () => void;
}

const ACCENT = "#0052FF";
const ACCENT_SEC = "#4D7CFF";
const easeOut = [0.16, 1, 0.3, 1] as const;
const stagger = {
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

function formatViDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Remove ExpandableFacultyDetails completely

function ResultBlock({
  summary,
  faculties,
  title,
  isFree,
  createdAt,
}: {
  summary: AssessmentSummary | null | undefined;
  faculties: FacultyItem[];
  title?: string;
  isFree?: boolean;
  createdAt?: string | null;
}) {
  const router = useRouter();
  const createdLabel = formatViDate(createdAt ?? undefined);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyItem | null>(null);
  const [showAllFaculties, setShowAllFaculties] = useState(false);

  const topFaculties = faculties.slice(0, 3);
  const remainingFacultiesCount = faculties.length - 3;

  return (
    <motion.div
      className="mt-10 space-y-8"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      {title && (
        <motion.div
          variants={fadeInUp}
          className="flex flex-wrap items-center gap-x-3 gap-y-1"
        >
          <span
            className="h-1 w-8 rounded-full flex-shrink-0"
            style={{
              background: `linear-gradient(to right, ${ACCENT}, ${ACCENT_SEC})`,
            }}
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-lg font-semibold text-foreground tracking-tight">
              {title}
            </h3>
            {createdLabel && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Cập nhật: {createdLabel}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {summary && (
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {summary.mbti_type != null && (
            <div className="group rounded-xl border border-border bg-card p-5 shadow-md hover:shadow-xl hover:border-[#0052FF]/20 transition-all duration-300">
              <div
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_SEC})`,
                  boxShadow: "0 4px 14px rgba(0,82,255,0.25)",
                }}
              >
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs font-sans font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
                MBTI
              </p>
              <p className="text-xl font-heading font-bold text-foreground">
                {summary.mbti_type}
              </p>
              {typeof summary.mbti_confidence === "number" && (
                <p className="text-sm text-muted-foreground mt-1">
                  Độ tin cậy {(summary.mbti_confidence * 100).toFixed(0)}%
                </p>
              )}
            </div>
          )}
          {summary.grit_score != null && (
            <div className="group rounded-xl border border-border bg-card p-5 shadow-md hover:shadow-xl hover:border-[#0052FF]/20 transition-all duration-300">
              <div
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_SEC})`,
                  boxShadow: "0 4px 14px rgba(0,82,255,0.25)",
                }}
              >
                <Target className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs font-sans font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
                GRIT
              </p>
              <p className="text-xl font-heading font-bold text-foreground">
                {summary.grit_score.toFixed(2)}
              </p>
              {summary.grit_level && (
                <p className="text-sm text-muted-foreground mt-1 capitalize">
                  {summary.grit_level}
                </p>
              )}
            </div>
          )}
          {summary.riasec_code && (
            <div className="group rounded-xl border border-border bg-card p-5 shadow-md hover:shadow-xl hover:border-[#0052FF]/20 transition-all duration-300">
              <div
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_SEC})`,
                  boxShadow: "0 4px 14px rgba(0,82,255,0.25)",
                }}
              >
                <Heart className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs font-sans font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
                RIASEC
              </p>
              <p className="text-xl font-heading font-bold text-foreground tracking-wide">
                {summary.riasec_code}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {faculties.length > 0 && (
        <motion.div variants={fadeInUp} className="space-y-4">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-[#0052FF]" />
            Top ngành gợi ý
          </h4>
          <ul className="space-y-3">
            {topFaculties.map((f, i) => (
              <motion.li
                key={i}
                variants={fadeInUp}
                onClick={() => setSelectedFaculty(f)}
                className={`group cursor-pointer rounded-xl border bg-card p-4 shadow-md transition-all duration-300 hover:shadow-xl ${i === 0
                  ? "border-[#0052FF]/40 bg-gradient-to-br from-[#0052FF]/5 to-transparent ring-1 ring-[#0052FF]/20"
                  : "border-border hover:border-[#0052FF]/20"
                  }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-lg text-foreground group-hover:text-[#0052FF] transition-colors">
                      {f.faculty_name}
                    </p>
                    {f.industry_group && (
                      <p className="mt-1 text-sm font-medium text-[#0052FF]">
                        {f.industry_group}
                      </p>
                    )}
                  </div>
                  <div
                    className="flex-shrink-0 text-3xl font-heading font-bold tabular-nums bg-clip-text text-transparent"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${ACCENT}, ${ACCENT_SEC})`,
                    }}
                  >
                    {(() => {
                      const raw = f.match_score ?? 0;
                      const pct = raw > 0 && raw <= 1 ? raw * 100 : raw;
                      return `${pct.toFixed(1)}%`;
                    })()}
                  </div>
                </div>
                {/* Match bar */}
                <div className="mt-4 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: `linear-gradient(to right, ${ACCENT}, ${ACCENT_SEC})`,
                    }}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(
                        100,
                        (() => {
                          const raw = f.match_score ?? 0;
                          return raw > 0 && raw <= 1 ? raw * 100 : raw;
                        })(),
                      )}%`,
                    }}
                    transition={{
                      duration: 0.8,
                      ease: easeOut,
                      delay: i * 0.05,
                    }}
                  />
                </div>
              </motion.li>
            ))}

            {isFree && faculties.length > 3 && (
              <motion.div
                variants={fadeInUp}
                onClick={() => router.push("/student/pricing")}
                className="group relative rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/30 shadow-sm hover:shadow-md cursor-pointer overflow-hidden p-6 transition-colors"
              >
                {/* Simulated blurred content in background */}
                <div className="absolute inset-0 z-0 opacity-30 blur-[8px] pointer-events-none p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="h-5 w-48 bg-amber-900/20 rounded mb-3"></div>
                      <div className="h-4 w-16 bg-amber-900/20 rounded mb-2"></div>
                      <div className="flex gap-2"><div className="h-6 w-20 bg-amber-900/15 rounded"></div><div className="h-6 w-24 bg-amber-900/15 rounded"></div></div>
                    </div>
                    <div className="h-8 w-16 bg-amber-900/20 rounded"></div>
                  </div>
                  <div className="h-2 w-full bg-amber-900/10 rounded-full"></div>
                </div>

                {/* Lock Overlay Content */}
                <div className="relative z-10 flex flex-col justify-center items-center h-full min-h-[140px] text-center">
                  <div className="bg-white/80 dark:bg-background/80 border border-amber-300 dark:border-amber-700 p-4 rounded-full mb-4 shadow-sm text-amber-600 dark:text-amber-500 group-hover:text-amber-700 group-hover:border-amber-400 group-hover:scale-105 transition-all duration-300">
                    <Lock className="h-7 w-7" />
                  </div>
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1.5">
                    Đã ẩn {faculties.length - 3} ngành học phù hợp
                  </h4>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200 bg-amber-100/60 dark:bg-amber-900/40 px-4 py-1.5 rounded-full border border-amber-200/60 dark:border-amber-800/60">
                    Nâng cấp Plus/Premium để mở khóa toàn bộ danh sách
                  </p>
                </div>
              </motion.div>
            )}

            {!isFree && remainingFacultiesCount > 0 && (
              <motion.div variants={fadeInUp} className="flex justify-center mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAllFaculties(true)}
                  className="rounded-xl border-[#0052FF]/30 text-[#0052FF] hover:bg-[#0052FF]/10 w-full font-semibold"
                >
                  Xem thêm {remainingFacultiesCount} ngành gợi ý
                </Button>
              </motion.div>
            )}
          </ul>
        </motion.div>
      )}

      {/* Modal Detail Faculty */}
      <Dialog open={!!selectedFaculty} onOpenChange={(open) => !open && setSelectedFaculty(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0052FF]">{selectedFaculty?.faculty_name}</DialogTitle>
            <DialogDescription className="text-base font-medium text-foreground">
              {selectedFaculty?.industry_group && `Nhóm ngành: ${selectedFaculty.industry_group}`}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-5">
             <div className="flex items-center gap-3 bg-[#0052FF]/5 p-4 rounded-xl border border-[#0052FF]/10">
               <span className="font-semibold text-foreground">Mức độ phù hợp:</span>
               <span className="text-2xl font-bold text-[#0052FF]">
                 {selectedFaculty?.match_score != null ? `${(selectedFaculty.match_score > 0 && selectedFaculty.match_score <= 1 ? selectedFaculty.match_score * 100 : selectedFaculty.match_score).toFixed(1)}%` : 'N/A'}
               </span>
             </div>
             {(selectedFaculty?.detail_reason || selectedFaculty?.reason) && (
               <div>
                 <h4 className="font-semibold text-foreground text-lg mb-2">Vì sao phù hợp</h4>
                 <p className="text-[15px] text-muted-foreground leading-relaxed">
                   {selectedFaculty.detail_reason || selectedFaculty.reason}
                 </p>
               </div>
             )}
             {selectedFaculty?.explain_faculty && (
               <div>
                 <h4 className="font-semibold text-foreground text-lg mb-2">Giới thiệu nhóm ngành</h4>
                 <p className="text-[15px] text-muted-foreground leading-relaxed">
                   {selectedFaculty.explain_faculty}
                 </p>
               </div>
             )}
             {(selectedFaculty?.recommend_career || selectedFaculty?.reason) && (
               <div>
                 <h4 className="font-semibold text-foreground text-lg mb-2">Nghề gợi ý</h4>
                 <div className="flex flex-wrap gap-2">
                   {(selectedFaculty.recommend_career || selectedFaculty.reason || "")
                     .split(",")
                     .map((s) => s.trim())
                     .filter(Boolean)
                     .map((job, j) => (
                       <span
                         key={j}
                         className="inline-flex rounded-lg border border-[#0052FF]/20 bg-[#0052FF]/10 px-3 py-1 text-sm font-medium text-[#0052FF]"
                       >
                         {job}
                       </span>
                     ))}
                 </div>
               </div>
             )}
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setSelectedFaculty(null)} className="rounded-xl px-6">Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal All Faculties */}
      <Dialog open={showAllFaculties} onOpenChange={setShowAllFaculties}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="shrink-0 p-6 pb-4 border-b">
            <DialogTitle className="text-xl font-bold text-foreground">Danh sách tất cả ngành gợi ý</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-3">
             {faculties.map((f, i) => (
               <div 
                 key={i} 
                 onClick={() => {
                   setShowAllFaculties(false);
                   setTimeout(() => setSelectedFaculty(f), 300);
                 }} 
                 className="group cursor-pointer rounded-xl border border-border bg-card p-4 hover:border-[#0052FF]/30 hover:bg-[#0052FF]/5 hover:shadow-md transition-all"
               >
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-foreground group-hover:text-[#0052FF] truncate">{f.faculty_name}</h5>
                      <p className="text-sm font-medium text-muted-foreground truncate">{f.industry_group}</p>
                    </div>
                    <div className="text-xl font-bold text-[#0052FF] shrink-0">
                      {f.match_score != null ? `${(f.match_score > 0 && f.match_score <= 1 ? f.match_score * 100 : f.match_score).toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
               </div>
             ))}
          </div>
          <DialogFooter className="shrink-0 p-4 border-t bg-muted/20">
            <Button variant="outline" onClick={() => setShowAllFaculties(false)} className="rounded-xl px-6">Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function SkeletonBlock() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="h-6 w-32 rounded-full bg-muted/60 animate-pulse" />
      <div className="h-8 w-56 rounded bg-muted/50 animate-pulse" />
      <div
        className="h-1 w-24 rounded opacity-60"
        style={{
          background: `linear-gradient(to right, ${ACCENT}, ${ACCENT_SEC})`,
        }}
      />
      <div className="space-y-3 pt-2">
        <div className="h-4 w-full rounded bg-muted/40 animate-pulse" />
        <div className="h-4 w-4/5 rounded bg-muted/40 animate-pulse" />
      </div>
      <div className="flex flex-wrap gap-4">
        <div
          className="h-12 w-44 rounded-xl animate-pulse opacity-80"
          style={{
            background: `linear-gradient(90deg, ${ACCENT}20, ${ACCENT_SEC}15)`,
          }}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-xl bg-muted/30 animate-pulse"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
      <div className="h-32 rounded-xl bg-muted/20 animate-pulse" />
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="size-4 animate-spin" />
        Đang tải...
      </p>
    </div>
  );
}

import { useSubscription } from "@/hooks/useSubscription";

export default function RecommendFacultySection({
  studentId,
  allCompleted,
  id,
  selectedHistoryItem,
  onRunSuccess,
}: RecommendFacultySectionProps) {
  const { isFree } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [sectionLoading, setSectionLoading] = useState(true);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [latest, setLatest] = useState<RecommendationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runConfirmOpen, setRunConfirmOpen] = useState(false);

  useEffect(() => {
    if (selectedHistoryItem) {
      setLatest({
        assessment_summary: selectedHistoryItem.assessment_summary,
        faculties: selectedHistoryItem.faculties,
        created_at: selectedHistoryItem.created_at,
      });
    }
  }, [selectedHistoryItem]);

  const normalizeErrorMessage = (err: unknown): string => {
    if (!err) return "Không thể tải gợi ý ngành.";
    if (typeof err === "string") return err;
    if (
      typeof err === "object" &&
      err !== null &&
      "message" in err &&
      typeof (err as { message?: unknown }).message === "string"
    ) {
      return (err as { message: string }).message;
    }
    return "Không thể tải gợi ý ngành.";
  };

  const fetchLimitsAndLatest = useCallback(async (sid: string) => {
    try {
      const [limitsRes, latestRes] = await Promise.all([
        fetch(`/api/students/${sid}/recommend-faculty/limits`),
        fetch(`/api/students/${sid}/recommend-faculty/latest`),
      ]);
      if (limitsRes.ok) {
        const lim = await limitsRes.json();
        setLimits({
          limit: lim.limit,
          used: lim.used ?? 0,
          remaining: lim.remaining ?? null,
        });
      }
      if (latestRes.ok) {
        const lat = await latestRes.json();
        setLatest(
          lat.recommendation
            ? {
              assessment_summary: lat.recommendation.assessment_summary,
              faculties: lat.recommendation.faculties,
              created_at: lat.recommendation.created_at,
            }
            : null,
        );
      }
    } catch {
      setLimits(null);
      setLatest(null);
    }
  }, []);

  useEffect(() => {
    if (!studentId) {
      setSectionLoading(false);
      return;
    }
    setSectionLoading(true);
    fetchLimitsAndLatest(studentId).finally(() => setSectionLoading(false));
  }, [studentId, fetchLimitsAndLatest]);

  const handleRun = async () => {
    if (!studentId) return;
    if (limits != null && limits.remaining !== null && limits.remaining <= 0) {
      setError(
        "Bạn đã dùng hết số lần xem gợi ý ngành. Vui lòng nâng cấp gói.",
      );
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/recommend-faculty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(normalizeErrorMessage((data as { error?: unknown }).error));
        return;
      }
      setLatest({
        assessment_summary: data.assessment_summary ?? null,
        faculties: data.faculties ?? null,
        created_at: data.created_at,
      });
      await fetchLimitsAndLatest(studentId);
      if (onRunSuccess) onRunSuccess();
      setRunConfirmOpen(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Lỗi kết nối. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const summary = latest?.assessment_summary;
  const faculties = latest?.faculties ?? [];
  const hasQuota =
    limits?.remaining === null ||
    (typeof limits?.remaining === "number" && limits.remaining > 0);
  const remainingLabel =
    limits?.remaining === null
      ? "không giới hạn"
      : `${Math.max(0, limits?.remaining ?? 0)} lần`;
  const canRun = allCompleted && hasQuota && !loading;
  const hasResult = latest && (summary || faculties.length > 0);

  const ONET_URL = "https://www.onetonline.org/";

  if (sectionLoading && studentId) {
    return (
      <motion.section
        className="mt-12 relative"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
      >
        <SkeletonBlock />
      </motion.section>
    );
  }

  return (
    <motion.section
      id={id}
      className="mt-12 relative scroll-mt-4"
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
    >
      {/* Headline + CTA */}
      <div className="relative mb-2 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(to right, ${ACCENT}, ${ACCENT_SEC})`,
              }}
            >
              Gợi ý ngành học
            </span>
          </h2>
          <span />
        </div>

        <Link
          href="/student/universities?tab=faculty"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold px-4 py-2 sm:px-5 sm:py-2.5 shadow-md hover:shadow-[0_6px_20px_rgba(139,92,246,0.4)] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] shrink-0"
        >
          <Heart className="h-4 w-4" />
          <span className="hidden sm:inline">Lựa chọn ngành yêu thích</span>
          <span className="sm:hidden">Yêu thích</span>
        </Link>
      </div>
      <p className="w-full text-muted-foreground text-sm sm:text-base leading-relaxed mb-8 line-clamp-2">
        Cùng Holie Mate khám phá ngay bản đồ ngành nghề dành riêng cho bạn! Dựa trên kết quả của các bài đánh giá, kết hợp với công thức độc quyền của Holyann Explore và lăng kính dữ liệu chuẩn quốc tế O*NET, lộ trình tương lai của bạn sẽ được phác họa rõ nét ngay sau đây.
      </p>

      {/* Subsection: Dự đoán ngành ONET */}
      <div
        className="rounded-xl border border-[#0052FF]/20 bg-gradient-to-br from-[#0052FF]/5 to-transparent p-5 sm:p-6 mb-8"
        style={{ boxShadow: "0 4px 14px rgba(0,82,255,0.08)" }}
      >


        <div className="flex flex-wrap items-center gap-4">
          <Button
            onClick={() => canRun && setRunConfirmOpen(true)}
            disabled={!canRun}
            className="group bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] text-white rounded-xl h-12 px-6 font-semibold shadow-md hover:shadow-[0_8px_24px_rgba(0,82,255,0.35)] transition-all duration-200 -translate-y-0.5 hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:transform-none disabled:shadow-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Đang xử lý…
              </>
            ) : (
              <>
                Xem gợi ý ngành
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </>
            )}
          </Button>

          {loading && !runConfirmOpen && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setRunConfirmOpen(true)}
              className="rounded-xl h-12 px-5"
            >
              Chơi Flappy Hollies
            </Button>
          )}
        </div>
      </div>

      <Dialog open={runConfirmOpen} onOpenChange={setRunConfirmOpen}>
        <DialogContent className="p-0 pt-0 sm:pt-0 gap-0 sm:max-w-4xl overflow-hidden">
          <DialogHeader className="space-y-0 p-0">
            <div className="px-6 pt-6 pb-4 border-b border-border bg-gradient-to-r from-[#0052FF]/8 via-transparent to-[#4D7CFF]/8">
              <DialogTitle className="text-xl sm:text-2xl font-heading tracking-tight">
                Xem gợi ý ngành
              </DialogTitle>
            </div>
            <DialogDescription asChild>
              {!loading ? (
                <div className="px-6 py-5 space-y-2 text-sm text-muted-foreground">
                  <p>
                    Bạn chỉ xem được kết quả{" "}
                    <strong className="text-foreground">
                      lần chạy gần nhất
                    </strong>
                    . Mỗi lần bấm &quot;Xem gợi ý ngành&quot; sẽ tạo một kết quả
                    mới và trừ 1 lần trong quota.
                  </p>
                  <p className="flex items-center gap-2 pt-1">
                    <span>Số lần còn lại:</span>
                    <span className="font-semibold text-[#0052FF] tabular-nums">
                      {remainingLabel}
                    </span>
                  </p>
                </div>
              ) : (
                <motion.div
                  className="px-6 py-5"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease: easeOut }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-stretch">
                    {/* Left: instructions card */}
                    <div className="lg:col-span-2">
                      <div className="h-full rounded-2xl border border-border bg-card/70 backdrop-blur-sm p-4 sm:p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 inline-flex size-9 items-center justify-center rounded-xl bg-[#0052FF]/10 text-[#0052FF]">
                            <Sparkles className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-snug">
                              Đang tạo gợi ý ngành cho bạn
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                              Trong lúc chờ, chơi một ván{" "}
                              <span className="font-semibold text-foreground">
                                Flappy Hollies
                              </span>{" "}
                              cho đỡ “sốt ruột”.
                            </p>
                          </div>
                          <Loader2 className="size-4 mt-1.5 animate-spin text-muted-foreground" />
                        </div>

                        <div className="mt-4 grid gap-3">
                          <div className="rounded-xl border border-border bg-muted/15 p-3">
                            <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                              <Gamepad2 className="size-4 text-[#0052FF]" />
                              Điều khiển nhanh
                            </p>
                            <ul className="space-y-2 text-xs text-muted-foreground">
                              <li className="flex items-start gap-2">
                                <MousePointerClick className="size-4 mt-0.5 shrink-0" />
                                <span>
                                  <span className="font-semibold text-foreground">
                                    Click/Touch
                                  </span>{" "}
                                  để bay
                                </span>
                              </li>
                              <li className="flex items-start gap-2">
                                <Keyboard className="size-4 mt-0.5 shrink-0" />
                                <span>
                                  <span className="font-semibold text-foreground">
                                    Space
                                  </span>{" "}
                                  để bay, và{" "}
                                  <span className="font-semibold text-foreground">
                                    Space/Click
                                  </span>{" "}
                                  lần nữa để chơi lại khi thua
                                </span>
                              </li>
                            </ul>
                          </div>

                          <div className="rounded-xl border border-border bg-muted/10 p-3">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Bạn có thể bấm{" "}
                              <span className="font-semibold text-foreground">
                                Ẩn
                              </span>{" "}
                              để đóng modal. Hệ thống vẫn tiếp tục xử lý ở nền,
                              và bạn có thể mở lại để chơi.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: game area */}
                    <div className="lg:col-span-3">
                      <motion.div
                        whileHover={{ y: -1 }}
                        transition={{ duration: 0.2, ease: easeOut }}
                        className="h-full rounded-3xl border border-[#0052FF]/15 bg-gradient-to-br from-[#0052FF]/8 via-background to-[#4D7CFF]/8 p-3 sm:p-4 shadow-[0_18px_45px_rgba(0,82,255,0.12)]"
                      >
                        <div className="flex items-center justify-between px-1.5 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex size-8 items-center justify-center rounded-xl bg-white/70 dark:bg-background/70 border border-border shadow-sm">
                              <Gamepad2 className="size-4 text-[#0052FF]" />
                            </span>
                            <div className="leading-tight">
                              <p className="text-sm font-semibold text-foreground">
                                Flappy Hollies
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                Nhân vật: Holie
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-3xl bg-white/55 dark:bg-card/60 border border-border shadow-sm p-2 sm:p-3">
                          <FlappyHollies height={340} spriteSrc="/holy/14.png" />
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-6 py-4 border-t border-border bg-background">
            <Button
              variant="outline"
              onClick={() => setRunConfirmOpen(false)}
              className="rounded-xl"
            >
              {loading ? "Ẩn (vẫn đang xử lý)" : "Hủy"}
            </Button>
            <Button
              onClick={() => handleRun()}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] text-white shadow-md hover:shadow-[0_10px_30px_rgba(0,82,255,0.28)]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Xem gợi ý ngành"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!allCompleted && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-4 px-1">
          Hoàn thành đủ 3 bài test (MBTI, GRIT, RIASEC) để mở khóa gợi ý ngành.
        </p>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Gợi ý gần nhất: Featured block with gradient border */}
      {hasResult && (
        <>
          <div className="rounded-xl bg-gradient-to-br from-[#0052FF] via-[#4D7CFF] to-[#0052FF] p-[2px] shadow-[0_8px_24px_rgba(0,82,255,0.25)]">
            <div className="rounded-[10px] bg-card p-6 sm:p-8">
              <ResultBlock
                summary={summary ?? null}
                faculties={faculties}
                title="Gợi ý gần nhất"
                isFree={isFree}
                createdAt={latest?.created_at}
              />
            </div>
          </div>
        </>
      )}

      {allCompleted && !hasResult && !sectionLoading && studentId && (
        <div className="rounded-xl border border-dashed border-[#0052FF]/30 bg-blue-50/40 dark:bg-blue-950/20 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Bạn đã hoàn thành 3 bài đánh giá. Chưa có lần gợi ý ngành nào — bấm{" "}
            <span className="font-semibold text-foreground">
              Xem gợi ý ngành
            </span>{" "}
            phía trên để tạo kết quả đầu tiên (có giới hạn theo gói).
          </p>
        </div>
      )}
    </motion.section>
  );
}
