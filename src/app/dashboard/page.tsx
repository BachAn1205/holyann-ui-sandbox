import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-config";
import { redirect } from "next/navigation";

/**
 * Trang /dashboard: chuy?n hu?ng theo role sau khi dang nh?p.
 * - Student / user -> /student/dashboard
 * - Mentor -> /mentor/dashboard
 * - Admin -> /admin/dashboard
 * - Marketing -> /marketing/posts
 * - Chua dang nh?p -> /login
 */
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  const role = (session.user as { role?: string }).role?.toUpperCase();
  if (role === "ADMIN") {
    redirect("/admin/dashboard");
  }
  if (role === "MARKETING") {
    redirect("/marketing/posts");
  }
  if (
    role === "MENTOR" ||
    role === "AS" ||
    role === "ACS" ||
    role === "ARD"
  ) {
    redirect("/mentor/dashboard");
  }
  // STUDENT, user, ho?c m?c d?nh
  redirect("/student/dashboard");
}

