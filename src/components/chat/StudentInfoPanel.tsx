"use client";

import React, { useEffect, useState } from "react";
import {
    X,
    Mail,
    Phone,
    School,
    GraduationCap,
    Calendar,
    Loader2,
    FileText,
    Clock,
    ChevronRight
} from "lucide-react";
import { Mentor } from "./types";

interface StudentDetails {
    id: string;
    full_name: string;
    email: string;
    phone_number: string | null;
    avatar_url: string | null;
    date_of_birth: string | null;
    current_school: string | null;
    grade: string | null;
    city: string | null;
    country: string | null;
}

interface StudentInfoPanelProps {
    student: Mentor; // Contains basic student data from chat
    showMobileInfo: boolean;
    onCloseMobileInfo: () => void;
    onShowSharedMedia?: () => void;
}

export const StudentInfoPanel: React.FC<StudentInfoPanelProps> = ({
    student,
    showMobileInfo,
    onCloseMobileInfo,
    onShowSharedMedia,
}) => {
    const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStudentDetails = async () => {
            if (!student.id) return;

            setIsLoading(true);
            try {
                const res = await fetch(`/api/chat/student/${student.id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success) {
                        setStudentDetails(data.student);
                    }
                }
            } catch (error) {
                console.error('Error fetching student details:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudentDetails();
    }, [student.id]);

    // Format date of birth
    const formatDateOfBirth = (dateStr: string | null) => {
        if (!dateStr) return 'Chưa cập nhật';
        try {
            return new Date(dateStr).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return 'Chưa cập nhật';
        }
    };

    return (
        <div
            className={`w-72 bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 flex flex-col h-full overflow-hidden ${
                showMobileInfo
                    ? "fixed inset-y-0 right-0 z-50 shadow-2xl"
                    : "hidden lg:flex"
            }`}
        >
            {/* Mobile Close Button */}
            {showMobileInfo && (
                <button
                    onClick={onCloseMobileInfo}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full lg:hidden text-gray-600 dark:text-slate-300"
                >
                    <X size={20} />
                </button>
            )}

            {/* Header / Avatar */}
            <div className="p-6 flex flex-col items-center border-b border-gray-100 dark:border-slate-700 text-center">
                <div className="relative mb-4">
                    <img
                        src={studentDetails?.avatar_url || student.avatar || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"%3E%3Ccircle cx="48" cy="48" r="48" fill="%23e5e7eb"/%3E%3Ccircle cx="48" cy="38" r="14" fill="%239ca3af"/%3E%3Cellipse cx="48" cy="88" rx="24" ry="18" fill="%239ca3af"/%3E%3C/svg%3E'}
                        alt={studentDetails?.full_name || student.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md"
                        onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"%3E%3Ccircle cx="48" cy="48" r="48" fill="%23e5e7eb"/%3E%3Ccircle cx="48" cy="38" r="14" fill="%239ca3af"/%3E%3Cellipse cx="48" cy="88" rx="24" ry="18" fill="%239ca3af"/%3E%3C/svg%3E';
                        }}
                    />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {studentDetails?.full_name || student.name}
                </h3>
                <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                    Học viên
                </span>
            </div>

            {/* Info List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <>
                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Thông tin liên hệ
                            </h4>

                            <div className="flex items-start gap-3 text-sm">
                                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Email</p>
                                    <p className="text-gray-600 dark:text-slate-300 break-all">
                                        {studentDetails?.email || 'Chưa cập nhật'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 text-sm">
                                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Điện thoại</p>
                                    <p className="text-gray-600 dark:text-slate-300">
                                        {studentDetails?.phone_number || 'Chưa cập nhật'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 text-sm">
                                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Ngày sinh</p>
                                    <p className="text-gray-600 dark:text-slate-300">
                                        {formatDateOfBirth(studentDetails?.date_of_birth || null)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Academic Info */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Học vấn
                            </h4>

                            <div className="flex items-start gap-3 text-sm">
                                <School className="w-5 h-5 text-purple-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Trường hiện tại</p>
                                    <p className="text-gray-600 dark:text-slate-300">
                                        {studentDetails?.current_school || 'Chưa cập nhật'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 text-sm">
                                <GraduationCap className="w-5 h-5 text-orange-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Lớp</p>
                                    <p className="text-gray-600 dark:text-slate-300">
                                        {studentDetails?.grade || 'Chưa cập nhật'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                                Thao tác nhanh
                            </h4>
                            <div className="space-y-2">
                                <button
                                    onClick={onShowSharedMedia}
                                    className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors group"
                                >
                                    <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
                                        <FileText className="w-4 h-4 text-blue-500" />
                                        File đã gửi
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300" />
                                </button>
                                <button className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors group">
                                    <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-200">
                                        <Clock className="w-4 h-4 text-amber-500" />
                                        Đặt lịch hẹn
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-slate-300" />
                                </button>
                            </div>
                        </div>

                        <button className="w-full py-2.5 mt-4 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors text-sm">
                            Xem hồ sơ chi tiết
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
