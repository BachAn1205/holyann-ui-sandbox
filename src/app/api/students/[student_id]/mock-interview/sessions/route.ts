import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireStudentRouteAccess } from "@/lib/auth-utils"
import type { MockInterviewQuestionRecord } from "@/data/mock-interview-questions"
import type { StoredInterviewAnswer } from "@/actions/mock-interview"

export async function GET(
  _request: Request,
  context: { params: Promise<{ student_id: string }> },
) {
  const { student_id: studentId } = await context.params
  try {
    const currentUser = await requireStudentRouteAccess(studentId)
    const rows = await prisma.student_interview_sessions.findMany({
      where: { user_id: currentUser.id, status: "completed" },
      orderBy: { updated_at: "desc" },
      take: 30,
      select: {
        id: true,
        updated_at: true,
        questions_json: true,
        answers_json: true,
      },
    })
    const sessions = rows.map((r) => ({
      id: r.id,
      completedAt: r.updated_at.toISOString(),
      questions: r.questions_json as MockInterviewQuestionRecord[],
      answers: (r.answers_json as StoredInterviewAnswer[] | null) ?? [],
    }))
    return NextResponse.json({ sessions })
  } catch (error) {
    const status =
      error instanceof Error &&
      (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN")
        ? 401
        : 500
    return NextResponse.json(
      { error: status === 401 ? "Unauthorized" : "Lỗi tải phiên phỏng vấn" },
      { status },
    )
  }
}
