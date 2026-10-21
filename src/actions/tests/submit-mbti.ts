'use server'

import { prisma } from '@/lib/prisma'
import { TestStatus } from '@prisma/client'
import { autoCompleteChecklistTask } from '@/lib/checklist-helper'
import { revalidatePath } from 'next/cache'

/**
 * Server Action: Submit MBTI Test
 */
export async function submitMbtiAction(
  studentId: string,
  testId: string,
  answers: any,
  results: any
) {
  try {
    // 1. Update Test Data
    const updatedTest = await prisma.mbti_tests.update({
      where: { id: testId },
      data: {
        answers,
        status: TestStatus.COMPLETED,
        completed_at: new Date(),
        updated_at: new Date(),
        result_type: results.type,
        score_e: results.scores?.['E/I']?.E ?? null,
        score_i: results.scores?.['E/I']?.I ?? null,
        score_s: results.scores?.['S/N']?.S ?? null,
        score_n: results.scores?.['S/N']?.N ?? null,
        score_t: results.scores?.['T/F']?.T ?? null,
        score_f: results.scores?.['T/F']?.F ?? null,
        score_j: results.scores?.['J/P']?.J ?? null,
        score_p: results.scores?.['J/P']?.P ?? null,
      }
    })

    // 2. Auto Complete Tiến độ Task
    // Tìm task có link chứa 'mbti' và đánh dấu hoàn thành
    await autoCompleteChecklistTask(studentId, 'mbti')

    // 3. Mark student assessments as completed (if all needed)
    // Logic này có thể tùy chỉnh kỹ hơn nếu cần check cả 3 bài
    await prisma.students.update({
      where: { user_id: studentId },
      data: { assessments_completed: true }
    })

    revalidatePath('/student/tests')

    return { success: true, data: updatedTest }
  } catch (error: unknown) {
    console.error('Submit MBTI Action Fail:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
