"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";
import { v4 as uuidv4 } from "uuid";
import React from "react";
import { addMinutes } from "date-fns";
import { handleServerError } from "@/lib/handle-error";
import { sendEmail } from "@/lib/email/sendEmail";
import { MeetingEmail, generateMeetingEmailHtml } from "@/emails/MeetingEmail";

// ============================================================
// DATA TYPES
// ============================================================

export interface CreateMeetingInput {
  content: string;
  startTime: Date;
  durationMinutes: number; // Thời lượng cuộc họp (phút)
  studentId: string; // UUID của học viên
  mentorEmail: string;
}

export interface CreateMeetingResult {
  success: boolean;
  meetLink?: string;
  hostMeetLink?: string;
  meetingId?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  studentId?: string;
  error?: string;
  emailSent?: boolean;
}

// ============================================================
// SERVER ACTIONS
// ============================================================

/**
 * Lấy danh sách học viên được phân công cho Cố vấn hiện tại
 */
export async function getAssignedStudentsForMentor() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Bạn chưa đăng nhập", data: [] };
    }

    const assignments = await prisma.mentor_assignments.findMany({
      where: {
        mentor_id: session.user.id,
        status: "ACTIVE",
      },
      include: {
        students: {
          include: {
            users: {
              select: {
                id: true,
                full_name: true,
                email: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    const students = assignments
      .filter((a) => a.students?.users)
      .map((a) => ({
        id: a.students.users.id,
        full_name: a.students.users.full_name,
        email: a.students.users.email,
        avatar_url: a.students.users.avatar_url,
      }));

    // Loại bỏ trùng lặp (1 học viên có thể được assign nhiều type)
    const uniqueStudents = Array.from(
      new Map(students.map((s) => [s.id, s])).values()
    );

    return { success: true, data: uniqueStudents };
  } catch (error) {
    console.error("[Meeting] Error fetching assigned students:", error);
    return { success: false, error: "Không thể tải danh sách học viên", data: [] };
  }
}

/**
 * Tạo buổi tư vấn với Daily.co và lưu vào Database
 */
export async function createConsultationEvent(
  data: CreateMeetingInput
): Promise<CreateMeetingResult> {
  try {
    // 1. Kiểm tra session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Bạn chưa đăng nhập" };
    }

    // 2. Lấy thông tin mentor từ database
    const mentor = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        role: true,
        full_name: true,
        email: true,
        mentors: true,
      },
    });

    if (!mentor || mentor.role !== "MENTOR") {
      return { success: false, error: "Chỉ mentor mới có quyền tạo lịch tư vấn" };
    }

    // 3. Lấy thông tin học viên từ studentId
    const student = await prisma.users.findUnique({
      where: { id: data.studentId },
      select: { id: true, full_name: true, email: true },
    });

    if (!student) {
      return { success: false, error: "Không tìm thấy học viên" };
    }

    const assignment = await prisma.mentor_assignments.findFirst({
      where: {
        mentor_id: session.user.id,
        student_id: data.studentId,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (!assignment) {
      return { success: false, error: "Không có quyền tạo lịch cho học viên này" };
    }

    const studentEmail = student.email;
    const studentName = student.full_name;

    // 3. Tính end_time sử dụng addMinutes
    const startTime = new Date(data.startTime);
    const duration = data.durationMinutes || 60;
    const endTime = addMinutes(startTime, duration);

    // Daily.co exp phải là Unix timestamp (giây) trong tương lai
    const nowSec = Math.floor(Date.now() / 1000);
    const endTimeSec = Math.floor(endTime.getTime() / 1000);
    const expSec = Math.max(endTimeSec, nowSec + 3600); // ít nhất 1 giờ từ bây giờ

    // 4. Tạo phòng Daily.co
    let roomUrl = "";
    let roomName = "";
    let hostLink = "";

    if (process.env.MOCK_EXTERNAL_APIS === "true") {
      console.log("[Mock Daily.co] Room creation skipped");
      roomUrl = "https://mock.daily.co/room-abc";
      roomName = "room-abc";
      hostLink = `${roomUrl}?t=mock-token`;
    } else {
      const DAILY_API_KEY = process.env.DAILY_API_KEY;
      if (!DAILY_API_KEY) {
        return { success: false, error: "Thiếu DAILY_API_KEY trong .env" };
      }

      try {
        // 4a. Tạo Room
        const roomRes = await fetch("https://api.daily.co/v1/rooms", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${DAILY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: {
              exp: expSec,
              enable_prejoin_ui: true, // Bật màn hình chờ chuẩn bị trước khi vào
              enable_screenshare: true, // Cho phép chia sẻ màn hình
              enable_chat: true, // Bật chat cơ bản
              enable_advanced_chat: true, // Bật chat nâng cao (gửi file, reply)
              enable_hand_raising: true, // Bật tính năng giơ tay
              enable_emoji_reactions: true, // Bật thả biểu tượng cảm xúc
              enable_noise_cancellation_ui: true, // Bật nút lọc tiếng ồn AI
              enable_video_processing_ui: true, // Cho phép làm mờ/đổi phông nền
              enable_pip_ui: true, // Cho phép thu nhỏ màn hình (Picture-in-Picture)
              enable_recording: "cloud", // Bật tính năng ghi hình trên Cloud
            },
          }),
        });

        if (!roomRes.ok) {
          const errBody = await roomRes.text();
          console.error("[Daily.co] Room creation failed:", errBody);
          return { success: false, error: "Không thể tạo phòng họp Daily.co" };
        }

        const roomData = await roomRes.json();
        roomUrl = roomData.url; // e.g. https://your-domain.daily.co/room-name
        roomName = roomData.name;

        console.log("[Daily.co] Room created:", { roomUrl, roomName });

        // 4b. Tạo Meeting Token cho Host (Owner)
        const tokenRes = await fetch("https://api.daily.co/v1/meeting-tokens", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${DAILY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            properties: {
              room_name: roomName,
              is_owner: true,
            },
          }),
        });

        if (!tokenRes.ok) {
          const errBody = await tokenRes.text();
          console.error("[Daily.co] Token creation failed:", errBody);
          // Vẫn tiếp tục, mentor sẽ dùng link thường
          hostLink = roomUrl;
        } else {
          const tokenData = await tokenRes.json();
          hostLink = `${roomUrl}?t=${tokenData.token}`;
          console.log("[Daily.co] Host token created");
        }
      } catch (dailyError) {
        console.error("[Daily.co] API Error:", dailyError);
        return { success: false, error: "Lỗi kết nối Daily.co API" };
      }
    }

    console.log("[Meeting] Creating with Daily.co:", {
      content: data.content,
      roomUrl,
      hostLink,
      duration,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
    });

    // 5. Lưu vào database
    await prisma.consultation_meetings.create({
      data: {
        id: uuidv4(),
        title: data.content,
        description: data.content,
        mentor_id: session.user.id,
        student_id: data.studentId,
        mentor_email: data.mentorEmail,
        student_email: studentEmail,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: duration,
        meet_link: roomUrl, // Link cho Học viên
        host_meet_link: hostLink, // Link cho Mentor (có token owner)
        google_event_id: null,
      },
    });

    // 6. Gửi email thông báo (React Email + Nodemailer)
    let emailSent = false;
    try {
      const studentRes = await sendEmail({
        to: studentEmail,
        subject: `[Holyann Explore] Thư mời tư vấn: ${data.content}`,
        html: generateMeetingEmailHtml({
          variant: "invite",
          title: data.content,
          description: data.content,
          startTime,
          endTime,
          meetLink: roomUrl,
          mentorName: mentor.full_name ?? undefined,
          studentName: studentName ?? undefined,
          brandName: "Holyann Explore",
        }),
      });

      const mentorRes = await sendEmail({
        to: data.mentorEmail,
        subject: `[Holyann Explore] Bạn là Host: ${data.content}`,
        html: generateMeetingEmailHtml({
          variant: "invite",
          title: `[Host] ${data.content}`,
          description: data.content,
          startTime,
          endTime,
          meetLink: hostLink,
          mentorName: mentor.full_name ?? undefined,
          studentName: studentName ?? undefined,
          brandName: "Holyann Explore",
        }),
      });

      emailSent = studentRes.success && mentorRes.success;
      if (emailSent) {
        console.log("[Email] Sent to student:", studentEmail);
        console.log("[Email] Sent to mentor:", data.mentorEmail);
      } else {
        console.warn("[Email] Not configured or partially failed.");
      }
    } catch (emailError) {
      console.error("[Email] Failed:", emailError);
    }

    // Find the newly created meeting ID
    const createdMeeting = await prisma.consultation_meetings.findFirst({
      where: { mentor_id: session.user.id, student_id: data.studentId, start_time: startTime },
      select: { id: true },
      orderBy: { created_at: 'desc' },
    });

    return {
      success: true,
      meetLink: roomUrl,
      hostMeetLink: hostLink,
      meetingId: createdMeeting?.id,
      title: data.content,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      studentId: data.studentId,
      emailSent,
    };
  } catch (error) {
    return { success: false, error: handleServerError(error) };
  }
}

