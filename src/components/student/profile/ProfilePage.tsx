"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  Users,
  Target,
  Award,
  ArrowRight,
  Edit3,
} from "lucide-react";
import { StudentProfile } from "../../types";
import { ProfileHeader } from "./components/ProfileHeader";
import { PersonalInfoCard } from "./components/PersonalInfoCard";
import { AcademicInfoSection } from "./components/AcademicInfoSection";
import { ActivitiesSection } from "./components/ActivitiesSection";
import { RelatedInfoCard } from "./components/RelatedInfoCard";
import { ProfileWishlistSection } from "./components/ProfileWishlistSection";
import { ProfileTargetGoalsCard } from "./components/ProfileTargetGoalsCard";
import { ProfileCollapsibleSection } from "./components/ProfileCollapsibleSection";
import { Button } from "@/components/ui/button";

export interface ProfilePageProps {
  profile: StudentProfile;
  /** Resolved student UUID for API calls (e.g. faculty nguyện vọng). */
  resolvedStudentId?: string | null;
  onEditClick: () => void;
  onUploadAvatar?: (file: File) => void;
  uploadAvatarLoading?: boolean;
  onSaveBasicInfo?: (data: {
    name: string;
    email: string;
    phone: string;
    dob: string;
    address: string;
  }) => void;
  onSaveAcademic?: (data: {
    gpa: number;
    gpaScale: number;
    englishCertificates: { type: string; score: string; level?: string }[];
    targetMajor: string;
    targetCountry: string;
  }) => void;
  onProfileUpdate?: (updatedFields: Partial<StudentProfile>) => Promise<void>;
}

function academicSummary(profile: StudentProfile): string {
  const certCount = profile.englishCertificates?.length ?? 0;
  const gpaPart =
    profile.gpa != null && profile.gpa !== 0
      ? `GPA ${profile.gpa}/10`
      : "Chưa có GPA";
  const certPart =
    certCount > 0
      ? `${certCount} chứng chỉ ngoại ngữ`
      : profile.englishLevel && profile.englishLevel !== "Chưa cập nhật"
        ? profile.englishLevel
        : "Chưa có chứng chỉ";
  return `${gpaPart} · ${certPart}`;
}

function relatedSummary(profile: StudentProfile): string {
  const related = profile.relatedInfo;
  if (!related) return "Chưa có thông tin liên quan";
  const parts: string[] = [];
  if (String(related.yearlyBudget ?? "").trim()) {
    parts.push(`Ngân sách: ${related.yearlyBudget}`);
  }
  const parents = related.parents.filter((p) => p.fullName?.trim()).length;
  if (parents > 0) parts.push(`${parents} phụ huynh`);
  if (related.personalDesire?.trim()) parts.push("Có mong muốn cá nhân");
  return parts.length > 0 ? parts.join(" · ") : "Chưa có thông tin liên quan";
}

function goalsSummary(profile: StudentProfile): string {
  const n =
    profile.targetGoals?.length ??
    (profile.targetGoal ? 1 : 0);
  if (n === 0) return "Chưa có mục tiêu";
  return `${n} mục tiêu ngành–trường`;
}

