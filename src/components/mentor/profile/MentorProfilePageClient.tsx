'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { MentorWithUser } from '@/types/mentor';
import MentorProfileHeader from '@/components/mentor/profile/MentorProfileHeader';
import MentorProfileOverview from '@/components/mentor/profile/MentorProfileOverview';
import MentorUpdateProfileModal from '@/components/mentor/profile/MentorUpdateProfileModal';
import {
  emptyMentorFormState,
  mergeMentorForm,
  mentorProfileFromApi,
} from '@/components/mentor/profile/mentor-profile-data';

export default function MentorProfilePageClient() {
  const [profile, setProfile] = useState<Partial<MentorWithUser>>(emptyMentorFormState);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/mentor/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }
      const data = await response.json();
      setProfile(mergeMentorForm(mentorProfileFromApi(data)));
    } catch (e) {
      console.error(e);
      toast.error('Không thể tải thông tin hồ sơ. Vui lòng thử lại.');
      setProfile(emptyMentorFormState());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <div className="w-full overflow-x-hidden pb-8">
        <div className="overflow-hidden rounded-2xl border-2 border-[#111827]/10 bg-muted/25 pc-sticker-shadow dark:border-white/10">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex flex-1 items-center gap-3 sm:gap-4">
              <div className="h-16 w-16 shrink-0 animate-pulse rounded-xl bg-muted/70" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-8 w-48 max-w-full animate-pulse rounded-md bg-muted/70 sm:h-9 sm:w-64" />
                <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted/50" />
              </div>
            </div>
            <div className="flex gap-2 sm:shrink-0">
              <div className="h-10 w-36 animate-pulse rounded-xl bg-muted/70" />
              <div className="h-10 w-32 animate-pulse rounded-xl bg-muted/60" />
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:mt-6 sm:gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 space-y-4 sm:space-y-6 lg:col-span-6">
            <div className="overflow-hidden rounded-2xl border-2 border-sky-500/20">
              <div className="h-24 animate-pulse bg-sky-100/50 dark:bg-sky-950/30 sm:h-28" />
              <div className="space-y-3 p-4 sm:p-6">
                <div className="mx-auto h-24 w-24 animate-pulse rounded-full bg-muted/60 sm:h-28 sm:w-28" />
                <div className="mx-auto h-5 w-40 animate-pulse rounded bg-muted/50" />
                <div className="h-16 animate-pulse rounded-lg bg-muted/30" />
              </div>
            </div>
            <div className="h-48 animate-pulse rounded-2xl border-2 border-indigo-500/20 bg-gradient-to-br from-indigo-100/30 to-muted/25 dark:from-indigo-950/20" />
            <div className="h-36 animate-pulse rounded-2xl border-2 border-amber-500/25 bg-gradient-to-br from-amber-100/35 to-muted/30 dark:from-amber-950/20" />
          </div>
          <div className="min-w-0 space-y-4 sm:space-y-6 lg:col-span-6">
            <div className="h-56 animate-pulse rounded-2xl border-2 border-violet-500/20 bg-gradient-to-br from-violet-100/40 to-muted/30 dark:from-violet-950/20 sm:h-64" />
            <div className="h-44 animate-pulse rounded-2xl border-2 border-emerald-500/25 bg-gradient-to-br from-emerald-100/35 to-muted/30 dark:from-emerald-950/20" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-x-hidden pb-8 antialiased transition-colors duration-300">
        <MentorProfileHeader onOpenUpdate={() => setModalOpen(true)} />
        <MentorProfileOverview data={profile} />
      </div>
      <MentorUpdateProfileModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        initialData={profile}
        onAfterSave={loadProfile}
      />
    </>
  );
}
