import React from 'react';
import AdminSupportChat from '@/components/admin/support/AdminSupportChat';
import RoleGuard from '@/components/auth/RoleGuard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hỗ trợ học viên | Admin Dashboard',
  description: 'Quản lý và hỗ trợ học viên trực tuyến',
};

export default function AdminSupportPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-140px)] flex flex-col overflow-hidden rounded-2xl bg-card/50 shadow-lg">
        <AdminSupportChat />
      </div>
    </RoleGuard>
  );
}
