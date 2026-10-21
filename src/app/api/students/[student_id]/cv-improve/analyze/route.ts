import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { SubscriptionPlan } from "@/lib/subscription";
import { requireStudentRouteAccess } from "@/lib/auth-utils";
import { callCvAnalysis } from "@/lib/ai-api-client";
import { buildCvFilePayloadForAi } from "@/lib/build-cv-feature7-payload";
import { getPerCvAnalysisLimit, sanitizeCvAnalysisOutputForClient } from "@/lib/cv-feature7";

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
    const body = (await request.json()) as { cv_document_id?: string };
    const cvDocumentId = body.cv_document_id;
    if (!cvDocumentId) {
      return NextResponse.json({ error: "Thiếu cv_document_id" }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { id: currentUser.id },
      select: { subscription_plan: true },
    });
    const plan = normalizePlan(user?.subscription_plan as string);
    const limit = getPerCvAnalysisLimit(plan);
    const used = await prisma.cv_analysis_runs.count({
      where: {
        cv_document_id: cvDocumentId,
        student_id: currentUser.id,
        run_kind: "analysis",
      },
    });

    if (used >= limit) {
      return NextResponse.json(
        {
          error: `CV này đã dùng hết ${limit} lần phân tích theo gói.`,
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
        { error: "Cần verify CV thành công trước khi phân tích." },
        { status: 400 },
      );
    }

    const payload = await buildCvFilePayloadForAi(cvDocumentId, currentUser.id);
    if (!payload) {
      return NextResponse.json({ error: "Không tạo được payload" }, { status: 500 });
    }

    const rawResult = await callCvAnalysis(payload);
    const now = new Date();

    await prisma.cv_analysis_runs.create({
      data: {
        id: randomUUID(),
        cv_document_id: cvDocumentId,
        student_id: currentUser.id,
        run_kind: "analysis",
        input_data: payload as object,
        output_data: rawResult as object,
        created_at: now,
      },
    });

    return NextResponse.json(sanitizeCvAnalysisOutputForClient(rawResult));
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[cv-improve/analyze]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Phân tích thất bại" },
      { status: 500 },
    );
  }
}
