import fs from "node:fs"
import path from "node:path"
import type { MockInterviewQuestionRecord } from "@/data/mock-interview-questions"
import { FALLBACK_MOCK_INTERVIEW_QUESTIONS } from "@/data/mock-interview-questions"

/** Một dòng CSV đơn giản (hỗ trợ field bọc ngoặc kép, dấu phẩy trong nội dung). */
function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (c === "," && !inQuotes) {
      out.push(cur.trim())
      cur = ""
    } else {
      cur += c
    }
  }
  out.push(cur.trim())
  return out
}

const CSV_RELATIVE = path.join("src", "HOEX_Interview_Questions_Dataset.csv")

let cache: MockInterviewQuestionRecord[] | null = null

/**
 * Đọc toàn bộ ngân hàng câu từ `src/HOEX_Interview_Questions_Dataset.csv` (chạy trên server).
 * Nếu không đọc được file → dùng bản fallback nhỏ.
 */
export function getInterviewQuestionBankFromCsv(): MockInterviewQuestionRecord[] {
  if (cache) return cache

  const csvPath = path.join(process.cwd(), CSV_RELATIVE)
  if (!fs.existsSync(csvPath)) {
    console.warn(
      `[mock-interview] Không thấy ${CSV_RELATIVE} — dùng câu fallback.`,
    )
    cache = FALLBACK_MOCK_INTERVIEW_QUESTIONS
    return cache
  }

  const raw = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "")
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0)
  if (lines.length < 2) {
    cache = FALLBACK_MOCK_INTERVIEW_QUESTIONS
    return cache
  }

  const header = parseCsvLine(lines[0]!)
  const col = (name: string) => header.indexOf(name)
  const iId = col("ID")
  const iText = col("Question Text")
  const iType = col("Type")
  const iCat = col("Category")
  const iDiff = col("Difficulty Level")
  const iCrit = col("Primary Criteria")

  if (
    iId < 0 ||
    iText < 0 ||
    iType < 0 ||
    iCat < 0 ||
    iDiff < 0 ||
    iCrit < 0
  ) {
    console.warn(
      "[mock-interview] Header CSV không đúng — dùng câu fallback.",
    )
    cache = FALLBACK_MOCK_INTERVIEW_QUESTIONS
    return cache
  }

  const rows: MockInterviewQuestionRecord[] = []
  for (let li = 1; li < lines.length; li++) {
    const cells = parseCsvLine(lines[li]!)
    if (!cells[iId]) continue
    rows.push({
      id: cells[iId]!,
      text: cells[iText]!,
      type: cells[iType]!,
      category: cells[iCat]!,
      difficulty: cells[iDiff]!,
      primaryCriteria: cells[iCrit]!,
    })
  }

  if (rows.length === 0) {
    cache = FALLBACK_MOCK_INTERVIEW_QUESTIONS
    return cache
  }

  cache = rows
  return cache
}
