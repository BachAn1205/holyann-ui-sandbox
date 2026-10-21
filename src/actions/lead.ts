"use server";

import { randomUUID } from "crypto";
import { z } from "zod";
import {prisma} from "@/lib/prisma";

// ==================== ZOD SCHEMA ====================

const LeadFormSchema = z.object({
  full_name: z
    .string()
    .min(1, "Họ tên là bắt buộc")
    .max(100, "Họ tên không được quá 100 ký tự"),
  phone: z
    .string()
    .min(1, "Số điện thoại là bắt buộc")
    .regex(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số"),
  email: z
    .string()
    .min(1, "Email là bắt buộc")
    .email("Email không hợp lệ"),
  current_location: z.string().max(255).optional().nullable(),
  current_school: z.string().max(255).optional().nullable(),
  current_grade: z.string().max(50).optional().nullable(),
  study_level: z.string().max(100).optional().nullable(),
  intended_major: z.string().max(255).optional().nullable(),
  intended_country: z.string().max(100).optional().nullable(),
  intended_university: z.string().max(255).optional().nullable(),
  budget_per_year: z.string().max(100).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
});

// Type inference from schema
export type LeadFormInput = z.infer<typeof LeadFormSchema>;

// Response type
export type LeadFormResponse = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

// ==================== LABEL MAPPINGS ====================

const CATEGORY_LABELS: Record<string, string> = {
  "consultation": "Đăng ký tư vấn",
  "package": "Đăng ký gói",
};

const BUDGET_LABELS: Record<string, string> = {
  "under_500m": "Dưới 500 triệu",
  "500m_1b": "500 triệu - 1 tỷ",
  "1b_2b": "1 tỷ - 2 tỷ",
  "over_2b": "Trên 2 tỷ",
  "undecided": "Chưa xác định",
};

const STUDY_LEVEL_LABELS: Record<string, string> = {
  "high_school": "Trung học",
  "college": "Cao đẳng",
  "university": "Đại học",
  "master": "Thạc sỹ",
  "other": "Khác",
};

// Prevent Google Sheets CSV Injection
function safeSheetString(val: string | null | undefined): string | null {
  if (!val) return null;
  // If string starts with =, +, -, or @, prepend an apostrophe to treat as plain text
  if (/^[=+\-@]/.test(val)) {
    return `'${val}`;
  }
  return val;
}

// ==================== SERVER ACTION ====================

export async function submitLeadForm(
  input: LeadFormInput
): Promise<LeadFormResponse> {
  try {
    // Step 1: Validate input with Zod
    const validationResult = LeadFormSchema.safeParse(input);

    if (!validationResult.success) {
      // Extract error messages by field
      const fieldErrors: Record<string, string[]> = {};
      validationResult.error.issues.forEach((err) => {
        const field = String(err.path[0] ?? "");
        if (!field) return;
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });

      return {
        success: false,
        message: "Vui lòng kiểm tra lại thông tin",
        errors: fieldErrors,
      };
    }

    // Step 2: Sanitize data - convert empty strings to null
    const sanitizedData = {
      full_name: validationResult.data.full_name.trim(),
      phone: validationResult.data.phone.trim(),
      email: validationResult.data.email.trim().toLowerCase(),
      current_location: validationResult.data.current_location?.trim() || null,
      current_school: validationResult.data.current_school?.trim() || null,
      current_grade: validationResult.data.current_grade?.trim() || null,
      study_level: validationResult.data.study_level?.trim() || null,
      intended_major: validationResult.data.intended_major?.trim() || null,
      intended_country: validationResult.data.intended_country?.trim() || null,
      intended_university: validationResult.data.intended_university?.trim() || null,
      budget_per_year: validationResult.data.budget_per_year?.trim() || null,
      category: validationResult.data.category?.trim() || null,
      status: "NEW",
    };

    // Step 3: Check for duplicate email manually (to prevent spam and quota waste)
    const existingLead = await prisma.leads.findFirst({
      where: { email: sanitizedData.email }
    });

    if (existingLead) {
      return {
        success: false,
        message: "Email này đã được đăng ký trước đó.",
        errors: {
          email: ["Email này đã được đăng ký trước đó."],
        },
      };
    }

    // Step 4: Save to database
    await prisma.leads.create({
      data: { id: randomUUID(), ...sanitizedData },
    });

    // Step 5: Send data to Make.com Webhook (if configured)
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;
    if (webhookUrl) {
      if (process.env.MOCK_EXTERNAL_APIS === "true") {
        console.log("[Mock Make.com Webhook] Skipping call to Make.com Webhook for lead:", sanitizedData.email);
      } else {
        try {
          // Format payload to be human-readable and safe for Google Sheets
          const webhookPayload = {
            ...sanitizedData,
            full_name: safeSheetString(sanitizedData.full_name),
            current_location: safeSheetString(sanitizedData.current_location),
            current_school: safeSheetString(sanitizedData.current_school),
            current_grade: safeSheetString(sanitizedData.current_grade),
            intended_major: safeSheetString(sanitizedData.intended_major),
            intended_country: safeSheetString(sanitizedData.intended_country),
            intended_university: safeSheetString(sanitizedData.intended_university),
            // Add apostrophe to phone to force Google Sheets to treat it as text (keeps leading zero)
            phone: sanitizedData.phone ? `'${sanitizedData.phone}` : null,
            budget_per_year: sanitizedData.budget_per_year 
              ? BUDGET_LABELS[sanitizedData.budget_per_year] || sanitizedData.budget_per_year 
              : null,
            category: sanitizedData.category 
              ? CATEGORY_LABELS[sanitizedData.category] || sanitizedData.category 
              : null,
            study_level: sanitizedData.study_level 
              ? STUDY_LEVEL_LABELS[sanitizedData.study_level] || sanitizedData.study_level 
              : null,
          };

          await fetch(webhookUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(webhookPayload),
          });
        } catch (webhookError) {
          console.error("[submitLeadForm] Make.com Webhook Error:", webhookError);
          // Do not fail the form submission if webhook fails
        }
      }
    }

    return {
      success: true,
      message: "Đăng ký thành công! Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.",
    };
  } catch (error) {
    console.error("[submitLeadForm] Error:", error);

    // Check for duplicate email (unique constraint violation)
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return {
        success: false,
        message: "Email này đã được đăng ký trước đó.",
        errors: {
          email: ["Email này đã được đăng ký trước đó."],
        },
      };
    }

    return {
      success: false,
      message: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
    };
  }
}

// ==================== ADMIN ACTIONS (Optional) ====================

// Get all leads with pagination
export async function getLeads(page: number = 1, pageSize: number = 20) {
  try {
    const skip = (page - 1) * pageSize;

    const [leads, total] = await Promise.all([
      prisma.leads.findMany({
        orderBy: { created_at: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.leads.count(),
    ]);

    return {
      success: true,
      data: leads,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  } catch (error) {
    console.error("[getLeads] Error:", error);
    return {
      success: false,
      message: "Không thể tải danh sách leads.",
    };
  }
}

// Update lead status
export async function updateLeadStatus(
  leadId: string,
  status: string,
  notes?: string
) {
  try {
    const updated = await prisma.leads.update({
      where: { id: leadId },
      data: {
        status,
        ...(notes !== undefined && { notes }),
      },
    });

    return {
      success: true,
      data: updated,
      message: "Cập nhật trạng thái thành công.",
    };
  } catch (error) {
    console.error("[updateLeadStatus] Error:", error);
    return {
      success: false,
      message: "Không thể cập nhật trạng thái.",
    };
  }
}
