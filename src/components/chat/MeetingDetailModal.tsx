"use client";

import React from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Clock, Calendar, ExternalLink, Crown, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MeetingMessageData } from "./types";

interface MeetingDetailModalProps {
  open: boolean;
  onClose: () => void;
  meeting: MeetingMessageData;
  /** true = mentor view (show both links), false = student view (student link only) */
  isMentor: boolean;
}

export default function MeetingDetailModal({
  open,
  onClose,
  meeting,
  isMentor,
}: MeetingDetailModalProps) {
  const startTime = new Date(meeting.startTime);
  const endTime = new Date(meeting.endTime);

  const formattedDate = format(startTime, "EEEE, dd/MM/yyyy", { locale: vi });
  const formattedStart = format(startTime, "HH:mm");
  const formattedEnd = format(endTime, "HH:mm");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-5 text-white">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <DialogTitle className="text-white text-lg font-semibold leading-tight">
                  Chi tiết buổi tư vấn
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          {/* Meeting title */}
          <p className="mt-3 text-white/90 font-medium text-base leading-snug">
            {meeting.title}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground capitalize">
                {formattedDate}
              </p>
              <p className="text-sm text-muted-foreground">
                {formattedStart} – {formattedEnd}
              </p>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Student Link */}
          {meeting.meetLink && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {isMentor ? "Link cho học viên" : "Link tham gia"}
              </p>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 shrink-0" />
                  <span className="truncate text-sm">{meeting.meetLink}</span>
                </a>
              </Button>
            </div>
          )}

          {/* Host Link — mentor only */}
          {isMentor && meeting.hostMeetLink && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Link của bạn (Host)
              </p>
              <Button
                asChild
                className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <a href={meeting.hostMeetLink} target="_blank" rel="noopener noreferrer">
                  <Crown className="w-4 h-4 shrink-0" />
                  <span className="truncate text-sm">Tham gia với quyền Host</span>
                </a>
              </Button>
            </div>
          )}

          {/* Footer close */}
          <div className="pt-1">
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
