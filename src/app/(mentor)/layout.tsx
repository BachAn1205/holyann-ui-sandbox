import React from 'react';
import MentorNavbar from '@/components/mentor/MentorNavbar';
import MentorFloatingActionMenu from '@/components/support/MentorFloatingActionMenu';

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-300 font-university-sans">
      {/* Navbar at the top */}
      <MentorNavbar />
      
      <main className="w-full">{children}</main>
      <MentorFloatingActionMenu />
    </div>
  );
}
