"use client";

import RoleGuard from '@/components/auth/RoleGuard';
import { MentorChatInterface } from '@/components/chat/MentorChatInterface';
import { PageLoading } from '@/components/ui/PageLoading';
import { useAuthSession } from '@/hooks/useAuthSession';

const MENTOR_CHAT_ROLES = [
  'mentor',
  'MENTOR',
  'admin',
  'ADMIN',
  'AS',
  'ACS',
  'ARD',
  'as',
  'acs',
  'ard',
] as const;

export default function MentorChatPageContent() {
  const { isLoading } = useAuthSession();

  if (isLoading) {
    return (
      <PageLoading
        fullPage={false}
        message="Đang xác thực..."
        className="min-h-[calc(100vh-theme(spacing.20))]"
      />
    );
  }

  return (
    <RoleGuard allowedRoles={[...MENTOR_CHAT_ROLES]}>
      <div className="flex h-[calc(100vh-theme(spacing.20))] flex-col overflow-hidden bg-muted/30">
        <MentorChatInterface />
      </div>
    </RoleGuard>
  );
}
