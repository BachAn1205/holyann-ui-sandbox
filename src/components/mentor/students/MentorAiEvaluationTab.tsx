"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  CartesianGrid,
} from "recharts";
import {
  BarChart3,
  Brain,
  FileText,
  Flame,
  GraduationCap,
  Heart,
  Lightbulb,
  Loader2,
  Mic,
  PenLine,
  Shield,
  Sparkles,
  Star,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileAnalysisResultCharts } from "@/components/student/profile-analysis/ProfileAnalysisResultCharts";
import { normalizeFeature1FullResult } from "@/lib/profile-analysis-normalize";
import type {
  Feature1AnalysisOutput,
  Feature1EnhanceOutput,
} from "@/lib/schemas/profile-analysis-v2.schema";
import {
  EssayAnalysisResultDetail,
  EssayEnhanceResultDetail,
} from "@/components/student/essay-improve/EssayFeature4ResultViews";
import {
  CompletedMockInterviewSessionsList,
  type MockInterviewCompletedSessionDto,
} from "@/components/student/mock-interview/CompletedMockInterviewSessionsList";
import {
  CvAnalysisResultDetail,
  CvEnhanceResultDetail,
} from "@/components/student/cv-improve/CvFeature7ResultViews";

type EssayRow = { id: string; title: string | null; slot_index: number };

type EssayLatestPayload = {
  analysis: { output_data: unknown; created_at?: string } | null;
  enhance: { output_data: unknown; created_at?: string } | null;
};

type CvRow = { id: string; file_name: string; slot_index: number };

type ProfileBundle = {
  analysis: {
    full_result?: unknown;
    analysis_date?: string;
  } | null;
  enhance: { enhance_result?: unknown; enhance_at?: string | null } | null;
};

type TestsPayload = {
  results?: Record<string, unknown>;
  progress?: Record<string, unknown>;
};

type EssayRunRow = {
  essay: EssayRow;
  runLoading: boolean;
  fetchError: boolean;
  latest: EssayLatestPayload | null;
};

type CvRunRow = {
  doc: CvRow;
  runLoading: boolean;
  fetchError: boolean;
  latest: EssayLatestPayload | null;
};

type AssessmentSummaryRec = {
  mbti_type?: string;
  mbti_confidence?: number;
  grit_score?: number;
  grit_level?: string;
  riasec_code?: string;
};

type FacultyRecItem = {
  faculty_name: string;
  industry_group?: string;
  match_score: number;
  recommend_career?: string;
  detail_reason?: string;
  explain_faculty?: string;
  reason?: string;
};

type FacultyRecommendationBundle = {
  assessment_summary: AssessmentSummaryRec | null;
  faculties: FacultyRecItem[];
  created_at: string | null;
};

/** Cặp trường × ngành từ admission chance (feature 3) — đồng bộ với trang Mục tiêu học sinh */
type AdmissionPairRow = {
  university_name?: string;
  faculty_name?: string;
  university_id?: number | null;
  delta?: number;
  qs_rank?: number;
  feature1_area?: string;
  feature1_area_label?: string;
};

type FacultiesRms = {
  reach: AdmissionPairRow[];
  match: AdmissionPairRow[];
  safety: AdmissionPairRow[];
};

type AdmissionChanceLatest = {
  summary: Record<string, unknown>;
  faculties: FacultiesRms;
  created_at: string | null;
};

type MentorAiRevealKey =
  | "profile"
  | "essays"
  | "cv"
  | "tests"
  | "facultySuggest"
  | "admissionRms"
  | "mockInterview";

const RECOMMEND_ACCENT = "#0052FF";
const RECOMMEND_ACCENT_SEC = "#4D7CFF";

const REACH_RMS_COLOR = "#7C3AED";
const MATCH_RMS_COLOR = "#0052FF";
const SAFE_RMS_COLOR = "#059669";

function parseAssessmentSummary(raw: unknown): AssessmentSummaryRec | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  return {
    mbti_type: typeof o.mbti_type === "string" ? o.mbti_type : undefined,
    mbti_confidence:
      typeof o.mbti_confidence === "number" ? o.mbti_confidence : undefined,
    grit_score: typeof o.grit_score === "number" ? o.grit_score : undefined,
    grit_level: typeof o.grit_level === "string" ? o.grit_level : undefined,
    riasec_code: typeof o.riasec_code === "string" ? o.riasec_code : undefined,
  };
}

function parseFacultiesList(raw: unknown): FacultyRecItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((x) => {
    if (!x || typeof x !== "object" || Array.isArray(x)) return [];
    const o = x as Record<string, unknown>;
    const name =
      typeof o.faculty_name === "string" ? o.faculty_name.trim() : "";
    if (!name) return [];
    const item: FacultyRecItem = {
      faculty_name: name,
      industry_group:
        typeof o.industry_group === "string" ? o.industry_group : undefined,
      match_score: n(o.match_score),
      recommend_career:
        typeof o.recommend_career === "string" ? o.recommend_career : undefined,
      detail_reason:
        typeof o.detail_reason === "string" ? o.detail_reason : undefined,
      explain_faculty:
        typeof o.explain_faculty === "string" ? o.explain_faculty : undefined,
      reason: typeof o.reason === "string" ? o.reason : undefined,
    };
    return [item];
  });
}

function parseAdmissionPairList(raw: unknown): AdmissionPairRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((x) => {
    if (!x || typeof x !== "object" || Array.isArray(x)) return [];
    const o = x as Record<string, unknown>;
    const uni =
      typeof o.university_name === "string" ? o.university_name : undefined;
    const fac = typeof o.faculty_name === "string" ? o.faculty_name : undefined;
    if (!uni?.trim() && !fac?.trim()) return [];
    const uid = o.university_id;
    const item: AdmissionPairRow = {
      university_name: uni,
      faculty_name: fac,
      university_id:
        typeof uid === "number" ? uid : uid === null ? null : undefined,
      delta: typeof o.delta === "number" ? o.delta : undefined,
      qs_rank: typeof o.qs_rank === "number" ? o.qs_rank : undefined,
      feature1_area:
        typeof o.feature1_area === "string" ? o.feature1_area : undefined,
      feature1_area_label:
        typeof o.feature1_area_label === "string"
          ? o.feature1_area_label
          : undefined,
    };
    return [item];
  });
}

function parseAdmissionLatestResult(
  raw: unknown,
): AdmissionChanceLatest | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const fac = o.faculties;
  if (!fac || typeof fac !== "object" || Array.isArray(fac)) return null;
  const f = fac as Record<string, unknown>;
  return {
    summary: asRecord(o.summary) ?? {},
    faculties: {
      reach: parseAdmissionPairList(f.reach),
      match: parseAdmissionPairList(f.match),
      safety: parseAdmissionPairList(f.safety),
    },
    created_at: typeof o.created_at === "string" ? o.created_at : null,
  };
}

function sortAdmissionRows(
  rows: AdmissionPairRow[],
  key: keyof FacultiesRms,
): AdmissionPairRow[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    const aDelta = typeof a.delta === "number" ? a.delta : 0;
    const bDelta = typeof b.delta === "number" ? b.delta : 0;
    if (key === "reach") {
      if (aDelta !== bDelta) return aDelta - bDelta;
    } else if (key === "safety") {
      if (aDelta !== bDelta) return bDelta - aDelta;
    } else {
      const aAbs = Math.abs(aDelta);
      const bAbs = Math.abs(bDelta);
      if (aAbs !== bAbs) return aAbs - bAbs;
    }
    const u = String(a.university_name ?? "").localeCompare(
      String(b.university_name ?? ""),
    );
    if (u !== 0) return u;
    return String(a.faculty_name ?? "").localeCompare(
      String(b.faculty_name ?? ""),
    );
  });
  return copy;
}

function formatAdmissionDelta(d?: number): string | null {
  if (d === undefined || !Number.isFinite(d)) return null;
  const sign = d > 0 ? "+" : "";
  return `${sign}${d.toFixed(2)}`;
}

