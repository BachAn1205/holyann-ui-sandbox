'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { TaskStatus } from '@prisma/client'
import crypto from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'

const CUSTOM_TASK_LINK_MARKER = '__CUSTOM_TASK__'

function appendFeedbackEntry(existing: string | null, message: string | null, author: 'MENTOR' | 'STUDENT') {
  if (!message) return existing ?? null;
  const now = new Date();
  const stamp = now.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const label = author === 'MENTOR' ? 'Mentor' : 'Học viên';
  const entry = `[${stamp}] ${label}: ${message}`;
  return existing ? `${entry}\n${existing}` : entry;
}

// ==================== TYPES ====================

interface TaskWithProgress {
  id: string
  stage_id: number
  title: string
  description: string | null
  link_to: string | null
  is_required: boolean
  task_type: string | null
  order_index: number
  stage: {
    id: number
    name: string
    description: string | null
    order_index: number
  }
  progress?: {
    id: string
    status: TaskStatus
    submission_url: string | null
    mentor_note: string | null
    student_note: string | null
    deadline: Date | null
    completed_at: Date | null
    created_at: Date
    updated_at: Date
    reviewed_by_mentor_id: string | null
  }
}

export interface StudentChecklistResult {
  success: boolean
  data?: {
    studentInfo: {
      id: string
      full_name: string
      email: string
    }
    stages: Array<{
      id: number
      name: string
      description: string | null
      order_index: number
      tasks: TaskWithProgress[]
    }>
    flatTasks: TaskWithProgress[]
  }
  error?: string
}

export type MentorStudentChecklistData = NonNullable<StudentChecklistResult['data']>

