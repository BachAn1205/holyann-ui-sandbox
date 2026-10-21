import { prisma } from "@/lib/prisma";
import {
  extractS3KeyFromPublicUrl,
  publicUrlForS3Key,
  s3GetObjectBuffer,
  s3ListObjectsUnderPrefix,
} from "@/lib/s3-storage";

function canReadS3WithSdk(): boolean {
  return Boolean(
    process.env.AWS_S3_BUCKET_NAME?.trim() &&
    process.env.AWS_REGION?.trim() &&
    process.env.AWS_ACCESS_KEY_ID?.trim() &&
    process.env.AWS_SECRET_ACCESS_KEY?.trim(),
  );
}

/**
 * Key object trong bucket từ `file_url`.
 * - Chuỗi thuần `uploads/students|users/...`
 * - Mọi URL https có pathname bắt đầu bằng `/uploads/students|users/` (CDN, CloudFront, domain tùy chỉnh — `extractS3KeyFromPublicUrl` không nhận diện được).
 * - URL virtual-hosted S3 / `AWS_S3_PUBLIC_BASE_URL` (như cũ).
 */
function resolveCvS3Key(fileUrl: string): string | null {
  const t = fileUrl.trim();
  if (!t) return null;
  const noQuery = t.split("?")[0] ?? t;
  if (/^uploads\/(students|users)\//.test(noQuery)) return noQuery;

  if (/^https?:\/\//i.test(t)) {
    try {
      const u = new URL(t);
      let path = u.pathname.replace(/^\/+/, "");
      try {
        path = decodeURIComponent(path);
      } catch {
        /* giữ path gốc */
      }
      if (/^uploads\/(students|users)\//.test(path)) {
        return path.split("?")[0];
      }
    } catch {
      /* không phải URL */
    }
  }

  const bucket = process.env.AWS_S3_BUCKET_NAME?.trim();
  if (!bucket || !/^https?:\/\//i.test(t)) return null;
  return extractS3KeyFromPublicUrl(t, bucket);
}

/**
 * CDN đôi khi thêm prefix (path không bắt đầu bằng `/uploads/...`) — tìm chuỗi key trong toàn bộ URL.
 */
function resolveCvS3KeyLoose(fileUrl: string): string | null {
  const raw = fileUrl.trim();
  if (!raw) return null;
  let t = raw;
  try {
    t = decodeURIComponent(raw);
  } catch {
    /* giữ nguyên */
  }
  const m = t.match(/(uploads\/(?:students|users)\/[^\s?#]+)/);
  if (!m?.[1]) return null;
  let key = m[1].replace(/\/+$/, "");
  try {
    key = decodeURIComponent(key);
  } catch {
    /* */
  }
  return key || null;
}

/** Khớp `uploadFileServerAction`: `timestamp_sanitizedName` trong key S3. */
function sanitizedCvBaseName(originalFileName: string): string {
  return originalFileName.replace(/[^a-zA-Z0-9.]/g, "_").toLowerCase();
}

/**
 * Khi `file_url` trong DB sai/không parse được: list `uploads/students/{id}/cvs/` và tìm object theo tên file.
 */
/** Key đã lưu lúc upload (`uploadFileServerAction` → `path`). */
function normalizeDbStorageKey(raw: string | null | undefined): string | null {
  const t = raw?.trim();
  if (!t) return null;
  const noQuery = t.split("?")[0] ?? t;
  if (/^uploads\/(students|users)\//.test(noQuery)) return noQuery;
  return null;
}

async function findCvS3KeyByListing(
  studentId: string,
  originalFileName: string,
): Promise<string | null> {
  const base = (originalFileName || "cv.pdf").trim() || "cv.pdf";
  const clean = sanitizedCvBaseName(base);
  if (!clean) return null;
  try {
    const prefix = `uploads/students/${studentId}/cvs/`;
    const objects = await s3ListObjectsUnderPrefix(prefix);
    if (objects.length === 0) return null;
    const lower = clean.toLowerCase();
    const matching = objects.filter((o) => {
      const k = o.key.toLowerCase();
      return k.endsWith(`_${lower}`) || k.endsWith(lower);
    });
    const pool = matching.length > 0 ? matching : objects;
    pool.sort((a, b) => b.lastModified - a.lastModified);
    return pool[0]?.key ?? null;
  } catch (e) {
    console.warn("[findCvS3KeyByListing]", e);
    return null;
  }
}

async function fetchFileAsBase64(
  fileUrl: string,
  fileName: string,
  studentUserId?: string,
  storagePathFromDb?: string | null,
): Promise<{ file_base64: string; filename: string }> {
  let key =
    normalizeDbStorageKey(storagePathFromDb) ??
    resolveCvS3Key(fileUrl) ??
    resolveCvS3KeyLoose(fileUrl);

  if (key && normalizeDbStorageKey(storagePathFromDb)) {
    console.info(
      "[fetchFileAsBase64] Dùng storage_path từ DB:",
      key.slice(0, 96),
    );
  }

  if (!key && studentUserId && canReadS3WithSdk()) {
    key = await findCvS3KeyByListing(studentUserId, fileName);
    if (key) {
      console.info(
        "[fetchFileAsBase64] S3 key từ list prefix cvs/:",
        key.slice(0, 80),
      );
    }
  }

  const outName = fileName || "cv.pdf";

  let s3Err: string | null = null;
  if (key && canReadS3WithSdk()) {
    try {
      const buf = await s3GetObjectBuffer(key);
      return {
        file_base64: buf.toString("base64"),
        filename: outName,
      };
    } catch (e) {
      s3Err = e instanceof Error ? e.message : String(e);
      console.warn("[fetchFileAsBase64] S3 GetObject failed, try HTTP:", e);
    }
  } else if (key && !canReadS3WithSdk()) {
    console.warn(
      "[fetchFileAsBase64] Có S3 key nhưng thiếu biến môi trường AWS — chỉ thử HTTP",
    );
  }

  /** Có key → luôn ưu tiên URL chuẩn của bucket (tránh CDN/URL trong DB trả 400). */
  let fetchUrl: string;
  if (key) {
    try {
      fetchUrl = publicUrlForS3Key(key);
    } catch {
      fetchUrl = fileUrl.trim();
    }
  } else {
    fetchUrl = fileUrl.trim();
    if (!/^https?:\/\//i.test(fetchUrl)) {
      throw new Error(
        "URL file CV không hợp lệ (cần http(s) hoặc cấu hình AWS để đọc S3)",
      );
    }
  }

  const res = await fetch(fetchUrl, {
    cache: "no-store",
    headers: {
      Accept: "*/*",
      "User-Agent": "Mozilla/5.0 (compatible; HoexServer/1.0; +cv-analysis)",
    },
  });
  if (!res.ok) {
    const s3Hint = s3Err
      ? ` S3 SDK: ${s3Err}`
      : key && !canReadS3WithSdk()
        ? " (thiếu AWS_* env — không đọc được qua SDK)"
        : "";
    const noKeyHint =
      !key && studentUserId
        ? " (không suy ra được key S3 từ URL; đã thử list uploads/students/.../cvs/)"
        : !key
          ? " (không suy ra được key S3 từ URL)"
          : "";
    const hint =
      res.status === 400
        ? ` (HTTP 400 — URL có thể không hợp lệ hoặc CDN chặn server)${s3Hint}${noKeyHint}`
        : `${s3Hint}${noKeyHint}`;
    throw new Error(`Không tải được file CV (${res.status})${hint}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    file_base64: buf.toString("base64"),
    filename: outName,
  };
}

function profileScoreFromAnalysis(
  pa: {
    score_aca: number | null;
    score_lan: number | null;
    score_hdnk: number | null;
    score_skill: number | null;
  } | null,
): number {
  if (!pa) return 75;
  const xs = [pa.score_aca, pa.score_lan, pa.score_hdnk, pa.score_skill].filter(
    (x): x is number => typeof x === "number" && !Number.isNaN(x),
  );
  if (xs.length === 0) return 75;
  const avg = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.min(100, Math.round(avg * 20));
}

/**
 * Context cho FastAPI Feature 7 — `target_program` + `profile_detail` (benchmark).
 */
export async function loadCvFeature7Context(studentUserId: string): Promise<{
  target_program: Record<string, unknown>;
  profile_detail: Record<string, unknown>;
}> {
  const [student, goal, pa, sap] = await Promise.all([
    prisma.students.findUnique({
      where: { user_id: studentUserId },
      select: {
        target_faculty_name: true,
        target_university_name: true,
      },
    }),
    prisma.student_target_goals.findFirst({
      where: { student_id: studentUserId },
      orderBy: { sort_order: "asc" },
      select: { faculty_name: true, university_name: true },
    }),
    prisma.profile_analyses.findFirst({
      where: { student_id: studentUserId },
      orderBy: { created_at: "desc" },
      select: {
        score_aca: true,
        score_lan: true,
        score_hdnk: true,
        score_skill: true,
      },
    }),
    prisma.student_academic_profiles.findUnique({
      where: { student_id: studentUserId },
      select: { gpa_transcript_details: true },
    }),
  ]);

  const major =
    goal?.faculty_name?.trim() || student?.target_faculty_name?.trim() || "";
  const countryOrSchool =
    goal?.university_name?.trim() ||
    student?.target_university_name?.trim() ||
    "";

  let gpaStr = "—";
  const gpaJson = sap?.gpa_transcript_details;
  if (gpaJson && typeof gpaJson === "object") {
    try {
      const s = JSON.stringify(gpaJson);
      if (s.length < 400) gpaStr = s;
    } catch {
      /* ignore */
    }
  }

  return {
    target_program: {
      major,
      degree: "Undergraduate",
      country_or_school: countryOrSchool,
    },
    profile_detail: {
      profile_score: profileScoreFromAnalysis(pa),
      gpa: gpaStr,
    },
  };
}

/**
 * Body JSON cho POST `/api/v1/feature7/analysis-cv` và `verify-cv`.
 */
export async function buildCvFilePayloadForAi(
  cvDocumentId: string,
  studentUserId: string,
): Promise<Record<string, unknown> | null> {
  const doc = await prisma.student_cv_documents.findFirst({
    where: { id: cvDocumentId, student_id: studentUserId },
  });
  if (!doc) return null;

  const { file_base64, filename } = await fetchFileAsBase64(
    doc.file_url,
    doc.file_name,
    studentUserId,
    doc.storage_path,
  );
  const ctx = await loadCvFeature7Context(studentUserId);

  return {
    file_base64,
    filename,
    target_program: ctx.target_program,
    profile_detail: ctx.profile_detail,
  };
}

/**
 * Payload enhance: cần cùng file + context + `analysis_report` từ lần phân tích gần nhất.
 */
export async function buildCvEnhancePayloadForAi(
  cvDocumentId: string,
  studentUserId: string,
  analysisReport: Record<string, unknown>,
  missingContext?: Record<string, unknown>,
): Promise<Record<string, unknown> | null> {
  const base = await buildCvFilePayloadForAi(cvDocumentId, studentUserId);
  if (!base) return null;
  return {
    ...base,
    analysis_report: analysisReport,
    missing_context: missingContext ?? {
      quantified_examples: [],
      timeline_details: "",
    },
  };
}
