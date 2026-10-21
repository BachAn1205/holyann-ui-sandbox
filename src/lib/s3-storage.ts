import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

export function getRequiredS3Env(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

let cachedS3Client: S3Client | null = null;

export function createS3Client(): S3Client {
  if (cachedS3Client) {
    return cachedS3Client;
  }
  cachedS3Client = new S3Client({
    region: getRequiredS3Env('AWS_REGION'),
    credentials: {
      accessKeyId: getRequiredS3Env('AWS_ACCESS_KEY_ID'),
      secretAccessKey: getRequiredS3Env('AWS_SECRET_ACCESS_KEY'),
    },
  });
  return cachedS3Client;
}

export function buildPublicFileUrl(
  bucketName: string,
  region: string,
  key: string
) {
  const customBaseUrl = process.env.AWS_S3_PUBLIC_BASE_URL?.trim()
  if (customBaseUrl) {
    return `${customBaseUrl.replace(/\/+$/, '')}/${key}`
  }
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`
}

/** URL công khai cho một S3 key (bucket/env hiện tại). */
export function publicUrlForS3Key(key: string): string {
  const bucketName = getRequiredS3Env('AWS_S3_BUCKET_NAME')
  const region = getRequiredS3Env('AWS_REGION')
  return buildPublicFileUrl(bucketName, region, key)
}

export async function s3PutPublicObject(
  key: string,
  body: Buffer,
  contentType: string
) {
  const client = createS3Client()
  const bucket = getRequiredS3Env('AWS_S3_BUCKET_NAME')
  
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          ACL: 'public-read',
        })
      );
      return; // Success
    } catch (error: any) {
      const isDnsError = error.code === 'EAI_AGAIN' || error.message?.includes('EAI_AGAIN');
      if (attempt === maxRetries || !isDnsError) {
        throw error;
      }
      console.warn(`[s3PutPublicObject] DNS EAI_AGAIN error, retrying attempt ${attempt}...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

export async function s3ListObjectsUnderPrefix(prefix: string): Promise<
  Array<{
    key: string
    size: number
    lastModified: number
  }>
> {
  const client = createS3Client()
  const bucket = getRequiredS3Env('AWS_S3_BUCKET_NAME')
  const out: Array<{ key: string; size: number; lastModified: number }> = []
  let ContinuationToken: string | undefined
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken,
      })
    )
    for (const obj of res.Contents ?? []) {
      if (!obj.Key || obj.Key.endsWith('/')) continue
      out.push({
        key: obj.Key,
        size: obj.Size ?? 0,
        lastModified: (obj.LastModified ?? new Date()).getTime(),
      })
    }
    ContinuationToken = res.IsTruncated
      ? res.NextContinuationToken
      : undefined
  } while (ContinuationToken)
  return out
}

export async function s3DeleteObject(key: string) {
  const client = createS3Client()
  const bucket = getRequiredS3Env('AWS_S3_BUCKET_NAME')
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

/** Đọc object qua SDK (ổn định hơn fetch URL công khai — tránh 400/403 từ CDN/edge). */
export async function s3GetObjectBuffer(key: string): Promise<Buffer> {
  const client = createS3Client()
  const bucket = getRequiredS3Env('AWS_S3_BUCKET_NAME')
  const res = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  )
  const body = res.Body
  if (!body) {
    throw new Error('S3 GetObject: empty body')
  }
  const bytes = await body.transformToByteArray()
  return Buffer.from(bytes)
}

function isVirtualHostedBucketHost(hostname: string, bucketName: string) {
  const h = hostname.toLowerCase()
  const b = bucketName.toLowerCase()
  if (h === `${b}.s3.amazonaws.com`) return true
  return h.startsWith(`${b}.s3.`) && h.endsWith('.amazonaws.com')
}

/**
 * Parse S3 object key từ URL công khai (custom domain hoặc virtual-hosted).
 */
export function extractS3KeyFromPublicUrl(
  publicUrl: string,
  bucketName: string
): string | null {
  let u: URL
  try {
    u = new URL(publicUrl)
  } catch {
    return null
  }

  const customBase = process.env.AWS_S3_PUBLIC_BASE_URL?.trim()
  if (customBase) {
    const base = customBase.replace(/\/+$/, '')
    if (publicUrl.startsWith(base + '/') || publicUrl === base) {
      const rest =
        publicUrl === base ? '' : publicUrl.slice(base.length + 1)
      return rest.replace(/^\/+/, '') || null
    }
  }

  if (isVirtualHostedBucketHost(u.hostname, bucketName)) {
    const path = u.pathname.replace(/^\/+/, '')
    return path || null
  }

  if (/\.amazonaws\.com$/i.test(u.hostname) && u.hostname.startsWith('s3')) {
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts[0] === bucketName && parts.length > 1) {
      return parts.slice(1).join('/')
    }
  }

  return null
}

/**
 * Xóa object nếu URL thuộc bucket và key nằm dưới uploads/users/{userId}/ hoặc uploads/students/{userId}/.
 */
export async function deleteS3ObjectByPublicUrlForUser(
  userId: string,
  publicUrl: string | null | undefined
): Promise<'deleted' | 'skipped' | 'forbidden' | { error: string }> {
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

  const okPrefix =
    key.startsWith(`uploads/users/${userId}/`) ||
    key.startsWith(`uploads/students/${userId}/`)
  if (!okPrefix) {
    return 'forbidden'
  }

  try {
    await s3DeleteObject(key)
    return 'deleted'
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'S3 delete failed' }
  }
}

/**
 * Xóa nhiều file bài nộp học viên (deadline/checklist) trên S3; dedupe URL.
 * Lỗi S3 chỉ log — không throw (DB vẫn được dọn).
 */
export async function tryDeleteStudentSubmissionFilesFromUrls(
  studentId: string,
  urls: Iterable<string | null | undefined>,
): Promise<void> {
  const seen = new Set<string>()
  for (const raw of urls) {
    const u = typeof raw === 'string' ? raw.trim() : ''
    if (!u || seen.has(u)) continue
    seen.add(u)
    const r = await deleteS3ObjectByPublicUrlForUser(studentId, u)
    if (typeof r === 'object' && r !== null && 'error' in r) {
      console.warn(
        '[tryDeleteStudentSubmissionFilesFromUrls]',
        studentId,
        u.slice(0, 80),
        r.error,
      )
    }
  }
}
