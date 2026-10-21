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

    const latest = await prisma.faculty_recommendations.findFirst({
      where: { student_id: studentId },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        assessment_summary: true,
        faculties: true,
        created_at: true,
      },
    });

    if (!latest) {
      return NextResponse.json({ recommendation: null });
    }

    return NextResponse.json({
      recommendation: {
        id: latest.id,
        assessment_summary: latest.assessment_summary,
        faculties: latest.faculties,
        created_at: latest.created_at,
      },
    });
  } catch {
    return NextResponse.json({ error: "Lỗi tải gợi ý" }, { status: 500 });
  }
}
