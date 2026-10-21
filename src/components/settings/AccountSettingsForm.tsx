"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { KeyRound, User, Loader2, Check, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type AccountSettingsFormProps = {
  /**
   * Ví dụ: "cố vấn", "marketing", "quản trị".
   * Nếu không truyền, dùng câu mặc định cho học sinh ("của bạn").
   */
  roleDescriptor?: string;
};

export function AccountSettingsForm({ roleDescriptor }: AccountSettingsFormProps) {
  const { update } = useSession();

  const [fullName, setFullName] = useState("");
  const [initialFullName, setInitialFullName] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [nameFeedback, setNameFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(
    null
  );
  const [showReloginDialog, setShowReloginDialog] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/users/profile");
        if (!res.ok) return;
        const data = (await res.json()) as { full_name?: string | null };
        if (cancelled) return;
        const name = typeof data.full_name === "string" ? data.full_name.trim() : "";
        setFullName(name);
        setInitialFullName(name);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpdateName = async () => {
    const trimmed = fullName.trim();
    if (!trimmed) return;
    setIsUpdating(true);
    setNameFeedback(null);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: trimmed }),
      });
      if (res.ok) {
        setNameFeedback({ kind: "success", text: "Đã lưu tên hiển thị." });
        setInitialFullName(trimmed);
        await update({ name: trimmed });
        setShowReloginDialog(true);
        setTimeout(() => setNameFeedback(null), 4000);
      } else {
        const data = await res.json();
        setNameFeedback({ kind: "error", text: data.error || "Có lỗi xảy ra." });
      }
    } catch {
      setNameFeedback({ kind: "error", text: "Có lỗi xảy ra." });
    } finally {
      setIsUpdating(false);
    }
  };

  const subtitle = roleDescriptor
    ? `Quản lý tên hiển thị và mật khẩu tài khoản ${roleDescriptor}.`
    : "Quản lý tên hiển thị và mật khẩu của bạn.";

  const nameUnchanged = fullName.trim() === (initialFullName ?? "");
  const saveDisabled =
    profileLoading || isUpdating || fullName.trim() === "" || nameUnchanged;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Cài đặt</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
      </div>

      <Card className="rounded-2xl border border-border/80 bg-card shadow-md shadow-black/5 dark:shadow-black/20">
        <CardHeader className="space-y-1 border-b border-border bg-muted/40 px-6 py-5">
          <CardTitle className="text-base font-semibold">Tài khoản</CardTitle>
          <CardDescription className="text-sm">Tên hiển thị và mật khẩu đăng nhập</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Tên hiển thị */}
          <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15"
                aria-hidden
              >
                <User className="size-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="font-medium leading-none text-foreground">Tên hiển thị</p>
                <p className="text-sm text-muted-foreground">
                  Tên hiển thị trên hệ thống (khác với email đăng nhập).
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[min(100%,280px)] sm:shrink-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-10 w-full border-border/80 bg-background shadow-sm sm:min-w-[200px]"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  disabled={profileLoading}
                  autoComplete="name"
                />
                <Button
                  type="button"
                  onClick={handleUpdateName}
                  disabled={saveDisabled}
                  className="h-10 w-full shrink-0 px-4 sm:w-auto"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Đang lưu…
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </Button>
              </div>
              {nameFeedback && (
                <p
                  className={`text-xs sm:text-right flex items-center gap-1 sm:justify-end ${
                    nameFeedback.kind === "success"
                      ? "font-medium text-emerald-600 dark:text-emerald-400"
                      : "text-destructive"
                  }`}
                >
                  {nameFeedback.kind === "success" ? <Check className="size-3.5 shrink-0" /> : null}
                  {nameFeedback.text}
                </p>
              )}
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Đổi mật khẩu */}
          <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15"
                aria-hidden
              >
                <KeyRound className="size-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="font-medium leading-none text-foreground">Đổi mật khẩu</p>
                <p className="text-sm text-muted-foreground">
                  Cập nhật mật khẩu đăng nhập cho tài khoản này.
                </p>
              </div>
            </div>
            <Button variant="outline" className="h-10 w-full shrink-0 gap-1.5 sm:w-auto" asChild>
              <Link href="/change-password">
                Đổi mật khẩu
                <ChevronRight className="size-4 opacity-70" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="border-t border-border/60 pt-6 text-sm text-muted-foreground">
        Bạn có thể đăng xuất từ menu tài khoản trên thanh điều hướng.
      </p>

      <Dialog open={showReloginDialog} onOpenChange={setShowReloginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật thành công</DialogTitle>
            <DialogDescription>Đăng nhập lại để nhìn thấy tên mới</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReloginDialog(false)}>
              Để sau
            </Button>
            <Button onClick={() => signOut({ callbackUrl: "/login" })}>Đăng xuất ngay</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
