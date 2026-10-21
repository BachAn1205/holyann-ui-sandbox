/**
 * FastAPI holyann trả JSON trực tiếp; một số proxy cũ bọc { success, data }.
 * Dùng hàm này để nhận đúng body trong mọi trường hợp.
 */
export function unwrapFastApiBody<T>(raw: unknown): T {
  if (raw != null && typeof raw === "object" && "data" in (raw as object)) {
    const r = raw as { data?: T };
    if (r.data !== undefined) return r.data as T;
  }
  return raw as T;
}