/**
 * Lấy danh sách TẤT CẢ buổi tư vấn của mentor (bao gồm cả quá khứ & sắp tới)
 */
export async function getMentorMeetings() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Bạn chưa đăng nhập", data: [] };
    }

    const meetings = await prisma.consultation_meetings.findMany({
      where: {
        mentor_id: session.user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        student_id: true,
        student_email: true,
        mentor_email: true,
        start_time: true,
        end_time: true,
        duration_minutes: true,
        meet_link: true,
        host_meet_link: true,
        created_at: true,
        student_user: {
          select: { id: true, full_name: true, avatar_url: true },
        },
      },
      orderBy: { start_time: "asc" },
    });

    return { success: true, data: meetings };
  } catch (error) {
    console.error("[Meeting] Error fetching meetings:", error);
    return { success: false, error: "Không thể tải danh sách cuộc họp", data: [] };
  }
}

/**
 * Lấy TẤT CẢ buổi tư vấn của mentor (bao gồm cả quá khứ)
 */
export async function getAllMentorMeetings() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Bạn chưa đăng nhập", data: [] };
    }

    const meetings = await prisma.consultation_meetings.findMany({
      where: { mentor_id: session.user.id },
      select: {
        id: true,
        title: true,
        description: true,
        student_id: true,
        student_email: true,
        mentor_email: true,
        start_time: true,
        end_time: true,
        duration_minutes: true,
        meet_link: true,
        host_meet_link: true,
        created_at: true,
        student_user: {
          select: { id: true, full_name: true, avatar_url: true },
        },
      },
      orderBy: { start_time: "desc" },
    });

    return { success: true, data: meetings };
  } catch (error) {
    console.error("[Meeting] Error fetching meetings:", error);
    return { success: false, error: "Không thể tải danh sách cuộc họp", data: [] };
  }
}

