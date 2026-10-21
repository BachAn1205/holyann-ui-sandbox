import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan } from "@/lib/subscription";
import { requireStudentRouteAccess } from "@/lib/auth-utils";
import { getPerEssayAnalysisLimit, getPerEssayEnhanceLimit } from "@/lib/essay-feature4";

function normalizePlan(raw: string | null | undefined): SubscriptionPlan {
  const upper = (raw ?? "FREE")?.toString?.().trim?.().toUpperCase?.() ?? "FREE";
  if (upper === "ADVANCED") return "PREMIUM";
  if (["FREE", "PLUS", "PREMIUM"].includes(upper)) return upper as SubscriptionPlan;
  return "FREE";
}

/**
 * GET .../essay-improve/limits?essay_id=...
 * Hạn mức theo từng essay_id: Free 2/2, Plus 5/5, Premium 10/10 (phân tích / cải thiện).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ student_id: string }> },
) {
  const { student_id: studentId } = await context.params;
  const essayId = request.nextUrl.searchParams.get("essay_id");
  try {
    await requireStudentRouteAccess(studentId);

    const user = await prisma.users.findUnique({
      where: { id: studentId },
      select: { subscription_plan: true },
    });
    const plan = normalizePlan(user?.subscription_plan as string);

    const analysisLimit = getPerEssayAnalysisLimit(plan);
    const enhanceLimit = getPerEssayEnhanceLimit(plan);

    if (!essayId) {
      return NextResponse.json({
        analysisLimit,
        enhanceLimit,
        analysisUsed: 0,
        analysisRemaining: analysisLimit,
        enhanceUsed: 0,
        enhanceRemaining: enhanceLimit,
        perEssay: true,
      });
    }

    const owned = await prisma.essays.findFirst({
      where: { id: essayId, student_id: studentId },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Không tìm thấy bài luận" }, { status: 404 });
    }

    const [analysisUsed, enhanceUsed] = await Promise.all([
      prisma.essay_analysis_runs.count({
        where: { student_id: studentId, essay_id: essayId, run_kind: "analysis" },
      }),
      prisma.essay_analysis_runs.count({
        where: { student_id: studentId, essay_id: essayId, run_kind: "enhance" },
      }),
    ]);

    return NextResponse.json({
      analysisLimit,
      enhanceLimit,
      analysisUsed,
      analysisRemaining: Math.max(0, analysisLimit - analysisUsed),
      enhanceUsed,
      enhanceRemaining: Math.max(0, enhanceLimit - enhanceUsed),
      perEssay: true,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Lỗi tải hạn mức" }, { status: 500 });
  }
}
