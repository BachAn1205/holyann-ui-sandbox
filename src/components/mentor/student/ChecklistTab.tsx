'use client';

import { useEffect, useState, useCallback, useRef, useMemo, Fragment } from 'react';
import MentorDeadlineNoteCell from '@/components/mentor/deadlines/MentorDeadlineNoteCell';
import {
  CheckSquare,
  Square,
  Clock,
  Calendar,
  FileText,
  AlertCircle,
  Eye,
  Loader2,
  X,
  CalendarDays,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  getStudentChecklist,
  updateStudentTaskStatus,
  updateTaskDeadline,
  type MentorStudentChecklistData,
} from '@/actions/mentor-checklist';
import FilePreviewModal from '@/components/common/FilePreviewModal';
import { PageLoading } from '@/components/ui/PageLoading';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface ChecklistTabProps {
  studentId: string;
  /** Đã tải checklist (ví dụ từ wrapper) — bỏ fetch lần đầu và spinner trùng. */
  initialChecklistData?: MentorStudentChecklistData;
}

interface Task {
  id: string;
  progressId?: string | null;
  title: string;
  description: string | null;
  linkTo: string | null;
  orderIndex: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED' | 'NEEDS_REVISION';
  submissionUrl?: string | null;
  mentorNote?: string | null;
  studentNote?: string | null;
  deadline?: Date | null;
  completedAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

interface Stage {
  id: number;
  name: string;
  description: string | null;
  tasks: Task[];
}

const getStatusInfo = (status: Task['status']) => {
  switch (status) {
    case 'COMPLETED':
      return {
        icon: CheckSquare,
        text: 'Đã hoàn thành',
        color: 'text-emerald-700 bg-emerald-100 ring-emerald-500/30 dark:text-emerald-300 dark:bg-emerald-900/50',
        iconColor: 'text-emerald-600 dark:text-emerald-400'
      };
    case 'SUBMITTED':
      return {
        icon: Clock,
        text: 'Đang review',
        color: 'text-amber-700 bg-amber-100 ring-amber-500/30 dark:text-amber-300 dark:bg-amber-900/50',
        iconColor: 'text-amber-600 dark:text-amber-400'
      };
    case 'IN_PROGRESS':
      return {
        icon: AlertCircle,
        text: 'Đang thực hiện',
        color: 'text-sky-700 bg-sky-100 ring-sky-500/30 dark:text-sky-300 dark:bg-sky-900/50',
        iconColor: 'text-sky-600 dark:text-sky-400'
      };
    case 'NEEDS_REVISION':
      return {
        icon: AlertCircle,
        text: 'Cần sửa lại',
        color: 'text-rose-700 bg-rose-100 ring-rose-500/30 dark:text-rose-300 dark:bg-rose-900/50',
        iconColor: 'text-rose-600 dark:text-rose-400'
      };
    default:
      return {
        icon: Square,
        text: 'Chưa bắt đầu',
        color: 'text-slate-600 bg-slate-100 ring-slate-400/30 dark:text-slate-400 dark:bg-slate-800',
        iconColor: 'text-slate-500 dark:text-slate-500'
      };
  }
};

function mapServerDataToStages(data: MentorStudentChecklistData): Stage[] {
  return data.stages.map((stage) => ({
    id: stage.id,
    name: stage.name,
    description: stage.description,
    tasks: stage.tasks.map((task) => ({
      id: task.id,
      progressId: task.progress?.id ?? null,
      title: task.title,
      description: task.description,
      linkTo: task.link_to,
      orderIndex: task.order_index,
      status: task.progress?.status || 'PENDING',
      submissionUrl: task.progress?.submission_url,
      mentorNote: task.progress?.mentor_note,
      studentNote: task.progress?.student_note,
      deadline: task.progress?.deadline ?? null,
      completedAt: task.progress?.completed_at ?? null,
      createdAt: task.progress?.created_at ?? null,
      updatedAt: task.progress?.updated_at ?? null,
    })),
  }));
}

export default function ChecklistTab({ studentId, initialChecklistData }: ChecklistTabProps) {
  const [stages, setStages] = useState<Stage[]>(() =>
    initialChecklistData ? mapServerDataToStages(initialChecklistData) : [],
  );
  const [isLoading, setIsLoading] = useState(() => !initialChecklistData);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{
    isOpen: boolean;
    taskId: string;
    taskTitle: string;
    newStatus: Task['status'];
    currentNote: string;
  }>({
    isOpen: false,
    taskId: '',
    taskTitle: '',
    newStatus: 'PENDING',
    currentNote: ''
  });
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    fileUrl: string;
    fileName: string;
  }>({
    isOpen: false,
    fileUrl: '',
    fileName: ''
  });
  const [updatingDeadlineTaskId, setUpdatingDeadlineTaskId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const lastFetchTime = useRef<number>(0);
  const MIN_FETCH_INTERVAL = 5000;

  const fetchChecklist = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const result = await getStudentChecklist(studentId);

      if (result.success && result.data) {
        setStages(mapServerDataToStages(result.data));
      } else {
        console.error('Failed to fetch tiến đọ:', result.error);
      }
    } catch (error) {
      console.error('Error fetching tiến đọ:', error);
    } finally {
      if (!silent) setIsLoading(false);
      lastFetchTime.current = Date.now();
    }
  }, [studentId]);

  useEffect(() => {
    if (initialChecklistData) {
      lastFetchTime.current = Date.now();
      return;
    }
    fetchChecklist();
  }, [studentId, initialChecklistData, fetchChecklist]);

  // Auto-refresh on focus
  useEffect(() => {
    let refreshTimeout: NodeJS.Timeout;

    const maybeRefresh = () => {
      const now = Date.now();
      if (now - lastFetchTime.current < MIN_FETCH_INTERVAL) return;
      refreshTimeout = setTimeout(() => {
        fetchChecklist(true); // silent fetch
      }, 500);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        clearTimeout(refreshTimeout);
        maybeRefresh();
      }
    };

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(refreshTimeout);
        maybeRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearTimeout(refreshTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchChecklist]);

  const tableSections = useMemo(() => {
    return stages.map((stage) => {
      const completed = stage.tasks.filter((t) => t.status === 'COMPLETED').length;
      const total = stage.tasks.length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { stage, completed, total, pct };
    });
  }, [stages]);

  const handleStatusChange = async (taskId: string, newStatus: Task['status'], taskTitle: string, currentNote: string = '') => {
    // Nếu status cần ghi chú (NEEDS_REVISION hoặc COMPLETED), mở modal
    if (newStatus === 'NEEDS_REVISION' || newStatus === 'COMPLETED') {
      const task = stages.flatMap(s => s.tasks).find(t => t.id === taskId);
      setNoteModal({
        isOpen: true,
        taskId,
        taskTitle,
        newStatus,
        currentNote: task?.mentorNote || ''
      });
      return;
    }

    // Cập nhật trực tiếp với các status khác
    await updateTaskStatus(taskId, newStatus);
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status'], note?: string) => {
    try {
      setUpdatingTaskId(taskId);
      const result = await updateStudentTaskStatus(studentId, taskId, newStatus, note);

      if (result.success) {
        // Update local state
        setStages(prev =>
          prev.map(stage => ({
            ...stage,
            tasks: stage.tasks.map(task =>
              task.id === taskId
                ? {
                    ...task,
                    status: newStatus,
                    mentorNote: note,
                    updatedAt: new Date()
                  }
                : task
            )
          }))
        );
      } else {
        alert('Lỗi khi cập nhật trạng thái: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleNoteSubmit = async (note: string) => {
    await updateTaskStatus(noteModal.taskId, noteModal.newStatus, note);
    setNoteModal(prev => ({ ...prev, isOpen: false }));
  };

  const handlePreviewFile = (fileUrl: string, taskTitle: string) => {
    // Extract filename from Supabase URL
    // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket/folder/filename.ext
    const urlParts = fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1] || `${taskTitle.replace(/[^a-zA-Z0-9\s]/g, '_').trim()}.pdf`;

    // Decode filename if it's URL encoded
    const decodedFileName = decodeURIComponent(fileName);

    setPreviewModal({
      isOpen: true,
      fileUrl,
      fileName: decodedFileName
    });
  };

  const closePreviewModal = () => {
    setPreviewModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleDeadlineChange = async (taskId: string, newDate: Date | undefined) => {
    try {
      setUpdatingDeadlineTaskId(taskId);
      const result = await updateTaskDeadline(studentId, taskId, newDate || null);

      if (result.success) {
        // Update local state
        setStages(prev =>
          prev.map(stage => ({
            ...stage,
            tasks: stage.tasks.map(task =>
              task.id === taskId
                ? {
                    ...task,
                    deadline: newDate || null,
                    updatedAt: new Date()
                  }
                : task
            )
          }))
        );
      } else {
        alert('Lỗi khi cập nhật deadline: ' + result.error);
      }
    } catch (error) {
      console.error('Error updating deadline:', error);
      alert('Có lỗi xảy ra khi cập nhật deadline');
    } finally {
      setUpdatingDeadlineTaskId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <PageLoading inline size="md" message="Đang tải tiến độ..." className="py-0" />
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium text-foreground">Chưa có tiến độ</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Học viên này chưa có tiến đọ tasks nào.
        </p>
      </div>
    );
  }

  const statusSelectClass =
    "w-full min-w-[9.5rem] max-w-[11rem] text-xs font-medium border border-border rounded-md px-2 py-1.5 bg-background text-foreground shadow-sm focus:ring-2 focus:ring-ring focus:border-ring disabled:opacity-50 appearance-none cursor-pointer pr-7 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1em] bg-[right_0.35rem_center] bg-no-repeat";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b bg-muted/40">
              <TableHead className="w-[14%] min-w-[7rem] font-semibold text-foreground">
                Giai đoạn
              </TableHead>
              <TableHead className="min-w-[12rem] font-semibold text-foreground">
                Nhiệm vụ
              </TableHead>
              <TableHead className="w-[12%] min-w-[8.5rem] font-semibold text-foreground">
                Trạng thái
              </TableHead>
              <TableHead className="w-[11%] min-w-[7rem] font-semibold text-foreground">
                Hạn chót
              </TableHead>
              <TableHead className="w-[10%] min-w-[5.5rem] text-center font-semibold text-foreground">
                Tệp nộp
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableSections.map(({ stage, completed, total, pct }) => (
              <Fragment key={stage.id}>
                <TableRow className="bg-muted/60 hover:bg-muted/60 border-b-2 border-border">
                  <TableCell colSpan={5} className="py-3 px-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {stage.name}
                        </p>
                        {stage.description ? (
                          <p className="text-xs text-muted-foreground mt-0.5 max-w-3xl">
                            {stage.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-medium tabular-nums text-muted-foreground whitespace-nowrap">
                          {completed}/{total} hoàn thành · {pct}%
                        </span>
                        <div className="hidden sm:block w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
                {stage.tasks.map((task) => {
                  const statusInfo = getStatusInfo(task.status);
                  const StatusIcon = statusInfo.icon;
                  const isExpanded = expandedTaskId === task.id;
                  return (
                    <Fragment key={task.id}>
                    <TableRow
                      className={cn('align-top cursor-pointer', isExpanded && 'bg-muted/30')}
                      onClick={() =>
                        setExpandedTaskId((prev) => (prev === task.id ? null : task.id))
                      }
                    >
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        <span className="line-clamp-2 sm:line-clamp-3">
                          {stage.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <span
                              className={cn(
                                'mt-0.5 inline-flex rounded-md p-1',
                                statusInfo.color,
                              )}
                            >
                              <StatusIcon
                                size={14}
                                className={statusInfo.iconColor}
                              />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground leading-snug">
                                {task.title}
                              </p>
                              {task.description ? (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                  {task.description}
                                </p>
                              ) : null}
                              {task.completedAt ? (
                                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                                  <Calendar className="size-3" />
                                  Hoàn thành:{' '}
                                  {new Date(task.completedAt).toLocaleDateString(
                                    'vi-VN',
                                  )}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <select
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(
                              task.id,
                              e.target.value as Task['status'],
                              task.title,
                              task.mentorNote || '',
                            )
                          }
                          disabled={updatingTaskId === task.id}
                          className={statusSelectClass}
                        >
                          <option value="PENDING">Chưa bắt đầu</option>
                          <option value="IN_PROGRESS">Đang thực hiện</option>
                          <option value="SUBMITTED">Đang review</option>
                          <option value="COMPLETED">Đã hoàn thành</option>
                          <option value="NEEDS_REVISION">Cần sửa lại</option>
                        </select>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={updatingDeadlineTaskId === task.id}
                              className={cn(
                                'h-8 px-2 text-xs font-medium w-full justify-start',
                                !task.deadline &&
                                  'text-muted-foreground',
                              )}
                            >
                              <CalendarDays className="mr-1 h-3.5 w-3.5 shrink-0" />
                              {updatingDeadlineTaskId === task.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-500" />
                              ) : task.deadline ? (
                                <span
                                  className={
                                    task.deadline < new Date()
                                      ? 'text-red-600 font-semibold dark:text-red-400'
                                      : ''
                                  }
                                >
                                  {format(new Date(task.deadline), 'dd/MM/yyyy', {
                                    locale: vi,
                                  })}
                                </span>
                              ) : (
                                <span className="truncate">Đặt hạn</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={
                                task.deadline
                                  ? new Date(task.deadline)
                                  : undefined
                              }
                              onSelect={(date) =>
                                handleDeadlineChange(task.id, date)
                              }
                              locale={vi}
                            />
                            {task.deadline ? (
                              <div className="p-2 border-t bg-muted/30">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full text-destructive hover:text-destructive text-xs"
                                  onClick={() =>
                                    handleDeadlineChange(task.id, undefined)
                                  }
                                >
                                  <X className="mr-1.5 h-3.5 w-3.5" />
                                  Gỡ hạn
                                </Button>
                              </div>
                            ) : null}
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        {task.submissionUrl ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-sky-600 dark:text-sky-400"
                                title="Xem trước"
                                onClick={() =>
                                  handlePreviewFile(
                                    task.submissionUrl!,
                                    task.title,
                                  )
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                asChild
                                title="Tải xuống"
                              >
                                <a
                                  href={`/api/file-proxy?url=${encodeURIComponent(task.submissionUrl!)}&download=true`}
                                >
                                  <FileText className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                            {task.orderIndex >= 9000 ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[11px] font-medium"
                                onClick={() =>
                                  handlePreviewFile(
                                    task.submissionUrl!,
                                    task.title,
                                  )
                                }
                              >
                                Xem bài nộp
                              </Button>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded ? (
                      <TableRow className="hover:bg-muted/20 bg-muted/10 border-t border-border">
                        <TableCell colSpan={5} className="py-4 px-4">
                          {task.progressId ? (
                            <MentorDeadlineNoteCell
                              type="checklist"
                              id={task.progressId}
                              studentId={studentId}
                              mentorNote={task.mentorNote ?? null}
                              studentNote={task.studentNote ?? null}
                              title={task.title}
                              onSaved={() => fetchChecklist(true)}
                            />
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Chưa có bản ghi tiến độ. Hãy cập nhật trạng thái nhiệm vụ để mở kênh feedback.
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : null}
                    </Fragment>
                  );
                })}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Note Modal */}
      {noteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)]">
          <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Ghi chú cho task
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                <strong>{noteModal.taskTitle}</strong>
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Trạng thái mới: <span className="font-medium">{getStatusInfo(noteModal.newStatus).text}</span>
              </p>

              <textarea
                defaultValue={noteModal.currentNote}
                placeholder="Thêm ghi chú cho học viên (tùy chọn)..."
                className="w-full h-24 p-3 border border-input rounded-lg resize-none bg-background focus:ring-2 focus:ring-ring focus:border-ring"
                id="note-textarea"
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setNoteModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={() => {
                    const textarea = document.getElementById('note-textarea') as HTMLTextAreaElement;
                    handleNoteSubmit(textarea.value);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                >
                  Cập nhật
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={previewModal.isOpen}
        onClose={closePreviewModal}
        fileUrl={previewModal.fileUrl}
        fileName={previewModal.fileName}
      />
    </div>
  );
}
