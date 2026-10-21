import type { SubscriptionPlan } from "@/lib/subscription";
import {
  getPerEssayAnalysisLimit,
  getPerEssayEnhanceLimit,
  cloneJsonSafe,
} from "@/lib/essay-feature4";

/** Hạn mỗi CV (theo `cv_document_id`): Free 2+2, Plus 5+5, Premium 10+10 — giống luận. */
export function getPerCvAnalysisLimit(plan: SubscriptionPlan): number {
  return getPerEssayAnalysisLimit(plan);
}

export function getPerCvEnhanceLimit(plan: SubscriptionPlan): number {
  return getPerEssayEnhanceLimit(plan);
}

/** Alias PascalCase / biến thể key — đồng bộ với CvFeature7ResultViews. */
function applyCvEnhanceKeyAliases(
  o: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...o };
  const pairs: [string, string][] = [
    ["Before_After_Matrix", "before_after_matrix"],
    ["beforeAfterMatrix", "before_after_matrix"],
    ["Information_Hierarchy", "information_hierarchy"],
    ["informationHierarchy", "information_hierarchy"],
    ["Noise_Reduction_List", "noise_reduction_list"],
    ["noiseReductionList", "noise_reduction_list"],
    ["Section_Notes_Vi", "section_notes_vi"],
    ["sectionNotesVi", "section_notes_vi"],
    ["Still_Missing_Vi", "still_missing_vi"],
    ["stillMissingVi", "still_missing_vi"],
    ["Enhance_Executive_Summary_Vi", "enhance_executive_summary_vi"],
    ["enhanceExecutiveSummaryVi", "enhance_executive_summary_vi"],
    ["Keyword_And_Positioning_Vi", "keyword_and_positioning_vi"],
    ["keywordAndPositioningVi", "keyword_and_positioning_vi"],
    ["Projected_Score", "projected_score"],
    ["projectedScore", "projected_score"],
    ["enhancedSummary", "enhanced_summary"],
    ["enhanceDetailAvailable", "enhance_detail_available"],
    ["risksMitigatedVi", "risks_mitigated_vi"],
    ["additionalTipsVi", "additional_tips_vi"],
  ];
  for (const [from, to] of pairs) {
    if (out[to] === undefined && out[from] !== undefined) {
      out[to] = out[from];
    }
  }
  return out;
}

function looksLikeCvEnhancePayload(o: Record<string, unknown>): boolean {
  return (
    "before_after_matrix" in o ||
    "beforeAfterMatrix" in o ||
    "enhance_executive_summary_vi" in o ||
    "enhanceExecutiveSummaryVi" in o ||
    "enhanced_summary" in o ||
    "enhancedSummary" in o ||
    "enhance_detail_available" in o ||
    "enhanceDetailAvailable" in o ||
    "information_hierarchy" in o ||
    "informationHierarchy" in o ||
    "noise_reduction_list" in o ||
    "noiseReductionList" in o ||
    "still_missing_vi" in o ||
    "stillMissingVi" in o ||
    "risks_mitigated_vi" in o ||
    "risksMitigatedVi" in o ||
    "additional_tips_vi" in o ||
    "additionalTipsVi" in o ||
    "section_notes_vi" in o ||
    "sectionNotesVi" in o ||
    "projected_score" in o ||
    "projectedScore" in o ||
    "keyword_and_positioning_vi" in o ||
    "keywordAndPositioningVi" in o
  );
}

const CV_ENHANCE_WRAPPER_KEYS = [
  "data",
  "result",
  "output",
  "body",
  "enhancement",
  "enhance",
  "response",
  "payload",
  "value",
  "parsed",
  "content",
  "cv_enhance",
  "enhance_output",
] as const;

/**
 * Gỡ bọc phản hồi enhance (data/result/chuỗi JSON lồng, `{ success, data }`, v.v.)
 * trước khi lưu DB hoặc render — khớp contract `feature7/enhance_cv` (object phẳng).
 */
