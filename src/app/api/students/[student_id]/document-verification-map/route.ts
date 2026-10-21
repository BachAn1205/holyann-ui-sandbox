import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth/auth-config";
import { prisma } from "@/lib/prisma";
import { publicUrlForS3Key } from "@/lib/s3-storage";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET_NAME = "hoex-documents";

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : null;

function publicUrlForStoragePath(storagePath: string): string {
  if (storagePath.startsWith("http://") || storagePath.startsWith("https://")) {
    return storagePath;
  }
  /** Tài liệu mới: key S3 */
  if (storagePath.startsWith("uploads/")) {
    try {
      return publicUrlForS3Key(storagePath);
    } catch {
      return storagePath;
    }
  }
  /** Legacy: path trong bucket Supabase hoex-documents */
  if (!supabaseAdmin) return storagePath;
  const { data } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
  return data?.publicUrl ?? storagePath;
}

/**
 * Map URL công khai → trạng thái verify (trùng nguồn với Tài liệu đính kèm / DB).
 */
export async function GET(
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

    const rows = await prisma.student_document_verifications.findMany({
      where: { student_id },
    });

    const entries = rows.map((r) => ({
      url: publicUrlForStoragePath(r.storage_path),
      storagePath: r.storage_path,
      verifyValid: r.ai_valid ?? null,
      verifyError: r.verify_error ?? null,
    }));

    return NextResponse.json({ entries });
  } catch (e) {
    console.error("[document-verification-map]", e);
    return NextResponse.json(
      { error: "Lỗi tải trạng thái xác minh" },
      { status: 500 },
    );
  }
}