function activitiesSummary(profile: StudentProfile): string {
  const acts = profile.extracurriculars.length;
  const awards = profile.achievements.length;
  if (acts === 0 && awards === 0) return "Chưa có hoạt động / thành tích";
  return `${acts} hoạt động · ${awards} giải thưởng`;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  resolvedStudentId,
  onEditClick,
  onUploadAvatar,
  uploadAvatarLoading = false,
  onSaveBasicInfo,
  onSaveAcademic: _onSaveAcademic,
  onProfileUpdate: _onProfileUpdate,
}) => {
  const isPersonalComplete = Boolean(
    profile.name &&
    profile.email &&
    profile.phone &&
    profile.address &&
    profile.dob,
  );
  const hasEnglishCerts =
    (profile.englishCertificates && profile.englishCertificates.length > 0) ||
    (profile.englishLevel && profile.englishLevel !== "Chưa cập nhật");
  const isAcademicComplete = Boolean(profile.gpa && hasEnglishCerts);
  const isTargetGoalsComplete = Boolean(
    (profile.targetGoals && profile.targetGoals.length > 0) || profile.targetGoal,
  );
  const isActivitiesComplete =
    profile.extracurriculars.length > 0 && profile.achievements.length > 0;

  const related = profile.relatedInfo;
  const isRelatedComplete = Boolean(
    related &&
    ((related.yearlyBudget && related.yearlyBudget.trim()) ||
      (related.personalDesire && related.personalDesire.trim()) ||
      related.parents.some((p) => p.fullName?.trim())),
  );

  const editBtn = (label = "Cập nhật trong hồ sơ") => (
    <button
      type="button"
      onClick={onEditClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted/80 sm:text-sm"
    >
      <Edit3 className="size-3.5 shrink-0" />
      {label}
    </button>
  );

  return (
    <div className="profile-creative-scope w-full overflow-x-hidden pb-8 antialiased transition-colors duration-300">
      <ProfileHeader
        onEditClick={onEditClick}
        analyzeHref="/student/profile-analysis"
      />

      <div className="mx-auto w-full space-y-5 sm:space-y-6 lg:space-y-6">
        {/* Hàng chính: Cá nhân | Nguyện vọng */}
        <div className="grid grid-cols-1 items-start gap-5 sm:gap-6 lg:grid-cols-12 lg:gap-6">
          <div className="min-w-0 lg:col-span-4">
            <PersonalInfoCard
              profile={profile}
              isComplete={isPersonalComplete}
              onUploadAvatar={onUploadAvatar}
              uploadAvatarLoading={uploadAvatarLoading}
              onSave={onSaveBasicInfo}
            />
          </div>
          <ProfileWishlistSection
            studentId={resolvedStudentId ?? null}
            bento
          />
        </div>

        {/* Khối phụ: accordion mặc định đóng */}
        <div className="space-y-3">
          <ProfileCollapsibleSection
            id="academic"
            title="Thông tin học thuật"
            icon={<BookOpen className="size-4" aria-hidden />}
            summary={academicSummary(profile)}
            isComplete={isAcademicComplete}
            actions={editBtn()}
          >
            <AcademicInfoSection
              profile={profile}
              isComplete={isAcademicComplete}
              readOnly
              bodyOnly
              onEditInModal={onEditClick}
            />
          </ProfileCollapsibleSection>

          <ProfileCollapsibleSection
            id="related"
            title="Thông tin liên quan"
            icon={<Users className="size-4" aria-hidden />}
            summary={relatedSummary(profile)}
            isComplete={!!isRelatedComplete}
            actions={editBtn()}
          >
            <RelatedInfoCard
              related={profile.relatedInfo}
              isComplete={!!isRelatedComplete}
              bodyOnly
              onEditInModal={onEditClick}
            />
          </ProfileCollapsibleSection>

          <ProfileCollapsibleSection
            id="goals"
            title="Mục tiêu"
            icon={<Target className="size-4" aria-hidden />}
            summary={goalsSummary(profile)}
            isComplete={isTargetGoalsComplete}
            actions={
              <Button variant="outline" size="sm" className="gap-1.5 rounded-lg" asChild>
                <Link href="/student/target">
                  Quản lý mục tiêu
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </Button>
            }
          >
            <ProfileTargetGoalsCard
              profile={profile}
              isComplete={isTargetGoalsComplete}
              bodyOnly
            />
          </ProfileCollapsibleSection>

          <ProfileCollapsibleSection
            id="activities"
            title="Hoạt động & Thành tích"
            icon={<Award className="size-4" aria-hidden />}
            summary={activitiesSummary(profile)}
            isComplete={isActivitiesComplete}
            actions={editBtn()}
          >
            <ActivitiesSection
              profile={profile}
              isComplete={isActivitiesComplete}
              onEditClick={onEditClick}
              alwaysPromptModal
              bodyOnly
            />
          </ProfileCollapsibleSection>
        </div>
      </div>
    </div>
  );
};