interface UpdateTaskStatusResult {
  success: boolean
  data?: {
    id: string
    status: TaskStatus
    mentor_note: string | null
    updated_at: Date
  }
  error?: string
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function extractStageOrder(stageText: string | null | undefined) {
  if (!stageText) return null
  const match = stageText.match(/giai\s*doan\s*(\d+)/i)
  if (!match) return null
  const order = Number(match[1])
  return Number.isFinite(order) ? order : null
}

// ==================== SERVER ACTIONS ====================

/**
 * Lấy toàn bộ checklist tasks với progress của học viên
 * @param studentId - UUID của học viên
 * @returns StudentChecklistResult
 */
export async function getStudentChecklist(studentId: string): Promise<StudentChecklistResult> {
  try {
    // Validate input
    if (!studentId) {
      return {
        success: false,
        error: 'Student ID không hợp lệ'
      }
    }

    // 1. Lấy thông tin học viên
    const student = await prisma.students.findUnique({
      where: { user_id: studentId },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true
          }
        }
      }
    })

    if (!student) {
      return {
        success: false,
        error: 'Không tìm thấy học viên'
      }
    }

    // 2. Lấy tất cả tasks với stage info và progress của học viên
    const tasksWithProgress = await prisma.checklist_tasks.findMany({
      include: {
        checklist_stages: {
          select: {
            id: true,
            name: true,
            description: true,
            order_index: true
          }
        },
        student_task_progress: {
          where: {
            student_id: studentId
          },
          select: {
            id: true,
            status: true,
            submission_url: true,
            mentor_note: true,
            student_note: true,
            deadline: true,
            completed_at: true,
            created_at: true,
            updated_at: true,
            reviewed_by_mentor_id: true
          }
        }
      },
      orderBy: [
        { checklist_stages: { order_index: 'asc' } },
        { order_index: 'asc' }
      ]
    })

    const customTasks = await prisma.mentor_custom_deadlines.findMany({
      where: { student_id: studentId }
    })
    const customTaskIds = customTasks.map((t) => t.id)
    const customTaskIdSet = new Set(customTaskIds)
    const customProgressList = customTaskIds.length
      ? await prisma.student_task_progress.findMany({
          where: {
            student_id: studentId,
            task_id: { in: customTaskIds }
          },
          select: {
            id: true,
            task_id: true,
            status: true,
            submission_url: true,
            mentor_note: true,
            student_note: true,
            deadline: true,
            completed_at: true,
            created_at: true,
            updated_at: true,
            reviewed_by_mentor_id: true
          }
        })
      : []
    const customProgressByTaskId = new Map(customProgressList.map((p) => [p.task_id, p]))

    // 3. Transform data structure
    const flatTasks: TaskWithProgress[] = tasksWithProgress
      .filter(task => task.link_to !== CUSTOM_TASK_LINK_MARKER)
      .filter(task => !customTaskIdSet.has(task.id))
      .map(task => ({
      id: task.id,
      stage_id: task.stage_id,
      title: task.title,
      description: task.description,
      link_to: task.link_to,
      is_required: task.is_required,
      task_type: task.task_type,
      order_index: task.order_index,
      stage: task.checklist_stages,
      progress: task.student_task_progress[0] || undefined // First match (should be only one due to unique constraint)
    }))

    // Get stages directly from tasksWithProgress to match names/order
    const existingStages = Array.from(new Map(tasksWithProgress.map(t => [t.stage_id, t.checklist_stages])).values());
    const fallbackStage = existingStages[0] || { id: 1, name: 'Giai đoạn 1: Khởi động', description: null, order_index: 0 };

    const mappedCustomTasks: TaskWithProgress[] = customTasks.map((ct, idx) => {
      const customProgress = customProgressByTaskId.get(ct.id)
      const targetOrder = ct.stage_order ?? extractStageOrder(normalizeText(ct.stage));
      const normalizedCustomStage = normalizeText(ct.stage);
      const matchedStage =
        existingStages.find(s => targetOrder != null && s.order_index === targetOrder) ||
        existingStages.find(s => normalizeText(s.name) === normalizedCustomStage) ||
        fallbackStage;
      return {
        id: ct.id,
        stage_id: matchedStage.id,
        title: ct.title,
        description: ct.description,
        link_to: null,
        is_required: true,
        task_type: null,
        order_index: 9000 + idx, // put at the end of the stage
        stage: matchedStage,
        progress: {
          id: customProgress?.id ?? ct.id,
          status: customProgress?.status ?? ct.status,
          submission_url: customProgress?.submission_url ?? ct.submission_url ?? null,
          mentor_note: customProgress?.mentor_note ?? ct.mentor_note,
          student_note: customProgress?.student_note ?? ct.student_note,
          deadline: customProgress?.deadline ?? ct.deadline,
          completed_at: customProgress?.completed_at ?? (ct.status === 'COMPLETED' ? ct.updated_at : null),
          created_at: customProgress?.created_at ?? ct.created_at,
          updated_at: customProgress?.updated_at ?? ct.updated_at,
          reviewed_by_mentor_id: customProgress?.reviewed_by_mentor_id ?? ct.mentor_id
        }
      }
    })

    flatTasks.push(...mappedCustomTasks)

    // 4. Group by stages
    const stagesMap = new Map<number, {
      id: number
      name: string
      description: string | null
      order_index: number
      tasks: TaskWithProgress[]
    }>()

    flatTasks.forEach(task => {
      if (!stagesMap.has(task.stage_id)) {
        stagesMap.set(task.stage_id, {
          id: task.stage.id,
          name: task.stage.name,
          description: task.stage.description,
          order_index: task.stage.order_index,
          tasks: []
        })
      }
      stagesMap.get(task.stage_id)!.tasks.push(task)
    })

    const stages = Array.from(stagesMap.values()).sort((a, b) => a.order_index - b.order_index)

    return {
      success: true,
      data: {
        studentInfo: {
          id: student.users.id,
          full_name: student.users.full_name,
          email: student.users.email
        },
        stages,
        flatTasks
      }
    }

  } catch (error) {
    console.error('❌ Error getting student tiến đọ:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi hệ thống khi tải tiến đọ'
    }
  }
}

/**
 * Cập nhật trạng thái task của học viên (dành cho Cố vấn)
 * @param studentId - UUID của học viên
 * @param taskId - UUID của task
 * @param newStatus - Trạng thái mới
 * @param mentorNote - Ghi chú từ mentor (optional)
 * @returns UpdateTaskStatusResult
 */
