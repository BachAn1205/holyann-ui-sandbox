import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireStudentRouteAccess } from "@/lib/auth-utils";

/** Đảm bảo Json từ Prisma/Postgres thành plain object (tránh edge case serialize). */
function toPlainJson(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  try {
    return JSON.parse(JSON.stringify(value)) as unknown;
  } catch {
    return value;
  }
}

function scoreSummary(
  output: unknown,
): { label: string; detail?: string } | null {
  const plain = toPlainJson(output);
  if (!plain || typeof plain !== "object") return null;
  const o = plain as Record<string, unknown>;
  let fa = o.final_assessment;
  if (!fa && o.data && typeof o.data === "object") {
    const d = o.data as Record<string, unknown>;
    fa = d.final_assessment;
  }
  if (fa && typeof fa === "object") {
    const f = fa as Record<string, unknown>;
    const total = f.Total_Score;
    const cls = f.Classification;
    if (typeof total === "number" && typeof cls === "string") {
      return { label: `${cls}`, detail: `Điểm: ${total.toFixed(1)}` };
    }
    if (typeof cls === "string") return { label: cls };
  }
  return null;
}

function enhanceSummary(
  output: unknown,
): { label: string; detail?: string } | null {
  const plain = toPlainJson(output);
  if (!plain || typeof plain !== "object") return null;
  const o = plain as Record<string, unknown>;
  let rs = o.revision_suggestions;
  if (!Array.isArray(rs) && o.data && typeof o.data === "object") {
    rs = (o.data as Record<string, unknown>).revision_suggestions;
  }
  if (Array.isArray(rs)) {
    return { label: `${rs.length} gợi ý chỉnh sửa` };
  }
  return { label: "Đã cải thiện" };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ student_id: string }> },
) {
  const { student_id: studentId } = await context.params;
  const essayId = request.nextUrl.searchParams.get("essay_id");
  try {
    await requireStudentRouteAccess(studentId);
    if (!essayId) {
      return NextResponse.json({ error: "Thiếu essay_id" }, { status: 400 });
    }

    const essay = await prisma.essays.findFirst({
      where: { id: essayId, student_id: studentId },
      select: { id: true, title: true, slot_index: true },
    });
    if (!essay) {
      return NextResponse.json(
        { error: "Không tìm thấy bài luận" },
        { status: 404 },
      );
    }

    const runs = await prisma.essay_analysis_runs.findMany({
      where: { essay_id: essayId, student_id: studentId },
      orderBy: { created_at: "desc" },
      take: 80,
      select: {
        id: true,
        run_kind: true,
        output_data: true,
        created_at: true,
      },
    });

    /** Chỉ trả tóm tắt — không gửi output_data để người dùng không xem lại toàn bộ kết quả trong lịch sử. */
    const items = runs.map((r) => ({
      id: r.id,
      type: r.run_kind as "analysis" | "enhance",
      date: r.created_at,
      summary:
        r.run_kind === "analysis"
          ? scoreSummary(r.output_data)
          : enhanceSummary(r.output_data),
    }));

    return NextResponse.json({
      essay: { id: essay.id, title: essay.title, slot_index: essay.slot_index },
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
