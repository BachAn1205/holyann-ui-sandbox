'use server'

import { randomUUID } from 'crypto'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import {
  buildPublicFileUrl,
  createS3Client,
  extractS3KeyFromPublicUrl,
  getRequiredS3Env,
  s3DeleteObject,
} from '@/lib/s3-storage'
import { requireStudentAuth, requireMarketingAuth } from '@/lib/auth-utils'

const ALLOWED_FILE_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

// Keep validation and S3 policy aligned so the browser cannot bypass server checks.
const MAX_FILE_SIZE = 5 * 1024 * 1024

function sanitizeFileName(fileName: string) {
  return (
    fileName
      .split(/[/\\]/)
      .pop()
      ?.replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 120) || 'upload.bin'
  )
}

export type S3UploadSignatureOptions = {
  /**
   * Thư mục con dưới `uploads/students/{id}/academic/` — khớp list Tài liệu đính kèm + nhãn Loại.
   * VD: `gpa-lop-10`, `chung-chi-ngoai-ngu`
   */
  academicSubpath?: string
}

export async function generateS3UploadSignature(
  fileName: string,
  fileType: string,
  fileSize: number,
  options?: S3UploadSignatureOptions
) {
  const user = await requireStudentAuth()

  if (!ALLOWED_FILE_TYPES.has(fileType)) {
    throw new Error('Invalid file type')
  }

  if (fileSize > MAX_FILE_SIZE) {
    throw new Error('File too large')
  }

  const region = getRequiredS3Env('AWS_REGION')
  const bucketName = getRequiredS3Env('AWS_S3_BUCKET_NAME')
  const safeFileName = sanitizeFileName(fileName)
  let s3Key: string
  if (options?.academicSubpath?.trim()) {
    const seg = options.academicSubpath
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'misc'
    s3Key = `uploads/students/${user.id}/academic/${seg}/${Date.now()}-${randomUUID()}-${safeFileName}`
  } else {
    s3Key = `uploads/students/${user.id}/${Date.now()}-${randomUUID()}-${safeFileName}`
  }

  const { url, fields } = await createPresignedPost(createS3Client(), {
    Bucket: bucketName,
    Key: s3Key,
    Expires: 180,
    Fields: {
      key: s3Key,
      acl: 'public-read',
      'Content-Type': fileType,
    },
    Conditions: [
      ['eq', '$key', s3Key],
      ['eq', '$acl', 'public-read'],
      ['eq', '$Content-Type', fileType],
      ['content-length-range', 0, MAX_FILE_SIZE],
    ],
  })

  return {
    url,
    fields,
    fileUrl: buildPublicFileUrl(bucketName, region, s3Key),
    /** Khóa S3 đầy đủ — dùng làm `storagePath` khi verify để khớp `student_document_verifications`. */
    storageKey: s3Key,
  }
}

/** MIME types allowed for profile “Verify tài liệu” (khớp upload-cv / verify-document). */
const PROFILE_VERIFY_ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
])

const PROFILE_VERIFY_MAX_BYTES = 10 * 1024 * 1024

/**
 * Upload file từ API route (verify-document): lưu S3 trước khi gọi FastAPI.
 * `studentId` phải đã được kiểm tra quyền (requireStudentRouteAccess).
 */
export async function uploadProfileVerifyDocumentToS3(params: {
  studentId: string
  fileName: string
  contentType: string
  body: Buffer
}): Promise<{ key: string; fileUrl: string }> {
  const { studentId, fileName, contentType, body } = params
  const ct = contentType?.trim() || 'application/octet-stream'
  if (!PROFILE_VERIFY_ALLOWED_TYPES.has(ct)) {
    throw new Error('Định dạng file không được hỗ trợ cho lưu S3 (profile verify)')
  }
  if (body.length > PROFILE_VERIFY_MAX_BYTES) {
    throw new Error(
      `File vượt quá ${PROFILE_VERIFY_MAX_BYTES / (1024 * 1024)}MB`,
    )
  }

  const region = getRequiredS3Env('AWS_REGION')
  const bucketName = getRequiredS3Env('AWS_S3_BUCKET_NAME')
  const safeFileName = sanitizeFileName(fileName)
  const key = `uploads/students/${studentId}/profile-verify/${Date.now()}-${randomUUID()}-${safeFileName}`

  const client = createS3Client()
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: ct,
      ACL: 'public-read',
    }),
  )

  return { key, fileUrl: buildPublicFileUrl(bucketName, region, key) }
}

export type DeleteStudentS3Outcome =
  | 'deleted'
  | 'skipped'
  | 'forbidden'
  | { error: string }

/**
 * Xóa object trên S3 nếu `publicUrl` trỏ đúng bucket và key có prefix
 * `uploads/students/{studentId}/`. URL không phải S3 của app → bỏ qua (skipped).
 */
export async function deleteStudentS3ObjectByPublicUrl(
  studentId: string,
  publicUrl: string | null | undefined
): Promise<DeleteStudentS3Outcome> {
  const trimmed = typeof publicUrl === 'string' ? publicUrl.trim() : ''
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return 'skipped'
  }

  let bucketName: string
  try {
    bucketName = getRequiredS3Env('AWS_S3_BUCKET_NAME')
    getRequiredS3Env('AWS_REGION')
    getRequiredS3Env('AWS_ACCESS_KEY_ID')
    getRequiredS3Env('AWS_SECRET_ACCESS_KEY')
  } catch {
    return 'skipped'
  }

  const key = extractS3KeyFromPublicUrl(trimmed, bucketName)
  if (!key) {
    return 'skipped'
  }

  const prefix = `uploads/students/${studentId}/`
  if (!key.startsWith(prefix)) {
    return 'forbidden'
  }

  try {
    await s3DeleteObject(key)
    return 'deleted'
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'S3 delete failed' }
  }
}

export async function generateMarketingS3UploadSignature(
  fileName: string,
  fileType: string,
  fileSize: number
) {
  await requireMarketingAuth()

  if (!ALLOWED_FILE_TYPES.has(fileType)) {
    throw new Error('Invalid file type')
  }

  if (fileSize > MAX_FILE_SIZE) {
    throw new Error('File too large')
  }

  const region = getRequiredS3Env('AWS_REGION')
  const bucketName = getRequiredS3Env('AWS_S3_BUCKET_NAME')
  const safeFileName = sanitizeFileName(fileName)
  
  const s3Key = `uploads/marketing/${Date.now()}-${randomUUID()}-${safeFileName}`

  const { url, fields } = await createPresignedPost(createS3Client(), {
    Bucket: bucketName,
    Key: s3Key,
    Expires: 180,
    Fields: {
      key: s3Key,
      acl: 'public-read',
      'Content-Type': fileType,
    },
    Conditions: [
      ['eq', '$key', s3Key],
      ['eq', '$acl', 'public-read'],
      ['eq', '$Content-Type', fileType],
      ['content-length-range', 0, MAX_FILE_SIZE],
    ],
  })

  return {
    url,
    fields,
    fileUrl: buildPublicFileUrl(bucketName, region, s3Key),
    storageKey: s3Key,
  }
}
