'use server'

import {
  extractS3KeyFromPublicUrl,
  publicUrlForS3Key,
  s3DeleteObject,
  s3ListObjectsUnderPrefix,
  s3PutPublicObject,
} from '@/lib/s3-storage'
import {
  collectLabeledProofUrlsFromAcademicJson,
  labelForAcademicSlug,
} from '@/lib/academic-proof-labels'
import { prisma } from '@/lib/prisma'
import { requireAuthenticatedUser } from '@/lib/auth-utils'

interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

/** Danh mục tài liệu hồ sơ (list trong Tài liệu đính kèm) — prefix uploads/students/... */
const STUDENT_DOCUMENT_CATEGORIES = new Set([
  'cvs',
  'certificates',
  'academic',
  'deadline-submissions',
  'mock-interview',
])

function buildS3ObjectKey(
  userId: string,
  category: string,
  timestamp: number,
  cleanFileName: string
): string {
  const c = category.replace(/[^a-zA-Z0-9_-]/g, '') || 'misc'
  if (STUDENT_DOCUMENT_CATEGORIES.has(c)) {
    return `uploads/students/${userId}/${c}/${timestamp}_${cleanFileName}`
  }
  return `uploads/users/${userId}/${c}/${timestamp}_${cleanFileName}`
}