const RMS_COLUMNS: Array<{
  key: keyof FacultiesRms;
  title: string;
  subtitle: string;
  color: string;
  Icon: LucideIcon;
}> = [
  {
    key: "safety",
    title: "Safety",
    subtitle: "Safe · An toàn",
    color: SAFE_RMS_COLOR,
    Icon: Shield,
  },
  {
    key: "match",
    title: "Match",
    subtitle: "Vừa sức",
    color: MATCH_RMS_COLOR,
    Icon: Target,
  },
  {
    key: "reach",
    title: "Reach",
    subtitle: "Thử sức",
    color: REACH_RMS_COLOR,
    Icon: Star,
  },
];

function MentorAdmissionRmsPanel({ data }: { data: AdmissionChanceLatest }) {
  const { summary, faculties, created_at } = data;
  const pillars = asRecord(summary.pillars);
  const academic =
    pillars && typeof pillars.academic === "number" ? pillars.academic : null;
  const language =
    pillars && typeof pillars.language === "number" ? pillars.language : null;
  const extracurricular =
    pillars && typeof pillars.extracurricular === "number"
      ? pillars.extracurricular
      : null;
  const skills =
    pillars && typeof pillars.skills === "number" ? pillars.skills : null;
  const pillarParts: string[] = [];
  if (academic != null) pillarParts.push(`học thuật ${academic}`);
  if (language != null) pillarParts.push(`ngoại ngữ ${language}`);
  if (extracurricular != null)
    pillarParts.push(`ngoại khóa ${extracurricular}`);
  if (skills != null) pillarParts.push(`kỹ năng ${skills}`);
  const hasPillarLine = pillarParts.length > 0;
  const studentScore =
    typeof summary.student_score === "number" ? summary.student_score : null;
  const spikeScore =
    typeof summary.spike_score === "number" ? summary.spike_score : null;
  const updated = created_at ? formatDate(created_at) : null;
  const totalPairs =
    faculties.safety.length + faculties.match.length + faculties.reach.length;

  return (
    <div className="space-y-4">
      {updated ? (
        <p className="text-xs text-muted-foreground">
          Theo lần chạy gần nhất: {updated}
        </p>
      ) : null}
      {(hasPillarLine || studentScore != null || spikeScore != null) && (
        <div className="flex flex-wrap gap-4 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5 text-xs sm:text-sm">
          {hasPillarLine ? (
            <span className="text-foreground">
              <strong>Trụ cột (0–100):</strong> {pillarParts.join(", ")}
            </span>
          ) : null}
          {studentScore != null ? (
            <span>
              <strong className="text-foreground">Điểm hồ sơ:</strong>{" "}
              <span className="text-foreground">{studentScore}</span>
            </span>
          ) : null}
          {spikeScore != null ? (
            <span>
              <strong className="text-foreground">Điểm spike:</strong>{" "}
              <span className="text-foreground">{spikeScore}</span>
            </span>
          ) : null}
        </div>
      )}
      {totalPairs === 0 ? (
        <p className="text-sm text-muted-foreground">
          Chưa có cặp trường–ngành nào trong kết quả lần chạy này.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {RMS_COLUMNS.map(({ key, title, subtitle, color, Icon }) => {
            const list = sortAdmissionRows(faculties[key], key);
            return (
              <div
                key={key}
                className="rounded-xl border border-border/80 bg-card/80 p-3 shadow-sm flex flex-col min-h-0"
              >
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: color }}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground leading-tight">
                      {title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {subtitle}
                    </p>
                  </div>
                  <span
                    className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {list.length}
                  </span>
                </div>
                <ul className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {list.map((item, i) => {
                    const area =
                      typeof item.feature1_area_label === "string" &&
                      item.feature1_area_label.trim()
                        ? item.feature1_area_label.trim()
                        : null;
                    return (
                      <li
                        key={`${key}-${i}-${item.university_name}-${item.faculty_name}`}
                        className="rounded-lg border border-border/50 bg-background/60 px-2.5 py-2 text-xs"
                      >
                        <p
                          className="font-semibold text-foreground leading-snug"
                          style={{ color }}
                        >
                          {item.university_name?.trim() || "—"}
                        </p>
                        <p className="mt-0.5 text-foreground/90">
                          {item.faculty_name?.trim() || "—"}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                          {typeof item.qs_rank === "number" ? (
                            <span>QS #{item.qs_rank}</span>
                          ) : null}
                          {area ? (
                            <span className="text-foreground/80">{area}</span>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function matchScoreToPercent(raw: number): number {
  if (raw > 0 && raw <= 1) return raw * 100;
  return raw;
}

function MentorFacultyRecExpand({
  detail_reason,
  explain_faculty,
}: {
  detail_reason?: string;
  explain_faculty?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!detail_reason?.trim() && !explain_faculty?.trim()) return null;
  return (
    <div className="relative mt-3 border-t border-border/60 pt-3">
      <div
        className={expanded ? "" : "relative max-h-[5.5rem] overflow-hidden"}
      >
        {detail_reason?.trim() ? (
          <div className="mb-2">
            <span className="text-xs font-semibold text-[#0052FF] block mb-1">
              Vì sao phù hợp
            </span>
            <p
              className={`text-sm text-foreground leading-relaxed ${expanded ? "" : "line-clamp-3"}`}
            >
              {detail_reason}
            </p>
          </div>
        ) : null}
        {explain_faculty?.trim() ? (
          <div>
            <span className="text-xs font-semibold text-foreground block mb-1">
              Giới thiệu nhóm ngành
            </span>
            <p
              className={`text-sm text-muted-foreground leading-relaxed ${expanded ? "" : "line-clamp-2"}`}
            >
              {explain_faculty}
            </p>
          </div>
        ) : null}
        {!expanded ? (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent" />
        ) : null}
      </div>
      <div className="mt-2 flex justify-center">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="rounded-full bg-[#0052FF]/10 text-[#0052FF] hover:bg-[#0052FF]/20 px-4 py-1 text-xs font-semibold transition-colors"
        >
          {expanded ? "Thu gọn" : "Mở rộng chi tiết"}
        </button>
      </div>
    </div>
  );
}

function MentorOutlookFromRecommendation({
  bundle,
}: {
  bundle: FacultyRecommendationBundle;
}) {
  const s = bundle.assessment_summary;
  const hasAny = Boolean(
    s?.mbti_type != null ||
    s?.grit_score != null ||
    (s?.riasec_code != null && s.riasec_code.trim() !== ""),
  );
  const updated = bundle.created_at ? formatDate(bundle.created_at) : null;

  if (!hasAny) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có tóm tắt trắc nghiệm trong lần gợi ý ngành gần nhất. Học viên cần
        chạy &quot;Gợi ý ngành học&quot; trên trang trắc nghiệm sau khi hoàn
        thành MBTI, Grit và RIASEC.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {updated ? (
        <p className="text-xs text-muted-foreground">
          Theo lần gợi ý gần nhất: {updated}
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground leading-relaxed">
        Cơ sở phân tích ngành (O*NET / mô hình nội bộ) dựa trên kết hợp MBTI,
        Grit và mã Holland — giúp đánh giá triển vọng định hướng ngành cho học
        viên.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {s?.mbti_type != null ? (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl mb-2 text-white"
              style={{
                background: `linear-gradient(135deg, ${RECOMMEND_ACCENT}, ${RECOMMEND_ACCENT_SEC})`,
              }}
            >
              <Sparkles className="size-4" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              MBTI
            </p>
            <p className="text-lg font-bold text-foreground">{s.mbti_type}</p>
            {typeof s.mbti_confidence === "number" ? (
              <p className="text-xs text-muted-foreground mt-1">
                Độ tin cậy {(s.mbti_confidence * 100).toFixed(0)}%
              </p>
            ) : null}
          </div>
        ) : null}
        {s?.grit_score != null ? (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl mb-2 text-white"
              style={{
                background: `linear-gradient(135deg, ${RECOMMEND_ACCENT}, ${RECOMMEND_ACCENT_SEC})`,
              }}
            >
              <Target className="size-4" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Grit
            </p>
            <p className="text-lg font-bold text-foreground">
              {s.grit_score.toFixed(2)}
            </p>
            {s.grit_level ? (
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {s.grit_level}
              </p>
            ) : null}
          </div>
        ) : null}
        {s?.riasec_code ? (
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl mb-2 text-white"
              style={{
                background: `linear-gradient(135deg, ${RECOMMEND_ACCENT}, ${RECOMMEND_ACCENT_SEC})`,
              }}
            >
              <Heart className="size-4" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              RIASEC
            </p>
            <p className="text-lg font-bold text-foreground tracking-wide">
              {s.riasec_code}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MentorFacultySuggestList({
  faculties,
}: {
  faculties: FacultyRecItem[];
}) {
  if (faculties.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có danh sách ngành gợi ý. Khi học viên dùng tính năng gợi ý ngành
        trên trang trắc nghiệm, kết quả sẽ hiển thị tại đây.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {faculties.map((f, i) => {
        const pct = Math.min(100, matchScoreToPercent(f.match_score));
        return (
          <li
            key={`${f.faculty_name}-${i}`}
            className={`rounded-xl border bg-card p-4 shadow-sm transition-shadow ${
              i === 0
                ? "border-[#0052FF]/40 bg-gradient-to-br from-[#0052FF]/5 to-transparent ring-1 ring-[#0052FF]/15"
                : "border-border"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground">
                  {f.faculty_name}
                </p>
                {f.industry_group ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Nhóm ngành:{" "}
                    <span className="font-medium text-foreground">
                      {f.industry_group}
                    </span>
                  </p>
                ) : null}
                {(f.recommend_career || f.reason) && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Nghề gợi ý
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(f.recommend_career || f.reason || "")
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((job, j) => (
                          <span
                            key={j}
                            className="inline-flex rounded-md border border-[#0052FF]/25 bg-[#0052FF]/8 px-2 py-0.5 text-xs text-foreground"
                          >
                            {job}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
                <MentorFacultyRecExpand
                  detail_reason={f.detail_reason}
                  explain_faculty={f.explain_faculty}
                />
              </div>
              <div
                className="shrink-0 text-xl font-bold tabular-nums bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(to right, ${RECOMMEND_ACCENT}, ${RECOMMEND_ACCENT_SEC})`,
                }}
              >
                {pct.toFixed(1)}%
              </div>
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(to right, ${RECOMMEND_ACCENT}, ${RECOMMEND_ACCENT_SEC})`,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

const PILLAR_LABELS: Record<
  "academic" | "language" | "extracurricular" | "skills",
  string
> = {
  academic: "Học thuật",
  language: "Ngoại ngữ",
  extracurricular: "Hoạt động ngoại khóa",
  skills: "Kỹ năng",
};

function formatDate(iso?: string | null) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function spikeTypeLabelVi(type: string, typeVi?: string): string {
  if (typeVi && typeVi.trim()) return typeVi.trim();
  const map: Record<string, string> = {
    academic_excellence: "Học thuật nổi bật",
    research: "Nghiên cứu",
    olympiad___competition: "Olympic / Cuộc thi học thuật",
    leadership: "Lãnh đạo",
    social_impact___community_service: "Tác động xã hội / Cộng đồng",
    entrepreneurship: "Khởi nghiệp",
    artistic: "Nghệ thuật",
    athletic: "Thể thao",
    media___content: "Truyền thông / Nội dung",
    tech: "Công nghệ",
    financial_hardship___resilience: "Nghị lực vượt khó",
    personal_story___identity: "Câu chuyện cá nhân",
  };
  return map[type] ?? type.replace(/_/g, " ");
}

function spikeTierLabelVi(tier: string, tierVi?: string): string {
  if (tierVi && tierVi.trim()) return tierVi.trim();
  const map: Record<string, string> = {
    T1: "Rất nổi bật",
    T2: "Nổi bật",
    T3: "Trung bình",
    T4: "Cần cải thiện",
  };
  return map[tier] ?? "Chưa phân loại";
}

function splitEvidence(evidence?: string): string[] {
  if (!evidence) return [];
  return evidence
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

function formatPrior(prior: string) {
  if (prior === "need_now") return "Cần thực hiện ngay bây giờ";
  if (prior === "need_soon") return "Cần sớm thực hiện";
  return prior;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === "object" && !Array.isArray(v))
    return v as Record<string, unknown>;
  return null;
}

function n(v: unknown, fallback = 0): number {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : fallback;
}

const RIASEC_KEYS = ["R", "I", "A", "S", "E", "C"] as const;
const RIASEC_LEGEND: Record<string, { title: string; desc: string }> = {
  R: {
    title: "R — Realistic (Thực tế)",
    desc: "Làm việc với vật thể, máy móc, công cụ",
  },
  I: {
    title: "I — Investigative (Nghiên cứu)",
    desc: "Phân tích, khoa học, giải quyết vấn đề",
  },
  A: { title: "A — Artistic (Nghệ thuật)", desc: "Sáng tạo, biểu đạt" },
  S: { title: "S — Social (Xã hội)", desc: "Hỗ trợ, làm việc với con người" },
  E: { title: "E — Enterprising (Kinh doanh)", desc: "Lãnh đạo, thuyết phục" },
  C: {
    title: "C — Conventional (Hành chính)",
    desc: "Tổ chức, dữ liệu, quy trình",
  },
};

/** Recharts không parse được CSS variables trong `fill` — dùng hex/rgba cố định */
const GRIT_PIE_COLORS = ["#9333ea", "#cbd5e1"];
const MBTI_BAR_SECOND = "#94a3b8";
const CHART_GRID_STROKE = "#cbd5e1";
const CHART_TICK_MUTED = "#64748b";
const CHART_TICK_FG = "#334155";

function TestProgressChips({
  progress,
}: {
  progress: Record<string, unknown> | null;
}) {
  if (!progress) return null;
  const items = [
    { key: "MBTI", ok: Boolean(progress.mbti_completed) },
    { key: "Grit", ok: Boolean(progress.grit_completed) },
    { key: "RIASEC", ok: Boolean(progress.riasec_completed) },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      <span className="text-xs font-medium text-muted-foreground">
        Tiến độ:
      </span>
      {items.map(({ key, ok }) => (
        <Badge
          key={key}
          variant="outline"
          className={
            ok
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
              : "border-border text-muted-foreground"
          }
        >
          {key} {ok ? "✓" : "—"}
        </Badge>
      ))}
      {typeof progress.completed_count === "number" ? (
        <span className="text-xs text-muted-foreground">
          ({progress.completed_count}/3 hoàn thành)
        </span>
      ) : null}
    </div>
  );
}

function MentorMbtiCard({ data }: { data: Record<string, unknown> }) {
  const scores = asRecord(data.scores) ?? {};
  const E = n(scores.E),
    I = n(scores.I),
    S = n(scores.S),
    N = n(scores.N),
    T = n(scores.T),
    F = n(scores.F),
    J = n(scores.J),
    P = n(scores.P);
  const label = typeof data.result_type === "string" ? data.result_type : "—";
  const mbtiChartData = [
    {
      name: "E/I",
      A: E,
      B: I,
      labelA: "Extraversion (E)",
      labelB: "Introversion (I)",
    },
    { name: "S/N", A: S, B: N, labelA: "Sensing (S)", labelB: "Intuition (N)" },
    { name: "T/F", A: T, B: F, labelA: "Thinking (T)", labelB: "Feeling (F)" },
    {
      name: "J/P",
      A: J,
      B: P,
      labelA: "Judging (J)",
      labelB: "Perceiving (P)",
    },
  ];
  const dims = [
    { dim: "E/I", a: "E", b: "I", va: E, vb: I },
    { dim: "S/N", a: "S", b: "N", va: S, vb: N },
    { dim: "T/F", a: "T", b: "F", va: T, vb: F },
    { dim: "J/P", a: "J", b: "P", va: J, vb: P },
  ];

  return (
    <div className="rounded-2xl border-2 border-blue-500/25 bg-gradient-to-br from-blue-500/10 via-card to-violet-500/10 p-4 sm:p-6 shadow-lg ring-1 ring-blue-500/10">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20 text-blue-700 dark:text-blue-300">
          <Brain className="size-4" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground">MBTI</h4>
          <p className="text-xs text-muted-foreground">
            Myers-Briggs — 4 chiều tính cách
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-blue-500/20 bg-card/80 p-4 sm:p-5 dark:bg-card/50">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Kiểu tính cách
        </p>
        <h3 className="text-center text-4xl sm:text-5xl font-black tracking-tight text-blue-600 dark:text-blue-400 mb-4">
          {label}
        </h3>
        <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
          {dims.map(({ dim, a, b, va, vb }) => {
            const win = va > vb ? a : b;
            const pct = Math.round(Math.max(va, vb));
            return (
              <div
                key={dim}
                className="rounded-lg border border-border/60 bg-background/80 p-2 text-center shadow-sm"
              >
                <p className="text-[10px] font-medium text-muted-foreground">
                  {dim}
                </p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {win}
                </p>
                <p className="text-[10px] text-muted-foreground">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 h-[280px] w-full">
        <p className="text-xs font-semibold text-center text-foreground mb-2">
          Chi tiết từng chiều
        </p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={mbtiChartData}
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke={CHART_GRID_STROKE}
            />
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              dataKey="name"
              type="category"
              width={44}
              tick={{ fontSize: 12, fontWeight: 600, fill: CHART_TICK_FG }}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={({ active, payload: pl }) => {
                if (!active || !pl?.[0]) return null;
                const row = pl[0].payload as (typeof mbtiChartData)[0];
                return (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-lg">
                    <p className="font-semibold text-blue-600 dark:text-blue-400">
                      {row.labelA}: {Math.round(row.A)}%
                    </p>
                    <p className="text-muted-foreground font-medium">
                      {row.labelB}: {Math.round(row.B)}%
                    </p>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="A"
              stackId="mbti"
              fill="#3b82f6"
              radius={[4, 0, 0, 4]}
            />
            <Bar
              dataKey="B"
              stackId="mbti"
              fill={MBTI_BAR_SECOND}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-3 text-[11px] text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-2">
        <p>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            E
          </span>{" "}
          — Hướng ngoại; <span className="font-semibold">I</span> — Hướng nội
        </p>
        <p>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            S
          </span>{" "}
          — Cảm giác; <span className="font-semibold">N</span> — Trực giác
        </p>
        <p>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            T
          </span>{" "}
          — Suy nghĩ; <span className="font-semibold">F</span> — Cảm xúc
        </p>
        <p>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            J
          </span>{" "}
          — Nguyên tắc; <span className="font-semibold">P</span> — Linh hoạt
        </p>
      </div>

      {typeof data.result_description === "string" &&
      data.result_description.trim() ? (
        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Tóm tắt
          </p>
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {data.result_description}
          </p>
        </div>
      ) : null}
      {typeof data.detail_test_explain === "string" &&
      data.detail_test_explain.trim() ? (
        <div className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <p className="text-xs font-semibold text-violet-800 dark:text-violet-200 mb-1">
            Mô tả chi tiết
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {data.detail_test_explain}
          </p>
        </div>
      ) : null}
      {data.completed_at ? (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Hoàn thành: {formatDate(String(data.completed_at))}
        </p>
      ) : null}
    </div>
  );
}

function MentorGritCard({ data }: { data: Record<string, unknown> }) {
  const total = n(data.total_score);
  const passion = n(data.passion_score);
  const persev = n(data.perseverance_score);
  const rest = Math.max(0, parseFloat((5 - total).toFixed(2)));
  const gritChartData = [
    { name: "Score", value: total },
    { name: "Remaining", value: rest },
  ];
  const breakdown = [
    { name: "Đam mê", score: passion, fill: "#db2777" },
    { name: "Kiên trì", score: persev, fill: "#7c3aed" },
  ];
  const level = typeof data.level === "string" ? data.level : "";

  return (
    <div className="rounded-2xl border-2 border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-card to-fuchsia-500/5 p-4 sm:p-6 shadow-lg ring-1 ring-violet-500/10">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/20 text-violet-700 dark:text-violet-300">
            <Flame className="size-4" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">Grit</h4>
            <p className="text-xs text-muted-foreground">
              Đam mê & kiên trì (thang ~5)
            </p>
          </div>
        </div>
        {level ? (
          <Badge className="bg-violet-600/15 text-violet-900 dark:text-violet-100 border-violet-500/30">
            {level}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-col items-center">
        <div className="w-full max-w-sm h-[160px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gritChartData}
                cx="50%"
                cy="100%"
                startAngle={180}
                endAngle={0}
                innerRadius="72%"
                outerRadius="100%"
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                {gritChartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={GRIT_PIE_COLORS[i % GRIT_PIE_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-1 pointer-events-none">
            <span className="text-3xl sm:text-4xl font-black text-violet-600 dark:text-violet-400 tabular-nums">
              {total.toFixed(2)}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Tổng / 5.0
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 h-[140px] w-full">
        <p className="text-xs font-semibold text-center text-muted-foreground mb-1">
          Thành phần
        </p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={breakdown}
            layout="vertical"
            margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal
              stroke={CHART_GRID_STROKE}
              vertical={false}
            />
            <XAxis
              type="number"
              domain={[0, 5]}
              tick={{ fontSize: 10, fill: CHART_TICK_MUTED }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={56}
              tick={{ fontSize: 11, fill: CHART_TICK_FG }}
            />
            <Tooltip
              cursor={{ fill: "rgba(148, 163, 184, 0.2)" }}
              contentStyle={{
                borderRadius: "0.75rem",
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                fontSize: "0.8125rem",
              }}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={18}>
              {breakdown.map((e, i) => (
                <Cell key={i} fill={e.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {typeof data.description === "string" && data.description.trim() ? (
        <p className="mt-3 text-sm text-foreground rounded-lg border border-border/60 bg-muted/20 p-3">
          {data.description}
        </p>
      ) : null}
      {typeof data.detail_test_explain === "string" &&
      data.detail_test_explain.trim() ? (
        <div className="mt-3 rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-4">
          <p className="text-xs font-semibold text-fuchsia-800 dark:text-fuchsia-200 mb-1">
            Mô tả chi tiết
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {data.detail_test_explain}
          </p>
        </div>
      ) : null}
      {data.completed_at ? (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Hoàn thành: {formatDate(String(data.completed_at))}
        </p>
      ) : null}
    </div>
  );
}

function MentorRiasecCard({ data }: { data: Record<string, unknown> }) {
  const scoresRaw = asRecord(data.scores) ?? {};
  const scores: Record<string, number> = {};
  for (const k of RIASEC_KEYS) {
    scores[k] = n(scoresRaw[k]);
  }
  const riasecRadar = RIASEC_KEYS.map((k) => ({ subject: k, A: scores[k] }));
  const scoreVals = RIASEC_KEYS.map((k) => scores[k]);
  const maxRaw = Math.max(...scoreVals, 0);
  /** Tránh full hexagon khi domain quá nhỏ so với điểm; trần hợp lý cho RIASEC */
  const radarMax =
    maxRaw <= 0 ? 25 : Math.min(50, Math.max(25, Math.ceil(maxRaw / 5) * 5));
  const code = typeof data.result_code === "string" ? data.result_code : "—";
  const top3 = Array.isArray(data.top3)
    ? (data.top3 as unknown[])
        .filter((x): x is [string, number] => Array.isArray(x) && x.length >= 2)
        .map((x) => [String(x[0]), n(x[1])] as [string, number])
    : [];

  return (
    <div className="rounded-2xl border-2 border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card to-teal-500/5 p-4 sm:p-6 shadow-lg ring-1 ring-emerald-500/10">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
          <BarChart3 className="size-4" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground">RIASEC (Holland)</h4>
          <p className="text-xs text-muted-foreground">
            6 xu hướng nghề nghiệp
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-card/80 p-4 dark:bg-card/50">
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Mã Holland
        </p>
        <h3 className="text-center text-4xl sm:text-5xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 mb-4">
          {code}
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-w-3xl mx-auto">
          {RIASEC_KEYS.map((k) => (
            <div
              key={k}
              className="rounded-lg border border-border/60 bg-background/80 p-2 text-center shadow-sm"
            >
              <p className="text-[10px] font-medium text-muted-foreground">
                {k}
              </p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {Math.round(scores[k])}
              </p>
              <p className="text-[10px] text-muted-foreground">điểm</p>
            </div>
          ))}
        </div>
        {top3.length > 0 ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {top3.map(([k, sc], i) => (
              <Badge
                key={`${k}-${i}`}
                variant="outline"
                className="border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
              >
                Top {i + 1}: {k} ({Math.round(sc)})
              </Badge>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-5 h-[300px] w-full">
        <p className="text-xs font-semibold text-center text-foreground mb-2">
          Biểu đồ radar
        </p>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={riasecRadar}>
            <PolarGrid stroke={CHART_GRID_STROKE} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: CHART_TICK_FG, fontSize: 12, fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, radarMax]}
              tickCount={5}
              tick={{ fill: CHART_TICK_MUTED, fontSize: 10 }}
            />
            <Radar
              name="Điểm"
              dataKey="A"
              stroke="#059669"
              fill="#34d399"
              fillOpacity={0.35}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "0.75rem",
                border: "1px solid #e2e8f0",
                backgroundColor: "#ffffff",
                fontSize: "0.8125rem",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
        {RIASEC_KEYS.map((k) => {
          const L = RIASEC_LEGEND[k];
          return (
            <div key={k}>
              <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                {L.title}
              </p>
              <p className="text-muted-foreground mt-0.5">{L.desc}</p>
            </div>
          );
        })}
      </div>

      {typeof data.result_description === "string" &&
      data.result_description.trim() ? (
        <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Tóm tắt
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {data.result_description}
          </p>
        </div>
      ) : null}
      {typeof data.detail_test_explain === "string" &&
      data.detail_test_explain.trim() ? (
        <div className="mt-3 rounded-xl border border-teal-500/20 bg-teal-500/5 p-4">
          <p className="text-xs font-semibold text-teal-800 dark:text-teal-200 mb-1">
            Mô tả chi tiết
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {data.detail_test_explain}
          </p>
        </div>
      ) : null}
      {data.completed_at ? (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Hoàn thành: {formatDate(String(data.completed_at))}
        </p>
      ) : null}
    </div>
  );
}

function MentorTestsResultsPanel({
  payload,
}: {
  payload: TestsPayload | null;
}) {
  const results = payload?.results ?? {};
  const progress = asRecord(payload?.progress);
  const mbti = asRecord(results.mbti);
  const grit = asRecord(results.grit);
  const riasec = asRecord(results.riasec);
  const anyTest = Boolean(mbti || grit || riasec);

  if (!anyTest) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có bài test hoàn thành (MBTI / Grit / RIASEC).
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <TestProgressChips progress={progress} />
      {mbti ? <MentorMbtiCard data={mbti} /> : null}
      {grit ? <MentorGritCard data={grit} /> : null}
      {riasec ? <MentorRiasecCard data={riasec} /> : null}
    </div>
  );
}

function SectionSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border-2 border-sky-500/15 bg-gradient-to-b from-sky-500/5 to-transparent p-5 space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 rounded bg-muted/50 animate-pulse ${i === 0 ? "w-2/3" : "w-full"}`}
        />
      ))}
      <p className="text-xs text-muted-foreground flex items-center gap-2 pt-1">
        <Loader2 className="size-3.5 animate-spin shrink-0" />
        Đang tải…
      </p>
    </div>
  );
}

function MentorProfileStudentStyle({ bundle }: { bundle: ProfileBundle }) {
  const raw = bundle.analysis?.full_result;
  const analysisView = (normalizeFeature1FullResult(raw) ??
    raw) as Feature1AnalysisOutput | null;
  const hasAnalysis = Boolean(
    analysisView?.pillar_scores && analysisView?.areas,
  );
  const enhance = bundle.enhance?.enhance_result as
    | Feature1EnhanceOutput
    | undefined;
  const hasEnhance = Boolean(enhance && typeof enhance === "object");

  if (!hasAnalysis && !hasEnhance) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có kết quả phân tích hoặc cải thiện hồ sơ từ AI.
      </p>
    );
  }

  const to100 = (v: number | undefined) => {
    if (v == null) return 0;
    return typeof v === "number"
      ? v <= 1
        ? Math.round(v * 100)
        : Math.round(v)
      : 0;
  };

  return (
    <div className="space-y-6">
      {bundle.analysis?.analysis_date ? (
        <p className="text-xs text-muted-foreground">
          Phân tích gần nhất: {formatDate(bundle.analysis.analysis_date)}
        </p>
      ) : null}

      {hasAnalysis && analysisView ? (
        <div className="rounded-2xl border-2 border-sky-500/20 bg-gradient-to-b from-sky-500/5 to-transparent p-4 sm:p-6 shadow-lg space-y-6">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-foreground">
            <span className="h-1 w-8 rounded-full bg-gradient-to-r from-sky-500 to-blue-500" />
            Kết quả đánh giá
          </h3>
          <ProfileAnalysisResultCharts
            pillar_scores={analysisView.pillar_scores}
            areas={analysisView.areas}
            regionalLocked={false}
          />

          {analysisView.swot && (
            <>
              <div
                className="border-t border-border my-2"
                role="separator"
                aria-hidden
              />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  Phân tích SWOT
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["S", "W", "O", "T"] as const).map((k) => {
                    const labels = {
                      S: "Điểm mạnh",
                      W: "Điểm yếu",
                      O: "Cơ hội",
                      T: "Thách thức",
                    };
                    const colors = {
                      S: "border-l-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
                      W: "border-l-rose-500 bg-rose-500/10 dark:bg-rose-500/10 text-rose-800 dark:text-rose-200",
                      O: "border-l-sky-500 bg-sky-500/10 dark:bg-sky-500/10 text-sky-800 dark:text-sky-200",
                      T: "border-l-violet-500 bg-violet-500/10 dark:bg-violet-500/10 text-violet-800 dark:text-violet-200",
                    };
                    const list = analysisView.swot[k] || [];
                    return (
                      <div
                        key={k}
                        className={`rounded-xl border-l-4 p-4 ${colors[k]}`}
                      >
                        <p className="text-xs font-bold uppercase tracking-wider mb-2 opacity-90">
                          {labels[k]}
                        </p>
                        <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                          {list.length > 0 ? (
                            list.map((t, i) => <li key={i}>{t}</li>)
                          ) : (
                            <li className="opacity-60">—</li>
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {analysisView.spikes && analysisView.spikes.length > 0 && (
            <>
              <div
                className="border-t border-border my-2"
                role="separator"
                aria-hidden
              />
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">
                  Spikes (điểm nổi bật)
                </h4>
                <ul className="space-y-3">
                  {analysisView.spikes.map((s, i) => (
                    <li
                      key={i}
                      className="rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-card to-fuchsia-500/5 p-4 shadow-sm"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {spikeTypeLabelVi(s.type, s.type_vi)} ·{" "}
                        {spikeTierLabelVi(s.tier, s.tier_vi)}
                      </p>
                      {splitEvidence(s.evidence).length > 0 && (
                        <ul className="mt-2 list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {splitEvidence(s.evidence).map((line, j) => (
                            <li key={j}>{line}</li>
                          ))}
                        </ul>
                      )}
                      {s.comment?.trim() ? (
                        <p className="mt-2 text-sm leading-relaxed text-foreground/95">
                          {s.comment}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      ) : null}

      {hasEnhance && enhance && (
        <div className="rounded-2xl border-2 border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-4 sm:p-6 shadow-lg">
          <h3 className="font-semibold text-lg flex items-center gap-2 mb-2 text-foreground">
            <span className="h-1 w-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
            Kết quả cải thiện
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Gợi ý tham khảo cho học viên — không bắt buộc làm theo từng bước.
          </p>
          {bundle.enhance?.enhance_at ? (
            <p className="text-xs text-muted-foreground mb-3">
              Cập nhật: {formatDate(bundle.enhance.enhance_at)}
            </p>
          ) : null}

          {enhance.pillar_score_after_enhance &&
            analysisView?.pillar_scores && (
              <div className="mb-6 rounded-xl border border-emerald-500/20 bg-white/50 dark:bg-white/5 p-4">
                <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-3">
                  Điểm 4 trụ cột: trước và sau cải thiện
                </h4>
                <div className="h-44 w-full text-foreground [&_.recharts-text]:fill-foreground [&_.recharts-legend-item-text]:fill-foreground">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(
                        [
                          "academic",
                          "language",
                          "extracurricular",
                          "skills",
                        ] as const
                      ).map((key) => {
                        const beforeRaw = analysisView.pillar_scores[key];
                        const afterRaw =
                          enhance.pillar_score_after_enhance?.[key];
                        return {
                          name: PILLAR_LABELS[key],
                          trước: to100(beforeRaw),
                          sau: to100(afterRaw as number | undefined),
                        };
                      })}
                      layout="vertical"
                      margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                    >
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fontSize: 11, fill: "var(--foreground)" }}
                      />
                      <Tooltip
                        cursor={{ fill: "var(--muted)" }}
                        contentStyle={{
                          borderRadius: "0.75rem",
                          border: "1px solid var(--border)",
                          backgroundColor: "var(--card)",
                          padding: "0.5rem 0.75rem",
                          fontSize: "0.875rem",
                        }}
                        formatter={(value: number, name: string) => [
                          `${value} điểm`,
                          name === "trước"
                            ? "Trước cải thiện"
                            : "Sau cải thiện",
                        ]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "0.75rem" }}
                        formatter={(value) =>
                          value === "trước"
                            ? "Trước cải thiện"
                            : "Sau cải thiện"
                        }
                      />
                      <Bar
                        dataKey="trước"
                        name="trước"
                        fill="#94a3b8"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={18}
                      />
                      <Bar
                        dataKey="sau"
                        name="sau"
                        fill="#10b981"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={18}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          {enhance.list_suggestion && enhance.list_suggestion.length > 0 && (
            <div className="mb-4 rounded-xl border-l-4 border-l-amber-500 bg-amber-500/10 dark:bg-amber-500/10 p-4">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-2">
                Gợi ý ưu tiên
              </p>
              <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                {enhance.list_suggestion.slice(0, 12).map((s, i) => (
                  <li key={i}>
                    <span className="font-medium text-amber-900 dark:text-amber-100">
                      {formatPrior(String(s.prior ?? ""))}
                    </span>
                    : {s.what_to_do}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {enhance.roadmap?.months && enhance.roadmap.months.length > 0 && (
            <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-500/10 via-card to-emerald-500/5 p-4 sm:p-6">
              <p className="text-sm font-semibold text-teal-800 dark:text-teal-200">
                Lộ trình phát triển ({enhance.roadmap.type})
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                {enhance.roadmap.months.length} tháng — mục tiêu và việc cần
                làm.
              </p>
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {enhance.roadmap.months.map((m, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-sm"
                  >
                    <p className="font-medium">Tháng {m.month ?? i + 1}</p>
                    {m.target ? (
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {m.target}
                      </p>
                    ) : null}
                    {m.tasks?.length ? (
                      <ul className="mt-1 list-inside list-disc text-xs space-y-0.5">
                        {m.tasks.map((t, j) => (
                          <li key={j}>{t}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StudentStyleSectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300">
        <Icon className="size-5" />
      </div>
      <div>
        <h3 className="font-semibold text-base text-foreground">{title}</h3>
        {subtitle ? (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

export function MentorAiEvaluationTab({ studentId }: { studentId: string }) {
  const [activeTab, setActiveTab] = useState<MentorAiRevealKey>("profile");
  const [revealed, setRevealed] = useState<Record<MentorAiRevealKey, boolean>>({
    profile: true,
    essays: false,
    cv: false,
    tests: false,
    facultySuggest: false,
    admissionRms: false,
    mockInterview: false,
  });
  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;

  const [profile, setProfile] = useState<{
    loading: boolean;
    error: string | null;
    data: ProfileBundle | null;
  }>({ loading: false, error: null, data: null });

  const [essays, setEssays] = useState<{
    listLoading: boolean;
    listError: string | null;
    items: EssayRunRow[];
  }>({ listLoading: false, listError: null, items: [] });

  const [cv, setCv] = useState<{
    listLoading: boolean;
    listError: string | null;
    items: CvRunRow[];
  }>({ listLoading: false, listError: null, items: [] });

  const [tests, setTests] = useState<{
    loading: boolean;
    error: string | null;
    data: TestsPayload | null;
  }>({ loading: false, error: null, data: null });

  const [recommend, setRecommend] = useState<{
    loading: boolean;
    error: string | null;
    bundle: FacultyRecommendationBundle | null;
  }>({ loading: false, error: null, bundle: null });

  const [admissionOutlook, setAdmissionOutlook] = useState<{
    loading: boolean;
    error: string | null;
    result: AdmissionChanceLatest | null;
  }>({ loading: false, error: null, result: null });

  const [mockInterview, setMockInterview] = useState<{
    loading: boolean;
    error: string | null;
    sessions: MockInterviewCompletedSessionDto[];
  }>({ loading: false, error: null, sessions: [] });

  useEffect(() => {
    setActiveTab("profile");
    setRevealed({
      profile: true,
      essays: false,
      cv: false,
      tests: false,
      facultySuggest: false,
      admissionRms: false,
      mockInterview: false,
    });
    setProfile({ loading: true, error: null, data: null });
    setEssays({ listLoading: false, listError: null, items: [] });
    setCv({ listLoading: false, listError: null, items: [] });
    setTests({ loading: false, error: null, data: null });
    setRecommend({ loading: false, error: null, bundle: null });
    setAdmissionOutlook({ loading: false, error: null, result: null });
    setMockInterview({ loading: false, error: null, sessions: [] });
  }, [studentId]);

  useEffect(() => {
    if (!revealed.mockInterview) return;
    let cancelled = false;
    (async () => {
      setMockInterview((s) => ({ ...s, loading: true, error: null }));
      const res = await fetch(
        `/api/mentor/students/${studentId}/mock-interview/sessions`,
        { cache: "no-store" },
      );
      if (cancelled) return;
      if (!res.ok) {
        setMockInterview({
          loading: false,
          error:
            res.status === 403
              ? "Không có quyền xem dữ liệu này."
              : `Phỏng vấn thử: ${res.status}`,
          sessions: [],
        });
        return;
      }
      const j = (await res.json()) as {
        sessions?: MockInterviewCompletedSessionDto[];
      };
      const sessions = Array.isArray(j.sessions) ? j.sessions : [];
      setMockInterview({ loading: false, error: null, sessions });
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, revealed.mockInterview]);

  useEffect(() => {
    if (!revealed.profile) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(
        `/api/mentor/students/${studentId}/profile-analysis/latest`,
        { cache: "no-store" },
      );
      if (cancelled) return;
      if (!res.ok) {
        setProfile({
          loading: false,
          error:
            res.status === 403
              ? "Không có quyền xem hồ sơ này."
              : `Không tải được (${res.status}).`,
          data: null,
        });
        return;
      }
      const data = (await res.json()) as ProfileBundle;
      setProfile({ loading: false, error: null, data });
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, revealed.profile]);

  useEffect(() => {
    if (!revealed.essays) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/mentor/students/${studentId}/essays`, {
        cache: "no-store",
      });
      if (cancelled) return;
      if (!res.ok) {
        setEssays({
          listLoading: false,
          listError: `Danh sách luận: ${res.status}`,
          items: [],
        });
        return;
      }
      const j = await res.json();
      const list: EssayRow[] = Array.isArray(j?.data) ? j.data : [];
      const items: EssayRunRow[] = list.map((e) => ({
        essay: { id: e.id, title: e.title, slot_index: e.slot_index },
        runLoading: true,
        fetchError: false,
        latest: null,
      }));
      setEssays({ listLoading: false, listError: null, items });

      items.forEach((row) => {
        fetch(
          `/api/mentor/students/${studentId}/essay-improve/latest?essay_id=${encodeURIComponent(row.essay.id)}`,
          { cache: "no-store" },
        )
          .then(async (r) => {
            if (cancelled) return;
            let latest: EssayLatestPayload | null = null;
            let fetchError = false;
            if (r.ok) latest = (await r.json()) as EssayLatestPayload;
            else fetchError = true;
            setEssays((prev) => ({
              ...prev,
              items: prev.items.map((it) =>
                it.essay.id === row.essay.id
                  ? { ...it, runLoading: false, fetchError, latest }
                  : it,
              ),
            }));
          })
          .catch(() => {
            if (cancelled) return;
            setEssays((prev) => ({
              ...prev,
              items: prev.items.map((it) =>
                it.essay.id === row.essay.id
                  ? { ...it, runLoading: false, fetchError: true, latest: null }
                  : it,
              ),
            }));
          });
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, revealed.essays]);

  useEffect(() => {
    if (!revealed.cv) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(
        `/api/mentor/students/${studentId}/cv-documents`,
        { cache: "no-store" },
      );
      if (cancelled) return;
      if (!res.ok) {
        setCv({
          listLoading: false,
          listError: `Danh sách CV: ${res.status}`,
          items: [],
        });
        return;
      }
      const j = await res.json();
      const raw = Array.isArray(j?.data) ? j.data : [];
      const list: CvRow[] = raw.map(
        (d: { id: string; file_name: string; slot_index: number }) => ({
          id: d.id,
          file_name: d.file_name,
          slot_index: d.slot_index,
        }),
      );
      const items: CvRunRow[] = list.map((doc) => ({
        doc,
        runLoading: true,
        fetchError: false,
        latest: null,
      }));
      setCv({ listLoading: false, listError: null, items });

      items.forEach((row) => {
        fetch(
          `/api/mentor/students/${studentId}/cv-improve/latest?cv_document_id=${encodeURIComponent(row.doc.id)}`,
          { cache: "no-store" },
        )
          .then(async (r) => {
            if (cancelled) return;
            let latest: EssayLatestPayload | null = null;
            let fetchError = false;
            if (r.ok) latest = (await r.json()) as EssayLatestPayload;
            else fetchError = true;
            setCv((prev) => ({
              ...prev,
              items: prev.items.map((it) =>
                it.doc.id === row.doc.id
                  ? { ...it, runLoading: false, fetchError, latest }
                  : it,
              ),
            }));
          })
          .catch(() => {
            if (cancelled) return;
            setCv((prev) => ({
              ...prev,
              items: prev.items.map((it) =>
                it.doc.id === row.doc.id
                  ? { ...it, runLoading: false, fetchError: true, latest: null }
                  : it,
              ),
            }));
          });
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, revealed.cv]);

  useEffect(() => {
    if (!revealed.tests) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/tests/results/${studentId}`, {
        cache: "no-store",
      });
      if (cancelled) return;
      if (!res.ok) {
        setTests({ loading: false, error: `Test: ${res.status}`, data: null });
        return;
      }
      const data = (await res.json()) as TestsPayload;
      setTests({ loading: false, error: null, data });
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, revealed.tests]);

  useEffect(() => {
    if (!revealed.facultySuggest) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(
        `/api/mentor/students/${studentId}/recommend-faculty/latest`,
        { cache: "no-store" },
      );
      if (cancelled) return;
      if (!res.ok) {
        setRecommend({
          loading: false,
          error:
            res.status === 403
              ? "Không có quyền xem gợi ý ngành."
              : `Gợi ý ngành: ${res.status}`,
          bundle: null,
        });
        return;
      }
      const j = (await res.json()) as {
        recommendation?: {
          assessment_summary?: unknown;
          faculties?: unknown;
          created_at?: string | Date;
        } | null;
      };
      const rec = j.recommendation;
      if (!rec) {
        setRecommend({ loading: false, error: null, bundle: null });
        return;
      }
      const created =
        rec.created_at instanceof Date
          ? rec.created_at.toISOString()
          : typeof rec.created_at === "string"
            ? rec.created_at
            : null;
      setRecommend({
        loading: false,
        error: null,
        bundle: {
          assessment_summary: parseAssessmentSummary(rec.assessment_summary),
          faculties: parseFacultiesList(rec.faculties),
          created_at: created,
        },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, revealed.facultySuggest]);

  useEffect(() => {
    if (!revealed.admissionRms) return;
    let cancelled = false;
    (async () => {
      const res = await fetch(
        `/api/mentor/students/${studentId}/admission-chance/latest`,
        { cache: "no-store" },
      );
      if (cancelled) return;
      if (!res.ok) {
        setAdmissionOutlook({
          loading: false,
          error:
            res.status === 403
              ? "Không có quyền xem triển vọng tuyển sinh."
              : `Triển vọng tuyển sinh: ${res.status}`,
          result: null,
        });
        return;
      }
      const j = (await res.json()) as { result?: unknown };
      const raw = j.result;
      if (!raw) {
        setAdmissionOutlook({ loading: false, error: null, result: null });
        return;
      }
      const parsed = parseAdmissionLatestResult(raw);
      setAdmissionOutlook({
        loading: false,
        error: null,
        result: parsed,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, revealed.admissionRms]);

  const primeLoad = (key: MentorAiRevealKey) => {
    switch (key) {
      case "profile":
        setProfile({ loading: true, error: null, data: null });
        break;
      case "essays":
        setEssays({ listLoading: true, listError: null, items: [] });
        break;
      case "cv":
        setCv({ listLoading: true, listError: null, items: [] });
        break;
      case "tests":
        setTests({ loading: true, error: null, data: null });
        break;
      case "facultySuggest":
        setRecommend({ loading: true, error: null, bundle: null });
        break;
      case "admissionRms":
        setAdmissionOutlook({ loading: true, error: null, result: null });
        break;
      case "mockInterview":
        setMockInterview({ loading: true, error: null, sessions: [] });
        break;
      default:
        break;
    }
  };

  const handleTabChange = (value: string) => {
    const k = value as MentorAiRevealKey;
    setActiveTab(k);
    if (!revealedRef.current[k]) {
      primeLoad(k);
    }
    setRevealed((r) => ({ ...r, [k]: true }));
  };

  return (
    <div className="profile-creative-scope w-full pb-4 overflow-x-hidden antialiased transition-colors duration-300">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1.5">
          <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm">
            <Sparkles className="size-3.5 shrink-0 opacity-70" />
            Hồ sơ
          </TabsTrigger>
          <TabsTrigger value="essays" className="gap-1.5 text-xs sm:text-sm">
            <PenLine className="size-3.5 shrink-0 opacity-70" />
            Luận
          </TabsTrigger>
          <TabsTrigger value="cv" className="gap-1.5 text-xs sm:text-sm">
            <FileText className="size-3.5 shrink-0 opacity-70" />
            CV
          </TabsTrigger>
          <TabsTrigger value="tests" className="gap-1.5 text-xs sm:text-sm">
            <GraduationCap className="size-3.5 shrink-0 opacity-70" />
            Test
          </TabsTrigger>
          <TabsTrigger
            value="facultySuggest"
            className="gap-1.5 text-xs sm:text-sm"
          >
            <Lightbulb className="size-3.5 shrink-0 opacity-70" />
            Gợi ý ngành
          </TabsTrigger>
          <TabsTrigger
            value="admissionRms"
            className="gap-1.5 text-xs sm:text-sm"
          >
            <Target className="size-3.5 shrink-0 opacity-70" />
            Safe · Match · Reach
          </TabsTrigger>
          <TabsTrigger
            value="mockInterview"
            className="gap-1.5 text-xs sm:text-sm"
          >
            <Mic className="size-3.5 shrink-0 opacity-70" />
            Phỏng vấn thử
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="profile"
          className="mt-0 focus-visible:outline-none"
        >
          <p className="text-xs text-muted-foreground mb-3">
            Phân tích &amp; cải thiện hồ sơ (feature 1)
          </p>
          {profile.loading ? (
            <SectionSkeleton />
          ) : profile.error ? (
            <p className="text-sm text-destructive">{profile.error}</p>
          ) : profile.data ? (
            <MentorProfileStudentStyle bundle={profile.data} />
          ) : null}
        </TabsContent>

        <TabsContent value="essays" className="mt-0 focus-visible:outline-none">
          <p className="text-xs text-muted-foreground mb-3">
            Bài luận — phân tích &amp; gợi ý (feature 4).
          </p>
          {essays.listLoading ? (
            <SectionSkeleton />
          ) : essays.listError ? (
            <p className="text-sm text-destructive">{essays.listError}</p>
          ) : essays.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có bài luận.</p>
          ) : (
            <div className="space-y-4">
              {essays.items.map((row) => (
                <div
                  key={row.essay.id}
                  className="rounded-2xl border-2 border-cyan-500/20 bg-gradient-to-b from-cyan-500/5 to-transparent p-4 sm:p-5 shadow-lg"
                >
                  <h4 className="font-semibold text-foreground">
                    Slot {row.essay.slot_index}:{" "}
                    {row.essay.title?.trim() || "Chưa đặt tiêu đề"}
                  </h4>
                  {row.runLoading ? (
                    <div className="mt-3">
                      <SectionSkeleton lines={2} />
                    </div>
                  ) : row.fetchError ? (
                    <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                      Không tải được kết quả AI.
                    </p>
                  ) : !row.latest?.analysis && !row.latest?.enhance ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Chưa có lần chạy AI gần nhất.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-5">
                      {row.latest.analysis?.output_data != null && (
                        <div>
                          <p className="text-xs font-semibold uppercase text-cyan-700 dark:text-cyan-300 mb-1">
                            Phân tích
                          </p>
                          {row.latest.analysis.created_at ? (
                            <p className="text-[11px] text-muted-foreground mb-2">
                              {formatDate(
                                row.latest.analysis.created_at as string,
                              )}
                            </p>
                          ) : null}
                          <EssayAnalysisResultDetail
                            output={row.latest.analysis.output_data}
                            showFullDetail
                          />
                        </div>
                      )}
                      {row.latest.enhance?.output_data != null && (
                        <div>
                          <p className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300 mb-1">
                            Gợi ý cải thiện
                          </p>
                          {row.latest.enhance.created_at ? (
                            <p className="text-[11px] text-muted-foreground mb-2">
                              {formatDate(
                                row.latest.enhance.created_at as string,
                              )}
                            </p>
                          ) : null}
                          <EssayEnhanceResultDetail
                            output={row.latest.enhance.output_data}
                            showFullDetail
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cv" className="mt-0 focus-visible:outline-none">
          <p className="text-xs text-muted-foreground mb-3">
            CV — phân tích &amp; gợi ý (feature 7).
          </p>
          {cv.listLoading ? (
            <SectionSkeleton />
          ) : cv.listError ? (
            <p className="text-sm text-destructive">{cv.listError}</p>
          ) : cv.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có CV.</p>
          ) : (
            <div className="space-y-4">
              {cv.items.map((row) => (
                <div
                  key={row.doc.id}
                  className="rounded-2xl border-2 border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent p-4 sm:p-5 shadow-lg"
                >
                  <h4 className="font-semibold text-foreground">
                    Slot {row.doc.slot_index}: {row.doc.file_name}
                  </h4>
                  {row.runLoading ? (
                    <div className="mt-3">
                      <SectionSkeleton lines={2} />
                    </div>
                  ) : row.fetchError ? (
                    <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                      Không tải được kết quả AI.
                    </p>
                  ) : !row.latest?.analysis && !row.latest?.enhance ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Chưa có lần chạy AI gần nhất.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-5">
                      {row.latest.analysis?.output_data != null && (
                        <div>
                          <p className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-200 mb-1">
                            Phân tích
                          </p>
                          {row.latest.analysis.created_at ? (
                            <p className="text-[11px] text-muted-foreground mb-2">
                              {formatDate(
                                row.latest.analysis.created_at as string,
                              )}
                            </p>
                          ) : null}
                          <CvAnalysisResultDetail
                            output={row.latest.analysis.output_data}
                            showFullDetail
                          />
                        </div>
                      )}
                      {row.latest.enhance?.output_data != null && (
                        <div>
                          <p className="text-xs font-semibold uppercase text-teal-800 dark:text-teal-200 mb-1">
                            Gợi ý cải thiện
                          </p>
                          {row.latest.enhance.created_at ? (
                            <p className="text-[11px] text-muted-foreground mb-2">
                              {formatDate(
                                row.latest.enhance.created_at as string,
                              )}
                            </p>
                          ) : null}
                          <CvEnhanceResultDetail
                            output={row.latest.enhance.output_data}
                            showFullDetail
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tests" className="mt-0 focus-visible:outline-none">
          <p className="text-xs text-muted-foreground mb-3">
            MBTI, Grit, RIASEC.
          </p>
          {tests.loading ? (
            <SectionSkeleton />
          ) : tests.error ? (
            <p className="text-sm text-destructive">{tests.error}</p>
          ) : (
            <div className="rounded-2xl border-2 border-violet-500/20 bg-gradient-to-b from-violet-500/5 to-transparent p-4 sm:p-6 shadow-lg">
              <MentorTestsResultsPanel payload={tests.data} />
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="facultySuggest"
          className="mt-0 focus-visible:outline-none"
        >
          <p className="text-xs text-muted-foreground mb-3">
            Tóm tắt trắc nghiệm (MBTI · Grit · RIASEC) và danh sách ngành gợi ý
            từ mô hình gợi ý ngành.
          </p>
          <div className="space-y-8">
            <div className="rounded-2xl border-2 border-[#0052FF]/20 bg-gradient-to-br from-[#0052FF]/5 to-transparent p-4 sm:p-5 shadow-lg">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nền trắc nghiệm (gợi ý ngành)
                </h4>
                {recommend.loading ? (
                  <SectionSkeleton lines={2} />
                ) : recommend.error ? (
                  <p className="text-sm text-destructive">{recommend.error}</p>
                ) : !recommend.bundle ? (
                  <p className="text-sm text-muted-foreground">
                    Học viên chưa có lần chạy gợi ý ngành học. Sau khi hoàn
                    thành đủ bài test trên trang trắc nghiệm và bấm &quot;Xem
                    gợi ý ngành&quot;, tóm tắt MBTI / Grit / RIASEC sẽ hiển thị
                    tại đây.
                  </p>
                ) : (
                  <MentorOutlookFromRecommendation bundle={recommend.bundle} />
                )}
              </div>
            </div>

            <div className="space-y-3">
              <StudentStyleSectionHeader
                icon={Lightbulb}
                title="Gợi ý ngành học"
                subtitle="Top ngành từ mô hình gợi ý (O*NET / Holyann)"
              />
              {recommend.loading ? (
                <SectionSkeleton lines={2} />
              ) : recommend.error ? (
                <p className="text-sm text-destructive">{recommend.error}</p>
              ) : !recommend.bundle ? (
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-muted-foreground">
                  Chưa có kết quả gợi ý ngành để hiển thị.
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-amber-500/25 bg-gradient-to-b from-amber-500/5 to-transparent p-4 sm:p-5 shadow-lg">
                  <MentorFacultySuggestList
                    faculties={recommend.bundle.faculties}
                  />
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="admissionRms"
          className="mt-0 focus-visible:outline-none"
        >
          <p className="text-xs text-muted-foreground mb-3">
            Phân loại Safety · Match · Reach theo từng cặp trường–ngành (kết quả
            &quot;Xem triển vọng các ngành&quot; trên trang Mục tiêu).
          </p>
          <div className="rounded-2xl border-2 border-[#0052FF]/20 bg-gradient-to-br from-[#0052FF]/5 to-transparent p-4 sm:p-5 shadow-lg">
            {admissionOutlook.loading ? (
              <SectionSkeleton lines={2} />
            ) : admissionOutlook.error ? (
              <p className="text-sm text-destructive">
                {admissionOutlook.error}
              </p>
            ) : !admissionOutlook.result ? (
              <p className="text-sm text-muted-foreground">
                Chưa có kết quả phân loại Safe / Match / Reach. Học viên cần có
                danh sách nguyện vọng trên trang Mục tiêu và chạy &quot;Xem
                triển vọng các ngành&quot; để hệ thống tính cơ hội theo từng cặp
                trường–ngành.
              </p>
            ) : (
              <MentorAdmissionRmsPanel data={admissionOutlook.result} />
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="mockInterview"
          className="mt-0 focus-visible:outline-none"
        >
          <p className="text-xs text-muted-foreground mb-3">
            Phỏng vấn thử tiếng Anh — đánh giá theo rubric Feature 8 (Holie
            Mate).
          </p>
          {mockInterview.loading ? (
            <SectionSkeleton lines={3} />
          ) : mockInterview.error ? (
            <p className="text-sm text-destructive">{mockInterview.error}</p>
          ) : (
            <CompletedMockInterviewSessionsList
              sessions={mockInterview.sessions}
              emptyMessage="Học viên chưa hoàn thành buổi phỏng vấn thử nào."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
