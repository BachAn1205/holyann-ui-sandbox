import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import {
  callVerifyDocument,
  FEATURE7_VERIFY_DOCUMENT_PATH,
  getResolvedAIServerBaseUrl,
} from "@/lib/ai-api-client";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/prisma";
import {
  extractS3KeyFromPublicUrl,
  publicUrlForS3Key,
  s3GetObjectBuffer,
  s3ListObjectsUnderPrefix,
} from "@/lib/s3-storage";

export const maxDuration = 120;

function canReadS3WithSdk(): boolean {
  return Boolean(
    process.env.AWS_S3_BUCKET_NAME?.trim() &&
      process.env.AWS_REGION?.trim() &&
      process.env.AWS_ACCESS_KEY_ID?.trim() &&
      process.env.AWS_SECRET_ACCESS_KEY?.trim(),
  );
}

/** Khi key client lệch với object thực (NoSuchKey): tìm theo đuôi tên file dưới prefix học sinh. */
async function findObjectKeyUnderStudentPrefix(
  studentId: string,
  fileLabel: string,
): Promise<string | null> {
  const base =
    fileLabel.split("/").pop()?.split("?")[0]?.trim() ?? fileLabel.trim();
  if (base.length < 3) return null;
  const prefix = `uploads/students/${studentId}/`;
  try {
    const objects = await s3ListObjectsUnderPrefix(prefix);
    if (objects.length === 0) return null;
    const lower = base.toLowerCase();
    const byExact = objects.find((o) => o.key.toLowerCase().endsWith(lower));
    if (byExact) return byExact.key;
    const stripped = lower.replace(
      /^\d+-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i,
      "",
    );
    if (stripped !== lower && stripped.length > 5) {
      const byTail = objects.find((o) =>
        o.key.toLowerCase().endsWith(stripped),
      );
      if (byTail) return byTail.key;
    }
    return null;
  } catch (e) {
    console.warn("[verify-uploaded-file] list prefix:", e);
    return null;
  }
}

/**
 * FastAPI `extract_cv_text_from_bytes` cần đuôi (.png, .pdf, …) để nhánh OCR/đọc file đúng.
 */
function filenameForVerifyDocument(
  filename: string,
  publicUrl: string,
  contentType: string | null,
): string {
  const base =
    (filename?.trim() || publicUrl.split("/").pop() || "file").split("?")[0] ||
    "file";
  if (/\.[a-z0-9]{2,8}$/i.test(base)) {
    return base.slice(0, 255);
  }
  const fromUrl = publicUrl.split("/").pop()?.split("?")[0] ?? "";
  if (/\.[a-z0-9]{2,8}$/i.test(fromUrl)) {
    return fromUrl.slice(0, 255);
  }
  const ct = (contentType || "").toLowerCase();
  const stem = base.replace(/\.+$/g, "") || "document";
  if (ct.includes("png")) return `${stem}.png`.slice(0, 255);
  if (ct.includes("jpeg")) return `${stem}.jpeg`.slice(0, 255);
  if (ct.includes("jpg")) return `${stem}.jpg`.slice(0, 255);
  if (ct.includes("webp")) return `${stem}.webp`.slice(0, 255);
  if (ct.includes("pdf")) return `${stem}.pdf`.slice(0, 255);
  if (ct.includes("word") || ct.includes("officedocument")) return `${stem}.docx`.slice(0, 255);
  return `${stem}.png`.slice(0, 255);
}

type Body = {
  publicUrl: string;
  storagePath?: string | null;
  filename?: string | null;
};

