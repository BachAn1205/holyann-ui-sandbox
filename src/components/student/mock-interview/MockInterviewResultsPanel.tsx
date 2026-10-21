"use client"

import { CheckCircle2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { MockInterviewQuestionRecord } from "@/data/mock-interview-questions"
import {
  mockInterviewDifficultyLabelVi,
  mockInterviewDifficultyTone,
} from "@/data/mock-interview-questions"
import type { StoredInterviewAnswer } from "@/actions/mock-interview"
import { cn } from "@/lib/utils"

function MockInterviewDifficultyBadge({ difficulty }: { difficulty: string }) {
  const tone = mockInterviewDifficultyTone(difficulty)
  const label = mockInterviewDifficultyLabelVi(difficulty)
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-tight",
        tone === "easy" &&
          "border-emerald-500/45 bg-emerald-500/12 text-emerald-900 dark:text-emerald-100",
        tone === "medium" &&
          "border-amber-500/45 bg-amber-500/12 text-amber-950 dark:text-amber-100",
        tone === "hard" &&
          "border-rose-500/45 bg-rose-500/12 text-rose-950 dark:text-rose-100",
        tone === "default" &&
          "border-border bg-muted text-muted-foreground",
      )}
    >
      Độ khó: {label}
    </span>
  )
}

const CRITERION_LABEL_VI: Record<string, string> = {
  C1_language: "Ngôn ngữ (C1)",
  C2_content: "Nội dung & ý tưởng (C2)",
  C3_authenticity: "Chân thực (C3)",
  C4_presentation: "Trình bày (C4)",
  C5_nonverbal: "Phi ngôn ngữ (C5)",
  C6_confidence: "Tự tin (C6)",
  C7_school_fit: "Phù hợp trường/ngành (C7)",
  C8_tough_questions: "Câu khó (C8)",
}

function pickOverallScores(evaluation: unknown) {
  if (!evaluation || typeof evaluation !== "object") return null
  const ev = evaluation as Record<string, unknown>
  const overall = ev.overall
  if (!overall || typeof overall !== "object") return null
  const o = overall as Record<string, unknown>
  return {
    total_score: typeof o.total_score === "number" ? o.total_score : null,
    level: typeof o.level === "string" ? o.level : null,
    level_label_vi:
      typeof o.level_label_vi === "string" ? o.level_label_vi : null,
  }
}

function pickFeedbackBlock(evaluation: unknown) {
  if (!evaluation || typeof evaluation !== "object") return null
  const f = (evaluation as Record<string, unknown>).feedback
  if (!f || typeof f !== "object") return null
  return f as Record<string, unknown>
}

function pickScoresBlock(evaluation: unknown) {
  if (!evaluation || typeof evaluation !== "object") return null
  const s = (evaluation as Record<string, unknown>).scores
  if (!s || typeof s !== "object") return null
  return s as Record<string, Record<string, unknown>>
}

function criterionRows(scores: Record<string, Record<string, unknown>> | null) {
  if (!scores) return []
  return Object.entries(scores).map(([code, row]) => {
    const total = row.total_score
    const level = row.level
    return {
      code,
      label: CRITERION_LABEL_VI[code] ?? code,
      total_score: typeof total === "number" ? total : null,
      level: typeof level === "string" ? level : null,
      available: row.is_available !== false,
    }
  })
}

