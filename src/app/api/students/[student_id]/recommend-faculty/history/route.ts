import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ student_id: string }> }
) {
  const { student_id: studentId } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;
    if (!sessionUserId || String(sessionUserId) !== String(studentId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const list = await prisma.faculty_recommendations.findMany({
      where: { student_id: studentId },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        created_at: true,
        assessment_summary: true,
        faculties: true,
      },
    });

    return NextResponse.json({
      items: list.map((row) => ({
        id: row.id,
        created_at: row.created_at,
        assessment_summary: row.assessment_summary,
        faculties: row.faculties,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Lỗi tải lịch sử" }, { status: 500 });
  }
}
