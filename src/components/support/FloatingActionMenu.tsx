"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Menu, X, Info, Headset, ListTodo, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useChatRooms } from "@/hooks/useChatRooms";

// Sub-components (lazy-imported to keep bundle light when menu is closed)
import dynamic from "next/dynamic";

const SupportChatWindow = dynamic(
  () => import("./SupportChatWindow").then((m) => m.SupportChatWindow),
  { ssr: false }
);

const TaskGuideModal = dynamic(
  () => import("./TaskGuideModal").then((m) => m.TaskGuideModal),
  { ssr: false }
);

// ─── Help Modal (inline, keeps original FloatingHelpButton form) ───────────────
import { useRef as useFormRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, X as XIcon } from "lucide-react";
import { submitSupportRequest, uploadSupportImage } from "@/actions/support";
import { usePathname } from "next/navigation";

const supportSchema = z.object({
  description: z.string().min(1, "Mô tả không được để trống"),
  image: z.any().optional(),
});
type SupportFormValues = z.infer<typeof supportSchema>;

export function HelpModal({ onClose }: { onClose: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useFormRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SupportFormValues>({
    resolver: zodResolver(supportSchema),
    defaultValues: { description: "", image: undefined },
  });

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("image", file, { shouldValidate: true });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setValue("image", undefined);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (values: SupportFormValues) => {
    setUploading(true);
    let imageUrl: string | null = null;
    try {
      if (values.image instanceof File) {
        const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
        if (!validTypes.includes(values.image.type)) {
          toast.error("Chỉ hỗ trợ file PNG, JPG, WEBP");
          return;
        }
        if (values.image.size > 5 * 1024 * 1024) {
          toast.error("File vượt quá 5MB");
          return;
        }
        const formData = new FormData();
        formData.append("file", values.image);
        const uploadRes = await uploadSupportImage(formData);
        if (!uploadRes.success || !uploadRes.url) {
          console.error("[FloatingActionMenu] Upload error:", uploadRes.error);
          toast.error(uploadRes.error || "Upload ảnh thất bại");
          return;
        }
        imageUrl = uploadRes.url;
      }

      const res = await submitSupportRequest({ description: values.description, imageUrl });
      if (res.success) {
        toast.success("Gửi yêu cầu thành công!");
        reset();
        setImagePreview(null);
        onClose();
      } else {
        toast.error(res.error || "Gửi yêu cầu thất bại");
      }
    } catch (err) {
      console.error("[FloatingActionMenu] Submit error:", err);
      toast.error("Đã xảy ra lỗi khi gửi yêu cầu");
    } finally {
      setUploading(false);
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[70] flex items-end justify-end p-4 pb-28 pr-6"
      onClick={onClose}
    >
      <div
        className="
          w-96 rounded-2xl shadow-2xl border border-border
          bg-background/95 backdrop-blur-md overflow-hidden
          animate-in slide-in-from-bottom-4 fade-in-0 duration-300
        "
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <span className="font-semibold text-base">Gửi yêu cầu trợ giúp</span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Upload area */}
          <div className="px-5 pt-5">
            <div
              className="flex flex-col items-center justify-center border-2 border-dashed border-border bg-muted/40 rounded-xl p-4 mb-3 cursor-pointer hover:bg-muted/70 transition-colors duration-200"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="flex flex-col items-center gap-2 w-full">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded-md border border-border"
                  />
                  <button
                    type="button"
                    className="text-xs text-destructive hover:underline"
                    onClick={(e) => { e.stopPropagation(); removeImage(); }}
                  >
                    Xóa ảnh
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6 text-primary" />
                  <span className="text-sm font-medium text-primary">Tải lên ảnh chụp vấn đề</span>
                  <span className="text-xs text-muted-foreground">Định dạng png, jpg · tối đa 5MB</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={onSelectFile}
              />
            </div>
          </div>

          {/* Textarea */}
          <div className="px-5 pb-2">
            <label className="block mb-1 font-medium text-sm">
              Mô tả chi tiết vấn đề <span className="text-destructive">*</span>
            </label>
            <textarea
              {...register("description")}
              placeholder="Nhập mô tả chi tiết tại đây ..."
              className="w-full resize-none min-h-[90px] px-3 py-2 rounded-xl border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm placeholder:text-muted-foreground"
              maxLength={5000}
              disabled={uploading || isSubmitting}
            />
            {errors.description && (
              <span className="text-xs text-destructive mt-1 block">
                {errors.description.message}
              </span>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end px-5 py-3 border-t border-border bg-muted/30">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] flex items-center justify-center gap-2"
              disabled={isSubmitting || uploading}
            >
              {(uploading || isSubmitting) && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {uploading ? "Đang tải ảnh..." : isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Action button descriptor ─────────────────────────────────────────────────
export interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  badge?: number;
}

// ─── Speed-dial child button ──────────────────────────────────────────────────
export function SpeedDialItem({
  item,
  index,
  isOpen,
}: {
  item: ActionItem;
  index: number;
  isOpen: boolean;
}) {
  const delay = `${index * 60}ms`;

  return (
    <div
      className="flex items-center justify-end gap-3 group/item"
      style={{
        transitionDelay: isOpen ? delay : "0ms",
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? "translateY(0)" : "translateY(12px)",
        transitionProperty: "opacity, transform",
        transitionDuration: "0.25s",
        transitionTimingFunction: "ease",
        pointerEvents: isOpen ? "auto" : "none",
      }}
    >
      {/* Label */}
      <span
        className="
          px-3 py-1.5 rounded-xl text-xs font-semibold
          bg-background/90 backdrop-blur-sm border border-border
          text-foreground shadow-md
          opacity-0 group-hover/item:opacity-100
          translate-x-2 group-hover/item:translate-x-0
          transition-all duration-200 pointer-events-none
          whitespace-nowrap
        "
      >
        {item.label}
      </span>

      {/* Icon button */}
      <button
        onClick={item.onClick}
        disabled={item.loading}
        aria-label={item.label}
        className="
          relative w-12 h-12 rounded-full
          bg-background border border-border shadow-lg
          flex items-center justify-center
          text-foreground
          hover:bg-primary hover:text-primary-foreground hover:border-primary
          hover:scale-110 active:scale-95
          transition-all duration-200
          disabled:opacity-60 disabled:cursor-wait
        "
      >
        {item.loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          item.icon
        )}
        {!!item.badge && item.badge > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-background pointer-events-none">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
      </button>
    </div>
  );
}

// ─── Main FloatingActionMenu component ───────────────────────────────────────
export function FloatingActionMenu() {
  const pathname = usePathname();
  const isChatPage = pathname?.includes("/chat");

  const { user } = useAuthSession();
  const { rooms } = useChatRooms(user?.id || "");

  const unreadSupportCount = rooms
    .filter((r) => r.type === "SUPPORT")
    .reduce((acc, r) => acc + r.unreadCount, 0);

  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<
    "help" | "chat" | "tasks" | null
  >(null);
  const [supportRoomId, setSupportRoomId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  // Close menu when clicking outside
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen]);

  const toggleMenu = () => setIsOpen((v) => !v);

  // Close menu after selecting an action
  const closeMenu = () => setIsOpen(false);

  // ── Handler: Help & Info ───────────────────────────────────────────────────
  const handleHelp = useCallback(() => {
    closeMenu();
    setActivePanel((p) => (p === "help" ? null : "help"));
  }, []);

  // ── Handler: Chat Admin ────────────────────────────────────────────────────
  const handleChatAdmin = useCallback(async () => {
    closeMenu();

    // If chat already open/room known, just toggle visibility
    if (supportRoomId) {
      setActivePanel((p) => (p === "chat" ? null : "chat"));
      return;
    }

    setChatLoading(true);
    try {
      const res = await fetch("/api/support/start", { method: "POST" });
      const data = await res.json();

      if (!data.success || !data.roomId) {
        toast.error(data.error || "Không thể mở chat hỗ trợ");
        return;
      }
      setSupportRoomId(data.roomId);
      setActivePanel("chat");
    } catch {
      toast.error("Lỗi kết nối đến hỗ trợ trực tuyến");
    } finally {
      setChatLoading(false);
    }
  }, [supportRoomId]);

  // ── Handler: Task Guide ────────────────────────────────────────────────────
  const handleTasks = useCallback(() => {
    closeMenu();
    setActivePanel((p) => (p === "tasks" ? null : "tasks"));
  }, []);

  // ── Action items (bottom → top order) ─────────────────────────────────────
  const actions: ActionItem[] = [
    {
      id: "tasks",
      label: "TASK GUIDE",
      icon: <ListTodo className="w-5 h-5" />,
      onClick: handleTasks,
    },
    {
      id: "chat",
      label: "CHAT ADMIN",
      icon: <Headset className="w-5 h-5" />,
      onClick: handleChatAdmin,
      loading: chatLoading,
      badge: unreadSupportCount,
    },
    {
      id: "help",
      label: "HELP & INFO",
      icon: <Info className="w-5 h-5" />,
      onClick: handleHelp,
    },
  ];

  return (
    <>
      {/* ── Floating Speed-Dial Menu ── */}
      <div
        ref={menuRef}
        className={`fixed right-6 z-50 flex flex-col items-end gap-3 ${
          isChatPage ? "bottom-24" : "bottom-6"
        }`}
      >
        {/* Action buttons (render above trigger) */}
        <div className="flex flex-col items-end gap-3">
          {actions.map((action, i) => (
            <SpeedDialItem
              key={action.id}
              item={action}
              index={i}
              isOpen={isOpen}
            />
          ))}
        </div>

        {/* Main trigger button */}
        <button
          onClick={toggleMenu}
          aria-label={isOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={isOpen}
          className={`
            relative w-14 h-14 rounded-full
            flex items-center justify-center
            shadow-xl
            transition-all duration-300
            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
            ${
              isOpen
                ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rotate-90 scale-105"
                : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-110 active:scale-95"
            }
          `}
        >
          {/* Pulse ring when open */}
          {isOpen && (
            <span className="absolute inset-0 rounded-full animate-ping bg-slate-700/30 dark:bg-slate-300/30" />
          )}
          {!isOpen && unreadSupportCount > 0 && (
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-destructive border-2 border-primary rounded-full z-10" />
          )}
          <span
            className="transition-transform duration-300"
            style={{ transform: isOpen ? "rotate(0deg)" : "rotate(0deg)" }}
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </span>
        </button>
      </div>

      {/* ── Panels / Modals ── */}

      {/* Help & Info Modal */}
      {activePanel === "help" && (
        <HelpModal onClose={() => setActivePanel(null)} />
      )}

      {/* Task Guide Modal */}
      {activePanel === "tasks" && (
        <TaskGuideModal onClose={() => setActivePanel(null)} />
      )}

      {/* Support Chat Window */}
      {activePanel === "chat" && supportRoomId && (
        <SupportChatWindow
          roomId={supportRoomId}
          onClose={() => setActivePanel(null)}
        />
      )}
    </>
  );
}

export default FloatingActionMenu;
