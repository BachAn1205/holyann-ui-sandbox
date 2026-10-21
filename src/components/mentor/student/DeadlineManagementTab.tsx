'use client';

import { useCallback, useEffect, useState, Fragment } from 'react';
import { AlertTriangle, Calendar, CalendarDays, Clock, Eye, FileText, Loader2, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { updateStudentTaskStatus, updateTaskDeadline } from '@/actions/mentor-checklist';
import CustomTaskActions from '@/components/mentor/deadlines/CustomTaskActions';
import MentorDeadlineNoteCell from '@/components/mentor/deadlines/MentorDeadlineNoteCell';
import FilePreviewModal from '@/components/common/FilePreviewModal';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { MentorStudentChecklistData } from '@/actions/mentor-checklist';

interface DeadlineManagementTabProps {
  studentId: string;
  /** Khi có, bảng deadline hydrate từ dữ liệu đã tải (tránh 2 spinner cạnh ChecklistTab). */
  deadlineBootstrap?: {
    checklistData: MentorStudentChecklistData;
    customJson: unknown;
  };
}

function extractStageOrder(stageText: string) {
  const match = stageText.match(/Giai đoạn\s*(\d+)/i);
  if (!match) return 1;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : 1;
}

type RowType = 'checklist' | 'custom';
type CustomPriority = 'LOW' | 'MEDIUM' | 'HIGH';

type DeadlineStatusInfo = {
  label: string;
  sublabel: string;
  colorClass: string;
  rowClass: string;
  icon: typeof AlertTriangle;
  iconColor: string;
  priority: number;
};

function getDeadlineStatus(deadline: Date): DeadlineStatusInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / 86400000);

  const formattedDate = deadlineDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (diffDays < 0) {
    return {
      label: formattedDate,
      sublabel: `Quá hạn ${Math.abs(diffDays)} ngày`,
      colorClass: 'text-destructive font-bold',
      rowClass: 'bg-destructive/5 hover:bg-destructive/10',
      icon: AlertTriangle,
      iconColor: 'text-destructive',
      priority: 1,
    };
  }

  if (diffDays === 0) {
    return {
      label: formattedDate,
      sublabel: 'Hôm nay!',
      colorClass: 'text-accent-foreground font-semibold',
      rowClass: 'bg-accent/5 hover:bg-accent/10',
      icon: AlertTriangle,
      iconColor: 'text-accent-foreground',
      priority: 1,
    };
  }

  if (diffDays <= 3) {
    return {
      label: formattedDate,
      sublabel: `Còn ${diffDays} ngày`,
      colorClass: 'text-amber-600 dark:text-amber-400 font-medium',
      rowClass: 'bg-muted/30 hover:bg-muted/50',
      icon: Clock,
      iconColor: 'text-amber-500 dark:text-amber-400',
      priority: 2,
    };
  }

  return {
    label: formattedDate,
    sublabel: `Còn ${diffDays} ngày`,
    colorClass: 'text-muted-foreground',
    rowClass: 'hover:bg-muted/30',
    icon: Calendar,
    iconColor: 'text-muted-foreground',
    priority: 3,
  };
}

function getCustomDeadlineStatus(deadline: Date | null): DeadlineStatusInfo {
  if (!deadline) {
    return {
      label: '—',
      sublabel: 'Chưa đặt',
      colorClass: 'text-muted-foreground',
      rowClass: 'hover:bg-muted/30',
      icon: Calendar,
      iconColor: 'text-muted-foreground',
      priority: 5,
    };
  }

  return {
    label: deadline.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    sublabel: 'Tùy chỉnh',
    colorClass: 'text-muted-foreground',
    rowClass: 'hover:bg-muted/30',
    icon: Calendar,
    iconColor: 'text-muted-foreground',
    priority: 5,
  };
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'COMPLETED':
      return {
        label: 'Hoàn thành',
        class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      };
    case 'SUBMITTED':
      return {
        label: 'Chờ review',
        class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      };
    case 'IN_PROGRESS':
      return {
        label: 'Đang làm',
        class: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      };
    case 'NEEDS_REVISION':
      return {
        label: 'Cần sửa',
        class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      };
    default:
      return {
        label: 'Chưa bắt đầu',
        class: 'bg-muted text-muted-foreground dark:bg-muted/80',
      };
  }
}

