/**
 * Chuẩn hóa JSON từ DB/API về Feature1AnalysisOutput — luôn đủ areas A/B/C
 * (name, score 4 trụ, suitability, suitability_level, reason) để UI an toàn.
 */

import type { Feature1AnalysisOutput, Feature1AreaBlock } from "@/lib/schemas/profile-analysis-v2.schema";

const AREA_DEFAULT_NAMES: Record<"A" | "B" | "C", string> = {
  A: "Mỹ (US / North America)",
  B: "Châu Á",
  C: "Châu Âu / Anh / Úc / Canada",
};

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeAreaBlock(raw: unknown, key: "A" | "B" | "C"): Feature1AreaBlock {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const sc = o.score && typeof o.score === "object" ? (o.score as Record<string, unknown>) : {};
  const name = typeof o.name === "string" && o.name.trim() ? o.name.trim() : AREA_DEFAULT_NAMES[key];
  return {
    name,
    score: {
      academic: num(sc.academic),
      language: num(sc.language),
      extracurricular: num(sc.extracurricular),
      skills: num(sc.skills),
    },
    suitability: num(o.suitability),
    suitability_level:
      typeof o.suitability_level === "string" && o.suitability_level.trim()
        ? o.suitability_level.trim()
        : "low",
    reason: typeof o.reason === "string" ? o.reason : "",
  };
}

export function normalizeFeature1FullResult(raw: unknown): Feature1AnalysisOutput | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const ps = o.pillar_scores;
  if (!ps || typeof ps !== "object") return null;
  const p = ps as Record<string, unknown>;
  const pillar_scores = {
    academic: num(p.academic),
    language: num(p.language),
    extracurricular: num(p.extracurricular),
    skills: num(p.skills),
  };

  const ar = o.areas && typeof o.areas === "object" ? (o.areas as Record<string, unknown>) : {};
  const areas: Feature1AnalysisOutput["areas"] = {
    A: normalizeAreaBlock(ar.A, "A"),
    B: normalizeAreaBlock(ar.B, "B"),
    C: normalizeAreaBlock(ar.C, "C"),
  };

  const swRaw = o.swot && typeof o.swot === "object" ? (o.swot as Record<string, unknown>) : {};
  const swot: Feature1AnalysisOutput["swot"] = {
    S: Array.isArray(swRaw.S) ? (swRaw.S as string[]) : [],
    W: Array.isArray(swRaw.W) ? (swRaw.W as string[]) : [],
    O: Array.isArray(swRaw.O) ? (swRaw.O as string[]) : [],
    T: Array.isArray(swRaw.T) ? (swRaw.T as string[]) : [],
  };

  const spikes = Array.isArray(o.spikes)
    ? (o.spikes as Feature1AnalysisOutput["spikes"])
    : [];

  return {
    pillar_scores,
    areas,
    swot,
    spikes,
  };
}

/**
 * Gộp cột DB `areas` vào `full_result.areas` — merge từng khối A/B/C (không bắt buộc đủ 3 khóa).
 * Ưu tiên trường từ cột DB; `score` được merge sâu (4 trụ).
 */
export function mergeAreasColumnIntoFullResult(
  fullResult: unknown,
  areasColumn: unknown,
): unknown {
  if (!fullResult || typeof fullResult !== "object") return fullResult;

  const col =
    areasColumn && typeof areasColumn === "object" && !Array.isArray(areasColumn)
      ? (areasColumn as Record<string, unknown>)
      : null;
  if (!col || Object.keys(col).length === 0) return fullResult;

  const fr = { ...(fullResult as Record<string, unknown>) };
  const base =
    fr.areas && typeof fr.areas === "object" && !Array.isArray(fr.areas)
      ? ({ ...(fr.areas as Record<string, unknown>) } as Record<string, unknown>)
      : {};

  const next: Record<string, unknown> = { ...base };

  for (const k of ["A", "B", "C"] as const) {
    const patch = col[k];
    if (patch == null || typeof patch !== "object" || Array.isArray(patch)) continue;

    const prev =
      base[k] && typeof base[k] === "object" && !Array.isArray(base[k])
        ? { ...(base[k] as Record<string, unknown>) }
        : {};
    const p = patch as Record<string, unknown>;
    const mergedBlock: Record<string, unknown> = { ...prev, ...p };

    const ps =
      prev.score && typeof prev.score === "object" && !Array.isArray(prev.score)
        ? { ...(prev.score as Record<string, unknown>) }
        : {};
    const po = p.score;
    const pos =
      po && typeof po === "object" && !Array.isArray(po)
        ? { ...(po as Record<string, unknown>) }
        : {};
    if (Object.keys(pos).length > 0) {
      mergedBlock.score = { ...ps, ...pos };
    }

    next[k] = mergedBlock;
  }

  fr.areas = next;
  return fr;
}