/**
 * Lấy meetings của mentor trong khoảng thời gian (để hiển thị lên calendar)
 */
export async function getMentorMeetingsInRange(start: Date, end: Date) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Bạn chưa đăng nhập", data: [] };
    }
    const meetings = await prisma.consultation_meetings.findMany({
      where: {
        mentor_id: session.user.id,
        start_time: { gte: start, lte: end },
      },
      orderBy: { start_time: "asc" },
      include: {
        student_user: {
          select: { id: true, full_name: true, email: true, avatar_url: true },
        },
      },
    });
    return { success: true, data: meetings };
  } catch (error) {
    console.error("[Meeting] getMentorMeetingsInRange Error:", error);
    return { success: false, error: "Không thể tải lịch", data: [] };
  }
}

/**
 * Lấy danh sách các buổi tư vấn sắp tới của học viên
 */
export async function getStudentMeetings() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Bạn chưa đăng nhập", data: [] };
    }

    // Lấy email của user hiện tại để fallback cho record cũ
    const currentUser = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });

    const meetings = await prisma.consultation_meetings.findMany({
      where: {
        OR: [
          { student_id: session.user.id },
          ...(currentUser?.email ? [{ student_email: currentUser.email }] : []),
        ],
        start_time: { gte: new Date() },
      },
      orderBy: { start_time: "asc" },
      include: {
        mentor_user: {
          select: { full_name: true, email: true, avatar_url: true },
        },
      },
    });

    return { success: true, data: meetings };
  } catch (error) {
    console.error("[Meeting] Error:", error);
    return { success: false, error: "Không thể tải danh sách", data: [] };
  }
}

/**
 * Lấy meetings của student trong khoảng thời gian (để hiển thị lên calendar)
 */
export async function getStudentMeetingsInRange(start: Date, end: Date) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Bạn chưa đăng nhập", data: [] };
    }
    const currentUser = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    });
    const meetings = await prisma.consultation_meetings.findMany({
      where: {
        OR: [
          { student_id: session.user.id },
          ...(currentUser?.email ? [{ student_email: currentUser.email }] : []),
        ],
        start_time: { gte: start, lte: end },
      },
      orderBy: { start_time: "asc" },
      include: {
        mentor_user: {
          select: { full_name: true, email: true, avatar_url: true },
        },
      },
    });
    return { success: true, data: meetings };
  } catch (error) {
    console.error("[Meeting] getStudentMeetingsInRange Error:", error);
    return { success: false, error: "Không thể tải lịch", data: [] };
  }
}

/**
 * Xóa buổi tư vấn và gửi email thông báo hủy cho học viên
 */
