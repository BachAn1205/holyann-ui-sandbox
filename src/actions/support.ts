"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import type { SupportRequestInput, SupportRequestResult } from "@/types/support";
import { publicUrlForS3Key, s3PutPublicObject } from "@/lib/s3-storage";

const SupportRequestSchema = z.object({
  description: z
    .string()
    .min(1, "Mô tả không được để trống")
    .max(5000, "Mô tả không được vượt quá 5000 ký tự"),
  imageUrl: z.string().url("URL hình ảnh không hợp lệ").nullable().optional(),
});


// ============================================================
// SERVER ACTIONS
// ============================================================

/**
 * Gửi yêu cầu hỗ trợ/feedback từ học viên
 */
export async function submitSupportRequest(
  data: SupportRequestInput
): Promise<SupportRequestResult> {
  try {
    // 1. Kiểm tra session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Bạn chưa đăng nhập" };
    }

    const studentId = session.user.id;

    // 2. Validate dữ liệu bằng Zod
    const validationResult = SupportRequestSchema.safeParse(data);

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0];
      return {
        success: false,
        error: firstError?.message || "Dữ liệu không hợp lệ",
      };
    }

    const { description, imageUrl } = validationResult.data;

    // 3. Lưu vào database
    const supportRequest = await prisma.support_requests.create({
      data: {
        id: uuidv4(),
        student_id: studentId,
        description: description,
        image_url: imageUrl || null,
        status: "PENDING",
      },
    });

    console.log("[Support] Request created:", {
      id: supportRequest.id,
      studentId,
    });

    // 4. Return kết quả thành công
    return {
      success: true,
      message: "Gửi yêu cầu thành công",
      data: {
        id: supportRequest.id,
        created_at: supportRequest.created_at,
      },
    };
  } catch (error) {
    console.error("[Support] Error:", error);

    if (error instanceof Error) {
      return { success: false, error: `Lỗi: ${error.message}` };
    }

    return { success: false, error: "Lỗi không xác định khi gửi yêu cầu" };
  }
}

/**
 * Lấy danh sách yêu cầu hỗ trợ của học viên hiện tại
 */
export async function getStudentSupportRequests(): Promise<{
  success: boolean;
  error?: string;
  data: Array<{
    id: string;
    description: string;
    image_url: string | null;
    status: string;
    admin_response: string | null;
    created_at: Date;
  }>;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Bạn chưa đăng nhập", data: [] };
    }

    const requests = await prisma.support_requests.findMany({
      where: { student_id: session.user.id },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        description: true,
        image_url: true,
        status: true,
        admin_response: true,
        created_at: true,
      },
    });

    return { success: true, data: requests };
  } catch (error) {
    console.error("[Support] Error fetching requests:", error);
    return {
      success: false,
      error: "Không thể tải danh sách yêu cầu",
      data: [],
    };
  }
}

/**
 * [ADMIN] Lấy tất cả yêu cầu hỗ trợ (dành cho Admin)
 */
export async function getAllSupportRequests(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  success: boolean;
  error?: string;
  data: Array<{
    id: string;
    description: string;
    image_url: string | null;
    status: string;
    admin_response: string | null;
    created_at: Date;
    users: {
      id: string;
      full_name: string;
      email: string;
      avatar_url: string | null;
    };
  }>;
  total: number;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Bạn chưa đăng nhập", data: [], total: 0 };
    }

    // Kiểm tra quyền Admin
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return {
        success: false,
        error: "Bạn không có quyền truy cập",
        data: [],
        total: 0,
      };
    }

    const { status, limit = 20, offset = 0 } = params || {};

    const whereClause = status ? { status } : {};

    const [requests, total] = await Promise.all([
      prisma.support_requests.findMany({
        where: whereClause,
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          description: true,
          image_url: true,
          status: true,
          admin_response: true,
          created_at: true,
          users: {
            select: {
              id: true,
              full_name: true,
              email: true,
              avatar_url: true,
            },
          },
        },
      }),
      prisma.support_requests.count({ where: whereClause }),
    ]);

    return { success: true, data: requests, total };
  } catch (error) {
    console.error("[Support] Error fetching all requests:", error);
    return {
      success: false,
      error: "Không thể tải danh sách yêu cầu",
      data: [],
      total: 0,
    };
  }
}