function getPriorityMeta(priority: string | null | undefined) {
  switch (priority) {
    case 'HIGH':
      return {
        label: 'Cao',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      };
    case 'LOW':
      return {
        label: 'Thấp',
        className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      };
    default:
      return {
        label: 'Trung bình',
        className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      };
  }
}

type UnifiedDeadlineRow = {
  type: RowType;
  id: string;
  checklistTaskId: string | null;
  taskTitle: string;
  description: string | null;
  priority: CustomPriority | null;
  stageOrder: number | null;
  stageName: string | null;
  deadline: Date | null;
  completedAt: Date | null;
  status: string;
  mentor_note: string | null;
  student_note: string | null;
  submissionUrl: string | null;
  deadlineStatus: DeadlineStatusInfo;
};

const STAGE_LABEL_BY_ORDER: Record<number, string> = {
  1: 'Giai đoạn 1: Khởi động',
  2: 'Giai đoạn 2: Phát triển',
  3: 'Giai đoạn 3: Về đích',
};

function toStageLabel(stageOrder?: number | null, fallback?: string | null) {
  if (stageOrder != null && STAGE_LABEL_BY_ORDER[stageOrder]) {
    return STAGE_LABEL_BY_ORDER[stageOrder];
  }
  return fallback ?? STAGE_LABEL_BY_ORDER[1];
}

function buildUnifiedDeadlineRows(
  checklistData: MentorStudentChecklistData | null | undefined,
  customJson: unknown,
): UnifiedDeadlineRow[] {
  const customParsed = customJson as
    | Array<{
        id: string;
        title: string;
        description: string | null;
        priority?: string | null;
        stage?: string | null;
        stage_order?: number | null;
        deadline: string | null;
        status: string;
        mentor_note: string | null;
        student_note: string | null;
        submission_url?: string | null;
        completed_at: string | null;
      }>
    | { error?: string }
    | null;

  const customIds = new Set(Array.isArray(customParsed) ? customParsed.map((c) => c.id) : []);

  const checklistRows: UnifiedDeadlineRow[] = checklistData
    ? checklistData.flatTasks
        .filter((t) => !customIds.has(t.id))
        .filter((t) => !!t.progress?.deadline)
        .map((t) => {
          const deadline = t.progress?.deadline ? new Date(t.progress.deadline as string | Date) : null;
          const completedAt = t.progress?.completed_at
            ? new Date(t.progress.completed_at as string | Date)
            : null;

          let finalDeadlineStatus: DeadlineStatusInfo;
          const isCompleted = t.progress?.status === 'COMPLETED';
          const isCompletedOnTime =
            isCompleted &&
            completedAt &&
            deadline &&
            new Date(completedAt).setHours(0, 0, 0, 0) <= new Date(deadline).setHours(0, 0, 0, 0);

          if (isCompletedOnTime) {
            finalDeadlineStatus = {
              label: deadline!.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
              sublabel: 'Hoàn thành đúng hạn',
              colorClass: 'text-emerald-700 dark:text-emerald-400 font-bold',
              rowClass: 'bg-emerald-50/50 hover:bg-emerald-100/50 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20',
              icon: Clock,
              iconColor: 'text-emerald-600 dark:text-emerald-400',
              priority: 4,
            };
          } else {
            finalDeadlineStatus = deadline
              ? getDeadlineStatus(deadline)
              : {
                  label: '—',
                  sublabel: 'Chưa đặt',
                  colorClass: 'text-muted-foreground',
                  rowClass: 'hover:bg-muted/30',
                  icon: Calendar,
                  iconColor: 'text-muted-foreground',
                  priority: 5,
                };
          }

          return {
            type: 'checklist' as const,
            id: t.progress!.id,
            checklistTaskId: t.id,
            taskTitle: t.title,
            description: null,
            priority: null,
            stageOrder: null,
            stageName: t.stage?.name ?? null,
            deadline,
            completedAt,
            status: t.progress?.status ?? 'PENDING',
            mentor_note: t.progress?.mentor_note ?? null,
            student_note: t.progress?.student_note ?? null,
            submissionUrl: t.progress?.submission_url ?? null,
            deadlineStatus: finalDeadlineStatus,
          };
        })
    : [];

  const customRows: UnifiedDeadlineRow[] = Array.isArray(customParsed)
    ? customParsed.map((c) => {
        const deadline = c.deadline ? new Date(c.deadline) : null;
        const completedAt = c.completed_at ? new Date(c.completed_at) : null;
        const finalDeadlineStatus = getCustomDeadlineStatus(deadline);

        return {
          type: 'custom' as const,
          id: c.id,
          checklistTaskId: null,
          taskTitle: c.title,
          description: c.description ?? null,
          priority: (c.priority?.toUpperCase() as CustomPriority | undefined) ?? 'MEDIUM',
          stageOrder: c.stage_order ?? null,
          stageName: toStageLabel(c.stage_order, c.stage),
          deadline,
          completedAt,
          status: c.status,
          mentor_note: c.mentor_note ?? null,
          student_note: c.student_note ?? null,
          submissionUrl: c.submission_url ?? null,
          deadlineStatus: finalDeadlineStatus,
        };
      })
    : [];

  return [...checklistRows, ...customRows].sort((a, b) => {
    if (a.deadlineStatus.priority !== b.deadlineStatus.priority) {
      return a.deadlineStatus.priority - b.deadlineStatus.priority;
    }
    const aTime = a.deadline ? a.deadline.getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.deadline ? b.deadline.getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });
}

