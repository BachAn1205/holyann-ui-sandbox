"use client";

import React, { useEffect, useState } from "react";
import DashboardComponent from "@/components/student/dashboard/Dashboard";
import { StudentPageContainer } from "@/components/student";
import RoleGuard from "@/components/auth/RoleGuard";
import { useAuthSession } from "@/hooks/useAuthSession";
import type { DashboardData } from "@/components/student/dashboard/types";

export default function StudentDashboardPage() {
  const { user } = useAuthSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/student/dashboard")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setData(json ?? null);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <RoleGuard allowedRoles={["user", "student", "STUDENT"]}>
      <StudentPageContainer noPadding className="min-h-[calc(100vh-theme(spacing.14))]">
        <DashboardComponent
          userName={user?.name || "Người dùng"}
          data={data}
          isLoading={loading}
          isFreePlan={((user as any)?.subscriptionPlan ?? "FREE") === "FREE"}
        />
      </StudentPageContainer>
    </RoleGuard>
  );
}
