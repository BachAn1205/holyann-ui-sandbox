import React from 'react';

/** Cùng mô hình trang học viên: chiều cao do page wrapper (100vh − navbar), không fixed. */
export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
