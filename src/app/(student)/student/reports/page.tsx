"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useSubscription } from "@/hooks/useSubscription";
import { StudentPageContainer } from "@/components/student";
import RoleGuard from "@/components/auth/RoleGuard";
import {
  FileBarChart,
  Printer,
  User,
  Sparkles,
  Target,
  Award,
  BookOpen,
  Star,
  Shield,
  TrendingUp,
  Heart,
  Brain,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { StudentProfile } from "@/components/types";
import { formatYearlyBudgetLabel } from "@/lib/yearly-budget";
import { normalizePillarScoreTo100 } from "@/lib/pillar-scores";
import { CompletedMockInterviewSessionsList } from "@/components/student/mock-interview/CompletedMockInterviewSessionsList";
import type { MockInterviewCompletedSessionDto } from "@/components/student/mock-interview/CompletedMockInterviewSessionsList";

/** Bổ sung field từ API profile cho báo cáo */
type ReportStudentProfile = StudentProfile & {
  personalDesire?: string | null;
  yearlyBudget?: string | null;
};
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

const ACCENT = "#10b981";
const ACCENT_SEC = "#34d399";
const REACH_COLOR = "#7C3AED";
const MATCH_COLOR = "#10b981";
const SAFE_COLOR = "#059669";

const PILLAR_CONFIG = [
  {
    key: "aca",
    label: "Học thuật",
    color: "#3b82f6",
    light: "bg-blue-500/15",
    border: "border-l-blue-500",
  },
  {
    key: "lan",
    label: "Ngoại ngữ",
    color: "#8b5cf6",
    light: "bg-violet-500/15",
    border: "border-l-violet-500",
  },
  {
    key: "hdnk",
    label: "HD Ngoại khóa",
    color: "#10b981",
    light: "bg-emerald-500/15",
    border: "border-l-emerald-500",
  },
  {
    key: "skill",
    label: "Kỹ năng",
    color: "#f59e0b",
    light: "bg-amber-500/15",
    border: "border-l-amber-500",
  },
];

type ProfileData = {
  feature1_output?: {
    summary?: {
      total_pillar_scores?: Record<string, number>;
      main_spike?: string;
      sharpness?: string;
    };
    summaryText?: string;
    "B. Phân tích SWOT"?: {
      strengths?: string[];
      weaknesses?: string[];
      opportunities?: string[];
      threats?: string[];
    };
  };
  feature2_output?: {
    assessment?: {
      mbti?: {
        personality_type?: string;
        dimension_scores?: Record<string, number>;
      };
      grit?: {
        score?: number;
        level?: string;
        description?: string;
        passion_score?: number;
        perseverance_score?: number;
      };
      riasec?: {
        code?: string;
        scores?: Record<string, number>;
        top3?: [string, number][];
      };
    };
  };
  feature3_output?: {
    universities?: {
      REACH?: {
        universities?: {
          id?: string;
          name: string;
          country?: string;
          ranking?: number;
        }[];
      };
      MATCH?: {
        universities?: {
          id?: string;
          name: string;
          country?: string;
          ranking?: number;
        }[];
      };
      SAFETY?: {
        universities?: {
          id?: string;
          name: string;
          country?: string;
          ranking?: number;
        }[];
      };
      reach?:
        | { universities?: { name: string; country?: string }[] }[]
        | { name: string; country?: string }[];
      match?: unknown[];
      safety?: unknown[];
    };
    faculties?: {
      reach?: Array<{
        faculty_name?: string;
        strong_universities?: Array<{ name: string; country?: string }>;
      }>;
      match?: Array<{
        faculty_name?: string;
        strong_universities?: Array<{ name: string; country?: string }>;
      }>;
      safety?: Array<{
        faculty_name?: string;
        strong_universities?: Array<{ name: string; country?: string }>;
      }>;
      safe?: Array<{
        faculty_name?: string;
        strong_universities?: Array<{ name: string; country?: string }>;
      }>;
    };
    summary?: Record<string, unknown> | string;
    roadmap?: Record<string, unknown>;
  };
};

type ImproveResults = {
  analysis?: Record<string, unknown>;
  enhance?: Record<string, unknown>;
};

type EssayListItem = {
  id: string;
  title: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
};

function safeStr(v: unknown): string {
  if (v == null) return ":";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object" && v !== null) {
    const o = v as Record<string, unknown>;
    if (typeof o.description === "string") return o.description;
    if (typeof o.text === "string") return o.text;
    if (typeof o.summary === "string") return o.summary;
    if (typeof o.feedback === "string") return o.feedback;
    if (typeof o.suggestion === "string") return o.suggestion;
    if (typeof o.content === "string") return o.content;
    if (typeof o.name === "string") return o.name;
    if (typeof o.reason === "string") return o.reason;
    return JSON.stringify(o);
  }
  return String(v);
}

const easeOut = [0.16, 1, 0.3, 1] as const;
const stagger = {
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
};
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

function ReportSection({
  index,
  title,
  subtitle,
  children,
}: {
  index: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      variants={fadeInUp}
      className="scroll-mt-8 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg print:shadow-none print:!translate-y-0 print:!opacity-100"
    >
      <div className="border-b border-border bg-gradient-to-r from-emerald-500/12 via-card to-sky-500/8 px-5 py-4 sm:px-6 print:py-3">
        <div className="flex flex-wrap items-start gap-3 sm:items-center">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-lg font-bold text-white shadow-md font-university-display print:h-9 print:w-9 print:text-base">
            {index}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-university-display text-lg font-bold leading-tight text-foreground sm:text-xl print:text-base">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground print:text-xs print:text-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6 print:p-4">{children}</div>
    </motion.section>
  );
}

