/**
 * Body POST /api/v1/feature3/admission-chance — theo fast-api-server-ai
 * `app/docs/api-logic/feature3/input.json`.
 */

export type Feature3WishlistFaculty = { faculty_name: string; prior: number };
export type Feature3WishlistUniversity = { name: string; prior: number };

export type Feature3AdmissionPayload = {
  wishlist_faculties: Feature3WishlistFaculty[];
  wishlist_universities: Feature3WishlistUniversity[];
  pillars: {
    academic: number;
    language: number;
    extracurricular: number;
    skills: number;
  };
  spikes: Array<{ type: string; tier: string }>;
  areas: Record<
    string,
    { name?: string; suitability?: number; [k: string]: unknown }
  >;
  feature2_faculties: Array<{ faculty_name: string; match_score: number }>;
  number_of_reach?: number;
  number_of_match?: number;
  number_of_safety?: number;
  preferred_areas?: Array<"A" | "B" | "C">;
  preferred_area_boost?: number;
};

/** prior 1…15 theo thứ tự nguyện vọng (đã sort). */
function wishlistPrior(index: number, max = 15): number {
  return Math.min(Math.max(index + 1, 1), max);
}

/** spikes: từ profile_analysis.full_result.spikes (type + tier T1–T4). */
export function spikesFromProfileFullResult(
  fullResult: Record<string, unknown> | null | undefined,
): Array<{ type: string; tier: string }> {
  const raw = fullResult?.spikes;
  if (!Array.isArray(raw)) return [{ type: "general", tier: "T2" }];
  const out: Array<{ type: string; tier: string }> = [];
  for (const s of raw) {
    if (!s || typeof s !== "object") continue;
    const o = s as Record<string, unknown>;
    const type = String(o.type ?? "general").trim() || "general";
    let tier = String(o.tier ?? "T2").trim().toUpperCase();
    if (!/^T[1-4]$/.test(tier)) tier = "T2";
    out.push({ type, tier });
  }
  return out.length ? out.slice(0, 5) : [{ type: "general", tier: "T2" }];
}

/** areas: chỉ cần A/B/C + suitability (và name) như input mẫu. */
export function areasFromProfileFullResult(
  fullResult: Record<string, unknown> | null | undefined,
): Feature3AdmissionPayload["areas"] {
  const raw = fullResult?.areas;
  if (!raw || typeof raw !== "object") {
    return {
      A: { name: "Mỹ (US, Mexico)", suitability: 0.7 },
      B: { name: "Châu Á", suitability: 0.7 },
      C: { name: "Châu Âu / Anh / Úc / Canada", suitability: 0.7 },
    };
  }
  const a = raw as Record<string, unknown>;
  const pick = (k: string) => {
    const block = a[k];
    if (!block || typeof block !== "object") return { name: "", suitability: 0.7 };
    const b = block as Record<string, unknown>;
    const suit = typeof b.suitability === "number" ? b.suitability : 0.7;
    return {
      name: typeof b.name === "string" ? b.name : "",
      suitability: suit,
    };
  };
  return {
    A: pick("A"),
    B: pick("B"),
    C: pick("C"),
  };
}

export function feature2FacultiesFromRecommendation(
  faculties: unknown,
): Array<{ faculty_name: string; match_score: number }> {
  if (!Array.isArray(faculties)) return [];
  const out: Array<{ faculty_name: string; match_score: number }> = [];
  for (const row of faculties) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const name = String(r.faculty_name ?? "").trim();
    if (!name) continue;
    const ms = typeof r.match_score === "number" ? r.match_score : Number(r.match_score);
    out.push({ faculty_name: name, match_score: Number.isFinite(ms) ? ms : 0 });
  }
  return out.slice(0, 15);
}

export function buildFeature3AdmissionPayload(args: {
  facultyWishlist: Array<{ faculty_name: string; sort_order: number }>;
  schoolWishlist: Array<{ sort_order: number; university_rankings: { name: string } | null }>;
  latestProfile: {
    full_result: unknown;
    score_aca: number | null;
    score_lan: number | null;
    score_hdnk: number | null;
    score_skill: number | null;
  } | null;
  latestFacultyRecommendation: { faculties: unknown } | null;
  preferredAreas?: Array<"A" | "B" | "C">;
  preferredAreaBoost?: number;
}): Feature3AdmissionPayload {
  const wishlist_faculties = args.facultyWishlist.map((r, i) => ({
    faculty_name: r.faculty_name,
    prior: wishlistPrior(i),
  }));

  const wishlist_universities = args.schoolWishlist
    .map((r, i) => ({
      name: r.university_rankings?.name?.trim() || "",
      prior: wishlistPrior(i),
    }))
    .filter((x) => x.name.length > 0);

  const fr = args.latestProfile?.full_result as Record<string, unknown> | undefined;

  function pillarFromStored(
    col: number | null | undefined,
  ): number {
    if (col == null || Number.isNaN(Number(col))) return 70;
    const n = Number(col);
    if (n <= 1) return Math.round(n * 100);
    if (n <= 10) return Math.round(n * 10);
    return Math.round(Math.min(100, Math.max(0, n)));
  }

  const pillars = {
    academic: pillarFromStored(args.latestProfile?.score_aca),
    language: pillarFromStored(args.latestProfile?.score_lan),
    extracurricular: pillarFromStored(args.latestProfile?.score_hdnk),
    skills: pillarFromStored(args.latestProfile?.score_skill),
  };

  const spikes = spikesFromProfileFullResult(fr);
  const areas = areasFromProfileFullResult(fr);
  const feature2_faculties = feature2FacultiesFromRecommendation(
    args.latestFacultyRecommendation?.faculties,
  );

  return {
    wishlist_faculties,
    wishlist_universities,
    pillars,
    spikes,
    areas,
    feature2_faculties,
    number_of_reach: 10,
    number_of_match: 10,
    number_of_safety: 10,
    ...(args.preferredAreas && args.preferredAreas.length > 0
      ? { preferred_areas: args.preferredAreas }
      : {}),
    ...(typeof args.preferredAreaBoost === "number"
      ? { preferred_area_boost: args.preferredAreaBoost }
      : {}),
  };
}
