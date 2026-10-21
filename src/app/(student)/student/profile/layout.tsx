import React from "react";
import "./profile-creative.css";

export default function StudentProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="profile-creative-root">{children}</div>;
}
