'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ClipboardList, ExternalLink, Eye, Users } from 'lucide-react';
import FilePreviewModal from '@/components/common/FilePreviewModal';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import MentorDeadlineNoteCell from '@/components/mentor/deadlines/MentorDeadlineNoteCell';
import CustomTaskActions from '@/components/mentor/deadlines/CustomTaskActions';

export type MentorDeadlineRowType = 'checklist' | 'custom';

export interface MentorDeadlineRow {
  id: string;
  type: MentorDeadlineRowType;
  student_id: string;
  studentName: string;
  studentEmail: string | null;
  title: string;
  description: string | null;
  stageName: string | null;
  status: string;
  mentor_note: string | null;
  student_note: string | null;
  deadlineStatus: {
    label: string;
    sublabel: string;
    badgeClass: string;
    priority: number;
  };
  /** custom task only */
  stageOrder?: number | null;
  deadlineIso?: string | null;
  /** File học viên nộp khi chờ review (S3) */
  submissionUrl?: string | null;
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

interface MentorDeadlinesTableProps {
  rows: MentorDeadlineRow[];
}

export default function MentorDeadlinesTable({ rows }: MentorDeadlinesTableProps) {
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    open: boolean;
    url: string;
    name: string;
  }>({ open: false, url: '', name: '' });

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-white shadow-md"
          style={{
            background: 'linear-gradient(135deg, #0052FF, #4D7CFF)',
            boxShadow: '0 4px 14px rgba(0, 82, 255, 0.25)',
          }}
        >
          <CalendarDays className="h-7 w-7" />
        </div>
        <p className="font-medium text-foreground">Không có hạn chót nào cần theo dõi</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Các học viên chưa có deadline hoặc đã hoàn thành nhiệm vụ có hạn.
        </p>
        <Link
          href="/mentor/students"
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <Users className="h-4 w-4" />
          Danh sách học viên
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b bg-muted/40">
            <TableHead className="w-[14%] min-w-[7rem] font-semibold text-foreground">
              Học viên
            </TableHead>
            <TableHead className="w-[14%] min-w-[7rem] font-semibold text-foreground">
              Giai đoạn
            </TableHead>
            <TableHead className="min-w-[12rem] font-semibold text-foreground">
              Nhiệm vụ
            </TableHead>
            <TableHead className="w-[12%] min-w-[8.5rem] font-semibold text-foreground">
              Trạng thái
            </TableHead>
            <TableHead className="w-[16%] min-w-[10rem] font-semibold text-foreground">
              Hạn chót
            </TableHead>
            <TableHead className="w-[10%] min-w-[5.5rem] text-right font-semibold text-foreground">
              Thao tác
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const rowKey = `${row.type}-${row.id}`;
            const isExpanded = expandedRowKey === rowKey;
            return (
              <Fragment key={rowKey}>
                <TableRow
                  className="cursor-pointer align-top hover:bg-muted/20"
                  onClick={() =>
                    setExpandedRowKey((prev) => (prev === rowKey ? null : rowKey))
                  }
                >
                  <TableCell
                    className="text-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href={`/mentor/students?studentId=${row.student_id}`}
                      className="font-semibold text-foreground hover:text-primary hover:underline"
                    >
                      {row.studentName}
                    </Link>
                    {row.studentEmail ? (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {row.studentEmail}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {row.stageName ?? (row.type === 'custom' ? 'Tùy chỉnh' : '—')}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{row.title}</p>
                      {row.description ? (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {row.description}
                        </p>
                      ) : null}
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        {row.type === 'checklist' ? 'Tiến độ' : 'Tùy chỉnh'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(row.status)}`}
                    >
                      {getStatusLabel(row.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-2 text-xs">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${row.deadlineStatus.badgeClass}`}
                      >
                        {row.deadlineStatus.label}
                        {row.deadlineStatus.sublabel
                          ? ` · ${row.deadlineStatus.sublabel}`
                          : ''}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {row.submissionUrl &&
                        ['SUBMITTED', 'COMPLETED', 'NEEDS_REVISION'].includes(
                          String(row.status).toUpperCase(),
                        ) && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-8 gap-1 text-xs"
                            onClick={() =>
                              setPreview({
                                open: true,
                                url: row.submissionUrl!,
                                name: row.title,
                              })
                            }
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Xem bài nộp
                          </Button>
                        )}
                      <Link
                        href={`/mentor/students?studentId=${row.student_id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        Hồ sơ
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      {row.type === 'custom' ? (
                        <CustomTaskActions
                          studentId={row.student_id}
                          taskId={row.id}
                          title={row.title}
                          description={row.description}
                          stageOrder={row.stageOrder ?? null}
                          deadlineIso={row.deadlineIso ?? null}
                          status={row.status}
                        />
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
                {isExpanded ? (
                  <TableRow className="bg-muted/10 hover:bg-muted/20">
                    <TableCell colSpan={6} className="p-4">
                      <MentorDeadlineNoteCell
                        type={row.type}
                        id={row.id}
                        studentId={row.student_id}
                        mentorNote={row.mentor_note}
                        studentNote={row.student_note}
                        title=""
                      />
                    </TableCell>
                  </TableRow>
                ) : null}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
      <div className="border-t border-border p-3">
        <Link
          href="/mentor/students"
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          <ClipboardList className="h-4 w-4" />
          Mở danh sách học viên
        </Link>
      </div>

      <FilePreviewModal
        isOpen={preview.open}
        onClose={() => setPreview((p) => ({ ...p, open: false }))}
        fileUrl={preview.url}
        fileName={preview.name}
      />
    </div>
  );
}
