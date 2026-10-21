/** Trả về chuỗi an toàn để hiển thị (tránh render object làm React child) */
export function safeText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "object" && v !== null) {
    const o = v as Record<string, unknown>;
    if (typeof o.description === "string") return o.description;
    if (typeof o.text === "string") return o.text;
    if (typeof o.summary === "string") return o.summary;
    if (typeof o.feedback === "string") return o.feedback;
    if (typeof o.specific_rec_name === "string") return o.specific_rec_name;
    if (typeof o.reason === "string") return o.reason;
    if (typeof o.priority === "string") return o.priority;
    return JSON.stringify(v);
  }
  return String(v);
}
