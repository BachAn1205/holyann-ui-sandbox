'use server';

import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';
import crypto from 'crypto';
import { requireStudentAuth } from '@/lib/auth-utils';

/**
 * Lấy checklist data cho student từ database
 * Trả về stages, tasks, và progress của student
 */
export async function getStudentChecklistData(_studentId?: string) {
  try {
    const user = await requireStudentAuth();

    // 1. Lấy tất cả stages
    const stages = await prisma.checklist_stages.findMany({
      orderBy: { order_index: 'asc' },
    });

    // 2. Lấy tất cả tasks
    const tasks = await prisma.checklist_tasks.findMany({
      orderBy: [
        { stage_id: 'asc' },
        { order_index: 'asc' },
      ],
      include: {
        checklist_stages: true,
      },
    });

    // 3. Lấy progress của student (nếu có)
    const progressRecords = await prisma.student_task_progress.findMany({
      where: { student_id: user.id },
      include: {
        checklist_tasks: true,
      },
    });

    // 4. Tạo map để dễ lookup progress
    const progressMap = new Map(
      progressRecords.map((p) => [p.task_id || p.id, p])
    );

    // 5. Format stages để match với interface
    const formattedStages = stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      description: stage.description || '',
      isUnlocked: true,
    }));

    // 6. Format tasks với progress
    const formattedTasks = tasks.map((task) => {
      const progress = progressMap.get(task.id);

      return {
        id: task.id,
        stageId: task.stage_id,
        title: task.title,
        description: task.description || '',
        deadline: '',
        isCompleted: progress ? progress.status === TaskStatus.COMPLETED : false,
        category: task.checklist_stages.name,
        linkTo: task.link_to || undefined,
        requiresFile: false,
        progress: progress
          ? {
              status: progress.status,
              submission_url: progress.submission_url || undefined,
              mentor_note: progress.mentor_note || undefined,
              completed_at: progress.completed_at || undefined,
              created_at: progress.created_at,
              updated_at: progress.updated_at,
            }
          : undefined,
        status: progress?.status || TaskStatus.PENDING,
        mentorNote: progress?.mentor_note || undefined,
        completedAt: progress?.completed_at || undefined,
      };
    });

    // 7. Tính toán stats
    const stats = {
      totalTasks: tasks.length,
      completedTasks: progressRecords.filter((p) => p.status === TaskStatus.COMPLETED).length,
      inProgressTasks: progressRecords.filter((p) => p.status === TaskStatus.IN_PROGRESS).length,
      pendingTasks: tasks.length - progressRecords.length,
    };

    return {
      success: true,
      data: {
        stages: formattedStages,
        tasks: formattedTasks,
        stats,
      },
    };
  } catch (error) {
    console.error('❌ Error fetching tiến đọ data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    };
  }
}

/**
 * Cập nhật trạng thái của task
 */
export async function updateStudentTaskStatus(
  _studentId: string,
  taskId: string,
  status: TaskStatus
) {
  try {
    const user = await requireStudentAuth();

    const existing = await prisma.student_task_progress.findUnique({
      where: {
        student_id_task_id: {
          student_id: user.id,
          task_id: taskId,
        },
      },
    });

    if (existing) {
      await prisma.student_task_progress.update({
        where: { id: existing.id },
        data: {
          status,
          completed_at: status === TaskStatus.COMPLETED ? new Date() : null,
          updated_at: new Date(),
        },
      });
    } else {
      await prisma.student_task_progress.create({
        data: {
          id: crypto.randomUUID(),
          student_id: user.id,
          task_id: taskId,
          status,
          completed_at: status === TaskStatus.COMPLETED ? new Date() : null,
        },
      });
    }

    return {
      success: true,
      message: 'Cập nhật trạng thái thành công',
    };
  } catch (error) {
    console.error('❌ Error updating task status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
