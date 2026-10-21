import React from "react";
import "../profile/profile-creative.css";

export default function StudentTargetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="profile-creative-root">{children}</div>;
}
