/**
 * Profile analysis service
 *
 * - analyzeAndSaveProfile: delegates to existing POST /api/students/[id]/analyze-profile
 * - buildAnalysisPayloadFromStudent: stub (preview payload); implement via same route if needed
 */

import type { Feature1InputPayload } from "@/lib/schemas/profile-analysis.schema";

const getAppOrigin = (): string => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const url = process.env.NEXTAUTH_URL;
  if (url && (url.startsWith("http://") || url.startsWith("https://")))
    return url.replace(/\/+$/, "");
  return "http://localhost:3000";
};

export interface AnalyzeResult {
  success: boolean;
  data?: unknown;
  analysisId?: string;
  error?: string;
}

/**
 * Run profile analysis and save result. Delegates to existing analyze-profile API.
 */
export async function analyzeAndSaveProfile(
  studentId: string,
  _customPayload?: Feature1InputPayload | null
): Promise<AnalyzeResult> {
  const origin = getAppOrigin();
  const url = `${origin}/api/students/${studentId}/analyze-profile`;

  const res = await fetch(url, { method: "POST" });
  const data = (await res.json()) as {
    success?: boolean;
    data?: unknown;
    error?: string;
    details?: string;
  };

  if (!res.ok) {
    return {
      success: false,
      error: data.error || data.details || "Phân tích thất bại",
    };
  }

  return {
    success: !!data.success,
    data: data.data,
    analysisId: (data as { analysisId?: string }).analysisId,
    error: data.error,
  };
}

/**
 * Build the payload that would be sent to the AI (for preview).
 * Returns null if not implemented or student not found.
 */
export async function buildAnalysisPayloadFromStudent(
  _studentId: string
): Promise<Feature1InputPayload | null> {
  // Stub: payload building lives in analyze-profile route; use GET preview or implement here if needed
  return null;
}
