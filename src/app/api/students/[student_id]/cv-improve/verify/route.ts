import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudentRouteAccess } from "@/lib/auth-utils";
import { callCvVerify } from "@/lib/ai-api-client";
import { buildCvFilePayloadForAi } from "@/lib/build-cv-feature7-payload";

export const maxDuration = 120;

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

    const doc = await prisma.student_cv_documents.findFirst({
      where: { id: cvDocumentId, student_id: currentUser.id },
    });
    if (!doc) {
      return NextResponse.json({ error: "Không tìm thấy CV" }, { status: 404 });
    }

    const payload = await buildCvFilePayloadForAi(cvDocumentId, currentUser.id);
    if (!payload) {
      return NextResponse.json({ error: "Không tạo được payload" }, { status: 500 });
    }

    const raw = (await callCvVerify(payload)) as Record<string, unknown>;
    const valid = Boolean(raw?.valid);

    await prisma.student_cv_documents.update({
      where: { id: cvDocumentId },
      data: {
        cv_verified_at: valid ? new Date() : null,
        cv_validation: raw as object,
      },
    });

    if (!valid) {
      const reasons = (raw as { reasons?: unknown }).reasons;
      const list = Array.isArray(reasons)
        ? reasons.map((r) => String(r))
        : [];
      // Chỉ chọn lý do mang nghĩa "thất bại", bỏ các tín hiệu tích cực kiểu "Phát hiện email..."
      const firstNegative =
        list.find(
          (msg) =>
            /thiếu|không|chưa|lỗi|marker|slide|quá ngắn|ít chữ|khó xác định/i.test(
              msg,
            ),
        ) ??
        list.find((msg) => !/tín hiệu cv|phát hiện email|phát hiện phone|linkedin|website\/url/i.test(msg));
      const first = firstNegative || "CV chưa đạt kiểm tra (verify).";
      return NextResponse.json(
        {
          error: `CV chưa đạt kiểm tra: ${first}`,
          validation: raw,
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ ok: true, validation: raw });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[cv-improve/verify]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verify thất bại" },
      { status: 500 },
    );
  }
}
