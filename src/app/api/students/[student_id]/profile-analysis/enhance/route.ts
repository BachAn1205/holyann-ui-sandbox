import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getLimit, type SubscriptionPlan } from "@/lib/subscription";
import { callEnhanceProfile } from "@/lib/ai-api-client";
import type { Feature1EnhanceOutput } from "@/lib/schemas/profile-analysis-v2.schema";
import { requireStudentRouteAccess } from "@/lib/auth-utils";
import { unwrapFastApiBody } from "@/lib/fast-api-response";
import { mergeAreasColumnIntoFullResult } from "@/lib/profile-analysis-normalize";

export const maxDuration = 300;

function normalizePlan(raw: string | null | undefined): SubscriptionPlan {
  const upper = (raw ?? "FREE")?.toString?.().trim?.().toUpperCase?.() ?? "FREE";
  if (upper === "ADVANCED") return "PREMIUM";
  if (["FREE", "PLUS", "PREMIUM"].includes(upper)) return upper as SubscriptionPlan;
  return "FREE";
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ student_id: string }> }
) {
  const { student_id: studentId } = await context.params;
  try {
    const currentUser = await requireStudentRouteAccess(studentId);

    const user = await prisma.users.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        subscription_plan: true,
        students: {
          select: { user_id: true },
        },
      },
    });
    if (!user?.students) {
      return NextResponse.json({ error: "Không tìm thấy học sinh" }, { status: 404 });
    }

    const plan = normalizePlan(user.subscription_plan as string);
    const limitRaw = getLimit(plan, "profileEnhanceLimit");
    const limit = typeof limitRaw === "number" ? limitRaw : limitRaw === true ? 1 : 0;
    const used = await prisma.profile_improve_results.count({ where: { student_id: currentUser.id } });
    if (limit !== -1 && used >= limit) {
      return NextResponse.json(
        {
          error: "Bạn đã dùng hết số lần cải thiện theo gói. Vui lòng nâng cấp.",
          limit,
          used,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const willing_area = body?.willing_area === "B" || body?.willing_area === "C" ? body.willing_area : "A";

    const latest = await prisma.profile_analyses.findFirst({
      where: { student_id: currentUser.id },
      orderBy: { created_at: "desc" },
      select: { full_result: true, areas: true },
    });
    const fullResult = latest
      ? (mergeAreasColumnIntoFullResult(latest.full_result, latest.areas) as Record<
          string,
          unknown
        > | null)
      : null;
    if (!fullResult?.pillar_scores || !fullResult?.areas || !fullResult?.swot) {
      return NextResponse.json(
        { error: "Chưa có kết quả đánh giá hồ sơ. Vui lòng chạy Đánh giá profile trước." },
        { status: 400 }
      );
    }

    const rawResult = await callEnhanceProfile({
      analysis_information: fullResult,
      willing_area,
    });
    const result = unwrapFastApiBody<Feature1EnhanceOutput>(rawResult);

    if (!result?.list_suggestion || !result?.roadmap) {
      return NextResponse.json(
        { error: "Dữ liệu cải thiện không hợp lệ từ AI" },
        { status: 500 }
      );
    }

    const now = new Date();
    await prisma.profile_improve_results.create({
      data: {
        id: randomUUID(),
        student_id: currentUser.id,
        enhance_result: result as unknown as object,
        enhance_at: now,
        updated_at: now,
      },
    });

    return NextResponse.json(result);
  } catch (e) {
    const status = e instanceof Error && (e.message === "UNAUTHORIZED" || e.message === "FORBIDDEN") ? 401 : 500;
    const msg = status === 401 ? "Unauthorized" : e instanceof Error ? e.message : "Lỗi cải thiện hồ sơ";
    return NextResponse.json({ error: msg }, { status });
  }
}
