import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type PillarScores = {
  academic?: number;
  language?: number;
  extracurricular?: number;
  skills?: number;
};

function pillarFromFullResult(fullResult: unknown): PillarScores | null {
  if (!fullResult || typeof fullResult !== "object") return null;
  const fr = fullResult as { pillar_scores?: PillarScores };
  return fr.pillar_scores ?? null;
}

function pillarFromEnhanceResult(enhanceResult: unknown): PillarScores | null {
  if (!enhanceResult || typeof enhanceResult !== "object") return null;
  const er = enhanceResult as { pillar_score_after_enhance?: PillarScores };
  return er.pillar_score_after_enhance ?? null;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ student_id: string }> }
) {
  const { student_id: studentId } = await context.params;
  try {
    const [analyses, enhances] = await Promise.all([
      prisma.profile_analyses.findMany({
        where: { student_id: studentId },
        orderBy: { created_at: "desc" },
        select: { id: true, created_at: true, full_result: true },
      }),
      prisma.profile_improve_results.findMany({
        where: {
          student_id: studentId,
          enhance_at: { not: null },
        },
        orderBy: { updated_at: "desc" },
        select: { id: true, enhance_at: true, enhance_result: true },
      }),
    ]);

    return NextResponse.json({
      analyses: analyses.map((a) => ({
        id: a.id,
        date: a.created_at,
        pillar_scores: pillarFromFullResult(a.full_result),
      })),
      enhances: enhances.map((e) => ({
        id: e.id,
        date: e.enhance_at,
        pillar_scores: pillarFromEnhanceResult(e.enhance_result),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Lỗi tải lịch sử" }, { status: 500 });
  }
}
