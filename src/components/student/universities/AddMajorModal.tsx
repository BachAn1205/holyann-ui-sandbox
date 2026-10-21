'use client';

import { useEffect, useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

type MajorPayload = {
  id: number;
  occupation_name: string;
  industry_group: string | null;
  occupation_code: string | null;
  major_score: number | null;
  job_zone: number | null;
  status: string;
  created_by_user_id: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialSearchTerm: string;
  onSuccess: (major: MajorPayload) => void;
  facultyIndustries: string[];
};

export default function AddMajorModal({ isOpen, onClose, initialSearchTerm, onSuccess, facultyIndustries }: Props) {
  const [occupationName, setOccupationName] = useState('');
  const [industryGroup, setIndustryGroup] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setOccupationName(initialSearchTerm?.trim() ?? '');
    setIndustryGroup('');
  }, [initialSearchTerm, isOpen]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!occupationName.trim() || !industryGroup) {
      toast.error('Vui lòng nhập đủ Tên ngành và Nhóm ngành.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/majors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occupation_name: occupationName.trim(),
          industry_group: industryGroup,
        }),
      });
      const data = await res.json();
      const major = data?.major as MajorPayload | undefined;

      if ((res.status === 201 || res.status === 409) && major) {
        onSuccess(major);
        onClose();
        toast.success('Đã thêm ngành vào danh sách đề xuất.');
        return;
      }

      toast.error(data?.error || 'Không thể đề xuất ngành mới.');
    } catch {
      toast.error('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6">
          <Dialog.Title className="text-lg font-semibold text-foreground">Đề xuất ngành học mới</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Nếu ngành hoặc nghề bạn muốn tìm chưa có trong hệ thống, bạn có thể gửi đề xuất.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Tên ngành / nghề</label>
              <input
                value={occupationName}
                onChange={(e) => setOccupationName(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="Ví dụ: Kỹ sư AI"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Nhóm ngành</label>
              <select
                value={industryGroup}
                onChange={(e) => setIndustryGroup(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                required
              >
                <option value="">Chọn nhóm ngành</option>
                {facultyIndustries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
                {/* Fallback open choice if industry is missing */}
                <option value="Khác">Khác (Sẽ được admin phân loại lại)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Gửi đề xuất
              </button>
            </div>
          </form>

          <Dialog.Close asChild>
            <button
              type="button"
              aria-label="Đóng"
              className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