/** Skeleton khi đang tải dữ liệu báo cáo — bố cục gần với hero + 5 section */
function ReportsPageSkeleton() {
  const heroBar = "animate-pulse rounded-md bg-white/20";
  const block = "animate-pulse rounded-xl bg-muted/60";
  return (
    <StudentPageContainer
      noPadding
      className="reports-print-scope min-h-[60vh]"
    >
      <span className="sr-only">Đang tải báo cáo…</span>
      <section
        aria-hidden
        className="relative mb-6 overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--primary) 0%, var(--brand-deep) 50%, var(--brand-cyan) 100%)",
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 right-1/4 h-40 w-80 rounded-full bg-[var(--brand-cyan)]/20 blur-2xl" />
        <div className="relative px-6 py-8 sm:px-10 sm:py-10">
          <div className="mx-auto max-w-6xl">
            <div className={`h-6 w-40 ${heroBar}`} />
            <div className={`mt-4 h-9 w-72 max-w-full sm:h-11 ${heroBar}`} />
            <div className={`mt-3 h-4 w-full max-w-xl ${heroBar} opacity-90`} />
            <div className={`mt-2 h-4 w-[85%] max-w-lg ${heroBar} opacity-75`} />
            <div className="mt-8 flex flex-wrap gap-3">
              <div className={`h-10 w-32 rounded-xl ${heroBar}`} />
              <div className={`h-10 w-36 rounded-xl ${heroBar}`} />
            </div>
          </div>
        </div>
      </section>
      <div
        className="mx-auto max-w-6xl space-y-8 px-4 pb-12 sm:px-6"
        aria-busy="true"
        aria-label="Đang tải nội dung báo cáo"
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg"
          >
            <div className="border-b border-border bg-gradient-to-r from-emerald-500/10 via-card to-sky-500/5 px-5 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-muted/80 animate-pulse" />
                <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                  <div className="h-5 w-52 max-w-[90%] rounded bg-muted/90 animate-pulse" />
                  <div className="h-3.5 w-full max-w-lg rounded bg-muted/60 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="space-y-4 p-5 sm:p-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className={`h-24 ${block}`} />
                ))}
              </div>
              <div className={`h-36 w-full ${block} bg-muted/40`} />
              <div className="h-4 max-w-xl rounded bg-muted/50 animate-pulse" />
              <div className="h-4 max-w-md rounded bg-muted/40 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </StudentPageContainer>
  );
}

/** Chuẩn hóa SWOT: API/DB dùng "Strengths (Điểm mạnh)", "strengths", hoặc S/W/O/T. */
function normalizeSwot(swot: Record<string, unknown> | undefined): {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
} {
  if (!swot || typeof swot !== "object")
    return { strengths: [], weaknesses: [], opportunities: [], threats: [] };
  const arr = (v: unknown) =>
    Array.isArray(v)
      ? (v.filter((x) => typeof x === "string") as string[])
      : [];
  return {
    strengths: arr(swot["Strengths (Điểm mạnh)"] ?? swot.strengths ?? swot.S),
    weaknesses: arr(swot["Weaknesses (Điểm yếu)"] ?? swot.weaknesses ?? swot.W),
    opportunities: arr(
      swot["Opportunities (Cơ hội)"] ?? swot.opportunities ?? swot.O,
    ),
    threats: arr(swot["Threats (Thách thức)"] ?? swot.threats ?? swot.T),
  };
}

type UniItem = { name: string; country?: string };
/** Lấy danh sách trường theo nhóm từ feature3 (universities REACH/MATCH/SAFETY hoặc faculties reach/match/safety). */
function getFeature3Lists(f3: ProfileData["feature3_output"]): {
  reach: UniItem[];
  match: UniItem[];
  safety: UniItem[];
} {
  const empty: UniItem[] = [];
  if (!f3) return { reach: empty, match: empty, safety: empty };
  const unis = f3.universities;
  const faculties = f3.faculties;

  const fromUni = (key: "REACH" | "MATCH" | "SAFETY") => {
    const block = unis?.[key] as { universities?: UniItem[] } | undefined;
    const list = block?.universities;
    return Array.isArray(list)
      ? list
          .filter((u) => u && typeof u.name === "string")
          .map((u) => ({ name: u.name, country: u.country }))
      : empty;
  };
  const fromFaculties = (key: "reach" | "match" | "safety" | "safe") => {
    const arr =
      faculties?.[key] ?? (key === "safety" ? faculties?.safe : undefined);
    if (!Array.isArray(arr)) return empty;
    const out: UniItem[] = [];
    for (const item of arr) {
      const list = (item as { strong_universities?: UniItem[] })
        .strong_universities;
      if (Array.isArray(list))
        for (const u of list)
          if (u?.name) out.push({ name: u.name, country: u.country });
    }
    return out;
  };

  return {
    reach: fromUni("REACH").length ? fromUni("REACH") : fromFaculties("reach"),
    match: fromUni("MATCH").length ? fromUni("MATCH") : fromFaculties("match"),
    safety: fromUni("SAFETY").length
      ? fromUni("SAFETY")
      : fromFaculties("safety"),
  };
}

