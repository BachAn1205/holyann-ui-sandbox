import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan } from "@/lib/subscription";
import { requireStudentRouteAccess } from "@/lib/auth-utils";
import { callEssayAnalysis } from "@/lib/ai-api-client";
import { buildEssayAnalysisPayload } from "@/lib/build-essay-analysis-payload";
import {
  getPerEssayAnalysisLimit,
  validateEssayFeature4Inputs,
} from "@/lib/essay-feature4";

export const maxDuration = 300;

function normalizePlan(raw: string | null | undefined): SubscriptionPlan {
  const upper = (raw ?? "FREE")?.toString?.().trim?.().toUpperCase?.() ?? "FREE";
  if (upper === "ADVANCED") return "PREMIUM";
  if (["FREE", "PLUS", "PREMIUM"].includes(upper)) return upper as SubscriptionPlan;
  return "FREE";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ student_id: string }> },
) {
  const { student_id: studentId } = await context.params;
  try {
    const currentUser = await requireStudentRouteAccess(studentId);

    const body = (await request.json()) as { essay_id?: string };
    const essayId = body.essay_id;
    if (!essayId) {
      return NextResponse.json({ error: "Thiếu essay_id" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { id: currentUser.id },
      select: { subscription_plan: true },
    });
    const plan = normalizePlan(user?.subscription_plan as string);
    const limit = getPerEssayAnalysisLimit(plan);
    const used = await prisma.essay_analysis_runs.count({
      where: { essay_id: essayId, student_id: currentUser.id, run_kind: "analysis" },
    });

    if (used >= limit) {
      return NextResponse.json(
        {
          error: `Bài luận này đã dùng hết ${limit} lần phân tích theo gói.`,
          limit,
          used,
        },
        { status: 403 },
      );
    }

    const essay = await prisma.essays.findFirst({
      where: { id: essayId, student_id: currentUser.id },
      include: {
        target_goal: { select: { faculty_name: true, university_name: true } },
      },
    });
    if (!essay) {
      return NextResponse.json({ error: "Không tìm thấy bài luận" }, { status: 404 });
    }

    const v = validateEssayFeature4Inputs(essay);
    if (!v.ok) {
      return NextResponse.json(
        {
          error: "Vui lòng đảm bảo bài luận có nội dung để phân tích.",
          missing: v.missing,
          missingLabels: v.missingLabels,
        },
        { status: 400 },
      );
    }

    const payload = await buildEssayAnalysisPayload(essayId, currentUser.id);
    if (!payload) {
      return NextResponse.json({ error: "Không tìm thấy bài luận" }, { status: 404 });
    }

    const rawResult = await callEssayAnalysis(payload);
    const now = new Date();

    await prisma.essay_analysis_runs.create({
      data: {
        id: randomUUID(),
        essay_id: essayId,
        student_id: currentUser.id,
        run_kind: "analysis",
        input_data: payload as object,
        output_data: rawResult as object,
        created_at: now,
      },
    });

    return NextResponse.json(rawResult);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[essay-improve/analyze]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Phân tích thất bại" },
      { status: 500 },
    );
  }
}
