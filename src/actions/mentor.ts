'use server'

import { prisma } from '@/lib/prisma'
import type { AssignedStudent } from '@/types/mentor'
import { TaskStatus } from '@prisma/client'

/**
 * Lấy danh sách học viên được gán cho Cố vấn với tính toán progress chính xác
 */
export async function getMentorStudents(mentorId: string): Promise<AssignedStudent[]> {
  try {
    // 1. Lấy tổng số lượng task trong hệ thống
    const totalTasks = await prisma.checklist_tasks.count();

    // 2. Lấy danh sách assignments với thông tin học viên và checklist progress
    const assignments = await prisma.mentor_assignments.findMany({
      where: {
        mentor_id: mentorId,
        status: 'ACTIVE',
      },
      include: {
        students: {
          include: {
            users: {
              select: {
                full_name: true,
                email: true,
                avatar_url: true,
                phone_number: true,
              },
            },
            // Chỉ tính task COMPLETED là hoàn thành (SUBMITTED = chờ/đang review, không tính hoàn thành)
            student_task_progress: {
              where: {
                status: {
                  in: [TaskStatus.COMPLETED]
                }
              }
            }
          },
        },
      },
      orderBy: {
        assigned_at: 'desc',
      },
    });

    // 3. Transform data và tính toán progress
    const students: AssignedStudent[] = assignments.map((assignment) => {
      // Safety check just in case
      if (!assignment.students?.users) {
        console.warn(`[getMentorStudents] Assignment ${assignment.id} has missing student/user data`);
        return null;
      }

      const completedCount = assignment.students.student_task_progress?.length || 0;
      const progressPercent = totalTasks > 0
        ? Math.round((completedCount / totalTasks) * 100)
        : 0;

      return {
        student_id: assignment.student_id,
        assignment_id: assignment.id,
        type: assignment.type,
        status: assignment.status,
        student: {
          full_name: assignment.students.users.full_name || 'Unknown',
          email: assignment.students.users.email,
          avatar_url: assignment.students.users.avatar_url,
          phone_number: assignment.students.users.phone_number,
        },
        progress: progressPercent,
      };
    }).filter((s): s is AssignedStudent => s !== null);

    return students;
  } catch (error) {
    console.error('Error fetching mentor students:', error);
    // Return empty array to prevent dashboard crash
    return [];
  }
}

/**
 * Lấy thống kê dashboard cho Cố vấn
 */
export async function getMentorDashboardStats(mentorId: string) {
  try {
    // Đếm tổng số học viên active
    const totalActiveStudents = await prisma.mentor_assignments.count({
      where: {
        mentor_id: mentorId,
        status: 'ACTIVE',
      },
    });

    // Lấy rating của mentor từ database
    const mentor = await prisma.mentors.findUnique({
      where: { user_id: mentorId },
      select: { rating: true },
    });

    // Mock data for weekly deadlines - có thể implement sau với task system
    const weeklyDeadlines = 0; // TODO: Tính toán deadline từ student_task_progress

    return {
      totalActiveStudents,
      weeklyDeadlines,
      averageRating: mentor?.rating || 5.0,
    };
  } catch (error) {
    console.error('Error fetching mentor dashboard stats:', error);
    // Return safe default values
    return {
      totalActiveStudents: 0,
      weeklyDeadlines: 0,
      averageRating: 5.0
    };
  }
}