export default function ReportsPage() {
  const {
    session,
    isLoading: sessionLoading,
    isAuthenticated,
  } = useAuthSession();
  const { can, limit } = useSubscription();
  const showProfileAnalysisFull = can("profileAnalysisDetail");
  const showRoadmapFull = can("roadmapDetail");
  const majorFitShowCap =
    typeof limit("majorFitShowCount") === "number"
      ? (limit("majorFitShowCount") as number)
      : 15;
  const [profile, setProfile] = useState<ReportStudentProfile | null>(null);
  const [essays, setEssays] = useState<EssayListItem[]>([]);
  const [cvDocs, setCvDocs] = useState<
    {
      id: string;
      slot_index: number;
      file_name: string;
      cv_verified_at: string | null;
    }[]
  >([]);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [improveResults, setImproveResults] = useState<ImproveResults | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [mockInterviewSessions, setMockInterviewSessions] = useState<
    MockInterviewCompletedSessionDto[]
  >([]);
  const reportRef = useRef<HTMLDivElement>(null);

  const studentId = useMemo(() => {
    const id =
      (session?.user as { id?: string })?.id ??
      (session?.user as { user_id?: string })?.user_id ??
      (session?.user as { sub?: string })?.sub;
    if (id) return id as string;
    const email = session?.user?.email;
    if (email && !id) return `email:${email}`;
    return null;
  }, [session?.user]);

  useEffect(() => {
    if (sessionLoading || !studentId || !isAuthenticated) {
      if (!sessionLoading && !studentId) setLoading(false);
      return;
    }
    let actualId = studentId;
    const load = async () => {
      setLoading(true);
      try {
        if (studentId.startsWith("email:")) {
          const email = studentId.slice(6);
          const r = await fetch(
            `/api/users/by-email?email=${encodeURIComponent(email)}`,
          );
          if (r.ok) {
            const u = await r.json();
            actualId = u.id;
          }
        }
        const [
          profileRes,
          dataRes,
          resultsRes,
          latestRes,
          essaysRes,
          cvRes,
          mockInterviewRes,
        ] = await Promise.all([
          fetch(`/api/students/${actualId}/profile`),
          fetch("/api/student/improve/profile-data"),
          fetch("/api/student/improve/results"),
          fetch(`/api/students/${actualId}/profile-analysis/latest`),
          fetch("/api/student/essays"),
          fetch(`/api/students/${actualId}/manage-upload/cv-documents`),
          fetch(`/api/students/${actualId}/mock-interview/sessions`),
        ]);
        if (essaysRes.ok) {
          try {
            const ej = await essaysRes.json();
            if (ej?.success && Array.isArray(ej.data)) {
              setEssays(ej.data as EssayListItem[]);
            }
          } catch {
            setEssays([]);
          }
        } else {
          setEssays([]);
        }

        if (cvRes.ok) {
          try {
            const cj = await cvRes.json();
            const docs = Array.isArray(cj.documents) ? cj.documents : [];
            setCvDocs(
              docs.map(
                (d: {
                  id: string;
                  slot_index: number;
                  file_name: string;
                  cv_verified_at?: string | null;
                }) => ({
                  id: d.id,
                  slot_index: d.slot_index,
                  file_name: d.file_name,
                  cv_verified_at: d.cv_verified_at ?? null,
                }),
              ),
            );
          } catch {
            setCvDocs([]);
          }
        } else {
          setCvDocs([]);
        }

        if (mockInterviewRes.ok) {
          try {
            const mj = await mockInterviewRes.json();
            const list = Array.isArray(mj.sessions) ? mj.sessions : [];
            const latest =
              list.length > 0
                ? [list[0] as MockInterviewCompletedSessionDto]
                : [];
            setMockInterviewSessions(latest);
          } catch {
            setMockInterviewSessions([]);
          }
        } else {
          setMockInterviewSessions([]);
        }

        if (profileRes.ok) {
          const data = await profileRes.json();
          const mapped: ReportStudentProfile = {
            id: actualId.substring(0, 8).toUpperCase(),
            name: data.basicInfo?.full_name || "Chưa cập nhật",
            email: data.basicInfo?.email || "Chưa cập nhật",
            phone: data.basicInfo?.phone_number || "Chưa cập nhật",
            address: data.basicInfo?.current_address || "Chưa cập nhật",
            dob: data.basicInfo?.date_of_birth
              ? new Date(data.basicInfo.date_of_birth).toLocaleDateString(
                  "vi-VN",
                )
              : "Chưa cập nhật",
            avatarUrl: data.basicInfo?.avatar_url || "",
            gpa: 0,
            gpaScale: 10,
            englishLevel: Array.isArray(
              data.academicProfile?.english_certificates,
            )
              ? data.academicProfile.english_certificates
                  .map(
                    (c: { type?: string; score?: string; level?: string }) => {
                      const level = c.level
                        ? ` ${c.type === "JLPT" ? c.level : `cấp ${c.level}`}`
                        : "";
                      return `${c.type || ""}${level} ${c.score ?? ""}`.trim();
                    },
                  )
                  .filter(Boolean)
                  .join(", ") || "Chưa cập nhật"
              : "Chưa cập nhật",
            targetMajor:
              data.studentInfo?.target_faculty_name &&
              data.studentInfo?.target_university_name
                ? `${data.studentInfo.target_faculty_name} @ ${data.studentInfo.target_university_name}`
                : "Chưa xác định",
            targetGoals: Array.isArray(data.targetGoals)
              ? data.targetGoals.map(
                  (g: {
                    faculty_name?: string | null;
                    university_name?: string | null;
                    university_id?: number | null;
                  }) => ({
                    facultyName: g.faculty_name ?? "",
                    universityName: g.university_name ?? "",
                    universityId: g.university_id ?? null,
                  }),
                )
              : [],
            personalDesire: data.studentInfo?.personal_desire ?? null,
            yearlyBudget: formatYearlyBudgetLabel(
              data.studentInfo?.yearly_budget,
              data.studentInfo?.yearly_budget_currency,
            ),
            targetCountry: ":",
            extracurriculars: [
              ...(data.background?.academic_extracurriculars?.map(
                (act: {
                  id: string;
                  activity_name?: string;
                  role?: string;
                  start_date?: string;
                  description?: string;
                }) => ({
                  id: act.id,
                  title: act.activity_name || "Hoạt động",
                  role: act.role || "Thành viên",
                  year: act.start_date
                    ? new Date(act.start_date).getFullYear().toString()
                    : ":",
                  description: act.description || "",
                  category: "academic" as const,
                }),
              ) || []),
              ...(data.background?.non_academic_extracurriculars?.map(
                (act: {
                  id: string;
                  activity_name?: string;
                  role?: string;
                  start_date?: string;
                  description?: string;
                }) => ({
                  id: act.id,
                  title: act.activity_name || "Hoạt động",
                  role: act.role || "Thành viên",
                  year: act.start_date
                    ? new Date(act.start_date).getFullYear().toString()
                    : ":",
                  description: act.description || "",
                  category: "non_academic" as const,
                }),
              ) || []),
            ],
            achievements: [
              ...(data.background?.academic_awards?.map(
                (a: {
                  id: string;
                  award_name?: string;
                  issuing_organization?: string;
                }) => ({
                  id: a.id,
                  text: `${a.award_name || ""} - ${a.issuing_organization || ""}`.trim(),
                  category: "academic" as const,
                }),
              ) || []),
              ...(data.background?.non_academic_awards?.map(
                (a: {
                  id: string;
                  award_name?: string;
                  issuing_organization?: string;
                }) => ({
                  id: a.id,
                  text: `${a.award_name || ""} - ${a.issuing_organization || ""}`.trim(),
                  category: "non_academic" as const,
                }),
              ) || []),
            ],
            documents: [],
          };
          const gpaDetails = data.academicProfile?.gpa_transcript_details;
          if (gpaDetails) {
            mapped.gpa =
              parseFloat(
                gpaDetails.grade12 ||
                  gpaDetails.grade11 ||
                  gpaDetails.grade10 ||
                  "0",
              ) || 0;
          }
          try {
            const docsRes = await fetch(`/api/students/${actualId}/upload-cv`);
            if (docsRes.ok) {
              const docs = await docsRes.json();
              mapped.documents = Array.isArray(docs) ? docs : [];
            }
          } catch (_) {}
          setProfile(mapped);
        }
        if (dataRes.ok) {
          const data = (await dataRes.json()) as ProfileData & {
            feature3_output?: ProfileData["feature3_output"];
          };
          let payload: ProfileData = data;
          try {
            const admRes = await fetch(
              `/api/students/${actualId}/admission-chance/latest`,
            );
            if (admRes.ok) {
              const adm = await admRes.json();
              if (
                adm?.result?.faculties != null ||
                adm?.result?.summary != null
              ) {
                payload = {
                  ...payload,
                  feature3_output: {
                    ...payload.feature3_output,
                    faculties:
                      adm.result.faculties ??
                      payload.feature3_output?.faculties,
                    summary:
                      adm.result.summary ?? payload.feature3_output?.summary,
                    roadmap: payload.feature3_output?.roadmap,
                  },
                };
              }
            }
          } catch (_) {}
          setProfileData(payload);
        }
        let improvePayload: ImproveResults = {};
        if (resultsRes.ok) {
          const data = await resultsRes.json();
          improvePayload = {
            analysis: data.analysis ?? undefined,
            enhance: data.enhance ?? undefined,
          };
        }
        if (
          !improvePayload.analysis &&
          !improvePayload.enhance &&
          latestRes.ok
        ) {
          const latest = await latestRes.json();
          const enhanceResult = latest.enhance?.enhance_result;
          const fullResult = latest.analysis?.full_result;
          if (enhanceResult != null && typeof enhanceResult === "object")
            improvePayload.enhance = enhanceResult as Record<string, unknown>;
          if (fullResult != null && typeof fullResult === "object") {
            const fr = fullResult as Record<string, unknown>;
            improvePayload.analysis = {
              overall: fr.summary ?? {
                feedback: undefined,
                summary: undefined,
                overall_score: undefined,
                personal_fit_score: undefined,
                priority_suggestions: [],
              },
              pillar_scores:
                (fr["D. Điểm số gốc (Pillar Scores)"] as Record<
                  string,
                  number
                >) ??
                (fr.summary as Record<string, unknown>)?.total_pillar_scores,
              feature1_output: {
                summary: fr.summary as Record<string, unknown>,
              },
            };
          }
        }
        setImproveResults(improvePayload);
      } catch (e) {
        console.error(e);
        toast.error("Không tải được dữ liệu báo cáo");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [studentId, sessionLoading, isAuthenticated]);

  const handlePrint = () => window.print();

  if (loading || sessionLoading) {
    return (
      <RoleGuard allowedRoles={["user", "student", "STUDENT"]}>
        <ReportsPageSkeleton />
      </RoleGuard>
    );
  }

  const hasAnyData =
    profile ||
    profileData?.feature1_output ||
    profileData?.feature2_output ||
    profileData?.feature3_output ||
    improveResults?.analysis ||
    improveResults?.enhance ||
    essays.length > 0 ||
    mockInterviewSessions.length > 0;

  return (
    <RoleGuard allowedRoles={["user", "student", "STUDENT"]}>
      <StudentPageContainer
        noPadding
        className="reports-print-scope min-h-[60vh]"
      >
        {/* Hero: no padding, full-bleed như trang Target / Dashboard */}
        <section
          aria-label="Báo cáo"
          className="relative mb-6 overflow-hidden text-white print:mb-4"
          style={{
            background:
              "linear-gradient(135deg, var(--primary) 0%, var(--brand-deep) 50%, var(--brand-cyan) 100%)",
          }}
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl print:hidden" />
          <div className="pointer-events-none absolute -bottom-8 right-1/4 h-40 w-80 rounded-full bg-[var(--brand-cyan)]/20 blur-2xl print:hidden" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04] print:hidden"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative px-6 py-8 sm:px-10 sm:py-10 print:py-4">
            <div className="mx-auto max-w-6xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-sans font-semibold uppercase tracking-[0.22em] text-white/80 print:text-[9px] print:border-white/50 print:text-white">
                  <FileBarChart className="size-3.5" />
                  Báo cáo tổng hợp
                </p>
                <h1 className="mt-3 font-university-display text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl print:text-2xl print:text-white">
                 Holie Mate báo cáo hồ sơ 
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80 print:text-xs print:text-white">
                  Báo cáo chi tiết thông tin hồ sơ và quá trình cải thiện cũng như các đề xuất tiếp theo
                </p>
              </div>
              <div className="flex items-center gap-3 print:hidden">
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="rounded-full border-white/30 bg-white/10 px-5 text-white backdrop-blur-md shadow-lg transition-all hover:bg-white/20 hover:text-white"
                >
                  <Printer className="mr-2 size-4" />
                  In báo cáo
                </Button>
                <Button
                  asChild
                  className="rounded-full bg-white px-6 font-bold text-primary shadow-lg transition-all hover:bg-white/90"
                >
                  <Link href="/student/target">Trang Target</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div
          id="report-print"
          ref={reportRef}
          className="mx-auto px-4 sm:px-6 pb-12 space-y-10 print:space-y-6 print:px-0"
        >
          {!hasAnyData ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="print:!translate-y-0 print:!opacity-100"
            >
              <Card className="rounded-2xl border-2 border-dashed border-border bg-muted/20 py-16 text-center">
                <Award className="mx-auto size-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  Chưa có dữ liệu module AI.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hoàn thành hồ sơ, bài test và trang Target / Improve.
                </p>
                <Button
                  asChild
                  className="mt-6 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] text-white"
                >
                  <Link href="/student/profile">Cập nhật hồ sơ</Link>
                </Button>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-10 print:space-y-6 print:!translate-y-0 print:!opacity-100"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              {/* Section 1 - Thông tin cá nhân & mục tiêu */}
              {profile && (
                <ReportSection
                  index={1}
                  title="Thông tin cá nhân & mục tiêu"
                  subtitle="Họ tên, liên hệ, GPA và toàn bộ mục tiêu ngành / trường đã lưu"
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Họ tên
                      </p>
                      <p className="mt-1 font-semibold text-foreground">
                        {profile.name}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Email
                      </p>
                      <p className="mt-1 font-semibold text-foreground truncate">
                        {profile.email}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        GPA (thang {profile.gpaScale})
                      </p>
                      <p className="mt-1 font-semibold text-foreground">
                        {profile.gpa
                          ? `${profile.gpa} / ${profile.gpaScale}`
                          : "Chưa cập nhật"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Ngân sách / năm
                      </p>
                      <p className="mt-1 font-semibold text-foreground">
                        {profile.yearlyBudget ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Mục tiêu chính (hồ sơ)
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {profile.targetMajor && profile.targetMajor !== "Chưa xác định"
                        ? profile.targetMajor
                        : "Chưa đặt mục tiêu chính"}
                    </p>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Danh sách mục tiêu (ưu tiên theo thứ tự)
                    </p>
                    {profile.targetGoals && profile.targetGoals.length > 0 ? (
                      <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
                        {profile.targetGoals.map((g, idx) => (
                          <li key={idx} className="pl-1">
                            <span className="font-medium">
                              {g.facultyName || "Ngành —"}
                            </span>
                            {g.universityName ? (
                              <span className="text-muted-foreground">
                                {" "}
                                · {g.universityName}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Chưa có mục tiêu bổ sung trên trang Target.
                      </p>
                    )}
                  </div>

                  {profile.personalDesire ? (
                    <div className="mt-6 rounded-xl border border-dashed border-border bg-card/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Nguyện vọng / định hướng cá nhân
                      </p>
                      <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {profile.personalDesire}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-8 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span>Ngoại ngữ: {profile.englishLevel ?? "—"}</span>
                    <span className="text-border">|</span>
                    <span>Hoạt động: {profile.extracurriculars?.length ?? 0}</span>
                    <span className="text-border">|</span>
                    <span>Thành tích: {profile.achievements?.length ?? 0}</span>
                    {profile.documents?.length ? (
                      <>
                        <span className="text-border">|</span>
                        <span>Tài liệu: {profile.documents.length}</span>
                      </>
                    ) : null}
                  </div>
                </ReportSection>
              )}

              {/* Section 2 - Feature 1 (+ đề xuất cải thiện) */}
              {(profileData?.feature1_output ||
                improveResults?.analysis ||
                improveResults?.enhance) && (
                <ReportSection
                  index={2}
                  title="Phân tích hồ sơ & cải thiện"
                  subtitle="Điểm trụ cột; phần SWOT, tóm tắt chi tiết và đề xuất cải thiện khi có quyền xem đầy đủ"
                >
              {profileData?.feature1_output &&
                (() => {
                  const f1 = profileData.feature1_output;
                  const hasPillar = Boolean(f1.summary?.total_pillar_scores);
                  const hasSummaryText = Boolean(f1.summaryText);
                  const swotRaw = f1["B. Phân tích SWOT"] as
                    | Record<string, unknown>
                    | undefined;
                  const swot = normalizeSwot(swotRaw);
                  const hasSwot =
                    swot.strengths.length +
                      swot.weaknesses.length +
                      swot.opportunities.length +
                      swot.threats.length >
                    0;
                  if (!hasPillar && !hasSummaryText && !hasSwot) return null;
                  return (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pillars + Chart */}
                        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg print:shadow-none">
                          <div className="bg-gradient-to-r from-[#0052FF]/10 to-[#4D7CFF]/5 px-6 py-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="font-university-display text-lg font-bold text-foreground">
                                Điểm trụ cột
                              </h3>
                              {(profileData.feature1_output.summary
                                ?.main_spike ||
                                profileData.feature1_output.summary
                                  ?.sharpness) && (
                                <Badge className="bg-[#0052FF]/20 text-[#0052FF] border-[#0052FF]/30">
                                  {safeStr(
                                    profileData.feature1_output.summary
                                      .main_spike,
                                  )}{" "}
                                  ·{" "}
                                  {safeStr(
                                    profileData.feature1_output.summary
                                      .sharpness,
                                  )}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <CardContent className="p-6">
                            {profileData.feature1_output.summary
                              ?.total_pillar_scores && (
                              <>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                                  {PILLAR_CONFIG.map(
                                    ({ key, label, color, light, border }) => {
                                      const value =
                                        profileData.feature1_output!.summary!
                                          .total_pillar_scores?.[key] ?? 0;
                                      return (
                                        <div
                                          key={key}
                                          className={`rounded-xl border-l-4 ${border} ${light} p-4`}
                                        >
                                          <p className="text-xs font-medium text-muted-foreground">
                                            {label}
                                          </p>
                                          <p
                                            className="text-2xl font-bold"
                                            style={{ color }}
                                          >
                                            {value}
                                          </p>
                                        </div>
                                      );
                                    },
                                  )}
                                </div>
                                <div
                                  className="h-48 w-full [&_.recharts-text]:fill-foreground"
                                  data-pdf-chart-wrap
                                >
                                  <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                  >
                                    <BarChart
                                      data={PILLAR_CONFIG.map(
                                        ({ key, label }) => ({
                                          name: label,
                                          value:
                                            profileData.feature1_output!
                                              .summary!.total_pillar_scores?.[
                                              key
                                            ] ?? 0,
                                        }),
                                      )}
                                      layout="vertical"
                                      margin={{
                                        top: 0,
                                        right: 24,
                                        left: 0,
                                        bottom: 0,
                                      }}
                                    >
                                      <XAxis
                                        type="number"
                                        domain={[0, 100]}
                                        hide
                                      />
                                      <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={80}
                                        tick={{
                                          fontSize: 12,
                                          fill: "var(--foreground)",
                                        }}
                                      />
                                      <Bar
                                        dataKey="value"
                                        radius={[0, 6, 6, 0]}
                                        maxBarSize={24}
                                      >
                                        {PILLAR_CONFIG.map((_, i) => (
                                          <Cell
                                            key={i}
                                            fill={PILLAR_CONFIG[i].color}
                                          />
                                        ))}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </>
                            )}
                            {profileData.feature1_output.summaryText &&
                              showProfileAnalysisFull && (
                              <p className="text-sm text-foreground mt-4 pt-4 border-t border-border">
                                {safeStr(
                                  profileData.feature1_output.summaryText,
                                )}
                              </p>
                            )}
                          </CardContent>
                        </div>

                        {/* SWOT — đầy đủ khi có quyền */}
                        {hasSwot && showProfileAnalysisFull && (
                          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg print:shadow-none">
                            <div className="bg-muted/50 px-6 py-4">
                              <h3 className="font-university-display text-lg font-bold text-foreground">
                                Phân tích SWOT
                              </h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
                              {[
                                {
                                  key: "strengths",
                                  label: "Điểm mạnh",
                                  items: swot.strengths,
                                  icon: Zap,
                                  bg: "bg-emerald-500/10",
                                  border: "border-emerald-500/40",
                                  text: "text-emerald-800 dark:text-emerald-200",
                                },
                                {
                                  key: "weaknesses",
                                  label: "Điểm yếu",
                                  items: swot.weaknesses,
                                  icon: TrendingUp,
                                  bg: "bg-rose-500/10",
                                  border: "border-rose-500/40",
                                  text: "text-rose-800 dark:text-rose-200",
                                },
                                {
                                  key: "opportunities",
                                  label: "Cơ hội",
                                  items: swot.opportunities,
                                  icon: Star,
                                  bg: "bg-sky-500/10",
                                  border: "border-sky-500/40",
                                  text: "text-sky-800 dark:text-sky-200",
                                },
                                {
                                  key: "threats",
                                  label: "Thách thức",
                                  items: swot.threats,
                                  icon: Shield,
                                  bg: "bg-amber-500/10",
                                  border: "border-amber-500/40",
                                  text: "text-amber-800 dark:text-amber-200",
                                },
                              ].map(
                                ({
                                  key,
                                  label,
                                  items,
                                  icon: Icon,
                                  bg,
                                  border,
                                  text,
                                }) => (
                                  <div
                                    key={key}
                                    className={`p-5 rounded-xl border ${bg} ${border} border-l-4 shadow-sm`}
                                  >
                                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                                      <Icon className="size-3.5" />
                                      {label}
                                    </p>
                                    <ul className="space-y-1.5">
                                      {(items.length ? items : [":"])
                                        .slice(0, 6)
                                        .map((item, i) => (
                                          <li
                                            key={i}
                                            className={`text-sm ${items.length ? text : "text-muted-foreground"}`}
                                          >
                                            · {safeStr(item)}
                                          </li>
                                        ))}
                                      {items.length > 6 && (
                                        <li className="text-xs text-muted-foreground">
                                          +{items.length - 6} mục
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {(improveResults?.analysis || improveResults?.enhance) && (
                  <div className="mt-12 space-y-6">
                    <h3 className="font-university-display text-base font-bold text-foreground">
                      Đề xuất cải thiện (phân tích bổ sung / enhance)
                    </h3>
                    <div className="space-y-6">
                    {improveResults.analysis &&
                      typeof improveResults.analysis === "object" &&
                      (() => {
                        const a = improveResults.analysis as Record<
                          string,
                          unknown
                        >;
                        const overall = a.overall as
                          | Record<string, unknown>
                          | undefined;
                        const f1 = a.feature1_output as
                          | Record<string, unknown>
                          | undefined;
                        const sum = f1?.summary as
                          | Record<string, unknown>
                          | undefined;
                        const scores =
                          (a.pillar_scores as Record<string, number>) ??
                          (sum?.total_pillar_scores as Record<string, number>);
                        const feedbackText = overall
                          ? safeStr(overall.feedback) ||
                            safeStr(overall.summary)
                          : ":";
                        const prio = Array.isArray(
                          overall?.priority_suggestions,
                        )
                          ? (overall!.priority_suggestions as unknown[])
                          : [];
                        return (
                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              {overall?.overall_score != null && (
                                <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30">
                                  Tổng: {Number(overall.overall_score)}/100
                                </Badge>
                              )}
                              {overall?.personal_fit_score != null && (
                                <Badge variant="secondary">
                                  Phù hợp: {Number(overall.personal_fit_score)}
                                  /100
                                </Badge>
                              )}
                              {scores &&
                                ["aca", "lan", "hdnk", "skill"].map((k) => {
                                  const labels: Record<string, string> = {
                                    aca: "Học thuật",
                                    lan: "Ngôn ngữ",
                                    hdnk: "HD Ngoại khóa",
                                    skill: "Kỹ năng"
                                  };
                                  const colors: Record<string, string> = {
                                    aca: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
                                    lan: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400",
                                    hdnk: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
                                    skill: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                                  };
                                  return (
                                    <Badge key={k} className={`${colors[k]} font-medium`}>
                                      {labels[k]}: {scores[k] ?? ":"}
                                    </Badge>
                                  );
                                })}
                            </div>
                            {feedbackText !== ":" && (
                              <p className="text-foreground">{feedbackText}</p>
                            )}
                            {showProfileAnalysisFull && prio.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-foreground mb-2">
                                  Gợi ý ưu tiên
                                </p>
                                  <div className="relative">
                                    <ul className="space-y-2">
                                      {prio.slice(0, 8).map((p, i) => {
                                        const raw = safeStr(p);
                                        const match = raw.match(
                                          /^\s*\*{0,2}(\d+)\.\s*(.+?)\*{0,2}:\s*([\s\S]*)/,
                                        );
                                        const title = match
                                          ? match[2].replace(/\*+/g, "").trim()
                                          : null;
                                        const body = match ? match[3].trim() : raw;
                                        return (
                                          <li
                                            key={i}
                                            className="flex gap-3 rounded-xl border border-border bg-amber-500/5 border-l-4 border-l-amber-500/60 px-4 py-3"
                                          >
                                            <span className="shrink-0 font-bold text-amber-600 dark:text-amber-400">
                                              {i + 1}.
                                            </span>
                                            <span className="text-sm text-foreground">
                                              {title && (
                                                <span className="font-medium">
                                                  {title}:{" "}
                                                </span>
                                              )}
                                              <span className="text-muted-foreground">
                                                {body}
                                              </span>
                                            </span>
                                          </li>
                                        );
                                      })}
                                      {prio.length > 8 && (
                                        <li className="text-xs text-muted-foreground pl-7">
                                          +{prio.length - 8} gợi ý
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    {improveResults.enhance &&
                      typeof improveResults.enhance === "object" &&
                      (() => {
                        const e = improveResults.enhance as Record<
                          string,
                          unknown
                        >;
                        const recs = Array.isArray(e.recommendations)
                          ? (e.recommendations as Record<string, unknown>[])
                          : [];
                        const improvements = Array.isArray(e.improvements)
                          ? (e.improvements as Record<string, unknown>[])
                          : [];
                        const sumText = safeStr(e.enhanced_summary);
                        const listSuggestion = Array.isArray(e.list_suggestion)
                          ? (e.list_suggestion as Array<{
                              prior?: string;
                              what_to_do?: string;
                            }>)
                          : [];
                        const pillarAfter = e.pillar_score_after_enhance as
                          | Record<string, number>
                          | undefined;
                        const roadmapEnhance = e.roadmap as
                          | {
                              type?: string;
                              months?: Array<{
                                month?: number;
                                tasks?: string[];
                                target?: string;
                              }>;
                            }
                          | undefined;
                        const hasProfileImprover =
                          sumText !== ":" ||
                          recs.length > 0 ||
                          improvements.length > 0;
                        const hasEnhanceOutput =
                          listSuggestion.length > 0 ||
                          (pillarAfter &&
                            Object.keys(pillarAfter).length > 0) ||
                          (roadmapEnhance?.months?.length ?? 0) > 0;
                        if (!hasProfileImprover && !hasEnhanceOutput)
                          return null;
                        return (
                          <div className="border-t border-border pt-4 space-y-4">
                            {sumText !== ":" && (
                              <p className="text-foreground">{sumText}</p>
                            )}
                            {recs.length > 0 && (
                              <p className="text-sm text-muted-foreground">
                                Khuyến nghị:{" "}
                                {recs
                                  .slice(0, 4)
                                  .map((r) => safeStr(r.specific_rec_name))
                                  .filter(Boolean)
                                  .join(" · ") || `${recs.length} mục`}
                              </p>
                            )}
                            {improvements.length > 0 && (
                              <p className="text-sm text-muted-foreground">
                                Cải thiện trụ:{" "}
                                {improvements
                                  .map(
                                    (imp) =>
                                      `${safeStr(imp.pillar)}→${safeStr(imp.target_score)}`,
                                  )
                                  .join(", ")}
                              </p>
                            )}
                            {listSuggestion.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-foreground mb-2">
                                  Gợi ý ưu tiên
                                </p>
                                  {showProfileAnalysisFull && (
                                    <div className="relative">
                                      <ul className="space-y-2">
                                        {listSuggestion.slice(0, 8).map((s, i) => (
                                          <li
                                            key={i}
                                            className="flex gap-3 rounded-xl border border-border bg-amber-500/5 border-l-4 border-l-amber-500/60 px-4 py-3"
                                          >
                                            {s.prior && (
                                              <span className={`shrink-0 font-bold uppercase tracking-wider text-[11px] px-2 py-1 rounded-md text-center min-w-[55px] ${
                                                s.prior === "need_now"
                                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                                  : s.prior === "need_soon"
                                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                                    : "bg-muted text-muted-foreground"
                                              }`}>
                                                {s.prior === "need_now"
                                                  ? "Now"
                                                  : s.prior === "need_soon"
                                                    ? "Soon"
                                                    : s.prior.replace(/_/g, " ")}
                                              </span>
                                            )}
                                            <span className="text-sm text-foreground">
                                              {safeStr(s.what_to_do)}
                                            </span>
                                          </li>
                                        ))}
                                        {listSuggestion.length > 8 && (
                                          <li className="text-xs text-muted-foreground pl-4">
                                            +{listSuggestion.length - 8} gợi ý
                                          </li>
                                        )}
                                      </ul>
                                    </div>
                                  )}
                              </div>
                            )}
                            {pillarAfter &&
                              Object.keys(pillarAfter).length > 0 && (
                                <div className="flex flex-wrap gap-2 items-center">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Điểm dự kiến sau cải thiện:
                                  </span>
                                  {[
                                    "academic",
                                    "language",
                                    "extracurricular",
                                    "skills",
                                  ]
                                    .filter((k) => pillarAfter[k] != null)
                                    .map((k) => (
                                      <Badge key={k} variant="secondary">
                                        {k}: {normalizePillarScoreTo100(Number(pillarAfter[k]))}/100
                                      </Badge>
                                    ))}
                                </div>
                              )}
                            {showProfileAnalysisFull && roadmapEnhance?.months?.length ? (
                              <div>
                                <p className="text-sm font-semibold text-foreground mb-2">
                                  Lộ trình{" "}
                                  {roadmapEnhance.type
                                    ? `(${roadmapEnhance.type.replace("12_month", "12 tháng")})`
                                    : ""}
                                </p>
                                <div className="space-y-2">
                                  {roadmapEnhance.months
                                    .slice(0, 4)
                                    .map((m, i) => (
                                      <div
                                        key={i}
                                        className="rounded-xl border border-border bg-muted/20 p-3 text-sm"
                                      >
                                        <p className="font-medium text-foreground">
                                          Tháng {m.month ?? i + 1}
                                        </p>
                                        {m.target && (
                                          <p className="text-muted-foreground text-xs mt-0.5">
                                            Mục tiêu: {m.target}
                                          </p>
                                        )}
                                        {m.tasks?.length ? (
                                          <div className="relative mt-1">
                                            <ul className="space-y-0.5 text-muted-foreground">
                                              {m.tasks.slice(0, 3).map((t, j) => (
                                                <li key={j}>· {safeStr(t)}</li>
                                              ))}
                                            </ul>
                                          </div>
                                        ) : null}
                                      </div>
                                    ))}
                                  {roadmapEnhance.months.length > 4 && (
                                    <p className="text-xs text-muted-foreground">
                                      +{roadmapEnhance.months.length - 4} tháng
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                </ReportSection>
              )}

              {/* Section 4 - Feature 3 */}
              {profileData?.feature3_output &&
                (() => {
                  const lists = getFeature3Lists(profileData.feature3_output);
                  const reach = lists.reach;
                  const match = lists.match;
                  const safety = lists.safety;
                  const summary = profileData.feature3_output.summary;
                  const summaryStr = typeof summary === "string" ? summary : "";
                  const roadmap = profileData.feature3_output.roadmap as
                    | {
                        start_date?: string;
                        monthly_plans?: Array<{
                          month_name?: string;
                          priority?: string;
                          focus_areas?: string[];
                          goals?: string[];
                        }>;
                      }
                    | undefined;
                  const plans = Array.isArray(roadmap?.monthly_plans)
                    ? (roadmap?.monthly_plans ?? [])
                    : [];
                  const hasUnis =
                    reach.length > 0 || match.length > 0 || safety.length > 0;
                  const hasContent =
                    hasUnis || summaryStr.length > 0 || plans.length > 0;
                  if (!hasContent) return null;
                  return (
                    <ReportSection
                      index={4}
                      title="Feature 3: Reach / Match / Safety"
                      subtitle="Gợi ý trường theo nhóm Reach/Match/Safety; lộ trình khi có dữ liệu"
                    >
                      {summaryStr && (
                        <p className="text-sm text-foreground rounded-xl border border-border bg-muted/30 p-4">
                          {summaryStr}
                        </p>
                      )}
                      {hasUnis && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[
                            {
                              key: "reach",
                              title: "Reach",
                              list: reach,
                              color: REACH_COLOR,
                              light: "bg-violet-500/10",
                              icon: Star,
                            },
                            {
                              key: "match",
                              title: "Match",
                              list: match,
                              color: MATCH_COLOR,
                              light: "bg-emerald-500/10",
                              icon: Target,
                            },
                            {
                              key: "safe",
                              title: "Safety",
                              list: safety,
                              color: SAFE_COLOR,
                              light: "bg-emerald-500/10",
                              icon: Shield,
                            },
                          ].map(
                            ({
                              key,
                              title,
                              list,
                              color,
                              light,
                              icon: Icon,
                            }) => (
                              <Card
                                key={key}
                                className={`rounded-2xl border-2 overflow-hidden shadow-lg print:shadow-none ${light}`}
                                style={{ borderColor: `${color}40` }}
                              >
                                <CardHeader className="py-3 px-4 flex flex-row items-center gap-2">
                                  <div
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                                    style={{ backgroundColor: color }}
                                  >
                                    <Icon className="size-4" />
                                  </div>
                                  <CardTitle
                                    className="text-base m-0"
                                    style={{ color }}
                                  >
                                    {title}
                                  </CardTitle>
                                  <Badge
                                    variant="secondary"
                                    className="ml-auto text-xs"
                                  >
                                    {list.length}
                                  </Badge>
                                </CardHeader>
                                <CardContent className="pt-0 px-4 pb-4">
                                  <ul className="space-y-2">
                                    {list.slice(0, 8).map((u, i) => (
                                      <li
                                        key={i}
                                        className="text-sm font-medium text-foreground truncate"
                                        title={u.name}
                                      >
                                        {u.name}
                                        {u.country && (
                                          <span className="text-muted-foreground font-normal text-xs ml-1">
                                            ({u.country})
                                          </span>
                                        )}
                                      </li>
                                    ))}
                                    {list.length > 8 && (
                                      <li className="text-xs text-muted-foreground">
                                        +{list.length - 8} trường
                                      </li>
                                    )}
                                  </ul>
                                </CardContent>
                              </Card>
                            ),
                          )}
                        </div>
                      )}
                      {plans.length > 0 && (
                        <div className="rounded-2xl border border-border bg-card p-6 shadow-lg print:shadow-none">
                          <h3 className="font-university-display text-lg font-bold text-foreground mb-4">
                            Lộ trình{" "}
                            {roadmap?.start_date
                              ? `từ ${roadmap?.start_date}`
                              : ""}
                          </h3>
                          <div className="space-y-4">
                            {plans.slice(0, 6).map((plan, idx) => (
                              <div
                                key={idx}
                                className="rounded-xl border border-border bg-muted/20 p-4"
                              >
                                <p className="font-semibold text-foreground">
                                  {plan.month_name ?? `Tháng ${idx + 1}`}
                                </p>
                                {plan.priority && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    Ưu tiên: {plan.priority}
                                  </p>
                                )}
                                {showRoadmapFull && plan.focus_areas?.length ? (
                                  <p className="text-sm text-foreground mt-2">
                                    Trọng tâm: {plan.focus_areas.join(", ")}
                                  </p>
                                ) : null}
                                {showRoadmapFull && plan.goals?.length ? (
                                  <div className="relative">
                                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                                      {plan.goals.slice(0, 3).map((g, i) => (
                                        <li key={i}>· {safeStr(g)}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : null}
                              </div>
                            ))}
                            {plans.length > 6 && (
                              <p className="text-sm text-muted-foreground">
                                +{plans.length - 6} tháng khác
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </ReportSection>
                  );
                })()}

              {mockInterviewSessions.length > 0 && (
                <ReportSection
                  index={5}
                  title="Phỏng vấn thử (Mock interview)"
                  subtitle="Đánh giá câu trả lời tiếng Anh theo rubric Holie Mate — chỉ hiển thị phiên hoàn thành mới nhất"
                >
                  <CompletedMockInterviewSessionsList
                    sessions={mockInterviewSessions}
                  />
                </ReportSection>
              )}

            </motion.div>
          )}
        </div>
      </StudentPageContainer>
    </RoleGuard>
  );
}
