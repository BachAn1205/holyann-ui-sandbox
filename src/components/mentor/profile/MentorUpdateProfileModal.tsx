'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import MentorProfileForm from '@/components/mentor/profile/MentorProfileForm';
import type { MentorWithUser } from '@/types/mentor';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: Partial<MentorWithUser>;
  /** Refetch / cập nhật state cha trước khi đóng modal. */
  onAfterSave: () => void | Promise<void>;
};

export default function MentorUpdateProfileModal({
  open,
  onOpenChange,
  initialData,
  onAfterSave,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="profile-creative-scope max-h-[min(92vh,64rem)] w-[calc(100%-1.5rem)] max-w-screen-2xl overflow-y-auto border-2 border-[#111827]/12 bg-card p-4 pc-sticker-shadow sm:p-6 dark:border-white/15">
        <DialogHeader className="text-left">
          <DialogTitle className="pc-display text-xl text-foreground sm:text-2xl">
            Cập nhật hồ sơ chuyên môn
          </DialogTitle>
          <DialogDescription className="pc-read-sans text-muted-foreground">
            Giống luồng học viên: chỉnh sửa trong modal — các thẻ màu bên ngoài sẽ khớp sau khi
            lưu.
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <MentorProfileForm
            compact
            initialData={initialData}
            onSaved={async () => {
              await onAfterSave();
              onOpenChange(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