export function MockInterviewResultsPanel({
  questions,
  answers,
  title = "Kết quả",
  description = "Mỗi câu: góp ý chi tiết (tiếng Việt), điểm theo tiêu chí, và gợi ý cải thiện / bước tiếp theo từ AI.",
}: {
  questions: MockInterviewQuestionRecord[]
  answers: StoredInterviewAnswer[]
  title?: string
  description?: string
}) {
  return (
    <Card className="rounded-2xl border-2 border-emerald-500/35 bg-gradient-to-br from-emerald-500/10 via-card to-violet-500/5 shadow-lg">
      <CardHeader className="border-b border-emerald-500/20 bg-gradient-to-r from-emerald-500/12 via-transparent to-violet-500/8">
        <CardTitle className="flex items-center gap-3 text-lg">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/35 to-teal-500/25 text-emerald-800 shadow-md dark:text-emerald-200">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
          </span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {answers.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Chưa có dữ liệu đánh giá cho phiên này.
          </p>
        ) : (
          answers.map((a) => {
            const ov = pickOverallScores(a.evaluation)
            const feedback = pickFeedbackBlock(a.evaluation)
            const scores = pickScoresBlock(a.evaluation)
            const rows = criterionRows(scores)
            const better =
              a.evaluation &&
              typeof a.evaluation === "object" &&
              (a.evaluation as Record<string, unknown>).better_version &&
              typeof (a.evaluation as Record<string, unknown>).better_version ===
                "object"
                ? ((a.evaluation as Record<string, unknown>)
                    .better_version as Record<string, unknown>)
                : null
            const nextSteps =
              a.evaluation &&
              typeof a.evaluation === "object" &&
              (a.evaluation as Record<string, unknown>).next_steps &&
              typeof (a.evaluation as Record<string, unknown>).next_steps ===
                "object"
                ? ((a.evaluation as Record<string, unknown>)
                    .next_steps as Record<string, unknown>)
                : null
            const strengths = Array.isArray(feedback?.strengths)
              ? feedback!.strengths.filter(
                  (x): x is Record<string, unknown> =>
                    x !== null && typeof x === "object",
                )
              : []
            const improvements = Array.isArray(feedback?.improvements)
              ? feedback!.improvements.filter(
                  (x): x is Record<string, unknown> =>
                    x !== null && typeof x === "object",
                )
              : []
            const immediate = Array.isArray(nextSteps?.immediate_actions)
              ? nextSteps!.immediate_actions.filter(
                  (x): x is Record<string, unknown> =>
                    x !== null && typeof x === "object",
                )
              : []
            const weekly = Array.isArray(nextSteps?.weekly_exercises)
              ? nextSteps!.weekly_exercises.filter(
                  (x): x is Record<string, unknown> =>
                    x !== null && typeof x === "object",
                )
              : []

            return (
              <div
                key={a.questionIndex}
                className="space-y-3 rounded-2xl border-2 border-violet-400/30 bg-gradient-to-br from-violet-500/8 via-card to-teal-500/5 p-4 shadow-md sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <span className="font-medium">
                      Câu {a.questionIndex + 1}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({a.questionId})
                      </span>
                    </span>
                    {questions[a.questionIndex] && (
                      <MockInterviewDifficultyBadge
                        difficulty={questions[a.questionIndex]!.difficulty}
                      />
                    )}
                  </div>
                  {ov?.total_score != null && (
                    <div className="text-right text-sm">
                      <div>
                        Điểm tổng:{" "}
                        <strong>{ov.total_score.toFixed(1)}</strong>/100
                      </div>
                      {(ov.level_label_vi || ov.level) && (
                        <div className="text-muted-foreground">
                          {ov.level_label_vi ?? ov.level}
                          {ov.level_label_vi && ov.level
                            ? ` (${ov.level})`
                            : ""}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {a.evaluate_error && (
                  <p className="text-destructive text-sm">
                    AI: {a.evaluate_error}
                  </p>
                )}
                <p className="text-muted-foreground text-sm">
                  Transcript (trình duyệt):{" "}
                  {a.transcript?.trim()
                    ? a.transcript
                    : "— trống — nhiều tiêu chí cần transcript để chấm đúng."}
                </p>
                {a.audio_url && (
                  <audio controls className="w-full max-w-md" src={a.audio_url}>
                    <track kind="captions" />
                  </audio>
                )}

                <Tabs defaultValue="feedback" className="w-full">
                  <TabsList className="mb-2 flex h-auto min-h-10 flex-wrap gap-1 bg-muted/80 p-1">
                    <TabsTrigger value="feedback">Góp ý</TabsTrigger>
                    <TabsTrigger value="scores">Điểm tiêu chí</TabsTrigger>
                    <TabsTrigger value="suggest">Gợi ý & bước tiếp</TabsTrigger>
                  </TabsList>
                  <TabsContent value="feedback" className="space-y-3 text-sm">
                    {typeof feedback?.summary === "string" && (
                      <p className="leading-relaxed">{feedback.summary}</p>
                    )}
                    {typeof feedback?.ao_impression === "string" && (
                      <p className="text-muted-foreground italic">
                        {feedback.ao_impression}
                      </p>
                    )}
                    {strengths.length > 0 && (
                      <div>
                        <p className="mb-1 font-medium text-emerald-700 dark:text-emerald-400">
                          Điểm mạnh
                        </p>
                        <ul className="list-inside list-disc space-y-1">
                          {strengths.map((s, i) => (
                            <li key={i}>
                              <span className="font-medium">
                                {typeof s.title === "string"
                                  ? s.title
                                  : "—"}
                              </span>
                              {typeof s.description === "string" &&
                                s.description !== s.title && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    — {s.description}
                                  </span>
                                )}
                              {typeof s.criteria_code === "string" && (
                                <span className="text-muted-foreground text-xs">
                                  {" "}
                                  (
                                  {CRITERION_LABEL_VI[s.criteria_code] ??
                                    s.criteria_code}
                                  )
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {improvements.length > 0 && (
                      <div>
                        <p className="mb-1 font-medium text-amber-800 dark:text-amber-200">
                          Cần cải thiện
                        </p>
                        <ul className="list-inside list-disc space-y-1">
                          {improvements.map((s, i) => (
                            <li key={i}>
                              <span className="font-medium">
                                {typeof s.title === "string"
                                  ? s.title
                                  : typeof s.description === "string"
                                    ? s.description
                                    : "—"}
                              </span>
                              {typeof s.description === "string" &&
                                typeof s.title === "string" &&
                                s.description !== s.title && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    — {s.description}
                                  </span>
                                )}
                              {typeof s.criteria_code === "string" && (
                                <span className="text-muted-foreground text-xs">
                                  {" "}
                                  (
                                  {CRITERION_LABEL_VI[s.criteria_code] ??
                                    s.criteria_code}
                                  )
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!feedback && (
                      <p className="text-muted-foreground">
                        Không có khối feedback trong phản hồi.
                      </p>
                    )}
                  </TabsContent>
                  <TabsContent value="scores">
                    {rows.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        Không có bảng điểm tiêu chí.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="py-2 pr-3 font-medium">Tiêu chí</th>
                              <th className="py-2 pr-3 font-medium">Điểm</th>
                              <th className="py-2 font-medium">Mức</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r) => (
                              <tr
                                key={r.code}
                                className="border-b border-border/60"
                              >
                                <td className="py-2 pr-3 align-top">
                                  {r.label}
                                  {!r.available && (
                                    <span className="text-muted-foreground text-xs">
                                      {" "}
                                      (N/A)
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 pr-3 align-top">
                                  {r.total_score != null
                                    ? r.total_score.toFixed(1)
                                    : "—"}
                                </td>
                                <td className="py-2 align-top text-muted-foreground">
                                  {r.level ?? "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="suggest" className="space-y-3 text-sm">
                    {better && (
                      <div className="rounded-md border bg-muted/30 p-3">
                        <p className="mb-1 font-medium">
                          Bản trả lời mẫu (tham khảo)
                        </p>
                        <p className="text-muted-foreground mb-2 text-xs">
                          Đoạn tiếng Anh bên dưới là gợi ý diễn đạt khi phỏng
                          vấn; phần chú thích và gợi ý khác là tiếng Việt.
                        </p>
                        {typeof better.note === "string" && (
                          <p className="text-muted-foreground mb-2 text-xs">
                            {better.note}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {typeof better.rewritten_response === "string"
                            ? better.rewritten_response
                            : "—"}
                        </p>
                        {Array.isArray(better.improvements_applied) &&
                          better.improvements_applied.length > 0 && (
                            <p className="text-muted-foreground mt-2 text-xs">
                              Đã áp dụng:{" "}
                              {better.improvements_applied
                                .filter((x): x is string => typeof x === "string")
                                .join(", ")}
                            </p>
                          )}
                      </div>
                    )}
                    {immediate.length > 0 && (
                      <div>
                        <p className="mb-1 font-medium">Hành động ngay</p>
                        <ul className="list-inside list-disc space-y-1">
                          {immediate.map((act, i) => (
                            <li key={i}>
                              {typeof act.action === "string"
                                ? act.action
                                : JSON.stringify(act)}
                              {typeof act.duration_minutes === "number" && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  (~{act.duration_minutes} phút)
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {weekly.length > 0 && (
                      <div>
                        <p className="mb-1 font-medium">Bài tập gợi ý</p>
                        <ul className="list-inside list-disc space-y-1">
                          {weekly.map((ex, i) => (
                            <li key={i}>
                              <span className="font-medium">
                                {typeof ex.exercise_name === "string"
                                  ? ex.exercise_name
                                  : "Bài tập"}
                              </span>
                              {typeof ex.description === "string" && (
                                <span> — {ex.description}</span>
                              )}
                              {typeof ex.frequency === "string" && (
                                <span className="text-muted-foreground text-xs">
                                  {" "}
                                  ({ex.frequency})
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!better &&
                      immediate.length === 0 &&
                      weekly.length === 0 && (
                        <p className="text-muted-foreground">
                          Không có gợi ý chi tiết trong phản hồi.
                        </p>
                      )}
                  </TabsContent>
                </Tabs>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
