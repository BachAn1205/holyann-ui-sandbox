"use client";

import React from "react";

/** Cùng logic với cột « Xác minh (AI) » ở Tài liệu đính kèm — dùng cho file minh chứng trong modal. */
export function VerifyStatusBadge({
  verifyValid,
  verifyError,
}: {
  verifyValid?: boolean | null;
  verifyError?: string | null;
}) {
  const errHint = verifyError?.trim();
  if (verifyValid === true) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 text-[11px] font-medium">
        Đã xác minh
      </span>
    );
  }
  if (verifyValid === false) {
    return (
      <span
        className="inline-flex items-center rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-200 px-2 py-0.5 text-[11px] font-medium max-w-[140px] truncate"
        title={errHint || "Nội dung chưa đạt kiểm tra AI"}
      >
        Chưa đạt
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[11px] font-medium"
      title={errHint || "Chưa có kết quả kiểm tra AI (upload lại để kiểm tra)"}
    >
      Chưa xác minh
    </span>
  );
}