export async function uploadFileServerAction(formData: FormData): Promise<UploadResult> {
  try {
    const user = await requireAuthenticatedUser()
    const file = formData.get('file') as File
    const category = (formData.get('category') ||
      formData.get('folder') ||
      'applications') as string
    const userId = user.id

    if (!file) {
      console.error('❌ No file provided in FormData')
      return {
        success: false,
        error: 'No file selected. Please select a file to upload.',
      }
    }

    if (file.size === 0) {
      console.error('❌ Empty file uploaded')
      return {
        success: false,
        error: 'Cannot upload empty file. Please select a valid file.',
      }
    }

    const isMockInterview = category === 'mock-interview'
    // Mock interview clips can include camera + audio for C5 video scoring.
    const maxSize = isMockInterview ? 120 * 1024 * 1024 : 25 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        success: false,
        error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`,
      }
    }

    const audioTypes = [
      'audio/webm',
      'audio/wav',
      'audio/wave',
      'audio/x-wav',
      'audio/ogg',
      'audio/mp4',
      'audio/mpeg',
      'audio/mp3',
    ]

    const videoTypes = [
      'video/webm',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska',
    ]

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/webp',
      ...audioTypes,
      ...videoTypes,
    ]

    const deadlineOnlyTypes = new Set([
      'application/pdf',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/webp',
    ])
    if (category === 'deadline-submissions' && !deadlineOnlyTypes.has(file.type)) {
      return {
        success: false,
        error: 'Chỉ chấp nhận PDF, TXT hoặc ảnh (JPG, PNG, WEBP).',
      }
    }

    if (isMockInterview) {
      const fileType = file.type.toLowerCase()
      const fileName = file.name.toLowerCase()
      const mediaExtensions = [
        '.webm',
        '.wav',
        '.wave',
        '.ogg',
        '.mp3',
        '.m4a',
        '.mp4',
        '.mov',
        '.avi',
        '.mkv',
      ]
      const okMedia =
        audioTypes.includes(fileType) ||
        fileType.startsWith('audio/') ||
        videoTypes.includes(fileType) ||
        fileType.startsWith('video/') ||
        mediaExtensions.some((ext) => fileName.endsWith(ext))
      if (!okMedia) {
        return {
          success: false,
          error:
            'Với phỏng vấn thử chỉ chấp nhận file âm thanh hoặc video (WebM, WAV, OGG, MP3, MP4, MOV, …).',
        }
      }
    } else if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error:
          'File type not allowed. Please upload PDF, DOC, DOCX, TXT, JPG, PNG, or audio/video for mock interview.',
      }
    }

    const timestamp = Date.now()
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase()
    const filePath = buildS3ObjectKey(userId, category, timestamp, cleanFileName)

    const fileArrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(fileArrayBuffer)

    await s3PutPublicObject(filePath, fileBuffer, file.type)

    const publicUrl = publicUrlForS3Key(filePath)

    return {
      success: true,
      url: publicUrl,
      path: filePath,
    }
  } catch (error) {
    console.error('❌ [ServerAction] Upload error:', error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown upload error',
    }
  }
}

export type DocumentType =
  | 'transcript'
  | 'certificate'
  | 'letter'
  | 'essay'
  | 'other'

export interface StudentDocItem {
  id: string
  name: string
  type: DocumentType
  /** Nhãn hiển thị (GPA, chứng chỉ, …) — ưu tiên hơn map type mặc định */
  categoryLabel?: string
  uploadDate: string
  size: string
  mtime: number
  url?: string
  /** Kết quả verify-document (AI); null = chưa có / lỗi kiểm tra */
  verifyValid?: boolean | null
  verifyError?: string | null
}

function classifyDocumentKey(
  key: string,
  studentId: string
): { type: DocumentType; categoryLabel?: string } {
  if (key.includes('/cvs/')) return { type: 'transcript' }
  if (key.includes('/certificates/')) return { type: 'certificate' }
  if (key.includes('/academic/')) {
    const m = key.match(/\/academic\/([^/]+)\//)
    const slug = m?.[1]
    return {
      type: 'other',
      categoryLabel: slug
        ? labelForAcademicSlug(slug)
        : 'Minh chứng học thuật',
    }
  }
  if (key.includes('/profile-verify/')) {
    return { type: 'other', categoryLabel: 'Xác minh hồ sơ' }
  }
  const escaped = studentId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  if (new RegExp(`^uploads/students/${escaped}/[^/]+$`).test(key)) {
    return { type: 'other', categoryLabel: 'Minh chứng (tải lên trước)' }
  }
  return { type: 'other', categoryLabel: 'Tài liệu' }
}

/**
 * Liệt kê file trên S3 theo `studentId`.
 * Gọi từ API route sau khi đã xác thực session — không dùng requireStudentAuth ở đây
 * (getServerSession trong server action gọi từ Route Handler có thể không có session → trả []).
 */
export async function listStudentDocuments(studentId: string): Promise<StudentDocItem[]> {
  try {
    if (!studentId?.trim()) {
      return []
    }
    const items: StudentDocItem[] = []
    let objects: Awaited<ReturnType<typeof s3ListObjectsUnderPrefix>>
    try {
      objects = await s3ListObjectsUnderPrefix(
        `uploads/students/${studentId}/`
      )
    } catch (e) {
      console.warn('[listStudentDocuments] list:', e)
      return []
    }
    for (const obj of objects) {
      const fullPath = obj.key
      if (!fullPath || fullPath.endsWith('/')) continue
      const { type, categoryLabel } = classifyDocumentKey(fullPath, studentId)
      const name = fullPath.split('/').pop() || 'file'
      const mtime = obj.lastModified
      const sizeBytes = obj.size
      const sizeKB = Math.round(sizeBytes / 1024)
      const sizeStr =
        sizeKB >= 1024
          ? `${(sizeKB / 1024).toFixed(1)} MB`
          : `${sizeKB} KB`
      let url: string | undefined
      try {
        url = publicUrlForS3Key(fullPath)
      } catch {
        url = undefined
      }
      items.push({
        id: fullPath,
        name,
        type,
        categoryLabel,
        uploadDate: new Date(mtime).toLocaleDateString('vi-VN'),
        size: sizeStr,
        mtime,
        url,
      })
    }
    items.sort((a, b) => b.mtime - a.mtime)
    return items
  } catch (error) {
    console.error('❌ [listStudentDocuments]', error)
    return []
  }
}

function collectHttpUrlsFromJson(value: unknown, out: Set<string>): void {
  if (value == null) return
  if (typeof value === 'string') {
    const s = value.trim()
    if (/^https?:\/\//i.test(s)) out.add(s)
    return
  }
  if (Array.isArray(value)) {
    value.forEach((v) => collectHttpUrlsFromJson(v, out))
    return
  }
  if (typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((v) =>
      collectHttpUrlsFromJson(v, out),
    )
  }
}

/**
 * Giống listStudentDocuments (S3) + URL minh chứng lưu trong `student_academic_profiles`
 * (proof_images, chứng chỉ, bài test — đồng bộ với modal học thuật).
 */
export async function listStudentDocumentsMerged(
  studentId: string,
): Promise<StudentDocItem[]> {
  const fromS3 = await listStudentDocuments(studentId)
  const seenUrls = new Set(
    fromS3.map((d) => d.url).filter(Boolean) as string[],
  )
  const academic = await prisma.student_academic_profiles.findUnique({
    where: { student_id: studentId },
    select: {
      proof_images: true,
      gpa_transcript_details: true,
      english_certificates: true,
      standardized_tests: true,
      updated_at: true,
    },
  })
  const extraUrls = new Set<string>()
  if (academic) {
    collectHttpUrlsFromJson(academic.proof_images, extraUrls)
    collectHttpUrlsFromJson(academic.gpa_transcript_details, extraUrls)
    collectHttpUrlsFromJson(academic.english_certificates, extraUrls)
    collectHttpUrlsFromJson(academic.standardized_tests, extraUrls)
  }
  const urlLabels = academic
    ? collectLabeledProofUrlsFromAcademicJson({
        proof_images: academic.proof_images,
        english_certificates: academic.english_certificates,
        standardized_tests: academic.standardized_tests,
        gpa_transcript_details: academic.gpa_transcript_details,
      })
    : new Map<string, string>()
  const bucket = process.env.AWS_S3_BUCKET_NAME?.trim()
  const fallbackMtime = academic?.updated_at?.getTime() ?? Date.now()
  const merged = [...fromS3]
  for (const url of extraUrls) {
    if (seenUrls.has(url)) continue
    seenUrls.add(url)
    let id = url
    if (bucket) {
      const key = extractS3KeyFromPublicUrl(url, bucket)
      if (key) id = key
    }
    const rawName = url.split('/').pop()?.split('?')[0] || 'minh-chứng'
    let name = rawName
    try {
      name = decodeURIComponent(rawName)
    } catch {
      name = rawName
    }
    const categoryLabel =
      urlLabels.get(url) ?? 'Thông tin học thuật (hồ sơ)'
    merged.push({
      id,
      name,
      type: 'other',
      categoryLabel,
      uploadDate: new Date(fallbackMtime).toLocaleDateString('vi-VN'),
      size: '—',
      mtime: fallbackMtime,
      url,
    })
  }
  merged.sort((a, b) => b.mtime - a.mtime)
  return merged
}

export async function deleteFileServerAction(
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuthenticatedUser()
    const normalized = filePath.replace(/\\/g, '/')
    const okStudent = normalized.startsWith(`uploads/students/${user.id}/`)
    const okUser = normalized.startsWith(`uploads/users/${user.id}/`)
    if (!okStudent && !okUser) {
      return {
        success: false,
        error: 'Forbidden',
      }
    }

    await s3DeleteObject(normalized)

    return { success: true }
  } catch (error) {
    console.error('❌ [ServerAction] Delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown delete error',
    }
  }
}
