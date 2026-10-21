"use client"

import type { MockInterviewQuestionRecord } from "@/data/mock-interview-questions"
import {
  mockInterviewCategoryLabelVi,
  mockInterviewTypeLabelVi,
} from "@/data/mock-interview-questions"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  averageFeature8Scores,
  summarizeFeature8Evaluation,
} from "@/lib/feature8-evaluation-display"

export type MockInterviewAnswerDto = {
  questionIndex: number
  questionId: string
  transcript: string
  duration_seconds: number
  evaluation: unknown | null
  evaluate_error?: string | null
}

export type MockInterviewCompletedSessionDto = {
  id: string
  completedAt: string
  questions: MockInterviewQuestionRecord[]
  answers: MockInterviewAnswerDto[]
}

function formatViDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return iso
  }
}

export function CompletedMockInterviewSessionsList({
  sessions,
  emptyMessage = "Chưa có buổi phỏng vấn thử nào đã hoàn thành.",
}: {
  sessions: MockInterviewCompletedSessionDto[]
  emptyMessage?: string
}) {
  if (!sessions.length) {
    return (
      <p className="text-sm text-muted-foreground py-4">{emptyMessage}</p>
    )
  }

  return (
    <div className="space-y-6">
      {sessions.map((sess) => {
        const summaries = sess.answers.map(summarizeFeature8Evaluation)
        const avg = averageFeature8Scores(summaries)
        return (
          <Card
            key={sess.id}
            className="overflow-hidden rounded-2xl border-2 border-violet-500/25 bg-gradient-to-br from-violet-500/5 via-card to-sky-500/5 shadow-md"
          >
            <CardHeader className="border-b border-border/80 bg-muted/20">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Phiên phỏng vấn thử
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Hoàn thành: {formatViDate(sess.completedAt)}
                  </CardDescription>
                </div>
                {avg != null ? (
                  <Badge className="shrink-0 bg-violet-600/90 text-white">
                    Trung bình: {avg}/100
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              {summaries.map((sum, idx) => {
                const q = sess.questions[sum.questionIndex]
                const title = q?.text?.trim() || `Câu ${idx + 1}`
                return (
                  <div
                    key={`${sess.id}-${sum.questionIndex}`}
                    className="rounded-xl border border-border bg-card/80 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Câu {sum.questionIndex + 1}
                      </span>
                      {q ? (
                        <>
                          <span>·</span>
                          <span>{mockInterviewTypeLabelVi(q.type)}</span>
                          <span>·</span>
                          <span>{mockInterviewCategoryLabelVi(q.category)}</span>
                        </>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground leading-snug">
                      {title}
                    </p>
                    {sum.evaluateError ? (
                      <p className="mt-2 text-sm text-destructive">
                        Lỗi chấm: {sum.evaluateError}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {sum.overallScore != null ? (
                        <Badge variant="secondary">
                          Điểm: {sum.overallScore}/100
                        </Badge>
                      ) : null}
                      {sum.levelLabelVi ? (
                        <Badge variant="outline">{sum.levelLabelVi}</Badge>
                      ) : null}
                    </div>
                    {sum.summary ? (
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                        {sum.summary}
                      </p>
                    ) : null}
                    {sum.strengths.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                          Điểm mạnh
                        </p>
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground">
                          {sum.strengths.slice(0, 5).map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {sum.improvements.length > 0 ? (
                      <div className="mt-3">
                        <p className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-300">
                          Cần cải thiện
                        </p>
                        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-foreground">
                          {sum.improvements.slice(0, 5).map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <details className="mt-3 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs">
                      <summary className="cursor-pointer font-medium text-muted-foreground">
                        Transcript (ước lượng)
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                        {sess.answers.find(
                          (a) => a.questionIndex === sum.questionIndex,
                        )?.transcript ?? "—"}
                      </p>
                    </details>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