export function unwrapCvEnhanceApiResponse(
  raw: unknown,
): Record<string, unknown> | null {
  let cur: unknown = raw;
  for (let depth = 0; depth < 18; depth++) {
    if (cur == null) return null;

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

    if (Array.isArray(cur)) {
      if (
        cur.length === 1 &&
        typeof cur[0] === "object" &&
        cur[0] !== null &&
        !Array.isArray(cur[0])
      ) {
        cur = cur[0];
        continue;
      }
      return null;
    }

    if (typeof cur !== "object") return null;

    const o = applyCvEnhanceKeyAliases({
      ...(cur as Record<string, unknown>),
    });

    if (
      o.success === true &&
      o.data != null &&
      typeof o.data === "object" &&
      !Array.isArray(o.data)
    ) {
      cur = o.data;
      continue;
    }

    if (looksLikeCvEnhancePayload(o)) {
      return o;
    }

    for (const key of CV_ENHANCE_WRAPPER_KEYS) {
      const inner = o[key];
      if (inner != null && typeof inner === "object" && !Array.isArray(inner)) {
        const innerA = applyCvEnhanceKeyAliases(inner as Record<string, unknown>);
        if (looksLikeCvEnhancePayload(innerA)) {
          return innerA;
        }
      }
    }

    let advanced = false;
    for (const key of CV_ENHANCE_WRAPPER_KEYS) {
      const inner = o[key];
      if (typeof inner === "string" && inner.trim()) {
        cur = inner;
        advanced = true;
        break;
      }
    }
    if (advanced) continue;

    for (const key of CV_ENHANCE_WRAPPER_KEYS) {
      const inner = o[key];
      if (inner != null && typeof inner === "object" && !Array.isArray(inner)) {
        cur = inner;
        advanced = true;
        break;
      }
    }
    if (advanced) continue;

    for (const v of Object.values(o)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const vA = applyCvEnhanceKeyAliases(v as Record<string, unknown>);
        if (looksLikeCvEnhancePayload(vA)) {
          return vA;
        }
      }
    }

    return o;
  }
  return null;
}

