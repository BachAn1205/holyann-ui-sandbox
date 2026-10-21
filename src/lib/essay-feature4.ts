import type { SubscriptionPlan } from "@/lib/subscription";

/** Hạn mỗi bài luận (essay_id): phân tích / cải thiện — Free 2, Plus 5, Premium 10. */
export function getPerEssayAnalysisLimit(plan: SubscriptionPlan): number {
  switch (plan) {
    case "FREE":
      return 2;
    case "PLUS":
      return 5;
    case "PREMIUM":
      return 10;
    default:
      return 2;
  }
}

export function getPerEssayEnhanceLimit(plan: SubscriptionPlan): number {
  return getPerEssayAnalysisLimit(plan);
}

export function parseStringArrayJson(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Bỏ HTML để kiểm tra nội dung & gửi `essay_text` dạng gần plain text. */
export function stripHtmlToText(html: string): string {
  return (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Clone JSON an toàn (Prisma Json / phản hồi API) — tránh mất field khi serialize.
 */
export function cloneJsonSafe(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  try {
    return JSON.parse(JSON.stringify(value)) as unknown;
  } catch {
    return value;
  }
}

/** API cải thiện không còn trả bài luận viết sẵn — bỏ field cũ khi đọc/ghi. */
export function omitEnhancedEssayFromEnhanceOutput(data: unknown): unknown {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const { enhanced_essay: _removed, ...rest } = data as Record<string, unknown>;
  return rest;
}

/** Làm sạch cụm rubric/chấm điểm còn sót trong text gợi ý (bản cũ lưu DB hoặc edge case). */
export function softenEnhanceCoachingCopy(text: string): string {
  let t = text;
  t = t.replace(/\btarget_words\b/gi, "số từ gợi ý");
  t = t.replace(/Bài của bạn bị trừ điểm/gi, "Phần này cần chỉnh thêm");
  t = t.replace(/trừ điểm ở\s*Tầng\s*\d/gi, "cần điều chỉnh thêm");
  t = t.replace(/mất trọn\s*Tầng\s*\d/gi, "cần xem lại phần nền của bài");
  t = t.replace(
    /Độ lệch\s*\|[^|]+\|\s*\/\s*[^\s.]+[^.]*\.?/gi,
    "",
  );
  t = t.replace(/\s{2,}/g, " ").trim();
  return t;
}

function softenEnhanceSuggestionFields(
  row: Record<string, unknown>,
): Record<string, unknown> {
  const keys = [
    "issue_detected",
    "why_it_matters",
    "how_to_edit",
    "edit_template",
    "revision_coaching_vi",
    "target_location",
    "metric_label_vi",
  ] as const;
  const out = { ...row };
  for (const k of keys) {
    const v = out[k];
    if (typeof v === "string" && v.length) {
      out[k] = softenEnhanceCoachingCopy(v);
    }
  }
  return out;
}

/**
 * Payload cải thiện gửi client / lưu DB: chỉ giữ phần nội dung gợi ý, bỏ điểm / metric / ma trận kỹ thuật.
 */
export function sanitizeEnhanceOutputForClient(data: unknown): unknown {
  const base = omitEnhancedEssayFromEnhanceOutput(data);
  if (!base || typeof base !== "object" || Array.isArray(base)) return base;
  const o = { ...(base as Record<string, unknown>) };
  delete o.projected_metrics;
  delete o.change_matrix;
  const rs = o.revision_suggestions;
  if (Array.isArray(rs)) {
    o.revision_suggestions = rs.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return item;
      const s = item as Record<string, unknown>;
      const {
        priority: _pr,
        linked_metric: _lm,
        expected_gain: _eg,
        ...keep
      } = s;
      return softenEnhanceSuggestionFields(keep as Record<string, unknown>);
    });
  }
  return o;
}

/**
 * Chuẩn hoá output đã lưu: chuỗi JSON hoặc object — dùng khi set state từ `/essay-improve/latest` hoặc lịch sử.
 * Unwrap lặp khi DB/API trả chuỗi JSON nhiều lớp (merge / serialize kép).
 */
export function parseFeature4RunOutput(raw: unknown): unknown {
  if (raw === null || raw === undefined) return null;
  let cur: unknown = raw;
  for (let depth = 0; depth < 12; depth++) {
    if (typeof cur === "string") {
      const t = cur.trim();
      if (!t) return null;
      try {
        cur = JSON.parse(t) as unknown;
        continue;
      } catch {
        return null;
      }
    }
    if (typeof cur === "object" && cur !== null) {
      return cloneJsonSafe(cur);
    }
    return cur;
  }
  return null;
}

export type EssayRowForValidation = {
  content: string;
  essay_prompt: string | null;
  target_words: number | null;
  target_culture: string | null;
  applicant_core_strengths: unknown;
  target_program_entities: unknown;
  target_major: string | null;
  target_goal_id?: string | null;
  target_goal?: { faculty_name: string; university_name: string } | null;
};

/** Ngành mục tiêu: text đã lưu hoặc từ mục tiêu hồ sơ. */
export function resolveEssayTargetMajor(essay: EssayRowForValidation): string {
  const fromText = essay.target_major?.trim();
  if (fromText) return fromText;
  const fromGoal = essay.target_goal?.faculty_name?.trim();
  return fromGoal ?? "";
}

const FIELD_LABELS: Record<string, string> = {
  essay_text: "Nội dung bài luận",
  essay_prompt: "Đề bài / yêu cầu từ trường",
  target_words: "Số từ mục tiêu",
  target_culture: "Vùng mục tiêu (A / B / C)",
  applicant_core_strengths: "Thế mạnh cốt lõi",
  target_program_entities: "Thực thể chương trình / trường",
  target_major: "Ngành học mục tiêu",
};

export function validateEssayFeature4Inputs(
  essay: EssayRowForValidation,
): { ok: true } | { ok: false; missing: string[]; missingLabels: string[] } {
  const missing: string[] = [];
  if (!stripHtmlToText(essay.content)) missing.push("essay_text");
  if (missing.length === 0) return { ok: true };
  return {
    ok: false,
    missing,
    missingLabels: missing.map((k) => FIELD_LABELS[k] ?? k),
  };
}
