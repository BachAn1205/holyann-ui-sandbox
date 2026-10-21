import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import {
  uploadFileServerAction,
  listStudentDocumentsMerged,
  deleteFileServerAction,
} from '@/actions/upload';
import {
  callVerifyDocument,
  FEATURE7_VERIFY_DOCUMENT_PATH,
  getResolvedAIServerBaseUrl,
} from '@/lib/ai-api-client';
import { authOptions } from '@/lib/auth/auth-config';
import { prisma } from '@/lib/prisma';
import {
  deleteS3ObjectByPublicUrlForUser,
  extractS3KeyFromPublicUrl,
  publicUrlForS3Key,
} from '@/lib/s3-storage';
import type { SubscriptionPlan } from '@/lib/api/require-premium';
import { completeCvChecklistTask } from '@/lib/checklist-helper';
import { getMaxCvUploadSlots } from '@/lib/cv-upload-slots';
export const maxDuration = 120;

const MAX_CV_UPLOAD_BYTES = 25 * 1024 * 1024;

function formatMb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function normalizePlan(raw: string | null | undefined): SubscriptionPlan {
  const upper = (raw ?? 'FREE').toString().trim().toUpperCase();
  if (['FREE', 'PLUS', 'PREMIUM'].includes(upper)) return upper as SubscriptionPlan;
  return 'FREE';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ student_id: string }> }
) {
  try {
    const { student_id } = await params;
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;
    if (!sessionUserId || String(sessionUserId) !== String(student_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = (formData.get('documentType') as string) || 'cv';
    const slotIndexRaw = formData.get('slot_index');

    if (!file) {
      return NextResponse.json(
        { error: 'Không có file được tải lên' },
        { status: 400 }
      );
    }

    if (typeof file.size === 'number' && file.size > MAX_CV_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error: `File quá lớn (${formatMb(file.size)}). Giới hạn hiện tại là ${formatMb(MAX_CV_UPLOAD_BYTES)}.`,
          code: 'FILE_TOO_LARGE',
          maxBytes: MAX_CV_UPLOAD_BYTES,
          advice:
            'Hãy thử xuất PDF dạng text (không scan), hoặc nén/giảm dung lượng file rồi upload lại.',
        },
        { status: 413 },
      );
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Chỉ chấp nhận file PDF, DOC, DOCX hoặc ảnh JPG, PNG, WebP' },
        { status: 400 }
      );
    }

    if (slotIndexRaw != null && slotIndexRaw !== '') {
      const slotIndex = typeof slotIndexRaw === 'string' ? parseInt(slotIndexRaw, 10) : Number(slotIndexRaw);
      const user = await prisma.users.findUnique({
        where: { id: student_id },
        select: { subscription_plan: true },
      });
      const plan = normalizePlan(user?.subscription_plan as string);
      const maxSlots = getMaxCvUploadSlots(plan);
      if (!Number.isInteger(slotIndex) || slotIndex < 1 || slotIndex > maxSlots) {
        return NextResponse.json(
          { error: `slot_index phải từ 1 đến ${maxSlots} theo gói của bạn` },
          { status: 400 }
        );
      }
    }

    const category = documentType === 'certificate' ? 'certificates' : 'cvs';
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const safeName = (file.name || 'document.pdf').slice(0, 255);
    const uploadFormData = new FormData();
    uploadFormData.append(
      'file',
      new File([fileBuffer], safeName, { type: file.type }),
    );
    uploadFormData.append('userId', student_id);
    uploadFormData.append('category', category);

    const result = await uploadFileServerAction(uploadFormData);

    if (!result.success) {
      // Normalize size error from server action to HTTP 413 for clearer client handling.
      const err = (result.error || '').toLowerCase();
      if (err.includes('exceeds maximum') || err.includes('too large')) {
        return NextResponse.json(
          {
            error: `File quá lớn. Giới hạn hiện tại là ${formatMb(MAX_CV_UPLOAD_BYTES)}.`,
            code: 'FILE_TOO_LARGE',
            maxBytes: MAX_CV_UPLOAD_BYTES,
            advice:
              'Hãy thử xuất PDF dạng text (không scan), hoặc nén/giảm dung lượng file rồi upload lại.',
          },
          { status: 413 },
        );
      }
      return NextResponse.json(
        { error: result.error || 'Lỗi khi upload' },
        { status: 500 }
      );
    }

    const fileUrl = result.url!;
    const storagePath = result.path;

    if (slotIndexRaw != null && slotIndexRaw !== '' && documentType === 'cv') {
      const slotIndex = typeof slotIndexRaw === 'string' ? parseInt(slotIndexRaw, 10) : Number(slotIndexRaw);
      const fileName = safeName;
      await prisma.student_cv_documents.upsert({
        where: {
          student_id_slot_index: { student_id, slot_index: slotIndex },
        },
        create: {
          id: randomUUID(),
          student_id,
          slot_index: slotIndex,
          file_url: fileUrl,
          storage_path: storagePath ?? null,
          file_name: fileName,
          cv_verified_at: null,
          cv_validation: Prisma.JsonNull,
        },
        update: {
          file_url: fileUrl,
          storage_path: storagePath ?? null,
          file_name: fileName,
          uploaded_at: new Date(),
          cv_verified_at: null,
          cv_validation: Prisma.JsonNull,
        },
      });
      const cvCount = await prisma.student_cv_documents.count({ where: { student_id } });
      if (cvCount >= 1) await completeCvChecklistTask(student_id);
    }

    let documentVerify: Record<string, unknown> | null = null;
    let verifyError: string | undefined;
    const aiBase = getResolvedAIServerBaseUrl();
    const verifyUrl = `${aiBase}${FEATURE7_VERIFY_DOCUMENT_PATH}`;
    console.info('[upload-cv] Gọi FastAPI (server → server-ai):', verifyUrl);
    try {
      // Tránh gửi file quá lớn dạng base64 để verify-document (dễ timeout/memory).
      if (fileBuffer.length > 10 * 1024 * 1024) {
        verifyError =
          `Bỏ qua kiểm tra AI vì file lớn (${formatMb(fileBuffer.length)}).`;
      } else {
        documentVerify = (await callVerifyDocument({
          file_base64: fileBuffer.toString('base64'),
          filename: safeName,
        })) as Record<string, unknown>;
      }
      console.info(
        '[upload-cv] verify-document OK, valid=',
        (documentVerify as { valid?: unknown })?.valid,
      );
    } catch (verifyErr) {
      verifyError =
        verifyErr instanceof Error ? verifyErr.message : 'Verify thất bại';
      console.error('[upload-cv] verify-document lỗi:', verifyErr);
    }

    if (storagePath) {
      const aiValid =
        documentVerify &&
        typeof (documentVerify as { valid?: unknown }).valid === 'boolean'
          ? (documentVerify as { valid: boolean }).valid
          : null;
      await prisma.student_document_verifications.upsert({
        where: {
          student_id_storage_path: {
            student_id,
            storage_path: storagePath,
          },
        },
        create: {
          id: randomUUID(),
          student_id,
          storage_path: storagePath,
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
    }

    return NextResponse.json({
      success: true,
      fileUrl,
      storagePath,
      message:
        documentType === 'certificate'
          ? 'Tải file thành tích lên thành công'
          : 'Upload tài liệu thành công',
      /** Luôn có: Next.js gọi FastAPI (không phải trình duyệt); xem Network → Response của POST này */
      verifyDocumentCall: {
        attempted: true,
        success: !verifyError,
        method: 'POST',
        path: FEATURE7_VERIFY_DOCUMENT_PATH,
        aiServerBaseUrl: aiBase,
        fullUrl: verifyUrl,
      },
      documentVerify,
      ...(verifyError ? { verifyError } : {}),
    });
  } catch (error) {
    console.error('❌ Error uploading CV:', error);
    return NextResponse.json(
      { error: 'Lỗi khi upload CV' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ student_id: string }> }
) {
  try {
    const { student_id } = await params;
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;
    if (!sessionUserId || String(sessionUserId) !== String(student_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const documents = await listStudentDocumentsMerged(student_id);
    const pathKeys = [...new Set(documents.flatMap((d) => [d.id, d.url].filter(Boolean) as string[]))];
    const verRows =
      pathKeys.length === 0
        ? []
        : await prisma.student_document_verifications.findMany({
            where: {
              student_id,
              storage_path: { in: pathKeys },
            },
          });
    const byPath = new Map(
      verRows.map((r) => [r.storage_path, r] as const),
    );
    return NextResponse.json(
      documents.map(({ mtime, ...d }) => {
        const v = byPath.get(d.id);
        return {
          ...d,
          verifyValid: v?.ai_valid ?? null,
          verifyError: v?.verify_error ?? null,
        };
      }),
    );
  } catch (error) {
    console.error('❌ Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Lỗi khi lấy danh sách tài liệu' },
      { status: 500 }
    );
  }
}

function safeDecodeQuery(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function stripQueryAndHash(url: string): string {
  return url.split('#')[0]?.split('?')[0] ?? url;
}

function pruneJsonUrls(value: unknown, targets: Set<string>): unknown {
  if (value == null) return value;
  if (typeof value === 'string') {
    const v = value.trim();
    if (!v) return value;
    if (targets.has(v) || targets.has(stripQueryAndHash(v))) {
      return undefined;
    }
    return value;
  }
  if (Array.isArray(value)) {
    const arr = value
      .map((item) => pruneJsonUrls(item, targets))
      .filter((item) => item !== undefined);
    return arr;
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const next = pruneJsonUrls(v, targets);
      if (next !== undefined) out[k] = next;
    }
    return out;
  }
  return value;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ student_id: string }> }
) {
  try {
    const { student_id } = await params;
    const session = await getServerSession(authOptions);
    const sessionUserId = (session?.user as { id?: string })?.id ?? (session?.user as { user_id?: string })?.user_id;
    if (!sessionUserId || String(sessionUserId) !== String(student_id)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const idRaw = searchParams.get('id');
    const publicUrlParam = searchParams.get('url');
    if (!idRaw?.trim()) {
      return NextResponse.json(
        { error: 'Thiếu id tài liệu' },
        { status: 400 }
      );
    }
    const id = safeDecodeQuery(idRaw.trim());
    const urlExtra = publicUrlParam ? safeDecodeQuery(publicUrlParam.trim()) : null;

    const allowedPrefix = `uploads/students/${student_id}/`;
    const bucketName = process.env.AWS_S3_BUCKET_NAME?.trim();

    /** Suy key S3: doc.id có thể là key hoặc URL đầy đủ (merge từ JSON học thuật). */
    let resolvedKey: string | null = null;
    if (id.startsWith(allowedPrefix)) {
      resolvedKey = id;
    } else if (bucketName && /^https?:\/\//i.test(id)) {
      const k = extractS3KeyFromPublicUrl(id, bucketName);
      if (k?.startsWith(allowedPrefix)) resolvedKey = k;
    }
    if (!resolvedKey && urlExtra && bucketName && /^https?:\/\//i.test(urlExtra)) {
      const k = extractS3KeyFromPublicUrl(urlExtra, bucketName);
      if (k?.startsWith(allowedPrefix)) resolvedKey = k;
    }

    let deleted = false;
    let lastError = '';

    if (resolvedKey) {
      const delResult = await deleteFileServerAction(resolvedKey);
      if (delResult.success) {
        deleted = true;
      } else {
        lastError = delResult.error || '';
      }
    }

    if (!deleted) {
      for (const u of [id, urlExtra].filter(
        (x): x is string => typeof x === 'string' && /^https?:\/\//i.test(x),
      )) {
        const r = await deleteS3ObjectByPublicUrlForUser(student_id, u);
        if (r === 'deleted') {
          deleted = true;
          if (!resolvedKey && bucketName) {
            resolvedKey =
              extractS3KeyFromPublicUrl(u, bucketName) ?? resolvedKey;
          }
          break;
        }
        if (r === 'forbidden') {
          return NextResponse.json(
            { error: 'Tài liệu không thuộc tài khoản này' },
            { status: 403 },
          );
        }
        if (typeof r === 'object' && r.error) lastError = r.error;
      }
    }

    if (!deleted) {
      return NextResponse.json(
        {
          error:
            lastError ||
            'Không xóa được file (id phải là key S3 uploads/students/... hoặc URL file trên bucket).',
        },
        { status: 400 },
      );
    }

    const cleanupPaths = new Set<string>();
    if (resolvedKey) cleanupPaths.add(resolvedKey);
    cleanupPaths.add(id);
    if (urlExtra) cleanupPaths.add(urlExtra);
    if (bucketName) {
      for (const p of [id, urlExtra].filter(Boolean) as string[]) {
        if (/^https?:\/\//i.test(p)) {
          const k = extractS3KeyFromPublicUrl(p, bucketName);
          if (k) cleanupPaths.add(k);
        }
      }
    }

    await prisma.student_document_verifications.deleteMany({
      where: {
        student_id,
        storage_path: { in: [...cleanupPaths] },
      },
    });

    // Đồng bộ dữ liệu học thuật: nếu URL minh chứng đã bị xóa thì loại khỏi JSON để tránh "xóa xong vẫn hiện".
    const academic = await prisma.student_academic_profiles.findUnique({
      where: { student_id },
      select: {
        proof_images: true,
        gpa_transcript_details: true,
        english_certificates: true,
        standardized_tests: true,
      },
    });
    if (academic) {
      const urlTargets = new Set<string>();
      for (const p of cleanupPaths) {
        if (!p) continue;
        urlTargets.add(p);
        if (/^https?:\/\//i.test(p)) {
          urlTargets.add(stripQueryAndHash(p));
        }
      }
      if (resolvedKey) {
        try {
          const pub = publicUrlForS3Key(resolvedKey);
          urlTargets.add(pub);
          urlTargets.add(stripQueryAndHash(pub));
        } catch {
          // ignore
        }
      }
      const nextProof = pruneJsonUrls(academic.proof_images, urlTargets);
      const nextGpa = pruneJsonUrls(academic.gpa_transcript_details, urlTargets);
      const nextEnglish = pruneJsonUrls(academic.english_certificates, urlTargets);
      const nextStd = pruneJsonUrls(academic.standardized_tests, urlTargets);

      await prisma.student_academic_profiles.update({
        where: { student_id },
        data: {
          proof_images: (nextProof ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          gpa_transcript_details: (nextGpa ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          english_certificates: (nextEnglish ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          standardized_tests: (nextStd ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        },
      });
    }

    return NextResponse.json({ success: true, message: 'Đã xóa tài liệu' });
  } catch (error) {
    console.error('❌ Error deleting document:', error);
    return NextResponse.json(
      { error: 'Lỗi khi xóa tài liệu' },
      { status: 500 }
    );
  }
}
