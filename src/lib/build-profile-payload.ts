/**
 * Build Feature1AnalysisInput from DB for profile-analysis (no form on client).
 * Toàn bộ giải, hoạt động, dự án, kỹ năng… trong hồ sơ đều đưa vào payload (không chặn theo verify tài liệu).
 */
import { prisma } from "@/lib/prisma";
import type { Feature1AnalysisInput } from "@/lib/schemas/profile-analysis-v2.schema";
import { clampProjectTier, normalizeProjectGroupFromDb } from "@/lib/feature1-project";

/** Phản hồi GET payload phân tích. `profileListsGated` giữ để tương thích API; hiện luôn false. */
export type ProfileAnalysisPayloadBundle = {
  payload: Feature1AnalysisInput;
  profileListsGated: boolean;
};

const SUBJECT_GROUP = ["natural", "language", "social"] as const;
type SubjectGroup = (typeof SUBJECT_GROUP)[number];
function toSubjectGroup(s: string | null | undefined): SubjectGroup {
  if (!s) return "natural";
  const lower = s.toLowerCase();
  if (lower.includes("language") || lower.includes("ngoại ngữ") || lower === "language") return "language";
  if (lower.includes("social") || lower.includes("xã hội") || lower === "social") return "social";
  return "natural";
}

function nonAcademicImpactTier(e: {
  scale?: number | null;
  impact?: string | null;
}): number {
  if (typeof e.scale === "number" && e.scale >= 1 && e.scale <= 5) return e.scale;
  const m = String(e.impact || "").match(/\d+/);
  if (m) {
    const n = parseInt(m[0], 10);
    if (n >= 1 && n <= 5) return n;
  }
  return 2;
}

export async function buildProfilePayloadFromDb(
  studentId: string,
): Promise<ProfileAnalysisPayloadBundle | null> {
  const student = await prisma.students.findUnique({
    where: { user_id: studentId },
    include: {
      student_academic_profiles: true,
      student_backgrounds: {
        include: {
          subject_scores: true,
          academic_awards: true,
          non_academic_awards: true,
          academic_extracurriculars: true,
          non_academic_extracurriculars: true,
          personal_projects: true,
          research_experiences: true,
        },
      },
      student_skills: true,
    },
  });

  if (!student) return null;
  const profile = student.student_academic_profiles;
  const bg = student.student_backgrounds;

  const gpaDetails = (profile?.gpa_transcript_details as Record<string, string | number> | null) ?? {};
  const gpaValue =
    typeof gpaDetails.grade12 === "number"
      ? gpaDetails.grade12
      : parseFloat(String(gpaDetails.grade12 || gpaDetails.grade11 || gpaDetails.grade10 || gpaDetails.grade9 || 0)) ||
        0;

  const englishCerts =
    (profile?.english_certificates as Array<{
      type?: string;
      score?: string;
      level?: string;
    }> | null) ?? [];
  const languages = Array.isArray(englishCerts)
    ? englishCerts
        .filter((c) => c && typeof c === "object")
        .map((c) => {
          const type = (c.type as string) || "";
          const level = (c.level as string | undefined)?.trim();
          const scoreRaw = String(c.score ?? "").trim();
          const num = parseFloat(scoreRaw);
          const hasNumericScore = !Number.isNaN(num) && scoreRaw !== "";
          return {
            language_name: type,
            score_name: level ? level : hasNumericScore ? "Điểm" : "—",
            value: hasNumericScore ? num : 0,
          };
        })
    : [];

  const stdTestsRaw = (profile?.standardized_tests as Array<{ type?: string; score?: string; max?: number }> | null) ?? [];
  const standardized_tests = Array.isArray(stdTestsRaw)
    ? stdTestsRaw
        .filter((t) => t && typeof t === "object")
        .map((t) => ({
          name: (t.type as string) || "",
          value: parseFloat(String(t.score ?? 0)) || 0,
          max_value: typeof t.max === "number" ? t.max : 1600,
          group: "general",
        }))
    : [];

  const subjectScores = (bg?.subject_scores ?? []).map((s) => ({
    name: s.subject || "",
    score_10: Number(s.score) || 0,
    group: toSubjectGroup(s.group ?? undefined),
  }));

  const academic_awards = (bg?.academic_awards ?? []).map((a) => a.award_name || "").filter(Boolean);
  const other_awards = (bg?.non_academic_awards ?? []).map((a) => a.award_name || "").filter(Boolean);

  const fromAcademic = (bg?.academic_extracurriculars ?? []).map((e) => ({
    name: e.activity_name || "",
    role: e.role || "",
    impact_tier: typeof e.impact_tier === "number" ? e.impact_tier : 1,
  }));
  const fromNonAcademic = (bg?.non_academic_extracurriculars ?? []).map((e) => ({
    name: e.activity_name || "",
    role: e.role || "",
    impact_tier: nonAcademicImpactTier(e),
  }));
  const academic_extracurricular = [...fromAcademic, ...fromNonAcademic];

  const experimentsRaw = bg?.experiments;
  const experiments: string[] = Array.isArray(experimentsRaw)
    ? experimentsRaw.filter((x): x is string => typeof x === "string")
    : [];

  const projectsFromPersonal = (bg?.personal_projects ?? []).map((p) => ({
    name: p.project_name || "",
    group: normalizeProjectGroupFromDb(
      (p as { project_group?: string | null }).project_group,
      p.topic,
    ),
    tier: clampProjectTier(p.tier),
  }));
  const projectsFromResearch = (bg?.research_experiences ?? []).map((r) => ({
    name: r.project_title || "",
    group: "research",
    tier: 3,
  }));
  const projects = [...projectsFromPersonal, ...projectsFromResearch];

  const hard_skills = (student.student_skills ?? [])
    .filter((s) => (s.category || "").toLowerCase() === "hard")
    .map((s) => ({ name: s.skill_name || "", level: s.proficiency || "" }));
  const soft_skills = (student.student_skills ?? [])
    .filter((s) => (s.category || "").toLowerCase() === "soft")
    .map((s) => ({ name: s.skill_name || "", level: s.proficiency || "" }));

  const payload: Feature1AnalysisInput = {
    gpa: { value_10: gpaValue },
    subjects: subjectScores,
    languages,
    standardized_tests,
    academic_awards,
    other_awards,
    academic_extracurricular,
    experiments,
    projects,
    hard_skills,
    soft_skills,
  };

  return { payload, profileListsGated: false };
}