function tryParseJsonArray(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (t.startsWith("[")) {
      try {
        const p = JSON.parse(t) as unknown;
        return Array.isArray(p) ? p : null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Gemini đôi khi trả một dòng ma trận ở root trong khi `before_after_matrix` rỗng —
 * gộp vào ma trận để load từ DB / render giống bản đầy đủ.
 */
function hoistRootMatrixRowIfNeeded(
  o: Record<string, unknown>,
): Record<string, unknown> {
  const matrix = o.before_after_matrix;
  if (Array.isArray(matrix) && matrix.length > 0) return o;

  const ob = o.original_bullet;
  const eb = o.enhanced_bullet;
  const obS = typeof ob === "string" ? ob.trim() : "";
  const ebS = typeof eb === "string" ? eb.trim() : "";
  if (!obS && !ebS) return o;

  const row: Record<string, unknown> = {
    original_bullet: obS,
    enhanced_bullet: ebS,
  };
  if (typeof o.bullet_section_vi === "string" && o.bullet_section_vi.trim()) {
    row.bullet_section_vi = o.bullet_section_vi.trim();
  }
  if (typeof o.improvement_type === "string" && o.improvement_type.trim()) {
    row.improvement_type = o.improvement_type.trim();
  }
  if (typeof o.why_changed_vi === "string" && o.why_changed_vi.trim()) {
    row.why_changed_vi = o.why_changed_vi.trim();
  }
  if (
    typeof o.linked_rubric_hint_vi === "string" &&
    o.linked_rubric_hint_vi.trim()
  ) {
    row.linked_rubric_hint_vi = o.linked_rubric_hint_vi.trim();
  }

  const next: Record<string, unknown> = { ...o, before_after_matrix: [row] };
  delete next.original_bullet;
  delete next.enhanced_bullet;
  delete next.bullet_section_vi;
  delete next.improvement_type;
  delete next.why_changed_vi;
  delete next.linked_rubric_hint_vi;

  const ex = next.enhance_executive_summary_vi;
  const es = next.enhanced_summary;
  const hasEx = typeof ex === "string" && ex.trim();
  const hasEs = typeof es === "string" && es.trim();
  if (!hasEx && !hasEs && ebS) {
    const hint = `(Tóm tắt ngắn từ bullet đã gợi ý) ${ebS.slice(0, 600)}`;
    next.enhance_executive_summary_vi = hint;
    next.enhanced_summary = hint;
  }
  return next;
}

/**
 * Model đôi khi trả mảng dạng chuỗi JSON — ép để ma trận / list không bị rỗng khi hiển thị.
 */
export function coerceEnhanceRecordFields(
  o: Record<string, unknown>,
): Record<string, unknown> {
  const out = hoistRootMatrixRowIfNeeded({ ...o });
  const arrKeys = [
    "before_after_matrix",
    "information_hierarchy",
    "noise_reduction_list",
    "still_missing_vi",
    "risks_mitigated_vi",
    "additional_tips_vi",
  ] as const;
  for (const k of arrKeys) {
    const v = out[k];
    if (v != null && !Array.isArray(v)) {
      const arr = tryParseJsonArray(v);
      if (arr) out[k] = arr;
    }
  }
  const sn = out.section_notes_vi;
  if (typeof sn === "string" && sn.trim().startsWith("[")) {
    try {
      const p = JSON.parse(sn) as unknown;
      if (Array.isArray(p)) out.section_notes_vi = p;
    } catch {
      /* keep */
    }
  }
  const ps = out.projected_score;
  if (typeof ps === "string" && ps.trim().startsWith("{")) {
    try {
      const p = JSON.parse(ps) as unknown;
      if (p && typeof p === "object") out.projected_score = p as object;
    } catch {
      /* keep */
    }
  }
  return out;
}

export function normalizeCvEnhanceOutput(
  raw: unknown,
): Record<string, unknown> | null {
  const u = unwrapCvEnhanceApiResponse(raw);
  if (!u) return null;
  return coerceEnhanceRecordFields(u);
}

/**
 * Chuẩn hoá output đã lưu / từ API trước khi set state.
 * Gỡ lớp chuỗi JSON (và bọc `[obj]`) giống `parseFeature4RunOutput` — DB/API đôi khi trả JSON stringify nhiều lần,
 * khiến `normalizeCvEnhanceOutput` trả null nếu parse một lần không đủ.
 */
export function parseCvEnhanceStoredOutput(raw: unknown): unknown {
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
    if (Array.isArray(cur)) {
      if (
        cur.length === 1 &&
        typeof cur[0] === "object" &&
        cur[0] !== null &&
        !Array.isArray(cur[0])
      ) {
        cur = cur[0];
        continue;
      }
      break;
    }
    break;
  }
  const n = normalizeCvEnhanceOutput(cur);
  if (n) return n;
  const fallback = cloneJsonSafe(cur);
  const n2 = normalizeCvEnhanceOutput(fallback);
  if (n2) return n2;
  return fallback;
}

export function parseCvFeature7Output(raw: unknown): unknown {
  return cloneJsonSafe(raw);
}

const COACHING_METRIC_TOKENS = [
  "achievement_ratio",
  "quantified_ratio",
  "relevant_ratio",
  "noise_ratio",
  "strong_verb_ratio",
  "action_verbs",
  "content_quality_49",
  "strategic_fit_36",
  "presentation_15",
] as const;

/**
 * Gỡ phần trăm rubric, điểm /49, tên metric snake_case trong văn bản coaching (đồng bộ backend `feature7` analysis).
 * Dùng khi hiển thị bản ghi cũ hoặc làm lớp phòng thủ thêm trên client.
 */
export function softenCvAnalysisCoachingCopy(text: string): string {
  if (typeof text !== "string" || !text.trim()) return text;
  let t = text;
  t = t.replace(/\s*\(\s*\d{1,2}%\s*\)/g, "");
  t = t.replace(/\s*[\u2013\-]\s*\d{1,2}%\s*/g, " ");
  t = t.replace(/\b\d+(?:\.\d+)?\s*\/\s*(?:49|100|36|15)\b/g, "");
  t = t.replace(/Điểm số\s*[\d.,]+\s*(?:\/\s*\d+)?\s*/gi, "");
  for (const tok of COACHING_METRIC_TOKENS) {
    t = t.replace(
      new RegExp(`\\b${tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"),
      "",
    );
  }
  t = t.replace(/'Achievement Orientation'/gi, "thành tựu");
  t = t.replace(/\bachievement orientation\b/gi, "thành tựu");
  t = t.replace(/chỉ đạt cấp\s*\d+/gi, "còn ở mức thấp");
  t = t.replace(/\blevel\s*\d+\b/gi, "");
  t = t.replace(/\([^)]*\b(?:ratio|level)\b[^)]*\)/gi, "");
  t = t.replace(/[ \t]{2,}/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

function softenEnrichmentForClient(
  en: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...en };
  for (const key of [
    "executive_summary_vi",
    "next_action_enriched",
    "minimum_gate_explanation_vi",
    "penalties_summary_vi",
  ] as const) {
    const v = out[key];
    if (typeof v === "string") out[key] = softenCvAnalysisCoachingCopy(v);
  }
  for (const key of [
    "top_strengths_enriched",
    "top_risks_enriched",
    "next_actions_checklist_vi",
  ] as const) {
    const arr = out[key];
    if (Array.isArray(arr)) {
      out[key] = arr.map((x) =>
        typeof x === "string" ? softenCvAnalysisCoachingCopy(x) : x,
      );
    }
  }
  const ca = out.criterion_analysis;
  if (Array.isArray(ca)) {
    out.criterion_analysis = ca.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return item;
      const row = { ...(item as Record<string, unknown>) };
      for (const fk of ["title_vi", "feedback_vi"] as const) {
        const s = row[fk];
        if (typeof s === "string") row[fk] = softenCvAnalysisCoachingCopy(s);
      }
      const ideas = row.improvement_ideas_vi;
      if (Array.isArray(ideas)) {
        row.improvement_ideas_vi = ideas.map((x) =>
          typeof x === "string" ? softenCvAnalysisCoachingCopy(x) : x,
        );
      }
      return row;
    });
  }
  return out;
}

/**
 * Phân tích CV: chỉ trả nội dung cho client (ẩn mọi trường điểm số).
 * Dùng khi đọc bản ghi cũ trong DB vẫn còn total_score / component_scores.
 */
export function sanitizeCvAnalysisOutputForClient(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object" || Array.isArray(data)) return data;
  const o = { ...(data as Record<string, unknown>) };
  delete o.total_score;
  delete o.overall_rating;
  delete o.component_scores;
  delete o.total_penalty;
  if (Array.isArray(o.penalties)) {
    o.penalties = o.penalties.map((p) => {
      if (!p || typeof p !== "object" || Array.isArray(p)) return p;
      const x = p as Record<string, unknown>;
      return {
        ...(typeof x.type === "string" ? { type: x.type } : {}),
        ...(typeof x.reason === "string" ? { reason: x.reason } : {}),
      };
    });
  }
  if (typeof o.next_action === "string") {
    o.next_action = softenCvAnalysisCoachingCopy(o.next_action);
  }
  if (Array.isArray(o.top_strengths)) {
    o.top_strengths = o.top_strengths.map((x) =>
      typeof x === "string" ? softenCvAnalysisCoachingCopy(x) : x,
    );
  }
  if (Array.isArray(o.top_risks)) {
    o.top_risks = o.top_risks.map((x) =>
      typeof x === "string" ? softenCvAnalysisCoachingCopy(x) : x,
    );
  }
  const enr = o.enrichment;
  if (enr && typeof enr === "object" && !Array.isArray(enr)) {
    o.enrichment = softenEnrichmentForClient(enr as Record<string, unknown>);
  }
  return o;
}

/** Cải thiện CV: ẩn khối điểm dự kiến khi trả về client (vẫn có thể lưu đầy đủ trong DB). */
export function sanitizeCvEnhanceOutputForClient(data: unknown): unknown {
  const n = normalizeCvEnhanceOutput(data);
  if (!n) return data;
  const o = { ...n };
  delete o.projected_score;
  return o;
}
