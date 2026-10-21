import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudentRouteAccess } from "@/lib/auth-utils";
import { normalizeCvEnhanceOutput } from "@/lib/cv-feature7";

function toPlainJson(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  try {
    return JSON.parse(JSON.stringify(value)) as unknown;
  } catch {
    return value;
  }
}

function analysisSummary(output: unknown): { label: string; detail?: string } | null {
  const plain = toPlainJson(output);
  if (!plain || typeof plain !== "object") return null;
  const o = plain as Record<string, unknown>;
  const enr =
    o.enrichment && typeof o.enrichment === "object" && !Array.isArray(o.enrichment)
      ? (o.enrichment as Record<string, unknown>)
      : null;
  const exec =
    enr && typeof enr.executive_summary_vi === "string"
      ? enr.executive_summary_vi.trim()
      : "";
  if (exec) {
    const line = exec.split(/\r?\n/)[0] ?? "";
    const short = line.length > 90 ? `${line.slice(0, 87)}…` : line;
    return { label: "Phân tích CV", detail: short };
  }
  return { label: "Phân tích CV" };
}

function enhanceSummary(output: unknown): { label: string; detail?: string } | null {
  const plain = toPlainJson(output);
  if (!plain || typeof plain !== "object") return null;
  const o =
    normalizeCvEnhanceOutput(plain) ?? (plain as Record<string, unknown>);
  const matrix = o.before_after_matrix;
  const n = Array.isArray(matrix) ? matrix.length : 0;
  if (n > 0) {
    return { label: "Cải thiện CV", detail: `${n} gợi ý bullet` };
  }
  return { label: "Đã cải thiện" };
}

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

    const cvDoc = await prisma.student_cv_documents.findFirst({
      where: { id: cvDocumentId, student_id: studentId },
      select: { id: true, slot_index: true, file_name: true },
    });
    if (!cvDoc) {
      return NextResponse.json({ error: "Không tìm thấy CV" }, { status: 404 });
    }

    const runs = await prisma.cv_analysis_runs.findMany({
      where: { cv_document_id: cvDocumentId, student_id: studentId },
      orderBy: { created_at: "desc" },
      take: 80,
      select: {
        id: true,
        run_kind: true,
        output_data: true,
        created_at: true,
      },
    });

    const items = runs.map((r) => ({
      id: r.id,
      type: r.run_kind as "analysis" | "enhance",
      date: r.created_at,
      summary:
        r.run_kind === "analysis"
          ? analysisSummary(r.output_data)
          : enhanceSummary(r.output_data),
    }));

    return NextResponse.json({
      cv: {
        id: cvDoc.id,
        slot_index: cvDoc.slot_index,
        file_name: cvDoc.file_name,
      },
      items,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Lỗi tải lịch sử" }, { status: 500 });
  }
}
