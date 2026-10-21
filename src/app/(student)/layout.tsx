import React from "react";
import StudentSidebar from "@/components/student/StudentSidebar";
import FloatingActionMenu from "@/components/support/FloatingActionMenu";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-slate-50 text-foreground transition-colors duration-300 font-university-sans overflow-hidden">
      <StudentSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-slate-50 relative">
        <main className="flex-1 w-full">{children}</main>
      </div>
      <FloatingActionMenu />
    </div>
  );
}
