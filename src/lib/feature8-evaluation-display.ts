export type Feature8AnswerSummary = {
  questionIndex: number
  questionId: string
  overallScore: number | null
  levelLabelVi: string | null
  summary: string | null
  strengths: string[]
  improvements: string[]
  evaluateError: string | null
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null
  return v as Record<string, unknown>
}

/** Rút gọn payload đánh giá Feature 8 (FastAPI) cho UI báo cáo / mentor. */
export function summarizeFeature8Evaluation(answer: {
  questionIndex: number
  questionId: string
  evaluation: unknown | null
  evaluate_error?: string | null
}): Feature8AnswerSummary {
  const ev = answer.evaluation
  const rec = asRecord(ev)
  const overall = rec ? asRecord(rec.overall) : null
  const overallScore =
    overall && typeof overall.total_score === "number"
      ? overall.total_score
      : null
  const levelLabelVi =
    overall && typeof overall.level_label_vi === "string"
      ? overall.level_label_vi
      : null

  const feedback = rec ? asRecord(rec.feedback) : null
  const summary =
    feedback && typeof feedback.summary === "string"
      ? feedback.summary
      : null

  const strengths: string[] = []
  const improvements: string[] = []

  const st = feedback?.strengths
  if (Array.isArray(st)) {
    for (const x of st) {
      const o = asRecord(x)
      const t =
        o && typeof o.title === "string"
          ? o.title
          : o && typeof o.description === "string"
            ? o.description
            : null
      if (t?.trim()) strengths.push(t.trim())
    }
  }

  const im = feedback?.improvements
  if (Array.isArray(im)) {
    for (const x of im) {
      const o = asRecord(x)
      const t =
        o && typeof o.title === "string"
          ? o.title
          : o && typeof o.description === "string"
            ? o.description
            : null
      if (t?.trim()) improvements.push(t.trim())
    }
  }

  return {
    questionIndex: answer.questionIndex,
    questionId: answer.questionId,
    overallScore,
    levelLabelVi,
    summary,
    strengths,
    improvements,
    evaluateError:
      typeof answer.evaluate_error === "string"
        ? answer.evaluate_error
        : answer.evaluate_error
          ? String(answer.evaluate_error)
          : null,
  }
}

export function averageFeature8Scores(
  summaries: Feature8AnswerSummary[],
): number | null {
  const nums = summaries
    .map((s) => s.overallScore)
    .filter((n): n is number => typeof n === "number" && !Number.isNaN(n))
  if (!nums.length) return null
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10
}
