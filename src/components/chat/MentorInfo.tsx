"use client";

import React, { useEffect, useState } from "react";
import {
    X,
    Star,
    Award,
    BookOpen,
    FileText,
    Clock,
    ChevronRight,
    Mail,
    Phone,
    Briefcase,
    GraduationCap,
    Loader2
} from "lucide-react";
import { Mentor } from "./types";
import { getRoleIcon, getRoleColor } from "./utils";
import { UserAvatar } from "./UserAvatar";

interface MentorDetails {
    id: string;
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

interface MentorInfoProps {
    mentor: Mentor;
    showMobileInfo: boolean;
    onCloseMobileInfo: () => void;
    onShowSharedMedia?: () => void;
}

export const MentorInfo: React.FC<MentorInfoProps> = ({
    mentor,
    showMobileInfo,
    onCloseMobileInfo,
    onShowSharedMedia,
}) => {
    const [mentorDetails, setMentorDetails] = useState<MentorDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const RoleIcon = getRoleIcon(mentor.roleCode);
    const roleColors = getRoleColor(mentor.roleCode);

    useEffect(() => {
        const fetchMentorDetails = async () => {
            if (!mentor.id) return;

            setIsLoading(true);
            try {
                const res = await fetch(`/api/chat/mentor/${mentor.id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setMentorDetails(data.mentor);
                    }
                }
            } catch (error) {
                console.error('Error fetching mentor details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMentorDetails();
    }, [mentor.id]);

    // Get role description
    const getRoleDescription = (roleCode: string) => {
        switch (roleCode) {
            case 'AS':
                return 'Admissions Strategist - Tư vấn chiến lược du học';
            case 'ACS':
                return 'Academic Content Specialist - Chuyên gia nội dung học thuật';
            case 'ARD':
                return 'Activity & Research Development - Phát triển hoạt động & nghiên cứu';
            default:
                return 'Mentor';
        }
    };

    return (
        <div
            className={`w-72 bg-card border-l border-border flex flex-col h-full overflow-hidden ${
                showMobileInfo
                    ? "fixed inset-y-0 right-0 z-50 shadow-2xl"
                    : "hidden lg:flex"
            }`}
        >
            {showMobileInfo && (
                <button
                    onClick={onCloseMobileInfo}
                    className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full lg:hidden text-muted-foreground z-10"
                >
                    <X size={20} />
                </button>
            )}

            <div className="p-4 text-center border-b border-border shrink-0 bg-gradient-to-b from-primary/5 to-transparent">
                <div className="flex justify-center mb-3">
                    <UserAvatar
                        avatarUrl={mentorDetails?.avatar_url ?? mentor.avatar}
                        name={mentorDetails?.full_name || mentor.name}
                        size="lg"
                        showOnlineIndicator={false}
                        isOnline={mentor.isOnline}
                        className="shadow-md"
                    />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1.5">
                    {mentorDetails?.full_name || mentor.name}
                </h3>
                <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${roleColors.bg} ${roleColors.text}`}
                >
                    <RoleIcon size={12} />
                    {mentorDetails?.specialization || mentor.roleCode}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        {/* Contact Info */}
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
                                            {mentorDetails?.email || 'Chưa cập nhật'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Phone size={12} className="text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-muted-foreground">Điện thoại</p>
                                        <p className="text-foreground">
                                            {mentorDetails?.phone_number || 'Chưa cập nhật'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Role Info */}
                        <div className="p-3 border-b border-border">
                            <h4 className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                                <BookOpen size={14} className="text-primary" />
                                Vai trò
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {mentorDetails?.bio || getRoleDescription(mentorDetails?.specialization || mentor.roleCode)}
                            </p>
                        </div>

                        {/* Work Info */}
                        {(mentorDetails?.current_company || mentorDetails?.current_job_title) && (
                            <div className="p-3 border-b border-border">
                                <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                                    <Briefcase size={14} className="text-blue-500" />
                                    Công việc hiện tại
                                </h4>
                                <div className="space-y-1 text-xs">
                                    {mentorDetails?.current_job_title && (
                                        <p className="text-foreground font-medium">{mentorDetails.current_job_title}</p>
                                    )}
                                    {mentorDetails?.current_company && (
                                        <p className="text-muted-foreground">{mentorDetails.current_company}</p>
                                    )}
                                    {mentorDetails?.years_of_experience && (
                                        <p className="text-muted-foreground">{mentorDetails.years_of_experience} năm kinh nghiệm</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Education */}
                        {(mentorDetails?.university_name || mentorDetails?.degree) && (
                            <div className="p-3 border-b border-border">
                                <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                                    <GraduationCap size={14} className="text-purple-500" />
                                    Học vấn
                                </h4>
                                <div className="space-y-1 text-xs">
                                    {mentorDetails?.university_name && (
                                        <p className="text-foreground font-medium">{mentorDetails.university_name}</p>
                                    )}
                                    {mentorDetails?.degree && mentorDetails?.major && (
                                        <p className="text-muted-foreground">{mentorDetails.degree} - {mentorDetails.major}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Achievements */}
                        <div className="p-3 border-b border-border">
                            <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                                <Award size={14} className="text-amber-500 dark:text-amber-400" />
                                Thành tựu
                            </h4>
                            {mentorDetails?.achievements && mentorDetails.achievements.length > 0 ? (
                                <ul className="space-y-1.5">
                                    {mentorDetails.achievements.slice(0, 4).map((achievement, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start gap-1.5 text-xs text-muted-foreground"
                                        >
                                            <Star
                                                size={12}
                                                className="text-amber-500 dark:text-amber-400 mt-0.5 shrink-0"
                                            />
                                            <span className="line-clamp-2">{achievement}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-muted-foreground">Chưa cập nhật</p>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="p-3 border-b border-border">
                            <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                                Thao tác nhanh
                            </h4>
                            <div className="space-y-1.5">
                                <button
                                    onClick={onShowSharedMedia}
                                    className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 hover:bg-muted rounded-lg transition-colors group border border-border"
                                >
                                    <span className="flex items-center gap-1.5 text-xs text-foreground">
                                        <FileText size={14} className="text-primary" />
                                        File đã gửi
                                    </span>
                                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground" />
                                </button>
                                <button className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 hover:bg-muted rounded-lg transition-colors group border border-border">
                                    <span className="flex items-center gap-1.5 text-xs text-foreground">
                                        <Clock size={14} className="text-amber-500 dark:text-amber-400" />
                                        Đặt lịch hẹn
                                    </span>
                                    <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};