'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type CustomTaskActionsProps = {
  studentId: string;
  taskId: string;
  title: string;
  description?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  stageOrder?: number | null;
  deadlineIso?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED' | 'NEEDS_REVISION' | string;
  onSaved?: () => Promise<void> | void;
};

const STAGE_OPTIONS = [
  { order: 1, label: 'Giai đoạn 1: Khởi động' },
  { order: 2, label: 'Giai đoạn 2: Phát triển' },
  { order: 3, label: 'Giai đoạn 3: Về đích' },
] as const;

function toDateInputValue(deadlineIso?: string | null) {
  if (!deadlineIso) return '';
  const d = new Date(deadlineIso);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function CustomTaskActions({
  studentId,
  taskId,
  title,
  description,
  priority,
  stageOrder,
  deadlineIso,
  status,
  onSaved,
}: CustomTaskActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const initialForm = useMemo(
    () => ({
      title,
      description: description ?? '',
      priority: priority ?? 'MEDIUM',
      stageOrder: stageOrder ?? 1,
      deadline: toDateInputValue(deadlineIso),
      status,
    }),
    [deadlineIso, description, priority, stageOrder, status, title]
  );

  const [form, setForm] = useState(initialForm);

  const refreshAfterChange = async () => {
    if (onSaved) {
      await onSaved();
      return;
    }
    router.refresh();
  };

  const openEdit = () => {
    setForm(initialForm);
    setError('');
    setEditOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Vui lòng nhập tên nhiệm vụ.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const stageOption = STAGE_OPTIONS.find((s) => s.order === Number(form.stageOrder)) ?? STAGE_OPTIONS[0];

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        stage: stageOption.label,
        stage_order: stageOption.order,
        deadline: form.deadline || null,
        status: form.status,
      };

      const res = await fetch(`/api/mentor/students/${studentId}/custom-deadlines/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || 'Không thể cập nhật task.');
        return;
      }

      setEditOpen(false);
      await refreshAfterChange();
    } catch (err) {
      console.error('Edit custom task error:', err);
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/mentor/students/${studentId}/custom-deadlines/${taskId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || 'Không thể xóa task.');
        return;
      }
      setDeleteOpen(false);
      await refreshAfterChange();
    } catch (err) {
      console.error('Delete custom task error:', err);
      setError('Có lỗi xảy ra khi xóa task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={openEdit}
          disabled={isSubmitting}
          title="Sửa task tùy chỉnh"
        >
          <Pencil className="h-3.5 w-3.5" />
          Sửa
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => setDeleteOpen(true)}
          disabled={isSubmitting}
          title="Xóa task tùy chỉnh"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Xóa
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa task tùy chỉnh</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tên nhiệm vụ</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Độ ưu tiên</label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    priority: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH',
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81]"
              >
                <option value="HIGH">Cao</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="LOW">Thấp</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Giai đoạn</label>
              <select
                value={form.stageOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, stageOrder: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81]"
              >
                {STAGE_OPTIONS.map((opt) => (
                  <option key={opt.order} value={opt.order}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Hạn chót</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((prev) => ({ ...prev, deadline: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Trạng thái</label>
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81]"
              >
                <option value="PENDING">Chưa bắt đầu</option>
                <option value="IN_PROGRESS">Đang làm</option>
                <option value="SUBMITTED">Chờ review</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="NEEDS_REVISION">Cần sửa</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mô tả</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-[#0f4c81] focus:ring-1 focus:ring-[#0f4c81]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-[#0f4c81] hover:bg-[#0d3f6a]">
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa deadline</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa task tùy chỉnh <span className="font-semibold text-foreground">{title}</span>? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang xóa...' : 'Xóa deadline'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
