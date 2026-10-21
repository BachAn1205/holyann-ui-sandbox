"use client";

import React, { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  BookOpen,
  Briefcase,
  GraduationCap,
  Award,
  Star,
  Loader2,
} from "lucide-react";
import { UserAvatar } from "../UserAvatar";
import { getRoleIcon, getRoleColor } from "../utils";
import type { Mentor } from "../types";

interface TeacherDetails {
  full_name: string;
  email: string;
  phone_number: string | null;
  avatar_url: string | null;
  specialization: string;
  bio: string | null;
  university_name: string | null;
  degree: string | null;
  major: string | null;
  current_company: string | null;
  current_job_title: string | null;
  years_of_experience: number | null;
  expertises: string[];
  achievements: string[];
}

interface TeacherInfoContentProps {
  partnerId: string;
  partner: Mentor;
  isActive: boolean;
}

function TeacherInfoSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="space-y-2 text-center">
        <div className="h-5 w-32 bg-muted rounded mx-auto animate-pulse" />
        <div className="h-4 w-20 bg-muted/80 rounded mx-auto animate-pulse" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  );
}

const getRoleDescription = (roleCode: string) => {
  switch (roleCode) {
    case "AS":
      return "Admissions Strategist - Tư vấn chiến lược du học";
    case "ACS":
      return "Academic Content Specialist - Chuyên gia nội dung học thuật";
    case "ARD":
      return "Activity & Research Development - Phát triển hoạt động & nghiên cứu";
    default:
      return "Mentor";
  }
};

export const TeacherInfoContent: React.FC<TeacherInfoContentProps> = ({
  partnerId,
  partner,
  isActive,
}) => {
  const [details, setDetails] = useState<TeacherDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!partnerId || !isActive) return;
    if (loaded) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/chat/mentor/${partnerId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success) setDetails(data.mentor);
        }
      } catch (err) {
        console.error("Error fetching teacher info:", err);
      } finally {
        setLoading(false);
        setLoaded(true);
      }
    };

    fetchDetails();
  }, [partnerId, isActive, loaded]);

  if (!isActive) return null;
  if (loading) return <TeacherInfoSkeleton />;

  const RoleIcon = getRoleIcon(partner.roleCode);
  const roleColors = getRoleColor(partner.roleCode);

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
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${roleColors.bg} ${roleColors.text}`}
        >
          <RoleIcon size={12} />
          {details?.specialization || partner.roleCode}
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
        </div>
      </div>

      <div className="p-3 border-b border-border">
        <h4 className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
          <BookOpen size={14} className="text-primary" />
          Vai trò
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {details?.bio ||
            getRoleDescription(details?.specialization || partner.roleCode)}
        </p>
      </div>

      {(details?.current_company || details?.current_job_title) && (
        <div className="p-3 border-b border-border">
          <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
            <Briefcase size={14} className="text-blue-500" />
            Công việc hiện tại
          </h4>
          <div className="space-y-1 text-xs">
            {details?.current_job_title && (
              <p className="text-foreground font-medium">
                {details.current_job_title}
              </p>
            )}
            {details?.current_company && (
              <p className="text-muted-foreground">{details.current_company}</p>
            )}
            {details?.years_of_experience && (
              <p className="text-muted-foreground">
                {details.years_of_experience} năm kinh nghiệm
              </p>
            )}
          </div>
        </div>
      )}

      {(details?.university_name || details?.degree) && (
        <div className="p-3 border-b border-border">
          <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
            <GraduationCap size={14} className="text-purple-500" />
            Học vấn
          </h4>
          <div className="space-y-1 text-xs">
            {details?.university_name && (
              <p className="text-foreground font-medium">
                {details.university_name}
              </p>
            )}
            {details?.degree && details?.major && (
              <p className="text-muted-foreground">
                {details.degree} - {details.major}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="p-3 border-b border-border">
        <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
          <Award size={14} className="text-amber-500 dark:text-amber-400" />
          Thành tựu
        </h4>
        {details?.achievements && details.achievements.length > 0 ? (
          <ul className="space-y-1.5">
            {details.achievements.slice(0, 4).map((a, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-xs text-muted-foreground"
              >
                <Star
                  size={12}
                  className="text-amber-500 dark:text-amber-400 mt-0.5 shrink-0"
                />
                <span className="line-clamp-2">{a}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">Chưa cập nhật</p>
        )}
      </div>
    </div>
  );
};
