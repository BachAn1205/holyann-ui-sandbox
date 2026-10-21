import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/auth-config"
import { prisma } from "@/lib/prisma"
import type { MockInterviewQuestionRecord } from "@/data/mock-interview-questions"
import type { StoredInterviewAnswer } from "@/actions/mock-interview"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { studentId } = await params

    const assignment = await prisma.mentor_assignments.findFirst({
      where: {
        student_id: studentId,
        mentor_id: session.user.id,
        status: "ACTIVE",
      },
      select: { id: true },
    })
    if (!assignment) {
      return NextResponse.json(
        { error: "Bạn không được assign với học sinh này" },
        { status: 403 },
      )
    }

    const rows = await prisma.student_interview_sessions.findMany({
      where: { user_id: studentId, status: "completed" },
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
  } catch (e) {
    console.error("[mentor mock-interview/sessions]", e)
    return NextResponse.json({ error: "Lỗi tải dữ liệu" }, { status: 500 })
  }
}
