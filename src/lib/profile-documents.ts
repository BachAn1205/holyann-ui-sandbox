/**
 * Phân tách file «Quản lý CV» (thư mục S3 `cvs`) khỏi tài liệu đính kèm profile / modal học thuật.
 */
export function isCvSlotUploadDocument(doc: { id: string; url?: string }): boolean {
  const id = doc.id || "";
  if (id.includes("/cvs/")) return true;
  const u = doc.url?.trim() ?? "";
  if (!u) return false;
  if (/\/cvs\//i.test(u)) return true;
  const lower = u.toLowerCase();
  if (lower.includes("%2fcvs%2f") || lower.includes("%2fcvs/")) return true;
  return false;
}

/** Chỉ tài liệu minh chứng / modal cập nhật hồ sơ (không gồm file CV slot). */
export function filterProfileAttachmentDocuments<T extends { id: string; url?: string }>(
  docs: T[],
): T[] {
  return docs.filter((d) => !isCvSlotUploadDocument(d));
}
