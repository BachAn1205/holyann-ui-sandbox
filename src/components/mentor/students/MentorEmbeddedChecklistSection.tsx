'use client';

import { useEffect, useState } from 'react';
import { getStudentChecklist, type MentorStudentChecklistData } from '@/actions/mentor-checklist';
import ChecklistTab from '@/components/mentor/student/ChecklistTab';
import DeadlineManagementTab from '@/components/mentor/student/DeadlineManagementTab';
import { PageLoading } from '@/components/ui/PageLoading';

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; checklist: MentorStudentChecklistData; customJson: unknown };

export default function MentorEmbeddedChecklistSection({ studentId }: { studentId: string }) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    (async () => {
      try {
        const [checklistResult, customRes] = await Promise.all([
          getStudentChecklist(studentId),
          fetch(`/api/mentor/students/${studentId}/custom-deadlines`),
        ]);
        const customJson = customRes.ok ? await customRes.json().catch(() => null) : null;
        if (cancelled) return;
        if (!checklistResult.success || !checklistResult.data) {
          setState({ status: 'error' });
          return;
        }
        setState({
          status: 'ready',
          checklist: checklistResult.data,
          customJson,
        });
      } catch {
        if (!cancelled) setState({ status: 'error' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (state.status === 'loading') {
    return (
      <div className="flex h-64 items-center justify-center">
        <PageLoading inline size="md" message="Đang tải checklist..." className="py-0" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-xl border border-border bg-card py-10 text-center text-sm text-muted-foreground">
        Không tải được tiến độ học viên.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ChecklistTab studentId={studentId} initialChecklistData={state.checklist} />
      <DeadlineManagementTab
        studentId={studentId}
        deadlineBootstrap={{ checklistData: state.checklist, customJson: state.customJson }}
      />
    </div>
  );
}
