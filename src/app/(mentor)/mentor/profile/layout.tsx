import React from "react";
import "../../../(student)/student/profile/profile-creative.css";

export default function MentorProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="profile-creative-root">{children}</div>;
}
