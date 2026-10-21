"use server"

import { uploadFileServerAction } from "@/actions/upload"
import type { MockInterviewQuestionRecord } from "@/data/mock-interview-questions"
import { pickMockInterviewQuestions } from "@/data/mock-interview-questions"
import { randomUUID } from "crypto"
import { getInterviewQuestionBankFromCsv } from "@/lib/interview-questions-csv"
import {
  callFeature8Evaluate,
  callFeature8EvaluateWithVideo,
} from "@/lib/ai-api-client"
import {
  buildFeature8EvaluatePayload,
  buildFeature8StudentProfile,
} from "@/lib/mock-interview-payload"
import { requireStudentAuth } from "@/lib/auth-utils"
import { getMockInterviewQuotaSnapshot } from "@/lib/mock-interview-quota"
import { prisma } from "@/lib/prisma"
import { MOCK_INTERVIEW_QUESTION_COUNT } from "@/lib/mock-interview-config"
import type { Prisma } from "@prisma/client"

export type StoredInterviewAnswer = {
  questionIndex: number
  questionId: string
  audio_url: string | null
  audio_path: string | null
  transcript: string
  duration_seconds: number
  evaluation: unknown | null
  evaluate_error?: string | null
}

export type CreateMockInterviewSessionResult =
  | { ok: true; sessionId: string; questions: MockInterviewQuestionRecord[] }
  | { ok: false; error: string; code: "QUOTA" | "ERROR" }

export async function createMockInterviewSession(): Promise<CreateMockInterviewSessionResult> {
  try {
    const user = await requireStudentAuth()
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { id: true, subscription_plan: true },
    })
    if (!dbUser) {
      return { ok: false, error: "Không tìm thấy tài khoản.", code: "ERROR" }
    }

    await prisma.student_interview_sessions.updateMany({
      where: {
        user_id: user.id,
        status: "in_progress",
      },
      data: { status: "abandoned" },
    })

    const quota = await getMockInterviewQuotaSnapshot(
      prisma,
      user.id,
      dbUser.subscription_plan,
    )
    if (!quota.canStartNew) {
      return {
        ok: false,
        error: quota.reason ?? "Đã hết lượt phỏng vấn thử.",
        code: "QUOTA",
      }
    }

    const bank = getInterviewQuestionBankFromCsv()
    const sessionSeed = `${user.id}:${randomUUID()}:${Date.now()}`
    const questions = pickMockInterviewQuestions(
      bank,
      sessionSeed,
      MOCK_INTERVIEW_QUESTION_COUNT,
    )
    const row = await prisma.student_interview_sessions.create({
      data: {
        user_id: user.id,
        status: "in_progress",
        questions_json: questions,
      },
    })
    return { ok: true, sessionId: row.id, questions }
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Không tạo được phiên phỏng vấn."
    if (msg === "UNAUTHORIZED" || msg === "FORBIDDEN") {
      return { ok: false, error: "Bạn cần đăng nhập với tài khoản học sinh.", code: "ERROR" }
    }
    return { ok: false, error: msg, code: "ERROR" }
  }
}

export async function markMockInterviewMicOk(sessionId: string) {
  const user = await requireStudentAuth()
  const row = await prisma.student_interview_sessions.findFirst({
    where: { id: sessionId, user_id: user.id },
  })
  if (!row) {
    return { ok: false as const, error: "Không tìm thấy phiên." }
  }
  await prisma.student_interview_sessions.update({
    where: { id: sessionId },
    data: { mic_checked_at: new Date() },
  })
  return { ok: true as const }
}

export async function submitMockInterviewAnswer(input: {
  sessionId: string
  questionIndex: number
  audio: File
  video?: File
  transcript: string
  durationSeconds: number
}) {
  const user = await requireStudentAuth()
  const session = await prisma.student_interview_sessions.findFirst({
    where: { id: input.sessionId, user_id: user.id },
    include: {
      users: {
        include: {
          students: { include: { student_academic_profiles: true } },
        },
      },
    },
  })

  if (!session) {
    return { success: false as const, error: "Phiên không tồn tại." }
  }

  const questions = session.questions_json as MockInterviewQuestionRecord[]
  const q = questions[input.questionIndex]
  if (!q) {
    return { success: false as const, error: "Câu hỏi không hợp lệ." }
  }

  const u = session.users
  const st = u.students
  const studentProfile = buildFeature8StudentProfile({
    userId: user.id,
    fullName: u.full_name,
    gradeLabel: st?.current_grade ?? null,
    targetMajor: st?.target_faculty_name ?? null,
    targetUniversity: st?.target_university_name ?? null,
    englishCertificates:
      st?.student_academic_profiles?.english_certificates ?? null,
  })

  const targetSchool =
    st?.target_university_name?.trim() || "General admissions"
  const targetCountry = "US"

  const payload = buildFeature8EvaluatePayload({
    sessionId: session.id,
    userId: user.id,
    studentProfile,
    targetSchool,
    targetCountry,
    question: q,
    questionIndex: input.questionIndex,
    totalQuestions: questions.length,
    transcript: input.transcript,
    durationSeconds: input.durationSeconds,
  })

  const formData = new FormData()
  formData.set("file", input.audio)
  formData.set("category", "mock-interview")

  const evalPromise = (input.video
    ? callFeature8EvaluateWithVideo(
        payload,
        input.video,
        input.video.name || `answer-${input.questionIndex}.webm`,
      )
    : callFeature8Evaluate(payload)
  ).then(
    (data) => ({ ok: true as const, data }),
    (e: unknown) => ({
      ok: false as const,
      error: e instanceof Error ? e.message : String(e),
    }),
  )

  const [uploadResult, evalOutcome] = await Promise.all([
    uploadFileServerAction(formData),
    evalPromise,
  ])

  if (!uploadResult.success) {
    return {
      success: false as const,
      error: uploadResult.error ?? "Upload âm thanh thất bại.",
    }
  }

  const evaluation = evalOutcome.ok ? evalOutcome.data : null
  const evaluateError = evalOutcome.ok ? null : evalOutcome.error

  const prev = (session.answers_json as StoredInterviewAnswer[] | null) ?? []
  const filtered = prev.filter((a) => a.questionIndex !== input.questionIndex)
  const entry: StoredInterviewAnswer = {
    questionIndex: input.questionIndex,
    questionId: q.id,
    audio_url: uploadResult.url ?? null,
    audio_path: uploadResult.path ?? null,
    transcript: input.transcript,
    duration_seconds: input.durationSeconds,
    evaluation,
    evaluate_error: evaluateError,
  }
  const next = [...filtered, entry].sort(
    (a, b) => a.questionIndex - b.questionIndex,
  )

  const answeredIndices = new Set(next.map((a) => a.questionIndex))
  const done = questions.every((_, i) => answeredIndices.has(i))

  await prisma.student_interview_sessions.update({
    where: { id: session.id },
    data: {
      answers_json: next as unknown as Prisma.InputJsonValue,
      status: done ? "completed" : "in_progress",
    },
  })

  return {
    success: true as const,
    answer: entry,
    sessionComplete: done,
  }
}

export async function getMockInterviewSession(sessionId: string) {
  const user = await requireStudentAuth()
  const row = await prisma.student_interview_sessions.findFirst({
    where: { id: sessionId, user_id: user.id },
  })
  if (!row) return null
  return {
    id: row.id,
    status: row.status,
    mic_checked_at: row.mic_checked_at,
    questions: row.questions_json as MockInterviewQuestionRecord[],
    answers: (row.answers_json as StoredInterviewAnswer[] | null) ?? [],
  }
}