export default function DeadlineManagementTab({ studentId, deadlineBootstrap }: DeadlineManagementTabProps) {
  const [rows, setRows] = useState<UnifiedDeadlineRow[]>(() =>
    deadlineBootstrap
      ? buildUnifiedDeadlineRows(deadlineBootstrap.checklistData, deadlineBootstrap.customJson)
      : [],
  );
  const [isLoading, setIsLoading] = useState(() => !deadlineBootstrap);
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  const [updatingDeadlineRowKey, setUpdatingDeadlineRowKey] = useState<string | null>(null);
  const [updatingStatusRowKey, setUpdatingStatusRowKey] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    fileUrl: string;
    fileName: string;
  }>({ isOpen: false, fileUrl: '', fileName: '' });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    priority: 'MEDIUM',
    stage: 'Giai đoạn 1: Khởi động',
    deadline: '',
    description: '',
  });

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);

      const [checklistRes, customRes] = await Promise.all([
        fetch(`/api/mentor/student/${studentId}/checklist`),
        fetch(`/api/mentor/students/${studentId}/custom-deadlines`),
      ]);

      const checklistJson = (await checklistRes.json().catch(() => null)) as
        | {
            success: boolean;
            data?: MentorStudentChecklistData;
          }
        | null;

      const customJson = await customRes.json().catch(() => null);

      const checklistData =
        checklistRes.ok && checklistJson?.success && checklistJson.data ? checklistJson.data : null;

      setRows(buildUnifiedDeadlineRows(checklistData, customJson));
    } catch (error) {
      console.error('Error fetching deadlines:', error);
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (deadlineBootstrap) return;
    fetchAll();
  }, [deadlineBootstrap, fetchAll]);

  const handlePreviewFile = (fileUrl: string, taskTitle: string) => {
    const urlParts = fileUrl.split('/');
    const fileName =
      urlParts[urlParts.length - 1] ||
      `${taskTitle.replace(/[^a-zA-Z0-9\s]/g, '_').trim()}.pdf`;
    setPreviewModal({
      isOpen: true,
      fileUrl,
      fileName: decodeURIComponent(fileName),
    });
  };

  const handleDeadlineRowChange = async (
    item: UnifiedDeadlineRow,
    rowKey: string,
    newDate: Date | undefined
  ) => {
    try {
      setUpdatingDeadlineRowKey(rowKey);
      if (item.type === 'checklist' && item.checklistTaskId) {
        const result = await updateTaskDeadline(studentId, item.checklistTaskId, newDate || null);
        if (!result.success) {
          alert('Lỗi khi cập nhật deadline: ' + result.error);
          return;
        }
      } else if (item.type === 'custom') {
        const res = await fetch(`/api/mentor/students/${studentId}/custom-deadlines/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deadline: newDate ? newDate.toISOString() : null,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          alert(err.error || 'Lỗi khi cập nhật deadline');
          return;
        }
      }
      await fetchAll();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi cập nhật deadline');
    } finally {
      setUpdatingDeadlineRowKey(null);
    }
  };

  const handleStatusRowChange = async (
    item: UnifiedDeadlineRow,
    rowKey: string,
    nextStatus: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED' | 'NEEDS_REVISION'
  ) => {
    try {
      setUpdatingStatusRowKey(rowKey);
      const targetTaskId =
        item.type === 'checklist' ? item.checklistTaskId : item.id;

      if (!targetTaskId) {
        alert('Không tìm thấy task để cập nhật trạng thái');
        return;
      }

      const result = await updateStudentTaskStatus(
        studentId,
        targetTaskId,
        nextStatus,
      );
      if (!result.success) {
        alert('Lỗi khi cập nhật trạng thái: ' + result.error);
        return;
      }

      await fetchAll();
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi cập nhật trạng thái');
    } finally {
      setUpdatingStatusRowKey(null);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      title: '',
      priority: 'MEDIUM',
      stage: 'Giai đoạn 1: Khởi động',
      deadline: '',
      description: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Vui lòng nhập tên nhiệm vụ.');
      return;
    }
    
    setIsSubmitting(true);
    setFormError('');

    try {
      const payload: any = {
        title: formData.title.trim(),
        priority: formData.priority,
        stage: formData.stage,
        stage_order: extractStageOrder(formData.stage),
      };

      if (formData.description.trim()) {
        payload.description = formData.description.trim();
      }

      if (formData.deadline) {
        payload.deadline = formData.deadline;
      }

      const res = await fetch(`/api/mentor/students/${studentId}/custom-deadlines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        setFormError(errorData.error || 'Có lỗi xảy ra khi tạo nhiệm vụ.');
        setIsSubmitting(false);
        return;
      }

      // Success
      await res.json().catch(() => null);
      handleCloseModal();
      await fetchAll();
    } catch (error) {
      console.error('Error creating deadline:', error);
      setFormError('Lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Hạn chót ({rows.length})
        </h3>
        <Button type="button" onClick={handleOpenModal} className="w-full sm:w-auto gap-2">
          <Plus className="h-4 w-4" />
          Thêm deadline
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-12 text-center shadow-sm">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Chưa có deadline nào</p>
        </div>
      ) : (
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
              {rows.map((item) => {
                const statusInfo = getStatusLabel(item.status);
                const rowKey = `${item.type}-${item.id}`;
                const isExpanded = expandedRowKey === rowKey;
                const busyDeadline = updatingDeadlineRowKey === rowKey;
                const busyStatus = updatingStatusRowKey === rowKey;
                const statusSelectClass =
                  "w-full min-w-[9.5rem] max-w-[11rem] text-xs font-medium border border-border rounded-md px-2 py-1.5 bg-background text-foreground shadow-sm focus:ring-2 focus:ring-ring focus:border-ring disabled:opacity-50 appearance-none cursor-pointer pr-7 bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1em] bg-[right_0.35rem_center] bg-no-repeat";

                return (
                  <Fragment key={rowKey}>
                    <TableRow
                      className={cn(
                        'align-top cursor-pointer',
                        item.deadlineStatus.rowClass,
                        isExpanded && 'bg-muted/30',
                      )}
                      onClick={() =>
                        setExpandedRowKey((prev) => (prev === rowKey ? null : rowKey))
                      }
                    >
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        <span className="line-clamp-3">
                          {item.stageName ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-semibold text-foreground leading-snug">
                            {item.taskTitle}
                          </p>
                          {item.type === 'custom' ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span
                                className={cn(
                                  'inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium',
                                  getPriorityMeta(item.priority).className,
                                )}
                              >
                                {getPriorityMeta(item.priority).label}
                              </span>
                            </div>
                          ) : null}
                          {item.description ? (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <select
                          value={item.status}
                          disabled={busyStatus}
                          onChange={(e) =>
                            handleStatusRowChange(
                              item,
                              rowKey,
                              e.target.value as
                                | 'PENDING'
                                | 'IN_PROGRESS'
                                | 'SUBMITTED'
                                | 'COMPLETED'
                                | 'NEEDS_REVISION',
                            )
                          }
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
                              disabled={busyDeadline}
                              className={cn(
                                'h-8 px-2 text-xs font-medium w-full justify-start',
                                !item.deadline && 'text-muted-foreground',
                              )}
                            >
                              <CalendarDays className="mr-1 h-3.5 w-3.5 shrink-0" />
                              {busyDeadline ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-500" />
                              ) : item.deadline ? (
                                <span
                                  className={
                                    item.deadline < new Date()
                                      ? 'text-red-600 font-semibold dark:text-red-400'
                                      : ''
                                  }
                                >
                                  {format(new Date(item.deadline), 'dd/MM/yyyy', {
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
                                item.deadline ? new Date(item.deadline) : undefined
                              }
                              onSelect={(date) => handleDeadlineRowChange(item, rowKey, date)}
                              locale={vi}
                            />
                            {item.deadline ? (
                              <div className="p-2 border-t bg-muted/30">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full text-destructive hover:text-destructive text-xs"
                                  onClick={() =>
                                    handleDeadlineRowChange(item, rowKey, undefined)
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
                      <TableCell
                        className="text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.submissionUrl ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-sky-600 dark:text-sky-400"
                                title="Xem trước"
                                onClick={() =>
                                  handlePreviewFile(item.submissionUrl!, item.taskTitle)
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
                                  href={`/api/file-proxy?url=${encodeURIComponent(item.submissionUrl!)}&download=true`}
                                >
                                  <FileText className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                            {item.type === 'custom' ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[11px] font-medium"
                                onClick={() =>
                                  handlePreviewFile(item.submissionUrl!, item.taskTitle)
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
                          <MentorDeadlineNoteCell
                            type={item.type}
                            id={item.id}
                            studentId={studentId}
                            mentorNote={item.mentor_note}
                            studentNote={item.student_note}
                            title={item.taskTitle}
                            onSaved={fetchAll}
                          />
                          {item.type === 'custom' ? (
                            <div
                              className="mt-4 flex flex-wrap justify-end gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <CustomTaskActions
                                studentId={studentId}
                                taskId={item.id}
                                title={item.taskTitle}
                                description={item.description}
                                priority={item.priority}
                                stageOrder={item.stageOrder}
                                deadlineIso={
                                  item.deadline ? item.deadline.toISOString() : null
                                }
                                status={item.status}
                                onSaved={fetchAll}
                              />
                            </div>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <FilePreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal((p) => ({ ...p, isOpen: false }))}
        fileUrl={previewModal.fileUrl}
        fileName={previewModal.fileName}
      />

      {/* Modal Thêm Task */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Thêm nhiệm vụ / deadline</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddTask} className="p-6">
              {formError && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {formError}
                </div>
              )}
              
              <div className="space-y-5">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Tên nhiệm vụ <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    id="title" 
                    name="title" 
                    required 
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81]" 
                    placeholder="Ví dụ: Nộp bài luận lần 1"
                  />
                </div>
                
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Độ ưu tiên</label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81]"
                  >
                    <option value="HIGH">Cao</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="LOW">Thấp</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">Giai đoạn</label>
                  <select 
                    id="stage" 
                    name="stage" 
                    value={formData.stage}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81]"
                  >
                    <option value="Giai đoạn 1: Khởi động">Giai đoạn 1: Khởi động</option>
                    <option value="Giai đoạn 2: Phát triển">Giai đoạn 2: Phát triển</option>
                    <option value="Giai đoạn 3: Về đích">Giai đoạn 3: Về đích</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">Hạn chót</label>
                  <input 
                    type="date" 
                    id="deadline" 
                    name="deadline" 
                    value={formData.deadline}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81]" 
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Mô tả thêm</label>
                  <textarea 
                    id="description" 
                    name="description" 
                    rows={3} 
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81] resize-none" 
                    placeholder="Mô tả chi tiết nhiệm vụ..."
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-[#0f4c81] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting && (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  {isSubmitting ? 'Đang lưu...' : 'Thêm nhiệm vụ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
