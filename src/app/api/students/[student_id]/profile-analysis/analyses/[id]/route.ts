import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ student_id: string; id: string }> }
) {
  const { student_id: studentId, id } = await context.params;
  try {
    const row = await prisma.profile_analyses.findFirst({
      where: { id, student_id: studentId },
      select: { id: true },
    });
    if (!row) {
      return NextResponse.json({ error: "Không tìm thấy bản ghi đánh giá" }, { status: 404 });
    }
    await prisma.profile_analyses.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Xóa thất bại" }, { status: 500 });
  }
}
