'use server'

import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { TaskStatus } from '@prisma/client'

/**
 * Hàm xử lý khi người dùng Tick/Untick vào checkbox
 * - Nếu Tick: Đánh dấu là COMPLETED (hoặc SUBMITTED tùy logic)
 * - Nếu Untick: Quay về PENDING
 */
export async function toggleTaskCompletion(
    studentId: string,
    taskId: string,
    isCompleted: boolean
) {
    try {
        // 1. Xác định trạng thái mới dựa trên hành động tick/untick
        // Lưu ý: Nếu muốn quy trình chặt chẽ (Mentor duyệt mới xong), bạn có thể đổi 'COMPLETED' thành 'SUBMITTED'
        const newStatus: TaskStatus = isCompleted ? 'COMPLETED' : 'PENDING'
        const completedAt = isCompleted ? new Date() : null

        // 2. Dùng upsert để xử lý cả trường hợp chưa có record hoặc đã có
        await prisma.student_task_progress.upsert({
            where: {
                student_id_task_id: {
                    student_id: studentId,
                    task_id: taskId,
                },
            },
            update: {
                status: newStatus,
                completed_at: completedAt,
                updated_at: new Date(),
            },
            create: {
                id: randomUUID(),
                student_id: studentId,
                task_id: taskId,
                status: newStatus,
                completed_at: completedAt,
            },
        })

        // 3. Revalidate path để UI cập nhật ngay lập tức mà không cần F5
        revalidatePath('/checklist')

        return { success: true }
    } catch (error) {
        console.error('Failed to toggle task:', error)
        return { success: false, error: 'Failed to update task status' }
    }
}

/**
 * Hàm xử lý khi người dùng Upload file minh chứng (CV, Bảng điểm...)
 * - Tự động lưu URL file vào DB
 * - Chuyển trạng thái sang SUBMITTED (Đã nộp, chờ duyệt)
 */
export async function submitTaskWithFile(
    studentId: string,
    taskId: string,
    fileUrl: string
) {
    try {
        await prisma.student_task_progress.upsert({
            where: {
                student_id_task_id: {
                    student_id: studentId,
                    task_id: taskId,
                },
            },
            update: {
                status: 'SUBMITTED', // Chuyển sang đã nộp
                submission_url: fileUrl, // Lưu link file
                completed_at: new Date(), // Ghi nhận thời điểm nộp
                updated_at: new Date(),
            },
            create: {
                id: randomUUID(),
                student_id: studentId,
                task_id: taskId,
                status: 'SUBMITTED',
                submission_url: fileUrl,
                completed_at: new Date(),
            },
        })

        revalidatePath('/checklist')
        return { success: true }
    } catch (error) {
        console.error('Submit Task Error:', error)
        return { success: false, error: 'Failed to submit task with file' }
    }
}