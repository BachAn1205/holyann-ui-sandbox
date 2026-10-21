"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Menu, X, Info, Headset, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useChatRooms } from "@/hooks/useChatRooms";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

import { motion } from "framer-motion";

import {
  HelpModal,
  SpeedDialItem,
  type ActionItem,
} from "@/components/support/FloatingActionMenu";

// Lazy-load the chat window to keep the initial bundle small
const SupportChatWindow = dynamic(
  () =>
    import("@/components/support/SupportChatWindow").then(
      (m) => m.SupportChatWindow
    ),
  { ssr: false }
);

type StaffSupportVariant = "mentor" | "marketing";

// ─── Staff (mentor / marketing) floating support menu ─────────────────────────
export function StaffSupportFloatingMenu({ variant }: { variant: StaffSupportVariant }) {
  const pathname = usePathname();
  const isChatPage = variant === "mentor" && pathname?.includes("/mentor/chat");

  const { user } = useAuthSession();
  const { rooms } = useChatRooms(user?.id || "");

  const unreadSupportCount = rooms
    .filter((r) => r.type === "SUPPORT")
    .reduce((acc, r) => acc + r.unreadCount, 0);

  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"help" | "chat" | null>(null);
  const [supportRoomId, setSupportRoomId] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  // Drag constraints reference
  const constraintsRef = useRef<HTMLDivElement>(null);
  
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
  const closeMenu = () => setIsOpen(false);

  // ── Handler: Help & Info ───────────────────────────────────────────────────
  const handleHelp = useCallback(() => {
    closeMenu();
    setActivePanel((p) => (p === "help" ? null : "help"));
  }, []);

  // ── Handler: Chat Admin ────────────────────────────────────────────────────
  const handleChatAdmin = useCallback(async () => {
    closeMenu();

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

  // ── Action items (bottom → top order) ─────────────────────────────────────
  const actions: ActionItem[] = [
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
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        ref={menuRef as any}
        style={{ transition: 'none', touchAction: 'none' }}
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
            transition duration-300
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
            style={{ transform: "rotate(0deg)" }}
          >
            {isOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </span>
        </button>
      </motion.div>

      {/* ── Panels / Modals ── */}

      {/* Help & Info Modal */}
      {activePanel === "help" && (
        <HelpModal onClose={() => setActivePanel(null)} />
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

export function MentorFloatingActionMenu() {
  return <StaffSupportFloatingMenu variant="mentor" />;
}

export function MarketingFloatingActionMenu() {
  return <StaffSupportFloatingMenu variant="marketing" />;
}

export default MentorFloatingActionMenu;
