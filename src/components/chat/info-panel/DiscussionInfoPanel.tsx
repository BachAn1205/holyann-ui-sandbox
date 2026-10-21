"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { InfoTabs } from "./InfoTabs";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Mentor } from "../types";

interface DiscussionInfoPanelProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Mentor;
  partnerRole: "student" | "teacher";
  roomId: string;
  width?: number;
}

export const DiscussionInfoPanel: React.FC<DiscussionInfoPanelProps> = ({
  isOpen,
  onClose,
  partner,
  partnerRole,
  roomId,
  width = 320,
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const panelContent = (
    <>
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <h2 className="text-base font-bold text-foreground">Thông tin</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
          aria-label="Đóng"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <InfoTabs
          partner={partner}
          partnerRole={partnerRole}
          roomId={roomId}
          isPanelOpen={isOpen}
        />
      </div>
    </>
  );

  if (isDesktop) {
    return (
      <div
        className={`shrink-0 flex flex-col bg-card border-l border-border overflow-hidden transition-[width] duration-200 ease-out ${
          isOpen ? "" : "w-0 min-w-0 pointer-events-none"
        }`}
        style={isOpen ? { width: `${width}px` } : undefined}
        role="dialog"
        aria-label="Thông tin cuộc hội thoại"
        aria-hidden={!isOpen}
      >
        {panelContent}
      </div>
    );
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={onClose}
          aria-hidden
        />
      )}
      <div
        className={`fixed inset-0 z-50 flex flex-col bg-card transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
        role="dialog"
        aria-label="Thông tin cuộc hội thoại"
        aria-hidden={!isOpen}
      >
        {panelContent}
      </div>
    </>
  );
};
