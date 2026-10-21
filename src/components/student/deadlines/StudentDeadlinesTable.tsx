'use client';

import { Fragment, useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CalendarDays,
  ClipboardList,
  FileUp,
  Loader2,
  Send,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import FeedbackChatBox from '@/components/shared/FeedbackChatBox';
import { uploadFileServerAction } from '@/actions/upload';

export type RowType = 'checklist' | 'custom';

export interface DeadlineRow {
  id: string;
  type: RowType;
  title: string;
  description: string | null;
  stageName?: string | null;
  deadline: string | null;
  status: string;
  mentor_note: string | null;
  student_note: string | null;
  submission_url?: string | null;
  deadlineStatus: {
    label: string;
    sublabel: string;
    badgeClass: string;
    priority: number;
  };
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'Đã hoàn thành';
    case 'SUBMITTED':
      return 'Chờ review';
    case 'IN_PROGRESS':
      return 'Đang thực hiện';
    case 'NEEDS_REVISION':
      return 'Cần chỉnh sửa';
    default:
      return 'Chưa bắt đầu';
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'SUBMITTED':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'IN_PROGRESS':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'NEEDS_REVISION':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-muted text-muted-foreground dark:bg-muted/80';
  }
}

const CAN_SUBMIT_REVIEW = ['PENDING', 'IN_PROGRESS', 'NEEDS_REVISION'];

function canSubmitReview(status: string): boolean {
  return CAN_SUBMIT_REVIEW.includes(String(status).toUpperCase());
}

/** PDF, TXT, ảnh — khớp server action deadline-submissions */
const REVIEW_FILE_ACCEPT =
  '.pdf,.txt,.png,.jpg,.jpeg,.webp,application/pdf,text/plain,image/png,image/jpeg,image/webp';