/**
 * Sau khi file đã có URL công khai (Supabase hoặc S3): tải bytes → verify-document → lưu student_document_verifications.
 * `storage_path` trong DB = đường dẫn Supabase nếu có; nếu không (S3) dùng `publicUrl` làm khóa.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ student_id: string }> },
) {
  try {
    const { student_id } = await params;
    const session = await getServerSession(authOptions);
    const sessionUserId =
      (session?.user as { id?: string })?.id ??
      (session?.user as { user_id?: string })?.user_id;
    if (!sessionUserId || String(sessionUserId) !== String(student_id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as Body;
    const publicUrl = typeof body.publicUrl === "string" ? body.publicUrl.trim() : "";
    if (!publicUrl.startsWith("http://") && !publicUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Thiếu publicUrl hợp lệ" }, { status: 400 });
    }

    const storageKey =
      typeof body.storagePath === "string" && body.storagePath.trim()
        ? body.storagePath.trim()
        : publicUrl;
    const safeName =
      (typeof body.filename === "string" && body.filename.trim()
        ? body.filename.trim()
        : publicUrl.split("/").pop() || "file") || "file";

    const studentPrefix = `uploads/students/${student_id}/`;
    let buf: Buffer | undefined;
    let responseContentType: string | null = null;
    let resolvedStorageKey: string | null = null;

    const bucketName = process.env.AWS_S3_BUCKET_NAME?.trim();

    // 1) HTTP trước — đúng URL mà UI dùng (tránh key doc.id lệch với object thật).
    try {
      const r = await fetch(publicUrl, { cache: "no-store" });
      if (r.ok) {
        responseContentType = r.headers.get("content-type");
        buf = Buffer.from(await r.arrayBuffer());
        console.info("[verify-uploaded-file] Đã tải qua publicUrl");
      } else {
        console.warn(
          "[verify-uploaded-file] publicUrl HTTP",
          r.status,
          publicUrl.slice(0, 120),
        );
      }
    } catch (e) {
      console.warn("[verify-uploaded-file] fetch publicUrl:", e);
    }

    // 2) Key S3 suy từ URL (custom domain / path khác storagePath client).
    if (!buf && bucketName && canReadS3WithSdk()) {
      const fromUrl = extractS3KeyFromPublicUrl(publicUrl, bucketName);
      if (fromUrl?.startsWith(studentPrefix)) {
        try {
          buf = await s3GetObjectBuffer(fromUrl);
          resolvedStorageKey = fromUrl;
          console.info(
            "[verify-uploaded-file] S3 GetObject từ key parse URL:",
            fromUrl.slice(0, 96),
          );
        } catch (e) {
          console.warn("[verify-uploaded-file] GetObject URL key:", e);
        }
      }
    }

    // 3) Key client gửi (doc.id / storagePath).
    if (!buf && storageKey.startsWith(studentPrefix) && canReadS3WithSdk()) {
      try {
        buf = await s3GetObjectBuffer(storageKey);
        resolvedStorageKey = storageKey;
        console.info(
          "[verify-uploaded-file] S3 GetObject storagePath:",
          storageKey.slice(0, 96),
        );
      } catch (e) {
        console.warn("[verify-uploaded-file] GetObject storagePath:", e);
      }
    }

    // 4) HTTP URL chuẩn bucket theo storageKey.
    if (!buf && storageKey.startsWith(studentPrefix)) {
      try {
        const canonical = publicUrlForS3Key(storageKey);
        const r = await fetch(canonical, { cache: "no-store" });
        if (r.ok) {
          responseContentType = r.headers.get("content-type");
          buf = Buffer.from(await r.arrayBuffer());
          console.info("[verify-uploaded-file] HTTP URL chuẩn bucket");
        }
      } catch (e) {
        console.warn("[verify-uploaded-file] fetch canonical URL:", e);
      }
    }

    // 5) Tìm object theo đuôi tên file (NoSuchKey do key cũ / merge JSON lệch).
    if (!buf && canReadS3WithSdk()) {
      const found = await findObjectKeyUnderStudentPrefix(student_id, safeName);
      if (found) {
        try {
          buf = await s3GetObjectBuffer(found);
          resolvedStorageKey = found;
          console.info(
            "[verify-uploaded-file] S3 key tìm theo tên:",
            found.slice(0, 96),
          );
        } catch (e) {
          console.warn("[verify-uploaded-file] GetObject found:", e);
        }
      }
    }

    if (!buf) {
      return NextResponse.json(
        {
          error:
            "Tải file thất bại (đã thử URL công khai, key S3 và tìm theo tên file). Kiểm tra file còn trên S3.",
        },
        { status: 422 },
      );
    }

    const effectiveStorageKey = resolvedStorageKey ?? storageKey;

    const aiBase = getResolvedAIServerBaseUrl();
    const verifyUrl = `${aiBase}${FEATURE7_VERIFY_DOCUMENT_PATH}`;
    console.info("[verify-uploaded-file] FastAPI:", verifyUrl);

    let documentVerify: Record<string, unknown> | null = null;
    let verifyError: string | undefined;
    const verifyFileName = filenameForVerifyDocument(
      safeName,
      publicUrl,
      responseContentType,
    );
    try {
      documentVerify = (await callVerifyDocument({
        file_base64: buf.toString("base64"),
        filename: verifyFileName,
      })) as Record<string, unknown>;
    } catch (verifyErr) {
      verifyError =
        verifyErr instanceof Error ? verifyErr.message : "Verify thất bại";
      console.error("[verify-uploaded-file] AI:", verifyErr);
    }

    const aiValid =
      documentVerify &&
      typeof (documentVerify as { valid?: unknown }).valid === "boolean"
        ? (documentVerify as { valid: boolean }).valid
        : null;

    await prisma.student_document_verifications.upsert({
      where: {
        student_id_storage_path: {
          student_id,
          storage_path: effectiveStorageKey,
        },
      },
      create: {
        id: randomUUID(),
        student_id,
        storage_path: effectiveStorageKey,
        ai_valid: aiValid,
        verify_error: verifyError ?? null,
        ai_detail: documentVerify
          ? (documentVerify as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      },
      update: {
        ai_valid: aiValid,
        verify_error: verifyError ?? null,
        ai_detail: documentVerify
          ? (documentVerify as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        checked_at: new Date(),
      },
    });

    return NextResponse.json({
      resolvedStoragePath:
        effectiveStorageKey !== storageKey ? effectiveStorageKey : undefined,
      documentVerify,
      ...(verifyError ? { verifyError } : {}),
      verifyDocumentCall: {
        attempted: true,
        success: !verifyError,
        path: FEATURE7_VERIFY_DOCUMENT_PATH,
        aiServerBaseUrl: aiBase,
        fullUrl: verifyUrl,
      },
    });
  } catch (e) {
    console.error("[verify-uploaded-file]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi verify" },
      { status: 500 },
    );
  }
}
