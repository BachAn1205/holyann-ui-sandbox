/** Kiểu một dòng trong HOEX_Interview_Questions_Dataset.csv */

export type MockInterviewQuestionRecord = {
  id: string
  text: string
  type: string
  category: string
  difficulty: string
  primaryCriteria: string
}

/** Dùng khi không đọc được CSV (môi trường thiếu file / header sai). */
export const FALLBACK_MOCK_INTERVIEW_QUESTIONS: MockInterviewQuestionRecord[] =
  [
    {
      id: "SF01",
      text: "What inspired you to apply to this university specifically, beyond its academic programs?",
      type: "motivational",
      category: "school_fit",
      difficulty: "Medium",
      primaryCriteria: "C7_School Fit",
    },
    {
      id: "RF01",
      text: "How do you define success for yourself?",
      type: "intellectual",
      category: "reflection",
      difficulty: "Medium",
      primaryCriteria: "C3_Personal Thinking",
    },
    {
      id: "RF03_FB",
      text: "If you could ask our admissions committee one question, what would it be and why?",
      type: "creative",
      category: "reflection",
      difficulty: "Hard",
      primaryCriteria: "C3_Personal Thinking",
    },
    {
      id: "SI02",
      text: "Can you describe a specific moment when you felt proud of yourself?",
      type: "behavioral",
      category: "self_introduction",
      difficulty: "Easy",
      primaryCriteria: "C3_Personal Thinking",
    },
  ]

function hashToUint(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function createSeededRandom(seed: string): () => number {
  let state = hashToUint(seed) || 0x9e3779b9
  return () => {
    state += 0x6d2b79f5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const shuffled = [...items]
  const rand = createSeededRandom(seed)
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = shuffled[i]!
    shuffled[i] = shuffled[j]!
    shuffled[j] = tmp
  }
  return shuffled
}

type DiffBucket = "easy" | "medium" | "hard"

function bucketFor(q: MockInterviewQuestionRecord): DiffBucket | null {
  const x = q.difficulty.trim().toLowerCase()
  if (x === "easy") return "easy"
  if (x === "medium") return "medium"
  if (x === "hard") return "hard"
  return null
}

/** Nhãn tiếng Việt cho độ khó (CSV: Easy / Medium / Hard). */
export function mockInterviewDifficultyLabelVi(diff: string): string {
  const x = diff.trim().toLowerCase()
  if (x === "easy") return "Dễ"
  if (x === "medium") return "Trung bình"
  if (x === "hard") return "Khó"
  return diff.trim() || "—"
}

export type MockInterviewDifficultyTone = "easy" | "medium" | "hard" | "default"

export function mockInterviewDifficultyTone(
  diff: string,
): MockInterviewDifficultyTone {
  const x = diff.trim().toLowerCase()
  if (x === "easy") return "easy"
  if (x === "medium") return "medium"
  if (x === "hard") return "hard"
  return "default"
}

function normalizeInterviewMetaKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s-]+/g, "_")
}

/** Cột Type trong HOEX_Interview_Questions_Dataset.csv → nhãn UI tiếng Việt. */
const MOCK_INTERVIEW_TYPE_VI: Record<string, string> = {
  behavioral: "Hành vi",
  creative: "Sáng tạo",
  factual: "Kiến thức",
  intellectual: "Tư duy",
  motivational: "Động lực",
  personal: "Cá nhân",
  pressure: "Áp lực",
  situational: "Tình huống",
}

/** Cột Category trong CSV → nhãn UI tiếng Việt. */
const MOCK_INTERVIEW_CATEGORY_VI: Record<string, string> = {
  academic_interests: "Sở thích học thuật",
  career_goals: "Định hướng nghề nghiệp",
  challenge_failure: "Thử thách & thất bại",
  current_events: "Thời sự",
  ethical_dilemma: "Tình huống đạo đức",
  extracurriculars: "Hoạt động ngoại khóa",
  leadership: "Lãnh đạo",
  reflection: "Suy ngẫm",
  school_fit: "Phù hợp trường",
  self_introduction: "Giới thiệu bản thân",
}

export function mockInterviewTypeLabelVi(type: string): string {
  const k = normalizeInterviewMetaKey(type)
  const vi = MOCK_INTERVIEW_TYPE_VI[k]
  if (vi) return vi
  const t = type.trim()
  return t ? t.replace(/_/g, " ") : "—"
}

export function mockInterviewCategoryLabelVi(category: string): string {
  const k = normalizeInterviewMetaKey(category)
  const vi = MOCK_INTERVIEW_CATEGORY_VI[k]
  if (vi) return vi
  const t = category.trim()
  return t ? t.replace(/_/g, " ") : "—"
}

/**
 * Chọn `count` câu: mỗi phiên khác nhau theo `seed`.
 * Với count=7: câu 1-3 Easy, 4-5 Medium, 6-7 Hard.
 * Trong từng mức, câu hỏi được seeded shuffle để phiên mới đổi câu nhưng vẫn giữ pattern độ khó.
 * Nếu thiếu mức: ưu tiên lấy đủ các mức còn lại rồi bổ sung ngẫu nhiên.
 */
const SEVEN_QUESTION_DIFFICULTY_PATTERN: DiffBucket[] = [
  "easy",
  "easy",
  "easy",
  "medium",
  "medium",
  "hard",
  "hard",
]

export function pickMockInterviewQuestions(
  bank: MockInterviewQuestionRecord[],
  seed: string,
  count: number,
): MockInterviewQuestionRecord[] {
  if (bank.length === 0) return []
  const n = Math.min(count, bank.length)

  const rawBuckets: Record<DiffBucket, MockInterviewQuestionRecord[]> = {
    easy: [],
    medium: [],
    hard: [],
  }
  for (const q of bank) {
    const b = bucketFor(q)
    if (b) rawBuckets[b].push(q)
  }

  const buckets: Record<DiffBucket, MockInterviewQuestionRecord[]> = {
    easy: seededShuffle(rawBuckets.easy, `${seed}:easy`),
    medium: seededShuffle(rawBuckets.medium, `${seed}:medium`),
    hard: seededShuffle(rawBuckets.hard, `${seed}:hard`),
  }
  const bucketCursor: Record<DiffBucket, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
  }

  const picked: MockInterviewQuestionRecord[] = []
  const used = new Set<string>()

  const pickFromBucket = (diff: DiffBucket) => {
    const pool = buckets[diff]
    while (bucketCursor[diff] < pool.length && used.has(pool[bucketCursor[diff]]!.id)) {
      bucketCursor[diff] += 1
    }
    const q = pool[bucketCursor[diff]]
    if (!q) return false
    bucketCursor[diff] += 1
    picked.push(q)
    used.add(q.id)
    return true
  }

  const pattern =
    n === 7
      ? SEVEN_QUESTION_DIFFICULTY_PATTERN
      : SEVEN_QUESTION_DIFFICULTY_PATTERN.slice(0, n)

  for (const diff of pattern) {
    if (picked.length >= n) break
    pickFromBucket(diff)
  }

  if (picked.length < n) {
    for (const diff of ["easy", "medium", "hard"] as const) {
      while (picked.length < n && pickFromBucket(diff)) {
        /* keep filling this bucket */
      }
    }
  }

  const rest = seededShuffle(
    bank.filter((q) => !used.has(q.id)),
    `${seed}:rest`,
  )
  let salt = 0
  while (picked.length < n && rest.length > 0) {
    const j = hashToUint(`${seed}:fill:${salt++}`) % rest.length
    const q = rest[j]!
    picked.push(q)
    used.add(q.id)
    rest.splice(j, 1)
  }

  return picked.slice(0, n)
}
