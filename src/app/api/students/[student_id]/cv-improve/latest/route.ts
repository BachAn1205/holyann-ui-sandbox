import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudentRouteAccess } from "@/lib/auth-utils";
import { cloneJsonSafe } from "@/lib/essay-feature4";
import {
  describeUnknownJson,
  summarizeJsonForLog,
} from "@/lib/cv-improve-server-log";
import {
  parseCvEnhanceStoredOutput,
  sanitizeCvAnalysisOutputForClient,
  sanitizeCvEnhanceOutputForClient,
} from "@/lib/cv-feature7";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ student_id: string }> },
) {
  const { student_id: studentId } = await context.params;
  const cvDocumentId = request.nextUrl.searchParams.get("cv_document_id");
  try {
    await requireStudentRouteAccess(studentId);
    if (!cvDocumentId) {
      return NextResponse.json({ error: "Thiếu cv_document_id" }, { status: 400 });
    }

    const doc = await prisma.student_cv_documents.findFirst({
      where: { id: cvDocumentId, student_id: studentId },
      select: { id: true },
    });
    if (!doc) {
      return NextResponse.json({ error: "Không tìm thấy CV" }, { status: 404 });
    }

    const [lastAnalysis, lastEnhance] = await Promise.all([
      prisma.cv_analysis_runs.findFirst({
        where: { cv_document_id: cvDocumentId, run_kind: "analysis" },
        orderBy: { created_at: "desc" },
        select: { output_data: true, input_data: true, created_at: true },
      }),
      prisma.cv_analysis_runs.findFirst({
        where: { cv_document_id: cvDocumentId, run_kind: "enhance" },
        orderBy: { created_at: "desc" },
        select: { output_data: true, input_data: true, created_at: true },
      }),
    ]);

    if (lastEnhance?.output_data !== undefined) {
      const od = lastEnhance.output_data;
      console.log("[cv-improve/latest] enhance row from DB", {
        cv_document_id: cvDocumentId,
        created_at: lastEnhance.created_at,
        output_data_shape: describeUnknownJson(od as unknown),
        output_data_json: summarizeJsonForLog(od as unknown, 6000),
      });
    } else {
      console.log("[cv-improve/latest] no enhance run for CV", {
        cv_document_id: cvDocumentId,
      });
    }

    const analysisOut = lastAnalysis?.output_data
      ? sanitizeCvAnalysisOutputForClient(cloneJsonSafe(lastAnalysis.output_data))
      : null;
    const enhanceParsed = lastEnhance?.output_data
      ? parseCvEnhanceStoredOutput(lastEnhance.output_data) ?? lastEnhance.output_data
      : null;
    const enhanceOut = enhanceParsed
      ? sanitizeCvEnhanceOutputForClient(enhanceParsed)
      : null;

    return NextResponse.json({
      analysis: lastAnalysis
        ? {
            output_data: analysisOut,
            input_data: cloneJsonSafe(lastAnalysis.input_data),
            created_at: lastAnalysis.created_at,
          }
        : null,
      enhance: lastEnhance
        ? {
            output_data: enhanceOut,
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
