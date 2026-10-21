import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan } from "@/lib/subscription";
import { requireStudentRouteAccess } from "@/lib/auth-utils";
import { callEssayEnhance } from "@/lib/ai-api-client";
import {
  getPerEssayEnhanceLimit,
  sanitizeEnhanceOutputForClient,
  stripHtmlToText,
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

    const body = (await request.json()) as {
      essay_id?: string;
      user_provided_context?: Record<string, unknown>;
      rewrite_constraints?: Record<string, unknown>;
      target_culture?: string;
    };
    const essayId = body.essay_id;
    if (!essayId) {
      return NextResponse.json({ error: "Thiếu essay_id" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { id: currentUser.id },
      select: { subscription_plan: true },
    });
    const plan = normalizePlan(user?.subscription_plan as string);
    const limit = getPerEssayEnhanceLimit(plan);
    const used = await prisma.essay_analysis_runs.count({
      where: { essay_id: essayId, student_id: currentUser.id, run_kind: "enhance" },
    });

    if (used >= limit) {
      return NextResponse.json(
        {
          error: `Bài luận này đã dùng hết ${limit} lần cải thiện theo gói.`,
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

    const lastAnalysis = await prisma.essay_analysis_runs.findFirst({
      where: { essay_id: essayId, run_kind: "analysis" },
      orderBy: { created_at: "desc" },
    });
    if (!lastAnalysis) {
      return NextResponse.json(
        { error: "Cần phân tích bài luận trước khi cải thiện." },
        { status: 400 },
      );
    }

    const analysisReport = lastAnalysis.output_data;
    const targetCulture = (essay.target_culture ?? "A").trim() || "A";

    const enhancePayload: Record<string, unknown> = {
      original_essay: stripHtmlToText(essay.content),
      analysis_report: analysisReport,
      target_culture: targetCulture,
      essay_prompt: essay.essay_prompt?.trim() ?? "",
      target_words: essay.target_words ?? null,
      user_provided_context: body.user_provided_context ?? {
        specific_actions: [],
        star_r_metrics: [],
        future_plans_entities: [],
        institution_entities: [],
      },
      rewrite_constraints: body.rewrite_constraints ?? {
        maintain_original_tone: true,
        force_star_r_structure: false,
        max_rewrite_ratio: 0.4,
      },
    };

    const rawResult = await callEssayEnhance(enhancePayload);
    const outputStored = sanitizeEnhanceOutputForClient(rawResult);
    const now = new Date();

    await prisma.essay_analysis_runs.create({
      data: {
        id: randomUUID(),
        essay_id: essayId,
        student_id: currentUser.id,
        run_kind: "enhance",
        input_data: enhancePayload as object,
        output_data: outputStored as object,
        created_at: now,
      },
    });

    return NextResponse.json(outputStored);
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[essay-improve/enhance]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Cải thiện thất bại" },
      { status: 500 },
    );
  }
}