export async function deleteMeeting(meetingId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Bạn chưa đăng nhập" };
    }

    const meeting = await prisma.consultation_meetings.findFirst({
      where: { id: meetingId, mentor_id: session.user.id },
      include: {
        mentor_user: { select: { full_name: true } },
        student_user: { select: { full_name: true } },
      },
    });

    if (!meeting) return { success: false, error: "Không tìm thấy cuộc họp" };

    // Gửi email hủy cho học viên trước khi xóa (best-effort)
    if (meeting.student_email) {
      try {
        const res = await sendEmail({
          to: meeting.student_email,
          subject: `[Holyann Explore] Thông báo hủy lịch tư vấn: ${meeting.title}`,
          html: generateMeetingEmailHtml({
            variant: "cancel",
            title: meeting.title,
            description: meeting.description ?? undefined,
            startTime: meeting.start_time,
            mentorName: meeting.mentor_user?.full_name ?? undefined,
            studentName: meeting.student_user?.full_name ?? undefined,
            brandName: "Holyann Explore",
          }),
        });
        if (res.success) {
          console.log("[Email] Cancellation sent to:", meeting.student_email);
        }
      } catch (emailError) {
        console.error("[Email] Failed to send cancellation email:", emailError);
        // Không dừng lại, vẫn xóa meeting
      }
    }

    // Xóa khỏi database
    await prisma.consultation_meetings.deleteMany({ where: { id: meetingId, mentor_id: session.user.id } });

    console.log("[Meeting] Deleted:", meetingId);

    return { success: true };
  } catch (error) {
    console.error("[Meeting] Delete error:", error);
    return { success: false, error: "Không thể xóa cuộc họp" };
  }
}

/**
 * Cập nhật thông tin buổi tư vấn và gửi email thông báo thay đổi cho học viên
 */
export async function updateConsultationEvent(
  meetingId: string,
  data: {
    content?: string;
    startTime?: Date;
    durationMinutes?: number;
  }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Bạn chưa đăng nhập" };
    }

    // Lấy meeting hiện tại
    const existing = await prisma.consultation_meetings.findFirst({
      where: { id: meetingId, mentor_id: session.user.id },
      include: {
        mentor_user: { select: { full_name: true } },
        student_user: { select: { full_name: true } },
      },
    });

    if (!existing) return { success: false, error: "Không tìm thấy cuộc họp" };

    // Tính toán lại các trường cần cập nhật
    const newStartTime = data.startTime ? new Date(data.startTime) : existing.start_time;
    const newDuration = data.durationMinutes ?? existing.duration_minutes;
    const newEndTime = addMinutes(newStartTime, newDuration);
    const newTitle = data.content ?? existing.title;

    // Cập nhật trong database
    await prisma.consultation_meetings.updateMany({
      where: { id: meetingId, mentor_id: session.user.id },
      data: {
        title: newTitle,
        description: newTitle,
        start_time: newStartTime,
        end_time: newEndTime,
        duration_minutes: newDuration,
      },
    });

    const updated = await prisma.consultation_meetings.findFirst({
      where: { id: meetingId, mentor_id: session.user.id },
    });

    console.log("[Meeting] Updated:", meetingId);

    // Gửi email thông báo cập nhật cho học viên (best-effort)
    if (existing.student_email) {
      try {
        const res = await sendEmail({
          to: existing.student_email,
          subject: `[Holyann Explore] Lịch tư vấn đã được cập nhật: ${newTitle}`,
          html: generateMeetingEmailHtml({
            variant: "update",
            title: newTitle,
            description: newTitle,
            startTime: newStartTime,
            endTime: newEndTime,
            meetLink: existing.meet_link ?? undefined,
            mentorName: existing.mentor_user?.full_name ?? undefined,
            studentName: existing.student_user?.full_name ?? undefined,
            brandName: "Holyann Explore",
          }),
        });
        if (res.success) {
          console.log("[Email] Update notification sent to:", existing.student_email);
        }
      } catch (emailError) {
        console.error("[Email] Failed to send update email:", emailError);
        // Không dừng lại, vẫn trả về success
      }
    }

    return { success: true, data: updated };
  } catch (error) {
    console.error("[Meeting] Update error:", error);
    if (error instanceof Error) {
      return { success: false, error: `Lỗi: ${error.message}` };
    }
    return { success: false, error: "Không thể cập nhật cuộc họp" };
  }
}

/**
 * Lấy cuộc họp sắp tới gần nhất giữa current user và một user khác
 * Dùng cho giao diện Chat để hiển thị lịch hẹn sắp tới
 */
export async function getUpcomingMeetingWithUser(partnerId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, data: null, error: "Bạn chưa đăng nhập" };
    }

    const currentUserId = session.user.id;

    const meeting = await prisma.consultation_meetings.findFirst({
      where: {
        start_time: { gte: new Date() },
        OR: [
          // Current user là mentor, partner là student
          { mentor_id: currentUserId, student_id: partnerId },
          // Current user là student, partner là mentor
          { mentor_id: partnerId, student_id: currentUserId },
        ],
      },
      orderBy: { start_time: "asc" },
      select: {
        id: true,
        title: true,
        start_time: true,
        end_time: true,
        duration_minutes: true,
        meet_link: true,
        host_meet_link: true,
        mentor_id: true,
      },
    });

    return { success: true, data: meeting };
  } catch (error) {
    console.error("[Meeting] Error fetching upcoming meeting with user:", error);
    return { success: false, data: null, error: "Không thể tải lịch hẹn" };
  }
}


