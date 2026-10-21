'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export default function MentorSubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatPage = pathname?.includes('/chat');
  const isDashboardPage = pathname?.includes('/dashboard');
  const isStudentsPage = pathname?.includes('/students');
  const isProfilePage = pathname?.includes('/profile');
  const isSettingsPage = pathname?.includes('/settings');
  const isDeadlinesPage = pathname?.includes('/deadlines');

  // Dashboard + Students + Chat + Profile + Settings + Deadlines use full-bleed layout (match student deadlines).
  if (
    isChatPage ||
    isDashboardPage ||
    isStudentsPage ||
    isProfilePage ||
    isSettingsPage ||
    isDeadlinesPage
  ) {
    return <>{children}</>;
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {children}
    </div>
  );
}
