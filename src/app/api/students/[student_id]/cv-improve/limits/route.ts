import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan } from "@/lib/subscription";
import { requireStudentRouteAccess } from "@/lib/auth-utils";
import { getPerCvAnalysisLimit, getPerCvEnhanceLimit } from "@/lib/cv-feature7";

function normalizePlan(raw: string | null | undefined): SubscriptionPlan {
  const upper = (raw ?? "FREE")?.toString?.().trim?.().toUpperCase?.() ?? "FREE";
  if (upper === "ADVANCED") return "PREMIUM";
  if (["FREE", "PLUS", "PREMIUM"].includes(upper)) return upper as SubscriptionPlan;
  return "FREE";
}

/** GET .../cv-improve/limits?cv_document_id=... */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ student_id: string }> },
) {
  const { student_id: studentId } = await context.params;
  const cvDocumentId = request.nextUrl.searchParams.get("cv_document_id");
  try {
    await requireStudentRouteAccess(studentId);

    const user = await prisma.users.findUnique({
      where: { id: studentId },
      select: { subscription_plan: true },
    });
    const plan = normalizePlan(user?.subscription_plan as string);

    const analysisLimit = getPerCvAnalysisLimit(plan);
    const enhanceLimit = getPerCvEnhanceLimit(plan);

    if (!cvDocumentId) {
      return NextResponse.json({
        analysisLimit,
        enhanceLimit,
        analysisUsed: 0,
        analysisRemaining: analysisLimit,
        enhanceUsed: 0,
        enhanceRemaining: enhanceLimit,
        perCv: true,
      });
    }

    const owned = await prisma.student_cv_documents.findFirst({
      where: { id: cvDocumentId, student_id: studentId },
      select: { id: true },
    });
    if (!owned) {
      return NextResponse.json({ error: "Không tìm thấy CV" }, { status: 404 });
    }

    const [analysisUsed, enhanceUsed] = await Promise.all([
      prisma.cv_analysis_runs.count({
        where: { student_id: studentId, cv_document_id: cvDocumentId, run_kind: "analysis" },
      }),
      prisma.cv_analysis_runs.count({
        where: { student_id: studentId, cv_document_id: cvDocumentId, run_kind: "enhance" },
      }),
    ]);

    return NextResponse.json({
      analysisLimit,
      enhanceLimit,
      analysisUsed,
      analysisRemaining: Math.max(0, analysisLimit - analysisUsed),
      enhanceUsed,
      enhanceRemaining: Math.max(0, enhanceLimit - enhanceUsed),
      perCv: true,
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
