import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudentRouteAccess } from "@/lib/auth-utils";
import { cloneJsonSafe, sanitizeEnhanceOutputForClient } from "@/lib/essay-feature4";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ student_id: string }> },
) {
  const { student_id: studentId } = await context.params;
  const essayId = request.nextUrl.searchParams.get("essay_id");
  try {
    await requireStudentRouteAccess(studentId);
    if (!essayId) {
      return NextResponse.json({ error: "Thiếu essay_id" }, { status: 400 });
    }

    const essay = await prisma.essays.findFirst({
      where: { id: essayId, student_id: studentId },
      select: { id: true },
    });
    if (!essay) {
      return NextResponse.json({ error: "Không tìm thấy bài luận" }, { status: 404 });
    }

    const [lastAnalysis, lastEnhance] = await Promise.all([
      prisma.essay_analysis_runs.findFirst({
        where: { essay_id: essayId, run_kind: "analysis" },
        orderBy: { created_at: "desc" },
        select: { output_data: true, input_data: true, created_at: true },
      }),
      prisma.essay_analysis_runs.findFirst({
        where: { essay_id: essayId, run_kind: "enhance" },
        orderBy: { created_at: "desc" },
        select: { output_data: true, input_data: true, created_at: true },
      }),
    ]);

    return NextResponse.json({
      analysis: lastAnalysis
        ? {
            output_data: cloneJsonSafe(lastAnalysis.output_data),
            input_data: cloneJsonSafe(lastAnalysis.input_data),
            created_at: lastAnalysis.created_at,
          }
        : null,
      enhance: lastEnhance
        ? {
            output_data: sanitizeEnhanceOutputForClient(
              cloneJsonSafe(lastEnhance.output_data),
            ),
            input_data: cloneJsonSafe(lastEnhance.input_data),
            created_at: lastEnhance.created_at,
          }
        : null,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Lỗi tải dữ liệu" }, { status: 500 });
  }
}
