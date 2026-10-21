'use server';

import { prisma } from '@/lib/prisma';
import { MentorType, RoomType } from '@prisma/client';
import { requireAdminAuth } from '@/lib/auth-utils';

interface AssignMentorsInput {
  studentId: string;
  mentorASId: string;
  mentorACSId: string;
  mentorARDId: string;
  createdBy: string;
}

export async function assignMentorsToStudent(input: AssignMentorsInput) {
  try {
    const admin = await requireAdminAuth();
    const { studentId, mentorASId, mentorACSId, mentorARDId, createdBy } = input;

    if (admin.id !== createdBy) {
      throw new Error('FORBIDDEN');
    }

    const [student, mentorAS, mentorACS, mentorARD, creator] = await Promise.all([
      prisma.users.findUnique({ where: { id: studentId }, select: { id: true, full_name: true, role: true } }),
      prisma.users.findUnique({ where: { id: mentorASId }, select: { id: true, role: true } }),
      prisma.users.findUnique({ where: { id: mentorACSId }, select: { id: true, role: true } }),
      prisma.users.findUnique({ where: { id: mentorARDId }, select: { id: true, role: true } }),
      prisma.users.findUnique({ where: { id: createdBy }, select: { id: true, role: true } }),
    ]);

    if (!student || !mentorAS || !mentorACS || !mentorARD || !creator) {
      throw new Error('Một hoặc nhiều user không tồn tại');
    }

    if (student.role !== 'STUDENT') {
      throw new Error('User được chọn không phải là học viên');
    }

    if (mentorAS.role !== 'MENTOR' || mentorACS.role !== 'MENTOR' || mentorARD.role !== 'MENTOR') {
      throw new Error('Một hoặc nhiều user được chọn không phải là mentor');
    }

    const result = await prisma.$transaction(async (tx) => {
      const assignmentAS = await tx.mentor_assignments.create({
        data: {
          id: crypto.randomUUID(),
          student_id: studentId,
          mentor_id: mentorASId,
          type: MentorType.AS,
          status: 'ACTIVE',
        },
      });

      const assignmentACS = await tx.mentor_assignments.create({
        data: {
          id: crypto.randomUUID(),
          student_id: studentId,
          mentor_id: mentorACSId,
          type: MentorType.ACS,
          status: 'ACTIVE',
        },
      });

      const assignmentARD = await tx.mentor_assignments.create({
        data: {
          id: crypto.randomUUID(),
          student_id: studentId,
          mentor_id: mentorARDId,
          type: MentorType.ARD,
          status: 'ACTIVE',
        },
      });

      const roomAS = await tx.chat_rooms.create({
        data: {
          id: crypto.randomUUID(),
          name: `${student.full_name} - Mentor AS`,
          type: RoomType.PRIVATE,
          student_id: studentId,
          mentor_type: MentorType.AS,
          chat_participants: {
            create: [
              { id: crypto.randomUUID(), user_id: studentId },
              { id: crypto.randomUUID(), user_id: mentorASId },
            ],
          },
        },
      });

      const roomACS = await tx.chat_rooms.create({
        data: {
          id: crypto.randomUUID(),
          name: `${student.full_name} - Mentor ACS`,
          type: RoomType.PRIVATE,
          student_id: studentId,
          mentor_type: MentorType.ACS,
          chat_participants: {
            create: [
              { id: crypto.randomUUID(), user_id: studentId },
              { id: crypto.randomUUID(), user_id: mentorACSId },
            ],
          },
        },
      });

      const roomARD = await tx.chat_rooms.create({
        data: {
          id: crypto.randomUUID(),
          name: `${student.full_name} - Mentor ARD`,
          type: RoomType.PRIVATE,
          student_id: studentId,
          mentor_type: MentorType.ARD,
          chat_participants: {
            create: [
              { id: crypto.randomUUID(), user_id: studentId },
              { id: crypto.randomUUID(), user_id: mentorARDId },
            ],
          },
        },
      });

      const groupRoom = await tx.chat_rooms.create({
        data: {
          id: crypto.randomUUID(),
          name: `Nhóm mentor - ${student.full_name}`,
          type: RoomType.GROUP,
          student_id: studentId,
          chat_participants: {
            create: [
              { id: crypto.randomUUID(), user_id: studentId },
              { id: crypto.randomUUID(), user_id: mentorASId },
              { id: crypto.randomUUID(), user_id: mentorACSId },
              { id: crypto.randomUUID(), user_id: mentorARDId },
            ],
          },
        },
      });

      return {
        assignments: [assignmentAS, assignmentACS, assignmentARD],
        rooms: [roomAS, roomACS, roomARD, groupRoom],
      };
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    return {
      success: true,
      data: result,
      message: 'Đã gán mentor và tạo phòng chat thành công',
    };
  } catch (error: unknown) {
    console.error('Error assigning mentors:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi gán mentor',
    };
  }
}

export async function closeChatRooms(studentId: string) {
  try {
    await requireAdminAuth();

    await prisma.chat_rooms.updateMany({
      where: {
        student_id: studentId,
        status: 'ACTIVE',
      },
      data: {
        status: 'CLOSED',
        updated_at: new Date(),
      },
    });

    return {
      success: true,
      message: 'Đã đóng tất cả phòng chat',
    };
  } catch (error: unknown) {
    console.error('Error closing chat rooms:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function softDeleteChatRooms(studentId: string) {
  try {
    await requireAdminAuth();

    await prisma.chat_rooms.updateMany({
      where: {
        student_id: studentId,
      },
      data: {
        deleted_at: new Date(),
      },
    });

    return {
      success: true,
      message: 'Đã xóa mềm tất cả phòng chat',
    };
  } catch (error: unknown) {
    console.error('Error soft deleting chat rooms:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
