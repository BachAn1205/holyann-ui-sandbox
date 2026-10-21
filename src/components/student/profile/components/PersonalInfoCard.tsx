"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Mail,
  Phone,
  Calendar,
  CalendarDays,
  MapPin,
  Camera,
  Pencil,
  Check,
  X,
  Loader2,
  Building2,
  GraduationCap,
  Sparkles,
  Heart,
} from "lucide-react";
import { format, parse } from "date-fns";
import { vi } from "date-fns/locale";
import { StudentProfile } from "../../../types";
import { StatusBadge } from "./StatusBadge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PersonalInfoCardProps {
  profile: StudentProfile;
  isComplete: boolean;
  onUploadAvatar?: (file: File) => void;
  uploadAvatarLoading?: boolean;
  onSave?: (data: {
    name: string;
    email: string;
    phone: string;
    dob: string;
    address: string;
  }) => void;
}

export const PersonalInfoCard: React.FC<PersonalInfoCardProps> = ({
  profile,
  isComplete,
  onUploadAvatar,
  uploadAvatarLoading = false,
  onSave,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imgError, setImgError] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    dob: profile.dob,
    address: profile.address,
  });

  useEffect(() => {
    setForm({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      dob: profile.dob,
      address: profile.address,
    });
  }, [
    profile.name,
    profile.email,
    profile.phone,
    profile.dob,
    profile.address,
  ]);

  const hasAvatarUrl =
    profile.avatarUrl &&
    (profile.avatarUrl.startsWith("http") || profile.avatarUrl.startsWith("/"));
  const showImage = Boolean(hasAvatarUrl && !imgError);
  const avatarSrc = hasAvatarUrl ? profile.avatarUrl : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadAvatar) {
      onUploadAvatar(file);
      e.target.value = "";
    }
  };

  const handleSave = () => {
    onSave?.(form);
    setEditing(false);
  };

  const handleCancel = () => {
    setForm({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      dob: profile.dob,
      address: profile.address,
    });
    setEditing(false);
  };

  const initials =
    (form.name || profile.name)
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const parseDobToDate = (dobStr: string): Date | undefined => {
    if (!dobStr || dobStr === "Chưa cập nhật") return undefined;
    try {
      const d = parse(dobStr.trim(), "dd/MM/yyyy", new Date(), { locale: vi });
      return isNaN(d.getTime()) ? undefined : d;
    } catch {
      return undefined;
    }
  };

  const dobDate = parseDobToDate(form.dob);

  const iconBox =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,#0f4c81_8%,transparent)] text-[#0f4c81] dark:bg-sky-500/15 dark:text-sky-300";

  const currentSchool = profile.relatedInfo?.currentSchool?.trim() || "";
  const currentGrade = profile.relatedInfo?.currentGrade?.trim() || "";
  const talents = profile.relatedInfo?.talents?.trim() || "";
  const hobbies = profile.relatedInfo?.hobbies?.trim() || "";

  return (
    <div className="pc-panel">
      <div className="px-4 pb-5 pt-5 sm:px-5 sm:pb-6 sm:pt-6">
        <div className="mb-5 flex items-start gap-3.5 sm:gap-4">
          <div
            className="group relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-[color-mix(in_srgb,#0f4c81_12%,transparent)] bg-slate-100 sm:h-[4.5rem] sm:w-[4.5rem] dark:border-white/10"
            onClick={() =>
              onUploadAvatar &&
              !uploadAvatarLoading &&
              inputRef.current?.click()
            }
          >
            {showImage ? (
              <img
                src={avatarSrc!}
                alt={profile.name}
                className="h-full w-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[color-mix(in_srgb,#0f4c81_8%,transparent)] text-lg font-semibold text-[#0f4c81] dark:text-sky-300">
                {initials}
              </div>
            )}
            {uploadAvatarLoading && (
              <div className="absolute inset-0 flex cursor-wait flex-col items-center justify-center bg-slate-50/90">
                <Loader2 className="h-7 w-7 animate-spin text-[#0f4c81]" />
                <span className="mt-1 text-[10px] font-medium text-slate-900">
                  Đang tải...
                </span>
              </div>
            )}
            {onUploadAvatar && !uploadAvatarLoading && (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-[#0f4c81]/70 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {editing ? (
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-lg font-semibold text-slate-900"
                placeholder="Họ tên"
              />
            ) : (
              <h2 className="pc-display truncate text-xl text-slate-900 sm:text-2xl dark:text-foreground">
                {profile.name}
              </h2>
            )}
            <p className="mt-0.5 text-xs text-slate-500 dark:text-muted-foreground">
              Mã HS: {profile.id}
            </p>
            {currentSchool || currentGrade ? (
              <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-600 dark:text-muted-foreground">
                {currentSchool ? (
                  <span className="inline-flex min-w-0 max-w-full items-center gap-1">
                    <Building2 className="size-3 shrink-0 opacity-70" aria-hidden />
                    <span className="truncate">{currentSchool}</span>
                  </span>
                ) : null}
                {currentGrade ? (
                  <span className="inline-flex shrink-0 items-center gap-1">
                    <GraduationCap className="size-3 shrink-0 opacity-70" aria-hidden />
                    <span>Lớp {currentGrade}</span>
                  </span>
                ) : null}
              </p>
            ) : null}
            <div className="mt-2">
              <StatusBadge isComplete={isComplete} />
            </div>
          </div>
        </div>

        <div className="border-t border-[color-mix(in_srgb,#0f4c81_10%,transparent)] pt-4 dark:border-white/10">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="pc-mono-caps">Thông tin cá nhân</h3>
            {onSave &&
              (editing ? (
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="rounded-lg bg-[#0f4c81] p-1.5 text-white hover:bg-[#0c3d68]"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-50"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-lg bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-50 dark:bg-muted dark:text-muted-foreground"
                  title="Chỉnh sửa"
                >
                  <Pencil size={14} />
                </button>
              ))}
          </div>

          <div className="divide-y divide-[color-mix(in_srgb,#0f4c81_8%,transparent)] text-sm dark:divide-white/8">
            <div className="flex items-center gap-3 py-2.5">
              <div className={iconBox}>
                <Mail size={14} />
              </div>
              {editing ? (
                <input
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-slate-900"
                  placeholder="Email"
                />
              ) : (
                <span className="truncate text-slate-900 dark:text-foreground">
                  {profile.email}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 py-2.5">
              <div className={iconBox}>
                <Phone size={14} />
              </div>
              {editing ? (
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-slate-900"
                  placeholder="Số điện thoại"
                />
              ) : (
                <span className="text-slate-900 dark:text-foreground">
                  {profile.phone}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 py-2.5">
              <div className={iconBox}>
                <Calendar size={14} />
              </div>
              {editing ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-8 min-w-0 flex-1 justify-start px-2 text-left font-normal",
                        !form.dob || form.dob === "Chưa cập nhật"
                          ? "text-slate-500"
                          : "text-slate-900",
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4 shrink-0" />
                      {form.dob && form.dob !== "Chưa cập nhật"
                        ? form.dob
                        : "Chọn ngày sinh"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dobDate}
                      onSelect={(date) => {
                        if (date) {
                          setForm((f) => ({
                            ...f,
                            dob: format(date, "dd/MM/yyyy", { locale: vi }),
                          }));
                        }
                      }}
                      locale={vi}
                      defaultMonth={dobDate}
                      captionLayout="dropdown"
                      fromYear={1980}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              ) : (
                <span className="text-slate-900 dark:text-foreground">
                  {profile.dob}
                </span>
              )}
            </div>
            <div className="flex items-start gap-3 py-2.5">
              <div className={cn(iconBox, "mt-0.5")}>
                <MapPin size={14} />
              </div>
              {editing ? (
                <input
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  className="min-w-0 flex-1 rounded border border-slate-200 bg-white px-2 py-1 text-slate-900"
                  placeholder="Địa chỉ"
                />
              ) : (
                <span className="text-slate-900 dark:text-foreground">
                  {profile.address}
                </span>
              )}
            </div>
          </div>

          {talents || hobbies ? (
            <div className="mt-3 space-y-2 rounded-xl border border-[color-mix(in_srgb,#0f4c81_8%,transparent)] bg-[color-mix(in_srgb,#0f4c81_3%,transparent)] px-3 py-2.5 dark:border-white/8 dark:bg-white/[0.03]">
              {talents ? (
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-700 dark:text-foreground">
                  <Sparkles
                    className="mr-1 inline size-3 align-text-bottom text-[#0f4c81] dark:text-sky-400"
                    aria-hidden
                  />
                  <span className="font-semibold text-slate-800 dark:text-foreground">
                    Năng khiếu:
                  </span>{" "}
                  {talents}
                </p>
              ) : null}
              {hobbies ? (
                <p className="line-clamp-2 text-xs leading-relaxed text-slate-700 dark:text-foreground">
                  <Heart
                    className="mr-1 inline size-3 align-text-bottom text-[#0f4c81] dark:text-sky-400"
                    aria-hidden
                  />
                  <span className="font-semibold text-slate-800 dark:text-foreground">
                    Sở thích:
                  </span>{" "}
                  {hobbies}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
