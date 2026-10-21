/**
 * Slug thư mục S3: uploads/students/{id}/academic/{slug}/...
 * Hiển thị cột «Loại» trong Tài liệu đính kèm.
 */
export const ACADEMIC_PROOF_SUBPATH_LABELS: Record<string, string> = {
  /** Minh chứng GPA chung (proof_images.gpa) */
  gpa: "GPA (Lớp 9, 10, 11, 12)",
  "gpa-lop-9": "GPA (Lớp 9)",
  "gpa-lop-10": "GPA (Lớp 10)",
  "gpa-lop-11": "GPA (Lớp 11)",
  "gpa-lop-12": "GPA (Lớp 12)",
  "chung-chi-ngoai-ngu": "Chứng chỉ ngoại ngữ",
  "bai-thi-chuan-hoa": "Bài thi chuẩn hóa",
  "bang-diem-mon-hoc": "Bảng điểm môn học",
  "giai-thuong-hoc-thuat": "Giải thưởng học thuật",
  "giai-thuong-phi-hoc-thuat": "Giải thưởng phi học thuật",
  "hoat-dong-hoc-thuat": "Hoạt động học thuật",
  "hoat-dong-phi-hoc-thuat": "Hoạt động phi học thuật",
  "du-an-ca-nhan": "Dự án cá nhân",
  "kinh-nghiem-nghien-cuu": "Kinh nghiệm nghiên cứu",
  "kinh-nghiem-lam-viec": "Kinh nghiệm làm việc",
};

/** Khóa trong `proof_images` JSON → nhãn */
export const PROOF_IMAGES_KEY_LABELS: Record<string, string> = {
  gpa: "GPA (Lớp 9, 10, 11, 12)",
  english_cert: "Chứng chỉ ngoại ngữ",
  standardized_test: "Bài thi chuẩn hóa",
  subject_score: "Bảng điểm môn học",
};

export function labelForAcademicSlug(slug: string): string {
  return ACADEMIC_PROOF_SUBPATH_LABELS[slug] ?? slug.replace(/-/g, " ");
}

/** Gắn nhãn cho URL minh chứng lưu trong JSON academic (proof_images, chứng chỉ, …). */
export function collectLabeledProofUrlsFromAcademicJson(
  academic: {
    proof_images?: unknown;
    english_certificates?: unknown;
    standardized_tests?: unknown;
    gpa_transcript_details?: unknown;
  } | null,
): Map<string, string> {
  const m = new Map<string, string>();
  if (!academic) return m;

  const addUrls = (urls: unknown, label: string) => {
    if (!Array.isArray(urls)) return;
    for (const u of urls) {
      if (typeof u === "string" && /^https?:\/\//i.test(u.trim())) {
        m.set(u.trim(), label);
      }
    }
  };

  if (
    academic.proof_images &&
    typeof academic.proof_images === "object" &&
    !Array.isArray(academic.proof_images)
  ) {
    const pi = academic.proof_images as Record<string, unknown>;
    for (const [k, val] of Object.entries(pi)) {
      const label = PROOF_IMAGES_KEY_LABELS[k] ?? k;
      addUrls(val, label);
    }
  }

  const ec = academic.english_certificates;
  if (Array.isArray(ec)) {
    for (const cert of ec) {
      if (cert && typeof cert === "object" && "proof_images" in cert) {
        addUrls(
          (cert as { proof_images?: unknown }).proof_images,
          "Chứng chỉ ngoại ngữ",
        );
      }
    }
  }

  const st = academic.standardized_tests;
  if (Array.isArray(st)) {
    for (const t of st) {
      if (t && typeof t === "object" && "proof_images" in t) {
        addUrls(
          (t as { proof_images?: unknown }).proof_images,
          "Bài thi chuẩn hóa",
        );
      }
    }
  }

  collectUrlsFromObject(academic.gpa_transcript_details, m, "GPA (Lớp 9–12)");

  return m;
}

function collectUrlsFromObject(
  obj: unknown,
  out: Map<string, string>,
  label: string,
) {
  if (obj == null) return;
  if (typeof obj === "string" && /^https?:\/\//i.test(obj)) {
    out.set(obj.trim(), label);
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v) => collectUrlsFromObject(v, out, label));
    return;
  }
  if (typeof obj === "object") {
    Object.values(obj as Record<string, unknown>).forEach((v) =>
      collectUrlsFromObject(v, out, label),
    );
  }
}
