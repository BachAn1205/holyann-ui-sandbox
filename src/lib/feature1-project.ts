/** Nhóm dự án đầu vào Feature 1 — khớp `model_analysis.Project.group` */
export type Feature1ProjectGroup = "research" | "science_tech" | "culture_business";

export function normalizeProjectGroupFromDb(
  projectGroup: string | null | undefined,
  topic: string | null | undefined,
): Feature1ProjectGroup {
  const g = String(projectGroup ?? "").trim();
  if (g === "research" || g === "science_tech" || g === "culture_business") {
    return g;
  }
  const t = String(topic ?? "").toLowerCase();
  if (t.includes("research") || t.includes("nghiên")) return "research";
  if (
    t.includes("culture") ||
    t.includes("business") ||
    t.includes("kinh doanh") ||
    t.includes("sport") ||
    t.includes("art")
  ) {
    return "culture_business";
  }
  return "science_tech";
}

export function clampProjectTier(tier: unknown): number {
  const n = typeof tier === "number" ? tier : parseInt(String(tier), 10);
  if (Number.isNaN(n)) return 3;
  return Math.min(5, Math.max(1, n));
}
