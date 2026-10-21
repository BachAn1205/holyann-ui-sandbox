import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLimit, type SubscriptionPlan } from "@/lib/subscription";
import { requireStudentRouteAccess } from "@/lib/auth-utils";

function normalizePlan(raw: string | null | undefined): SubscriptionPlan {
  const upper = (raw ?? "FREE")?.toString?.().trim?.().toUpperCase?.() ?? "FREE";
  if (upper === "ADVANCED") return "PREMIUM";
  if (["FREE", "PLUS", "PREMIUM"].includes(upper)) return upper as SubscriptionPlan;
  return "FREE";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ student_id: string }> }
) {
  const { student_id: studentId } = await context.params;
  try {
    const currentUser = await requireStudentRouteAccess(studentId);

    const user = await prisma.users.findUnique({
      where: { id: currentUser.id },
      select: { id: true, subscription_plan: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
    }

    const plan = normalizePlan(user.subscription_plan as string);
    const analysisLimitRaw = getLimit(plan, "profileAnalysisLimit");
    const enhanceLimitRaw = getLimit(plan, "profileEnhanceLimit");
    const analysisLimit = typeof analysisLimitRaw === "number" ? analysisLimitRaw : analysisLimitRaw === true ? 1 : 0;
    const enhanceLimit = typeof enhanceLimitRaw === "number" ? enhanceLimitRaw : enhanceLimitRaw === true ? 1 : 0;

    const [analysisUsed, enhanceUsed] = await Promise.all([
      prisma.profile_analyses.count({ where: { student_id: currentUser.id } }),
      prisma.profile_improve_results.count({ where: { student_id: currentUser.id } }),
    ]);

    const analysisRemaining = analysisLimit === -1 ? null : Math.max(0, analysisLimit - analysisUsed);
    const enhanceRemaining = enhanceLimit === -1 ? null : Math.max(0, enhanceLimit - enhanceUsed);

    return NextResponse.json({
      plan,
      analysisLimit: analysisLimit === -1 ? null : analysisLimit,
      analysisUsed,
      analysisRemaining,
      enhanceLimit: enhanceLimit === -1 ? null : enhanceLimit,
      enhanceUsed,
      enhanceRemaining,
    });
  } catch (error) {
    const status = error instanceof Error && (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? "Unauthorized" : "Lỗi lấy giới hạn" }, { status });
  }
}
