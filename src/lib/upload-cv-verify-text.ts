/**
 * Mô tả cho toast sau POST upload-cv (server đã gọi feature7 verify-document).
 */
export function getUploadCvVerifyDescription(result: {
  verifyError?: string;
  documentVerify?: Record<string, unknown> | null;
}): string {
  const base = "Tài liệu đã được lưu.";
  if (result.verifyError) {
    const msg = result.verifyError.slice(0, 160);
    return `${base} Kiểm tra AI: không hoàn tất — ${msg}${result.verifyError.length > 160 ? "…" : ""}`;
  }
  const dv = result.documentVerify;
  if (!dv || typeof dv !== "object") return base;
  if (dv.valid === true) {
    return `${base} Kiểm tra AI: đạt (nội dung đọc được).`;
  }
  const reasons = dv.reasons;
  const first =
    Array.isArray(reasons) && reasons[0] != null
      ? String(reasons[0])
      : "Nội dung chưa đạt kiểm tra.";
  return `${base} Kiểm tra AI: chưa đạt — ${first}`;
}