function isAllowedReviewMime(type: string): boolean {
  const ok = new Set([
    'application/pdf',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);
  return ok.has(type);
}

interface StudentDeadlinesTableProps {
  rows: DeadlineRow[];
  onNoteSaved?: () => void;
}

export default function StudentDeadlinesTable({
  rows,
  onNoteSaved,
}: StudentDeadlinesTableProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [uploadingFileId, setUploadingFileId] = useState<string | null>(null);
  const [requestingReviewId, setRequestingReviewId] = useState<string | null>(null);
  const [uploadDialogRow, setUploadDialogRow] = useState<DeadlineRow | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [localRows, setLocalRows] = useState<DeadlineRow[]>(rows);

  // Sync when server data changes (initial load)
  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  /**
   * Fetch the latest rows from server and merge deadlineStatus back in.
   * This ensures mentor_note is always up-to-date after any mutation.
   */
  const refreshRows = async () => {
    try {
      const res = await fetch('/api/students/me/deadlines', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      const fresh: Omit<DeadlineRow, 'deadlineStatus'>[] = json.rows ?? [];
      // Re-merge deadlineStatus from the current localRows (it's a display-only field)
      // so we don't need to recompute it on client
      setLocalRows((prev) => {
        const prevMap = new Map(prev.map((r) => [r.id, r]));
        return fresh.map((r) => ({
          ...r,
          deadlineStatus: prevMap.get(r.id)?.deadlineStatus ?? {
            label: r.deadline ?? '—',
            sublabel: '',
            badgeClass: 'bg-muted text-muted-foreground',
            priority: 5,
          },
        }));
      });
    } catch {
      // Fallback: let Next.js handle it
      router.refresh();
    }
  };


  const handleSendNote = async (row: DeadlineRow, message: string) => {
    try {
      const url =
        row.type === 'checklist'
          ? `/api/students/me/deadlines/checklist/${row.id}`
          : `/api/students/me/deadlines/custom/${row.id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_note: message || null }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Đã gửi feedback');
      onNoteSaved?.();
      await refreshRows();
    } catch {
      toast.error('Không gửi được feedback');
    }
  };


  const handleUpdateStudentNote = async (
    row: DeadlineRow,
    nextRaw: string | null,
  ) => {
    try {
      const url =
        row.type === 'checklist'
          ? `/api/students/me/deadlines/checklist/${row.id}`
          : `/api/students/me/deadlines/custom/${row.id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_note: nextRaw,
          student_note_mode: 'replace',
        }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Đã cập nhật feedback');
      onNoteSaved?.();
      await refreshRows();
    } catch {
      toast.error('Không cập nhật được feedback');
    }
  };


  const openUploadDialog = (row: DeadlineRow) => {
    setUploadFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploadDialogRow(row);
  };

  const closeUploadDialog = () => {
    setUploadDialogRow(null);
    setUploadFile(null);
  };

  const confirmUploadFile = async (andRequestReview = false) => {
    const row = uploadDialogRow;
    if (!row) return;
    if (!uploadFile) {
      toast.error('Vui lòng chọn file PDF, TXT hoặc ảnh');
      return;
    }
    if (!isAllowedReviewMime(uploadFile.type)) {
      toast.error('Chỉ chấp nhận PDF, TXT hoặc ảnh (JPG, PNG, WEBP)');
      return;
    }

    setUploadingFileId(row.id);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('category', 'deadline-submissions');

      const up = await uploadFileServerAction(formData);
      if (!up.success || !up.url) {
        toast.error(up.error || 'Upload thất bại');
        return;
      }

      const apiUrl =
        row.type === 'checklist'
          ? `/api/students/me/deadlines/checklist/${row.id}`
          : `/api/students/me/deadlines/custom/${row.id}`;

      // Save submission_url (and optionally set status=SUBMITTED in the same request)
      const patchBody: Record<string, unknown> = { submission_url: up.url };
      if (andRequestReview && canSubmitReview(row.status)) {
        patchBody.status = 'SUBMITTED';
      }

      const res = await fetch(apiUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(typeof err.error === 'string' ? err.error : 'Không lưu được file');
        return;
      }

      // Optimistic update
      setLocalRows(prev =>
        prev.map(r =>
          r.id === row.id
            ? {
                ...r,
                submission_url: up.url,
                ...(andRequestReview && canSubmitReview(r.status) ? { status: 'SUBMITTED' } : {}),
              }
            : r
        )
      );

      if (andRequestReview && canSubmitReview(row.status)) {
        toast.success('Đã tải lên file và gửi yêu cầu review!');
      } else {
        toast.success('Đã tải lên file đính kèm');
      }

      closeUploadDialog();
      onNoteSaved?.();
      await refreshRows();

    } catch {
      toast.error('Upload thất bại');
    } finally {
      setUploadingFileId(null);
    }
  };

  const requestReview = async (row: DeadlineRow) => {
    if (!canSubmitReview(row.status)) return;
    setRequestingReviewId(row.id);
    try {
      const apiUrl =
        row.type === 'checklist'
          ? `/api/students/me/deadlines/checklist/${row.id}`
          : `/api/students/me/deadlines/custom/${row.id}`;
      const res = await fetch(apiUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SUBMITTED' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(typeof err.error === 'string' ? err.error : 'Không gửi được yêu cầu');
        return;
      }
      setLocalRows(prev => prev.map(r => r.id === row.id ? { ...r, status: 'SUBMITTED' } : r));
      toast.success('Đã gửi yêu cầu Cố vấn review');
      onNoteSaved?.();
      await refreshRows();

    } catch {
      toast.error('Không gửi được yêu cầu');
    } finally {
      setRequestingReviewId(null);
    }
  };

  if (localRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-md"
          style={{
            background: 'linear-gradient(135deg, #0052FF, #4D7CFF)',
            boxShadow: '0 4px 14px rgba(0, 82, 255, 0.25)',
          }}
        >
          <Calendar className="h-7 w-7" />
        </div>
        <p className="font-medium text-foreground">Chưa có hạn chót nào</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cố vấn sẽ thiết lập hạn chót cho các nhiệm vụ của bạn
        </p>
        <a
          href="/student/checklist"
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <ClipboardList className="h-4 w-4" />
          Xem Tiến độ
        </a>
      </div>
    );
  }

  const urgent = localRows.filter(r => r.deadlineStatus.priority === 1);
  const thisWeek = localRows.filter(r => r.deadlineStatus.priority === 2);
  const upcoming = localRows.filter(r => r.deadlineStatus.priority === 3 || r.deadlineStatus.priority === 5);
  const completed = localRows.filter(r => r.deadlineStatus.priority === 4);

  const renderCard = (row: DeadlineRow) => {
    const rowKey = `${row.type}-${row.id}`;
    const isExpanded = expandedRowKey === rowKey;
    
    return (
      <div key={rowKey} className="group overflow-hidden rounded-xl border border-border bg-card hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm">
        <div 
          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer gap-4"
          onClick={() => setExpandedRowKey(prev => prev === rowKey ? null : rowKey)}
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 shrink-0">
              {row.status === 'COMPLETED' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-muted-foreground/40" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {row.type === 'checklist' ? 'Hệ thống' : 'Tùy chỉnh'}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusBadgeClass(row.status)}`}>
                  {getStatusLabel(row.status)}
                </span>
                {row.stageName && (
                  <span className="text-[10px] font-medium text-muted-foreground">
                    • {row.stageName}
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-foreground text-sm sm:text-base leading-tight">{row.title}</h4>
              {row.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{row.description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center pl-8 sm:pl-0 gap-2 sm:gap-1 shrink-0">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${row.deadlineStatus.badgeClass}`}>
              <CalendarDays className="h-3.5 w-3.5" />
              {row.deadlineStatus.label}
            </div>
            {row.deadlineStatus.sublabel && (
              <span className="text-[11px] text-muted-foreground font-medium">{row.deadlineStatus.sublabel}</span>
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="border-t border-border p-4 bg-muted/10">
            <div className="space-y-4">
              <FeedbackChatBox
                mentorFeedback={row.mentor_note}
                studentFeedback={row.student_note}
                inputPlaceholder="Nhập phản hồi của bạn..."
                onSendMessage={(message) => handleSendNote(row, message)}
                onUpdateStudentFeedback={(nextRaw) =>
                  handleUpdateStudentNote(row, nextRaw)
                }
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                {row.submission_url ? (
                  <a
                    href={`/api/file-proxy?url=${encodeURIComponent(row.submission_url)}&download=true`}
                    className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted sm:mr-auto transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Tải file đã đính kèm
                  </a>
                ) : null}
                {canSubmitReview(row.status) ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1.5 rounded-lg"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openUploadDialog(row);
                      }}
                      disabled={
                        uploadingFileId === row.id ||
                        requestingReviewId === row.id
                      }
                    >
                      {uploadingFileId === row.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FileUp className="h-3.5 w-3.5" />
                      )}
                      Tải lên file
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="gap-1.5 rounded-lg"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        requestReview(row);
                      }}
                      disabled={
                        requestingReviewId === row.id ||
                        uploadingFileId === row.id
                      }
                    >
                      {requestingReviewId === row.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Yêu cầu review
                    </Button>
                  </>
                ) : (
                  String(row.status).toUpperCase() === 'SUBMITTED' && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      <Send className="h-3.5 w-3.5" />
                      Đã gửi review
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="space-y-10">
        {urgent.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Cần làm ngay
            </h3>
            <div className="flex flex-col gap-3">
              {urgent.map(renderCard)}
            </div>
          </div>
        )}

        {thisWeek.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Tuần này
            </h3>
            <div className="flex flex-col gap-3">
              {thisWeek.map(renderCard)}
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-500 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Sắp tới
            </h3>
            <div className="flex flex-col gap-3">
              {upcoming.map(renderCard)}
            </div>
          </div>
        )}

        {completed.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Đã hoàn thành / Chờ Review
            </h3>
            <div className="flex flex-col gap-3 opacity-80">
              {completed.map(renderCard)}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <a
          href="/student/checklist"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
        >
          <ClipboardList className="h-4 w-4" />
          Mở toàn bộ Tiến độ
        </a>
      </div>

      <Dialog open={!!uploadDialogRow} onOpenChange={(o) => !o && closeUploadDialog()}>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Tải lên file đính kèm</DialogTitle>
            <DialogDescription>
              Tùy chọn: gửi kèm <strong>PDF</strong>, <strong>TXT</strong> hoặc{' '}
              <strong>ảnh</strong> (JPG, PNG, WEBP) cho Cố vấn. Lưu trên S3 (tối đa 5MB).{' '}
              Bạn vẫn có thể bấm <strong>Yêu cầu review</strong> mà không cần file.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={REVIEW_FILE_ACCEPT}
              className="w-full text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1.5"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
            />
            {uploadFile ? (
              <p className="text-xs text-muted-foreground">
                Đã chọn: {uploadFile.name}
              </p>
            ) : null}
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row">
            <Button type="button" variant="outline" onClick={closeUploadDialog}
              disabled={!!uploadDialogRow && uploadingFileId === uploadDialogRow.id}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              onClick={() => confirmUploadFile(false)}
              disabled={
                !uploadDialogRow || uploadingFileId === uploadDialogRow.id
              }
            >
              {uploadDialogRow && uploadingFileId === uploadDialogRow.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="h-4 w-4" />
              )}
              Chỉ tải lên
            </Button>
            <Button
              type="button"
              className="gap-1.5"
              onClick={() => confirmUploadFile(true)}
              disabled={
                !uploadDialogRow ||
                uploadingFileId === uploadDialogRow.id ||
                !canSubmitReview(uploadDialogRow.status)
              }
            >
              {uploadDialogRow && uploadingFileId === uploadDialogRow.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Tải lên & Yêu cầu review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
