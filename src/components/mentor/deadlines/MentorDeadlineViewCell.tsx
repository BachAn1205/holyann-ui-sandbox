'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export interface MentorDeadlineViewItem {
  id: string;
  student_id: string;
  studentName: string;
  studentEmail: string | null;
  taskTitle: string;
  stageName: string | null;
  deadlineLabel: string;
  deadlineSublabel: string;
  statusLabel: string;
  statusClass: string;
  mentor_note: string | null;
  student_note: string | null;
}

export default function MentorDeadlineViewCell({
  item,
}: {
  item: MentorDeadlineViewItem;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => setOpen(true)}
          title="Xem chi tiết"
        >
          <Eye className="h-3.5 w-3.5" />
          Xem
        </Button>
        <Link
          href={`/mentor/students?studentId=${item.student_id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Chi tiết
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader className="pr-10">
            <DialogTitle>Chi tiết deadline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Học viên</Label>
              <p className="mt-1 font-medium text-foreground">{item.studentName}</p>
              {item.studentEmail && (
                <p className="mt-0.5 text-muted-foreground">{item.studentEmail}</p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">Nhiệm vụ</Label>
              <p className="mt-1 font-medium text-foreground">{item.taskTitle}</p>
              {item.stageName && (
                <p className="mt-0.5 text-muted-foreground">{item.stageName}</p>
              )}
            </div>
            <div>
              <Label className="text-muted-foreground">Hạn chót</Label>
              <p className="mt-1 text-foreground">
                {item.deadlineLabel}
                {item.deadlineSublabel && ` · ${item.deadlineSublabel}`}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Trạng thái</Label>
              <p className="mt-1">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${item.statusClass}`}>
                  {item.statusLabel}
                </span>
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Ghi chú (mentor)</Label>
              <p className="mt-1 text-foreground">{item.mentor_note || ':'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Ghi chú (học viên)</Label>
              <p className="mt-1 text-foreground">{item.student_note || ':'}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
