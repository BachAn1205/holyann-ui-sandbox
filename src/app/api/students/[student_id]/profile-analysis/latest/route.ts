import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  mergeAreasColumnIntoFullResult,
  normalizeFeature1FullResult,
} from "@/lib/profile-analysis-normalize";

export async function GET(
  _request: Request,
  context: { params: Promise<{ student_id: string }> }
) {
  const { student_id: studentId } = await context.params;
  try {
    const [analysis, enhance] = await Promise.all([
      prisma.profile_analyses.findFirst({
        where: { student_id: studentId },
        orderBy: { created_at: "desc" },
        select: { id: true, full_result: true, areas: true, input_data: true, created_at: true },
      }),
      prisma.profile_improve_results.findFirst({
        where: { student_id: studentId },
        orderBy: { created_at: "desc" },
        select: { id: true, enhance_result: true, enhance_at: true },
      }),
    ]);

    return NextResponse.json({
      analysis: analysis
        ? (() => {
            const merged = mergeAreasColumnIntoFullResult(
              analysis.full_result,
              analysis.areas,
            );
            const normalized = normalizeFeature1FullResult(merged);
            return {
              id: analysis.id,
              full_result: (normalized ?? merged) as object,
              input_data: analysis.input_data,
              analysis_date: analysis.created_at,
            };
          })()
        : null,
      enhance: enhance
        ? {
            id: enhance.id,
            enhance_result: enhance.enhance_result,
            enhance_at: enhance.enhance_at,
          }
        : null,
    });
  } catch {
    return NextResponse.json({ error: "Lỗi tải dữ liệu" }, { status: 500 });
  }
}
