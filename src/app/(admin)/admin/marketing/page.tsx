"use client";

import RoleGuard from "@/components/auth/RoleGuard";
import MarketingManagement from "@/components/admin/MarketingManagement";

export default function AdminMarketingPage() {
  return (
    <RoleGuard allowedRoles={["admin", "ADMIN"]}>
      <MarketingManagement />
    </RoleGuard>
  );
}

