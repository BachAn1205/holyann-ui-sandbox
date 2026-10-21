import { NextResponse } from "next/server";
import { requireStudentRouteAccess } from "@/lib/auth-utils";
import {
  callVerifyDocument,
  FEATURE7_VERIFY_DOCUMENT_PATH,
  getResolvedAIServerBaseUrl,
} from "@/lib/ai-api-client";
import { uploadProfileVerifyDocumentToS3 } from "@/actions/s3-upload";

export const maxDuration = 120;

function guessContentType(fileName: string, declared: string): string {
  const d = declared?.trim();
  if (d) return d;
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (lower.endsWith(".doc")) return "application/msword";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

/**
 * POST multipart: `file` — PDF / DOCX / PNG / JPEG / WebP.
 * 1) Lưu bản sao lên S3 (prefix profile-verify)
 * 2) Gọi FastAPI verify-document (tài liệu chung, không rubric CV).
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ student_id: string }> },
) {
  const { student_id: studentId } = await context.params;
  try {
    await requireStudentRouteAccess(studentId);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: "Thiếu file" }, { status: 400 });
    }
    const name =
      typeof (file as File).name === "string" ? (file as File).name : "document.pdf";
    const buf = Buffer.from(await file.arrayBuffer());
    const contentType = guessContentType(
      name,
      typeof (file as File).type === "string" ? (file as File).type : "",
    );

    const payload = {
      file_base64: buf.toString("base64"),
      filename: name,
    };
    const aiBase = getResolvedAIServerBaseUrl();
    const verifyUrl = `${aiBase}${FEATURE7_VERIFY_DOCUMENT_PATH}`;
    console.info("[verify-document] Gọi FastAPI (server → server-ai):", verifyUrl);
    const raw = await callVerifyDocument(payload);
    console.info("[verify-document] FastAPI OK, valid=", (raw as { valid?: unknown })?.valid);

    const { key: s3Key, fileUrl } = await uploadProfileVerifyDocumentToS3({
      studentId,
      fileName: name,
      contentType,
      body: buf,
    });
    return NextResponse.json({
      ...raw,
      s3Key,
      fileUrl,
      verifyDocumentCall: {
        attempted: true,
        success: true,
        method: "POST",
        path: FEATURE7_VERIFY_DOCUMENT_PATH,
        aiServerBaseUrl: aiBase,
        fullUrl: verifyUrl,
      },
    });
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (e instanceof Error && e.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (
      e instanceof Error &&
      (e.message.includes("Định dạng file") ||
        e.message.includes("File vượt quá"))
    ) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    if (
      e instanceof Error &&
      e.message.startsWith("Missing required environment variable")
    ) {
      return NextResponse.json(
        { error: "Chưa cấu hình lưu trữ S3 (AWS)." },
        { status: 503 },
      );
    }
    console.error("[verify-document]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verify thất bại" },
      { status: 500 },
    );
  }
}