export async function updateStudentTaskStatus(
  studentId: string,
  taskId: string,
  newStatus: TaskStatus,
  mentorNote?: string
): Promise<UpdateTaskStatusResult> {
  try {
    const session = await getServerSession(authOptions)
    const mentorId = session?.user?.id

    // Validate inputs
    if (!studentId) {
      return {
        success: false,
        error: 'Student ID không hợp lệ'
      }
    }

    if (!taskId) {
      return {
        success: false,
        error: 'Task ID không hợp lệ'
      }
    }

    if (!Object.values(TaskStatus).includes(newStatus)) {
      return {
        success: false,
        error: 'Trạng thái task không hợp lệ'
      }
    }

    // 1. Verify student exists
    const student = await prisma.students.findUnique({
      where: { user_id: studentId },
      select: { user_id: true }
    })

    if (!student) {
      return {
        success: false,
        error: 'Không tìm thấy học viên'
      }
    }

// 2. Verify task exists (could be in checklist_tasks or mentor_custom_deadlines)
    const task = await prisma.checklist_tasks.findUnique({
      where: { id: taskId },
      select: { id: true, title: true }
    })

    const customTask = !task ? await prisma.mentor_custom_deadlines.findUnique({
      where: { id: taskId },
      select: { id: true, title: true }
    }) : null

    if (!task && !customTask) {
      return {
        success: false,
        error: 'Không tìm thấy task'
      }
    }

    let updatedProgress: any;

    if (task) {
      const existingProgress = await prisma.student_task_progress.findUnique({
        where: {
          student_id_task_id: {
            student_id: studentId,
            task_id: taskId
          }
        },
        select: { mentor_note: true }
      });
      const nextMentorNote = appendFeedbackEntry(existingProgress?.mentor_note ?? null, mentorNote || null, 'MENTOR');

      updatedProgress = await prisma.student_task_progress.upsert({
        where: {
          student_id_task_id: {
            student_id: studentId,
            task_id: taskId
          }
        },
        create: {
          id: crypto.randomUUID(),
          student_id: studentId,
          task_id: taskId,
          status: newStatus,
          mentor_note: nextMentorNote,
          completed_at: newStatus === TaskStatus.COMPLETED ? new Date() : null,   
          created_at: new Date(),
          updated_at: new Date(),
          reviewed_by_mentor_id: mentorId || null
        },
        update: {
          status: newStatus,
          mentor_note: nextMentorNote,
          completed_at: newStatus === TaskStatus.COMPLETED ? new Date() : null,   
          updated_at: new Date(),
          reviewed_by_mentor_id: mentorId || null
        },
        select: {
          id: true,
          status: true,
          mentor_note: true,
          completed_at: true,
          updated_at: true
        }
      })

      const linkedCustomTask = await prisma.mentor_custom_deadlines.findUnique({
        where: { id: taskId },
        select: { id: true }
      })

      if (linkedCustomTask) {
        await prisma.mentor_custom_deadlines.update({
          where: { id: taskId },
          data: {
            status: newStatus,
            mentor_note: nextMentorNote,
            updated_at: new Date()
          }
        })
      }
    } else if (customTask) {
      // 3b. Update custom deadline record for custom tasks
      const existingCustom = await prisma.mentor_custom_deadlines.findUnique({
        where: { id: taskId },
        select: { mentor_note: true }
      });
      const nextMentorNoteCustom = appendFeedbackEntry(existingCustom?.mentor_note ?? null, mentorNote || null, 'MENTOR');

      const updatedCustom = await prisma.mentor_custom_deadlines.update({
        where: { id: taskId },
        data: {
          status: newStatus,
          mentor_note: nextMentorNoteCustom,
          updated_at: new Date()
        }
      })
      updatedProgress = {
        id: updatedCustom.id,
        status: updatedCustom.status,
        mentor_note: updatedCustom.mentor_note,
        completed_at: updatedCustom.status === 'COMPLETED' ? updatedCustom.updated_at : null,
        updated_at: updatedCustom.updated_at
      }
    }

    // 4. Revalidate relevant paths
    revalidatePath('/mentor/dashboard')
    revalidatePath('/mentor/students')
    revalidatePath(`/mentor/students/${studentId}`)
    revalidatePath('/student/checklist') // For student view if they're logged in

    return {
      success: true,
      data: {
        id: updatedProgress.id,
        status: updatedProgress.status,
        mentor_note: updatedProgress.mentor_note,
        updated_at: updatedProgress.updated_at
      }
    }

  } catch (error) {
    console.error('❌ Error updating task status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi hệ thống khi cập nhật trạng thái task'
    }
  }
}

