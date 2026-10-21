"use client";

import React from "react";
import { Users, Edit3 } from "lucide-react";
import type { StudentRelatedInfo } from "@/components/types";
import { StatusBadge } from "./StatusBadge";

interface RelatedInfoCardProps {
  related: StudentRelatedInfo | undefined;
  isComplete: boolean;
  onEditInModal?: () => void;
  /** Chỉ nội dung — dùng trong accordion cha. */
  bodyOnly?: boolean;
}

function hasContent(r: StudentRelatedInfo | undefined): boolean {
  if (!r) return false;
  if (String(r.yearlyBudget ?? "").trim()) return true;
  if (r.personalDesire?.trim()) return true;
  return r.parents.some((p) => p.fullName?.trim());
}

export const RelatedInfoCard: React.FC<RelatedInfoCardProps> = ({
  related,
  isComplete,
  onEditInModal,
  bodyOnly = false,
}) => {
  const filled = hasContent(related);

  const body = (
    <div className="space-y-4 p-4 text-sm sm:p-5">
      {!filled ? (
        <p className="text-muted-foreground">
          Chưa có thông tin. Mở <strong className="font-medium text-foreground">Cập nhật hồ sơ</strong> → tab{" "}
          <strong className="font-medium text-foreground">Thông tin liên quan</strong> để điền ngân sách, mong muốn cá
          nhân và phụ huynh.
        </p>
      ) : (
        <>
          {String(related?.yearlyBudget ?? "").trim() ? (
            <div className="rounded-xl border border-border bg-muted/15 p-3">
              <p className="mb-0.5 text-xs font-medium text-muted-foreground">Ngân sách (ước tính / năm)</p>
              <p className="text-foreground">{related?.yearlyBudget}</p>
            </div>
          ) : null}
          {related?.personalDesire?.trim() ? (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Mong muốn cá nhân</p>
              <p className="whitespace-pre-wrap text-foreground">{related.personalDesire}</p>
            </div>
          ) : null}
          {related && related.parents.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Phụ huynh / người giám hộ</p>
              <ul className="space-y-2">
                {related.parents.map((p) => (
                  <li
                    key={p.id}
                    className="space-y-0.5 rounded-xl border border-border bg-muted/10 p-3"
                  >
                    <p className="font-medium text-foreground">
                      {p.fullName || "—"}
                      {p.relationship ? (
                        <span className="font-normal text-muted-foreground"> · {p.relationship}</span>
                      ) : null}
                    </p>
                    {p.jobTitle?.trim() ? (
                      <p className="text-xs text-muted-foreground">Nghề nghiệp: {p.jobTitle}</p>
                    ) : null}
                    {p.phone?.trim() ? (
                      <p className="text-xs text-muted-foreground">Điện thoại: {p.phone}</p>
                    ) : null}
                    {p.email?.trim() ? (
                      <p className="text-xs text-muted-foreground">Email: {p.email}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </div>
  );

  if (bodyOnly) return body;

  return (
    <section className="pc-panel">
      <div className="pc-panel-header flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <h3 className="pc-display flex items-center gap-2 text-base text-foreground sm:text-lg">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,#0f4c81_10%,transparent)] text-[#0f4c81] dark:bg-sky-500/15 dark:text-sky-300">
            <Users className="size-4" aria-hidden />
          </span>
          Thông tin liên quan
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {onEditInModal && (
            <button
              type="button"
              onClick={onEditInModal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/80 sm:text-sm"
            >
              <Edit3 className="size-3.5 shrink-0" />
              Cập nhật trong hồ sơ
            </button>
          )}
          <StatusBadge isComplete={isComplete} />
        </div>
      </div>
      {body}
    </section>
  );
};
