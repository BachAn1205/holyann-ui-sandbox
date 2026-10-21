import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { listStudentDocumentsMerged } from "@/actions/upload";
import { callVerifyDocument } from "@/lib/ai-api-client";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/prisma";
import { filterProfileAttachmentDocuments } from "@/lib/profile-documents";

/** Nhiều file — gọi AI tuần tự */
export const maxDuration = 300;

export async function POST(
  _request: NextRequest,
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

    const documents = filterProfileAttachmentDocuments(
      await listStudentDocumentsMerged(student_id),
    );
    if (documents.length === 0) {
      return NextResponse.json({
        message: "Không có tài liệu để kiểm tra",
        processed: 0,
        summary: { ok: 0, fail: 0, errorOrSkipped: 0 },
        results: [] as const,
      });
    }

    const results: Array<{
      storage_path: string;
      name: string;
      valid: boolean | null;
      verifyError?: string;
    }> = [];

    for (const doc of documents) {
      if (!doc.url) {
        const msg = "Không có URL công khai";
        results.push({
          storage_path: doc.id,
          name: doc.name,
          valid: null,
          verifyError: msg,
        });
        await prisma.student_document_verifications.upsert({
          where: {
            student_id_storage_path: {
              student_id,
              storage_path: doc.id,
            },
          },
          create: {
            id: randomUUID(),
            student_id,
            storage_path: doc.id,
            ai_valid: null,
            verify_error: msg,
            ai_detail: Prisma.JsonNull,
          },
          update: {
            ai_valid: null,
            verify_error: msg,
            ai_detail: Prisma.JsonNull,
            checked_at: new Date(),
          },
        });
        continue;
      }

      let buf: Buffer;
      try {
        const r = await fetch(doc.url, { cache: "no-store" });
        if (!r.ok) throw new Error(`Tải file: HTTP ${r.status}`);
        buf = Buffer.from(await r.arrayBuffer());
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Tải file thất bại";
        results.push({
          storage_path: doc.id,
          name: doc.name,
          valid: null,
          verifyError: msg,
        });
        await prisma.student_document_verifications.upsert({
          where: {
            student_id_storage_path: {
              student_id,
              storage_path: doc.id,
            },
          },
          create: {
            id: randomUUID(),
            student_id,
            storage_path: doc.id,
            ai_valid: null,
            verify_error: msg,
            ai_detail: Prisma.JsonNull,
          },
          update: {
            ai_valid: null,
            verify_error: msg,
            ai_detail: Prisma.JsonNull,
            checked_at: new Date(),
          },
        });
        continue;
      }

      let documentVerify: Record<string, unknown> | null = null;
      let verifyError: string | undefined;
      try {
        documentVerify = (await callVerifyDocument({
          file_base64: buf.toString("base64"),
          filename: doc.name,
        })) as Record<string, unknown>;
      } catch (verifyErr) {
        verifyError =
          verifyErr instanceof Error ? verifyErr.message : "Verify thất bại";
        console.error("[verify-all-documents] AI:", doc.id, verifyErr);
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
            storage_path: doc.id,
          },
        },
        create: {
          id: randomUUID(),
          student_id,
          storage_path: doc.id,
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

      results.push({
        storage_path: doc.id,
        name: doc.name,
        valid: verifyError ? null : aiValid,
        ...(verifyError ? { verifyError } : {}),
      });
    }

    const ok = results.filter((r) => r.valid === true).length;
    const fail = results.filter((r) => r.valid === false).length;
    const errorOrSkipped = results.filter((r) => r.valid === null).length;

    return NextResponse.json({
      processed: documents.length,
      summary: { ok, fail, errorOrSkipped },
      results,
    });
  } catch (e) {
    console.error("[verify-all-documents]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Lỗi kiểm tra" },
      { status: 500 },
    );
  }
}