/**
 * [ADMIN] Cập nhật trạng thái yêu cầu hỗ trợ
 */
export async function updateSupportRequestStatus(
  requestId: string,
  status: string,
  admin_response?: string
): Promise<SupportRequestResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Bạn chưa đăng nhập" };
    }

    // Kiểm tra quyền Admin
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return { success: false, error: "Bạn không có quyền thực hiện" };
    }

    // Validate status
    const validStatuses = ["PENDING", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    if (!validStatuses.includes(status)) {
      return { success: false, error: "Trạng thái không hợp lệ" };
    }

    await prisma.support_requests.update({
      where: { id: requestId },
      data: { 
        status,
        ...(admin_response !== undefined ? { admin_response } : {})
      },
    });

    return { success: true, message: "Cập nhật trạng thái thành công" };
  } catch (error) {
    console.error("[Support] Error updating status:", error);
    return { success: false, error: "Không thể cập nhật trạng thái" };
  }
}

/**
 * [STUDENT] Xóa yêu cầu hỗ trợ (chỉ khi đang ở trạng thái PENDING)
 */
export async function deleteSupportRequest(
  requestId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Bạn chưa đăng nhập" };
    }

    // Kiểm tra yêu cầu có tồn tại và thuộc về học viên này không
    const request = await prisma.support_requests.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { success: false, error: "Không tìm thấy yêu cầu" };
    }

    if (request.student_id !== session.user.id) {
      return { success: false, error: "Bạn không có quyền xóa yêu cầu này" };
    }

    // Chỉ được xóa khi trạng thái là PENDING
    if (request.status !== "PENDING") {
      return { 
        success: false, 
        error: "Không thể xóa yêu cầu đã được Admin tiếp nhận hoặc xử lý" 
      };
    }

    await prisma.support_requests.delete({
      where: { id: requestId },
    });

    return { success: true, message: "Đã xóa yêu cầu thành công" };
  } catch (error) {
    console.error("[Support] Error deleting request:", error);
    return { success: false, error: "Không thể xóa yêu cầu" };
  }
}

/**
 * [STUDENT] Cập nhật yêu cầu hỗ trợ (chỉ khi đang ở trạng thái PENDING)
 */
export async function updateSupportRequest(
  requestId: string,
  data: { description: string; imageUrl?: string | null }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Bạn chưa đăng nhập" };
    }

    const request = await prisma.support_requests.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return { success: false, error: "Không tìm thấy yêu cầu" };
    }

    if (request.student_id !== session.user.id) {
      return { success: false, error: "Bạn không có quyền sửa yêu cầu này" };
    }

    if (request.status !== "PENDING") {
      return { 
        success: false, 
        error: "Không thể sửa yêu cầu đã được Admin tiếp nhận hoặc xử lý" 
      };
    }

    await prisma.support_requests.update({
      where: { id: requestId },
      data: {
        description: data.description,
        ...(data.imageUrl !== undefined ? { image_url: data.imageUrl } : {}),
      },
    });

    return { success: true, message: "Cập nhật yêu cầu thành công" };
  } catch (error) {
    console.error("[Support] Error updating request:", error);
    return { success: false, error: "Không thể cập nhật yêu cầu" };
  }
}

/**
 * Upload ảnh hỗ trợ lên Supabase Storage (server-side, bypass RLS)
 */
export async function uploadSupportImage(
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Bạn chưa đăng nhập" };
    }

    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return { success: false, error: "Không tìm thấy file hợp lệ" };
    }

    const fileObj = file as unknown as File;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(fileObj.type)) {
      return { success: false, error: `Định dạng file không hỗ trợ: ${fileObj.type}` };
    }

    // Validate file size (max 5MB)
    if (fileObj.size > 5 * 1024 * 1024) {
      return { success: false, error: "File vượt quá 5MB" };
    }

    const timestamp = Date.now();
    const originalName = fileObj.name || 'image';
    const cleanFileName = originalName.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
    const filePath = `uploads/users/${session.user.id}/support/${timestamp}_${cleanFileName}`;

    // Convert File to Buffer for server-side upload
    const arrayBuffer = await fileObj.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await s3PutPublicObject(filePath, buffer, fileObj.type);

    return { success: true, url: publicUrlForS3Key(filePath) };
  } catch (error) {
    console.error("[Support] Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Lỗi khi upload ảnh: ${errorMessage}` };
  }
}


