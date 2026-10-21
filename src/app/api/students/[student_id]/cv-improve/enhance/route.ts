import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan } from "@/lib/subscription";
import { requireStudentRouteAccess } from "@/lib/auth-utils";
import { callCvEnhance, getResolvedAIServerBaseUrl } from "@/lib/ai-api-client";
import { buildCvEnhancePayloadForAi } from "@/lib/build-cv-feature7-payload";
import {
  getPerCvEnhanceLimit,
  normalizeCvEnhanceOutput,
  sanitizeCvEnhanceOutputForClient,
} from "@/lib/cv-feature7";
import {
  describeUnknownJson,
  summarizeJsonForLog,
} from "@/lib/cv-improve-server-log";

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
      cv_document_id?: string;
      missing_context?: Record<string, unknown>;
    };
    const cvDocumentId = body.cv_document_id;
    if (!cvDocumentId) {
      return NextResponse.json({ error: "Thiếu cv_document_id" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { id: currentUser.id },
      select: { subscription_plan: true },
    });
    const plan = normalizePlan(user?.subscription_plan as string);
    const limit = getPerCvEnhanceLimit(plan);
    const used = await prisma.cv_analysis_runs.count({
      where: {
        cv_document_id: cvDocumentId,
        student_id: currentUser.id,
        run_kind: "enhance",
      },
    });

    if (used >= limit) {
      return NextResponse.json(
        {
          error: `CV này đã dùng hết ${limit} lần cải thiện theo gói.`,
          limit,
          used,
        },
        { status: 403 },
      );
    }

    const doc = await prisma.student_cv_documents.findFirst({
      where: { id: cvDocumentId, student_id: currentUser.id },
    });
    if (!doc) {
      return NextResponse.json({ error: "Không tìm thấy CV" }, { status: 404 });
    }
    if (!doc.cv_verified_at) {
      return NextResponse.json(
        { error: "Cần verify CV thành công trước khi cải thiện." },
        { status: 400 },
      );
    }

    const lastAnalysis = await prisma.cv_analysis_runs.findFirst({
      where: { cv_document_id: cvDocumentId, run_kind: "analysis" },
      orderBy: { created_at: "desc" },
    });
    if (!lastAnalysis) {
      return NextResponse.json(
        { error: "Cần phân tích CV trước khi cải thiện." },
        { status: 400 },
      );
    }

    const analysisReport =
      typeof lastAnalysis.output_data === "object" && lastAnalysis.output_data !== null
        ? (lastAnalysis.output_data as Record<string, unknown>)
        : {};

    const payload = await buildCvEnhancePayloadForAi(
      cvDocumentId,
      currentUser.id,
      analysisReport,
      body.missing_context,
    );
    if (!payload) {
      return NextResponse.json({ error: "Không tạo được payload" }, { status: 500 });
    }

    const rawResult = await callCvEnhance(payload);
    const storedOutput =
      normalizeCvEnhanceOutput(rawResult as unknown) ?? (rawResult as object);

    const rawDesc = describeUnknownJson(rawResult);
    const storedDesc = describeUnknownJson(storedOutput);
    console.log("[cv-improve/enhance] AI response (before DB)", {
      aiServerBase: getResolvedAIServerBaseUrl(),
      cv_document_id: cvDocumentId,
      raw: rawDesc,
      rawBody: summarizeJsonForLog(rawResult, 6000),
    });
    console.log("[cv-improve/enhance] normalized → stored output_data", {
      cv_document_id: cvDocumentId,
      stored: storedDesc,
      storedBody: summarizeJsonForLog(storedOutput, 6000),
      hasBeforeAfterMatrix: Array.isArray(
        (storedOutput as Record<string, unknown>).before_after_matrix,
      ),
      hasProjectedScore:
        (storedOutput as Record<string, unknown>).projected_score != null,
    });

    const now = new Date();

    await prisma.cv_analysis_runs.create({
      data: {
        id: randomUUID(),
        cv_document_id: cvDocumentId,
        student_id: currentUser.id,
        run_kind: "enhance",
        input_data: payload as object,
        output_data: storedOutput as object,
        created_at: now,
      },
    });

    return NextResponse.json(sanitizeCvEnhanceOutputForClient(storedOutput));
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[cv-improve/enhance]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Cải thiện thất bại" },
      { status: 500 },
    );
  }
}