/**
 * Lấy thống kê tiến độ của học viên (optional helper function)
 * @param studentId - UUID của học viên
 * @returns Progress statistics
 */
export async function getStudentProgressStats(studentId: string) {
  try {
    if (!studentId) {
      return {
        success: false,
        error: 'Student ID không hợp lệ'
      }
    }

    // Get total tasks and progress breakdown
    const [totalTasks, progressStats] = await Promise.all([
      prisma.checklist_tasks.count(),
      prisma.student_task_progress.groupBy({
        by: ['status'],
        where: { student_id: studentId },
        _count: { status: true }
      })
    ])

    // Calculate stats
    const statsByStatus = progressStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status
      return acc
    }, {} as Record<TaskStatus, number>)

    const completedTasks = statsByStatus[TaskStatus.COMPLETED] || 0
    const submittedTasks = statsByStatus[TaskStatus.SUBMITTED] || 0
    const inProgressTasks = statsByStatus[TaskStatus.IN_PROGRESS] || 0
    const needsRevisionTasks = statsByStatus[TaskStatus.NEEDS_REVISION] || 0
    const pendingTasks = totalTasks - (completedTasks + submittedTasks + inProgressTasks + needsRevisionTasks)

    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      success: true,
      data: {
        totalTasks,
        completedTasks,
        submittedTasks,
        inProgressTasks,
        needsRevisionTasks,
        pendingTasks,
        completionPercentage
      }
    }

  } catch (error) {
    console.error('❌ Error getting progress stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi hệ thống khi tải thống kê tiến độ'
    }
  }
}

/**
 * Cập nhật deadline cho task của học viên (dành cho Cố vấn)
 * @param studentId - UUID của học viên
 * @param taskId - UUID của task
 * @param deadline - Ngày deadline mới (null để xóa deadline)
 * @returns UpdateTaskDeadlineResult
 */
export async function updateTaskDeadline(
  studentId: string,
  taskId: string,
  deadline: Date | null
): Promise<{ success: boolean; data?: { deadline: Date | null }; error?: string }> {
  try {
    // Validate inputs
    if (!studentId) {
      return {
        success: false,
        error: 'Student ID không hợp lệ'
      }
    }

    if (!taskId) {
      return {
        success: false,
        error: 'Task ID không hợp lệ'
      }
    }

    // 1. Verify student exists
    const student = await prisma.students.findUnique({
      where: { user_id: studentId },
      select: { user_id: true }
    })

    if (!student) {
      return {
        success: false,
        error: 'Không tìm thấy học viên'
      }
    }

    // 2. Verify task exists
    const task = await prisma.checklist_tasks.findUnique({
      where: { id: taskId },
      select: { id: true }
    })

    if (!task) {
      return {
        success: false,
        error: 'Không tìm thấy task'
      }
    }

    // 3. Upsert student task progress with deadline
    const updatedProgress = await prisma.student_task_progress.upsert({
      where: {
        student_id_task_id: {
          student_id: studentId,
          task_id: taskId
        }
      },
      create: {
        id: crypto.randomUUID(),
        student_id: studentId,
        task_id: taskId,
        status: 'PENDING',
        deadline: deadline,
        created_at: new Date(),
        updated_at: new Date()
      },
      update: {
        deadline: deadline,
        updated_at: new Date()
      },
      select: {
        deadline: true
      }
    })

    const linkedCustomTask = await prisma.mentor_custom_deadlines.findUnique({
      where: { id: taskId },
      select: { id: true }
    })

    if (linkedCustomTask) {
      await prisma.mentor_custom_deadlines.update({
        where: { id: taskId },
        data: {
          deadline,
          updated_at: new Date()
        }
      })
    }

    // 4. Revalidate relevant paths
    revalidatePath('/mentor/dashboard')
    revalidatePath('/mentor/students')
    revalidatePath(`/mentor/students?studentId=${studentId}`)
    revalidatePath('/student/checklist')

    return {
      success: true,
      data: {
        deadline: updatedProgress.deadline
      }
    }

  } catch (error) {
    console.error('❌ Error updating task deadline:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi hệ thống khi cập nhật deadline'
    }
  }
}
