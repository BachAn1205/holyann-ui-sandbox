import type { MockInterviewQuestionRecord } from "@/data/mock-interview-questions"

function primaryCriteriaCodes(raw: string): string[] {
  const m = raw.match(/C\d+/g)
  if (m?.length) return [...new Set(m)]
  return ["C3"]
}

function difficultyLower(d: string): string {
  const x = d.toLowerCase()
  if (x === "easy" || x === "medium" || x === "hard") return x
  if (d === "Easy") return "easy"
  if (d === "Medium") return "medium"
  if (d === "Hard") return "hard"
  return "medium"
}

export type Feature8StudentProfile = Record<string, unknown>

export function buildFeature8StudentProfile(args: {
  userId: string
  fullName: string
  gradeLabel: string | null
  targetMajor: string | null
  targetUniversity: string | null
  englishCertificates: unknown
}): Feature8StudentProfile {
  let grade = 12
  if (args.gradeLabel) {
    const n = parseInt(args.gradeLabel.replace(/\D/g, ""), 10)
    if (!Number.isNaN(n) && n > 0) grade = n
  }

  let ielts: number | null = null
  let toefl: number | null = null
  if (args.englishCertificates && typeof args.englishCertificates === "object") {
    const ec = args.englishCertificates as Record<string, unknown>
    const i = ec.ielts
    const t = ec.toefl
    if (typeof i === "number") ielts = i
    if (typeof t === "number") toefl = t
  }

  return {
    student_id: args.userId,
    name: args.fullName,
    grade,
    target_major: args.targetMajor ?? "Undecided",
    intended_degree: "undergraduate",
    english_background: {
      ielts_score: ielts,
      toefl_score: toefl,
      self_assessment: "unknown",
      schooling_language: "unknown",
    },
    previous_score: null,
    weak_criteria: [],
  }
}

export function buildFeature8EvaluatePayload(args: {
  sessionId: string
  userId: string
  studentProfile: Feature8StudentProfile
  targetSchool: string
  targetCountry: string
  question: MockInterviewQuestionRecord
  questionIndex: number
  totalQuestions: number
  transcript: string
  durationSeconds: number
}): Record<string, unknown> {
  const transcript =
    args.transcript.trim() ||
    "[Audio recorded; transcript not available from browser.]"

  const words = transcript.trim().match(/\S+/g) ?? []
  const wordCount = words.length

  return {
    session_context: {
      session_id: args.sessionId,
      session_type: "mock_web_multi",
      target_school: args.targetSchool,
      target_country: args.targetCountry,
      interview_format: "audio",
      question_index: args.questionIndex + 1,
      total_questions: args.totalQuestions,
      timestamp: new Date().toISOString(),
      session_number: 1,
    },
    student_profile: args.studentProfile,
    question_context: {
      question_id: args.question.id,
      question_text: args.question.text,
      question_type: args.question.type,
      question_category: args.question.category,
      expected_duration_sec: 120,
      difficulty_level: difficultyLower(args.question.difficulty),
      primary_criteria: primaryCriteriaCodes(args.question.primaryCriteria),
      good_answer_example: "",
      red_flags: [],
    },
    response_content: {
      transcript,
      duration_seconds: args.durationSeconds,
      word_count: wordCount,
      audio_features: {},
      video_features: {},
    },
    evaluation_config: {
      rubric_version: "1.0.0",
      feedback_language: "vi",
      feedback_depth: "detailed",
      include_better_version: true,
      criteria_override_weights: null,
      has_video: false,
      strict_mode: false,
    },
  }
}
