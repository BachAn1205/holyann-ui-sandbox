"use client";

import React, { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  School,
  GraduationCap,
  Calendar,
  Target,
} from "lucide-react";
import { UserAvatar } from "../UserAvatar";
import type { Mentor } from "../types";

interface StudentDetails {
  full_name: string;
  email: string;
  phone_number: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  current_school: string | null;
  current_grade: string | null;
  current_address: string | null;
  target_university_name: string | null;
  target_faculty_name: string | null;
}

interface StudentInfoContentProps {
  partnerId: string;
  partner: Mentor;
  isActive: boolean;
}

function StudentInfoSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="space-y-2 text-center">
        <div className="h-5 w-32 bg-muted rounded mx-auto animate-pulse" />
        <div className="h-4 w-16 bg-muted/80 rounded mx-auto animate-pulse" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

const formatDateOfBirth = (dateStr: string | null) => {
  if (!dateStr) return "Chưa cập nhật";
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "Chưa cập nhật";
  }
};

export const StudentInfoContent: React.FC<StudentInfoContentProps> = ({
  partnerId,
  partner,
  isActive,
}) => {
  const [details, setDetails] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!partnerId || !isActive) return;
    if (loaded) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/chat/student/${partnerId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) setDetails(data.student);
        }
      } catch (err) {
        console.error("Error fetching student info:", err);
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    };

    fetchDetails();
  }, [partnerId, isActive, loaded]);

  if (!isActive) return null;
  if (loading) return <StudentInfoSkeleton />;

  return (
    <div className="space-y-4">
      <div className="p-4 text-center border-b border-border bg-gradient-to-b from-primary/5 to-transparent rounded-lg">
        <div className="flex justify-center mb-3">
          <UserAvatar
            avatarUrl={details?.avatar_url ?? partner.avatar}
            name={details?.full_name || partner.name}
            size="lg"
            showOnlineIndicator={false}
            isOnline={partner.isOnline}
            className="shadow-md"
          />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1.5">
          {details?.full_name || partner.name}
        </h3>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary">
          Học viên
        </span>
      </div>

      <div className="p-3 border-b border-border">
        <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
          <Mail size={14} className="text-primary" />
          Thông tin liên hệ
        </h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <Mail size={12} className="text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="text-foreground break-all">
                {details?.email || "Chưa cập nhật"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Phone size={12} className="text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground">Điện thoại</p>
              <p className="text-foreground">
                {details?.phone_number || "Chưa cập nhật"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar size={12} className="text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground">Ngày sinh</p>
              <p className="text-foreground">
                {formatDateOfBirth(details?.date_of_birth || null)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 border-b border-border">
        <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
          <School size={14} className="text-purple-500" />
          Học vấn
        </h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <School size={12} className="text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground">Trường hiện tại</p>
              <p className="text-foreground">
                {details?.current_school || "Chưa cập nhật"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <GraduationCap size={12} className="text-muted-foreground mt-0.5" />
            <div>
              <p className="text-muted-foreground">Lớp</p>
              <p className="text-foreground">
                {details?.current_grade || "Chưa cập nhật"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {(details?.target_faculty_name || details?.target_university_name) && (
        <div className="p-3 border-b border-border">
          <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Target size={14} className="text-primary" />
            Mục tiêu
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <Target size={12} className="text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-muted-foreground">Ngành / Trường đích</p>
                <p className="text-foreground">
                  {[details.target_faculty_name, details.target_university_name]
                    .filter(Boolean)
                    .join(" @ ") || "Chưa thiết lập"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
