"use client";

import React, { useMemo, useState } from "react";
import { FileText, Trash2, File, Loader2, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { StudentProfile, Document, DocumentType } from "../../../types";
import { StatusBadge } from "./StatusBadge";
import { VerifyStatusBadge } from "./VerifyStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { filterProfileAttachmentDocuments } from "@/lib/profile-documents";

export type DeleteDocumentPayload = {
  id: string;
  name: string;
  /** URL công khai (khi file nằm trên S3 cần xóa object) */
  publicUrl?: string;
};

interface DocumentsSectionProps {
  profile: StudentProfile;
  isComplete: boolean;
  onDeleteDocument: (payload: DeleteDocumentPayload) => void;
  /** UUID học sinh — verify tất cả / từng file + gọi API. */
  studentUserId?: string | null;
  onRefreshDocuments?: () => Promise<void>;
  /** Đang chờ wishlist hoặc đang fetch danh sách file từ server. */
  isInitialLoading?: boolean;
}

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  transcript: "Bảng điểm",
  certificate: "Chứng chỉ",
  letter: "Thư giới thiệu",
  essay: "Bài luận",
  other: "Khác",
};

function getDocTypeName(type: DocumentType): string {
  return DOC_TYPE_LABELS[type] ?? "Khác";
}

function docTypeDisplay(doc: Document): string {
  const label = doc.categoryLabel?.trim();
  if (label) return label;
  return getDocTypeName(doc.type);
}

function DocumentsTableSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Đang tải tài liệu">
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="h-9 w-40 rounded-lg bg-muted animate-pulse" />
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="h-10 bg-muted/40 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex gap-3 border-t border-border px-4 py-3 items-center"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="h-8 w-8 rounded bg-muted animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-[70%] max-w-sm rounded bg-muted animate-pulse" />
              <div className="h-3 w-24 rounded bg-muted/70 animate-pulse" />
            </div>
            <div className="h-8 w-20 rounded-md bg-muted/80 animate-pulse shrink-0" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin text-primary" aria-hidden />
        <span>Đang tải danh sách tài liệu…</span>
      </div>
    </div>
  );
}

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  profile,
  isComplete,
  onDeleteDocument,
  studentUserId,
  onRefreshDocuments,
  isInitialLoading = false,
}) => {
  const [verifyAllLoading, setVerifyAllLoading] = useState(false);
  const [verifyingDocId, setVerifyingDocId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<DeleteDocumentPayload | null>(null);

  /** Không liệt kê file trong slot CV (manage-upload); chỉ minh chứng / tài liệu modal hồ sơ. */
  const attachmentDocuments = useMemo(
    () => filterProfileAttachmentDocuments(profile.documents),
    [profile.documents],
  );

  const verifiedDocs = useMemo(
    () => attachmentDocuments.filter((d) => d.verifyValid === true),
    [attachmentDocuments],
  );
  const pendingDocs = useMemo(
    () => attachmentDocuments.filter((d) => d.verifyValid !== true),
    [attachmentDocuments],
  );

  const documentGroups = useMemo(() => {
    const groups: {
      key: string;
      title: string;
      hint: string;
      docs: Document[];
    }[] = [];
    if (verifiedDocs.length > 0) {
      groups.push({
        key: "verified",
        title: "Đã xác minh (AI)",
        hint: "Tài liệu này được coi là hiển thị chính thức trên hồ sơ; các mục hoạt động & thành tích mới đủ điều kiện đưa vào phân tích profile.",
        docs: verifiedDocs,
      });
    }
    if (pendingDocs.length > 0) {
      groups.push({
        key: "pending",
        title: "Chưa xác minh hoặc chưa đạt",
        hint: "File tải từ form cập nhật hồ sơ chưa kiểm tra tại đây — dùng Verify từng file hoặc Verify tất cả.",
        docs: pendingDocs,
      });
    }
    return groups;
  }, [verifiedDocs, pendingDocs]);

  const handleVerifyAll = async () => {
    if (!studentUserId || attachmentDocuments.length === 0) return;
    setVerifyAllLoading(true);
    try {
      const res = await fetch(
        `/api/students/${studentUserId}/verify-all-documents`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kiểm tra thất bại");
      await onRefreshDocuments?.();
      const s = data.summary as {
        ok?: number;
        fail?: number;
        errorOrSkipped?: number;
      };
      toast.success(`Đã kiểm tra ${data.processed ?? 0} tài liệu (AI)`, {
        description: `Đạt: ${s?.ok ?? 0} · Không đạt: ${s?.fail ?? 0} · Lỗi/chưa xử lý: ${s?.errorOrSkipped ?? 0}`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi kiểm tra");
    } finally {
      setVerifyAllLoading(false);
    }
  };

  const handleVerifyOne = async (doc: Document) => {
    if (!studentUserId) return;
    if (!doc.url) {
      toast.error("Không có URL công khai để kiểm tra file này");
      return;
    }
    setVerifyingDocId(doc.id);
    try {
      const res = await fetch(
        `/api/students/${studentUserId}/verify-uploaded-file`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicUrl: doc.url,
            storagePath: doc.id,
            filename: doc.name,
          }),
        },
      );
      const data = (await res.json()) as {
        error?: string;
        verifyError?: string;
        documentVerify?: { valid?: unknown };
      };
      if (!res.ok) throw new Error(data.error || "Kiểm tra thất bại");
      await onRefreshDocuments?.();
      const val = data.documentVerify?.valid;
      const desc =
        typeof val === "boolean"
          ? val
            ? "AI: đạt kiểm tra nội dung."
            : "AI: chưa đạt kiểm tra nội dung."
          : data.verifyError?.slice(0, 160);
      toast.success("Đã kiểm tra tài liệu (AI)", {
        description: desc,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi kiểm tra");
    } finally {
      setVerifyingDocId(null);
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    onDeleteDocument(pendingDelete);
    setPendingDelete(null);
  };

  const verifyDisabled = (doc: Document) =>
    !studentUserId || !doc.url || verifyAllLoading || verifyingDocId !== null;

  return (
    <section className="rounded-2xl border border-border pc-sticker-shadow overflow-hidden border-l-4 border-l-sky-500/60 bg-card bg-linear-to-br from-sky-500/5 to-transparent">
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-linear-to-r from-blue-100 via-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/10 transition-colors duration-300">
        <h3 className="pc-display text-base sm:text-lg text-foreground flex items-center gap-2">
          <span className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-sky-500/20 text-sky-700 dark:text-sky-400 shrink-0">
            <FileText size={18} className="size-4" aria-hidden />
          </span>
          Tài liệu đính kèm
          {isInitialLoading && (
            <Loader2
              className="size-4 animate-spin text-primary"
              aria-label="Đang tải"
            />
          )}
        </h3>
        <StatusBadge isComplete={isComplete} />
      </div>

      <div className="p-4 sm:p-5 relative">
        {verifyAllLoading && (
          <div className="absolute inset-0 bg-background/90 z-10 flex items-center justify-center rounded-b-2xl transition-colors duration-300">
            <div className="flex flex-col items-center gap-2 text-primary">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm font-medium text-foreground">
                Đang kiểm tra tất cả tài liệu (AI)...
              </span>
            </div>
          </div>
        )}
        {isInitialLoading ? (
          <DocumentsTableSkeleton />
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
              {studentUserId && profile.documents.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={verifyAllLoading || verifyingDocId !== null}
                  className="rounded-lg border-emerald-500/40 text-emerald-800 dark:text-emerald-200"
                  onClick={() => void handleVerifyAll()}
                >
                  {verifyAllLoading ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <ListChecks className="mr-1.5 size-3.5" />
                  )}
                  Verify tất cả (AI)
                </Button>
              )}
            </div>

            {documentGroups.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Chưa có tài liệu đính kèm hồ sơ nào. Tải minh chứng trong{" "}
                <strong className="text-foreground font-medium">
                  Cập nhật hồ sơ
                </strong>
                , sau đó quay lại đây để xác minh.
              </div>
            ) : (
              <div className="space-y-8">
                {documentGroups.map((group) => (
                  <div key={group.key} className="space-y-3">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {group.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {group.hint}
                      </p>
                    </div>
                    {/* Mobile: Card view */}
                    <div className="block sm:hidden space-y-3">
                      {group.docs.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3 rounded-xl border border-border bg-muted/20 flex flex-col gap-3 transition-colors duration-300"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                <File size={14} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {doc.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {docTypeDisplay(doc)} • {doc.uploadDate}
                                </p>
                                <div className="mt-1.5">
                                  <VerifyStatusBadge
                                    verifyValid={doc.verifyValid}
                                    verifyError={doc.verifyError}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-border/60">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              disabled={verifyDisabled(doc)}
                              onClick={() => void handleVerifyOne(doc)}
                            >
                              {verifyingDocId === doc.id ? (
                                <Loader2 className="mr-1 size-3 animate-spin" />
                              ) : (
                                <ListChecks className="mr-1 size-3" />
                              )}
                              Verify
                            </Button>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingDelete({
                                  id: doc.id,
                                  name: doc.name,
                                  publicUrl: doc.url,
                                })
                              }
                              disabled={verifyAllLoading}
                              className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors shrink-0 disabled:opacity-50"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop: Table view */}
                    <div className="hidden sm:block rounded-xl border border-border overflow-hidden">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/30">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Tài liệu
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Loại
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Ngày
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Xác minh (AI)
                            </th>
                            <th className="relative px-4 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Thao tác
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                          {group.docs.map((doc) => (
                            <tr
                              key={doc.id}
                              className="hover:bg-muted/20 transition-colors duration-300"
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-muted-foreground">
                                    <File size={14} />
                                  </div>
                                  <span className="text-sm font-medium text-foreground truncate max-w-[160px]">
                                    {doc.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-muted text-foreground">
                                  {docTypeDisplay(doc)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                {doc.uploadDate}
                              </td>
                              <td className="px-4 py-3">
                                <VerifyStatusBadge
                                  verifyValid={doc.verifyValid}
                                  verifyError={doc.verifyError}
                                />
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                <div className="inline-flex items-center justify-end gap-1">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2 text-xs"
                                    disabled={verifyDisabled(doc)}
                                    onClick={() => void handleVerifyOne(doc)}
                                  >
                                    {verifyingDocId === doc.id ? (
                                      <Loader2 className="mr-1 size-3 animate-spin" />
                                    ) : (
                                      <ListChecks className="mr-1 size-3" />
                                    )}
                                    Verify
                                  </Button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPendingDelete({
                                        id: doc.id,
                                        name: doc.name,
                                        publicUrl: doc.url,
                                      })
                                    }
                                    disabled={verifyAllLoading}
                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors disabled:opacity-50"
                                    aria-label="Xóa tài liệu"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa tài liệu?</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `Bạn có chắc muốn xóa “${pendingDelete.name}”? Hành động này không thể hoàn tác.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingDelete(null)}
            >
              Hủy
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};
