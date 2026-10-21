"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { ProfilePage } from "@/components/student/profile";
import type { DeleteDocumentPayload } from "@/components/student/profile/components/DocumentsSection";
import AcademicInfoModal from "@/components/student/profile/AcademicInfoModal";
import { StudentPageContainer } from "@/components/student";
import { PageLoading } from "@/components/ui/PageLoading";
import { StudentProfile } from "@/components/types";
import { useAuthSession } from "@/hooks/useAuthSession";
export default function ProfilePageWrapper() {
  const {
    session,
    isLoading: sessionLoading,
    isAuthenticated,
  } = useAuthSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const analysisInFlightRef = useRef(false);
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const isInitialProfileLoad = useRef(true);

  // Get student ID from session - memoized to prevent unnecessary recalculations
  const studentId = useMemo(() => {
    if (sessionLoading) return null;

    // Priority 1: Try NextAuth session first
    const sessionUserId =
      (session?.user as any)?.id ||
      (session?.user as any)?.user_id ||
      (session?.user as any)?.sub;

    if (sessionUserId) {
      // Found student ID from NextAuth
      return sessionUserId as string;
    }

    // If we have email but no id, mark for email-based fetch
    const userEmail = session?.user?.email;
    if (userEmail && !sessionUserId) {
      console.warn(
        "⚠️ [Profile] Have email but no user ID, will fetch by email:",
        userEmail,
      );
      return `email:${userEmail}`;
    }

    console.warn("⚠️ [Profile] No student ID found");
    return null;
  }, [session?.user, sessionLoading, isAuthenticated]);

  // Get student ID from session (for use in handlers)
  const getStudentId = (): string | null => {
    return studentId;
  };

  // Fetch profile data from API
  useEffect(() => {
    // Skip if session is still loading (only for NextAuth)
    if (sessionLoading && !studentId) {
      return;
    }

    // For Custom Auth, we don't need NextAuth authentication
    // Check if we have studentId from ANY source (NextAuth or Custom Auth)
    const hasAuth = isAuthenticated || studentId;

    if (!hasAuth) {
      console.warn("⚠️ [Profile] No authentication found");
      setError("Vui lòng đăng nhập để xem hồ sơ.");
      setLoading(false);
      return;
    }

    // Skip if no studentId
    if (!studentId) {
      console.error("❌ [Profile] No student ID found", {
        session,
      });
      setError("Không tìm thấy thông tin học sinh. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    // Skip if already loaded
    // if (profile && !loading) {
    //   return;
    // }

    const fetchProfile = async () => {
      const showPageLoading = isInitialProfileLoad.current;
      try {
        if (showPageLoading) setLoading(true);

        // Check if studentId is an email marker
        let actualStudentId = studentId;
        if (studentId.startsWith("email:")) {
          const email = studentId.substring(6);
          // Fetch user by email to get the actual ID
          const userResponse = await fetch(
            `/api/users/by-email?email=${encodeURIComponent(email)}`,
          );
          if (userResponse.ok) {
            const userData = await userResponse.json();
            actualStudentId = userData.id;
          } else {
            throw new Error("Không thể tìm thấy người dùng với email này");
          }
        }

        const response = await fetch(
          `/api/students/${actualStudentId}/profile`,
        );

        if (!response.ok) {
          const text = await response.text();
          console.error("❌ [Profile] API Error Response Text:", text);
          let errorData;
          try {
            errorData = JSON.parse(text);
          } catch (e) {
            console.error("❌ [Profile] Failed to decode JWT token:", e);
            errorData = { error: "Unknown error", raw: text };
          }
          console.error("❌ [Profile] API Error Data:", errorData);
          const errorMessage =
            errorData.error || "Không thể tải thông tin học sinh";
          const errorDetails = errorData.details
            ? ` (${errorData.details})`
            : "";
          throw new Error(errorMessage + errorDetails);
        }

        const data = await response.json();

        // Check if this is a new student (just created)
        const isNewStudent = data.status?.isNewStudent;
        if (isNewStudent) {
          setIsNewStudent(true);
        } else {
          setIsNewStudent(false);
        }

        // Map API data to StudentProfile interface
        const mappedProfile: StudentProfile = {
          id: actualStudentId.substring(0, 8).toUpperCase(),
          name: data.basicInfo.full_name || "Chưa cập nhật",
          email: data.basicInfo.email || "Chưa cập nhật",
          phone: data.basicInfo.phone_number || "Chưa cập nhật",
          address: data.basicInfo.current_address || "Chưa cập nhật",
          dob: data.basicInfo.date_of_birth
            ? new Date(data.basicInfo.date_of_birth).toLocaleDateString("vi-VN")
            : "Chưa cập nhật",
          avatarUrl: data.basicInfo.avatar_url || "",

          // GPA hiện tại: Lấy GPA lớp 12, nếu không có thì lấy lớp 11
          gpa: (() => {
            const gpaDetails = data.academicProfile?.gpa_transcript_details;
            if (!gpaDetails) return 0;

            // Ưu tiên lớp 12
            if (gpaDetails.grade12) {
              return parseFloat(gpaDetails.grade12) || 0;
            }

            // Fallback lớp 11
            if (gpaDetails.grade11) {
              return parseFloat(gpaDetails.grade11) || 0;
            }

            // Fallback khác
            return (
              parseFloat(gpaDetails.grade10 || gpaDetails.grade9 || "0") || 0
            );
          })(),

          gpaScale: 10.0,
          englishLevel: data.academicProfile?.english_certificates?.[0]?.type
            ? (() => {
                const c = data.academicProfile.english_certificates[0];
                const level = c.level ? ` ${c.type === 'JLPT' ? c.level : `cấp ${c.level}`}` : '';
                return `${c.type}${level} ${c.score}`;
              })()
            : "Chưa cập nhật",
          targetMajor: ":",
          targetCountry: ":",

          // Map extracurriculars
          extracurriculars: [
            ...(data.background?.academic_extracurriculars?.map((act: any) => ({
              id: act.id,
              title: act.activity_name || "Hoạt động",
              role: act.role || "Thành viên",
              year: act.start_date
                ? new Date(act.start_date).getFullYear().toString()
                : "",
              description: act.description || "",
              category: "academic" as const,
              organization: act.organization ?? null,
              startDate: act.start_date
                ? new Date(act.start_date).toISOString().split("T")[0]
                : null,
              endDate: act.end_date
                ? new Date(act.end_date).toISOString().split("T")[0]
                : null,
              scale:
                act.scale != null && act.scale !== ""
                  ? String(act.scale)
                  : null,
              region: act.region ?? null,
            })) || []),
            ...(data.background?.non_academic_extracurriculars?.map(
              (act: any) => ({
                id: act.id,
                title: act.activity_name || "Hoạt động",
                role: act.role || "Thành viên",
                year: act.start_date
                  ? new Date(act.start_date).getFullYear().toString()
                  : "",
                description: act.description || "",
                category: "non_academic" as const,
                organization: act.organization ?? null,
                startDate: act.start_date
                  ? new Date(act.start_date).toISOString().split("T")[0]
                  : null,
                endDate: act.end_date
                  ? new Date(act.end_date).toISOString().split("T")[0]
                  : null,
                scale:
                  act.scale != null && act.scale !== ""
                    ? String(act.scale)
                    : null,
                region: act.region ?? null,
              }),
            ) || []),
          ],

          achievements: [
            ...(data.background?.academic_awards?.map((award: any) => ({
              id: award.id,
              text: award.award_name || "Giải thưởng",
              category: "academic" as const,
              issuingOrganization: award.issuing_organization ?? null,
              description: award.description ?? null,
              awardLevel: award.award_level ?? null,
              awardDate: award.award_date ?? null,
              awardCategory: award.category ?? null,
              rank:
                award.rank != null && award.rank !== ""
                  ? Number(award.rank)
                  : null,
              region: award.region ?? null,
              year:
                award.year != null && award.year !== ""
                  ? Number(award.year)
                  : null,
            })) || []),
            ...(data.background?.non_academic_awards?.map((award: any) => ({
              id: award.id,
              text: award.award_name || "Giải thưởng",
              category: "non_academic" as const,
              issuingOrganization: award.issuing_organization ?? null,
              description: award.description ?? null,
              awardLevel: award.award_level ?? null,
              awardDate: award.award_date ?? null,
              awardCategory: award.category ?? null,
              rank:
                award.rank != null && award.rank !== ""
                  ? Number(award.rank)
                  : null,
              region: award.region ?? null,
              year:
                award.year != null && award.year !== ""
                  ? Number(award.year)
                  : null,
            })) || []),
          ],

          documents: [],
        };

        setProfile(mappedProfile);
        setError(null);
        if (showPageLoading) {
          setLoading(false);
          isInitialProfileLoad.current = false;
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Có lỗi xảy ra khi tải thông tin học sinh");
        setLoading(false);
        isInitialProfileLoad.current = false;
      }
    };

    fetchProfile();
  }, [studentId, sessionLoading, isAuthenticated, profileRefreshKey]);

  const handleEditClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProfileRefreshKey((k) => k + 1);
  };

  const handleSaveProfile = async (updatedProfile: StudentProfile) => {
    const studentId = getStudentId();
    if (!studentId) return;

    try {
      const response = await fetch(`/api/students/${studentId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userInfo: {
            full_name: updatedProfile.name,
            phone_number: updatedProfile.phone,
            avatar_url: updatedProfile.avatarUrl,
          },
          studentInfo: {
            date_of_birth: updatedProfile.dob,
            current_address: updatedProfile.address,
          },
        }),
      });

      if (response.ok) {
        setProfile(updatedProfile);
        toast.success("Cập nhật thông tin thành công", {
          description: "Thông tin hồ sơ của bạn đã được lưu",
        });
      } else {
        toast.error("Cập nhật thông tin thất bại", {
          description: "Vui lòng kiểm tra lại thông tin và thử lại",
        });
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Có lỗi xảy ra khi cập nhật thông tin", {
        description: "Vui lòng thử lại sau hoặc liên hệ hỗ trợ",
      });
    }
  };

  // Handle profile updates (like avatar upload)
  const handleProfileUpdate = async (
    updatedFields: Partial<StudentProfile>,
  ): Promise<void> => {
    try {
      const studentId = getStudentId();
      if (!studentId) {
        throw new Error("Không có thông tin người dùng");
      }

      // Update local state immediately for better UX
      if (profile) {
        setProfile((prev) => (prev ? { ...prev, ...updatedFields } : null));
      }

      // Send update to server
      const actualStudentId = studentId.startsWith("email:")
        ? studentId.replace("email:", "")
        : studentId;

      const response = await fetch(`/api/students/${actualStudentId}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedFields),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      // Show success message
      toast.success("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Cập nhật thất bại. Vui lòng thử lại.");

      // Revert local state on error
      if (profile) {
        setProfile(profile); // Reset to original profile
      }
    }
  };

  const handleRefreshDocuments = async () => {
    const sid = getStudentId();
    if (!sid) return;
    try {
      const docsRes = await fetch(`/api/students/${sid}/upload-cv`);
      if (docsRes.ok) {
        const docs = await docsRes.json();
        setProfile((prev) =>
          prev
            ? { ...prev, documents: Array.isArray(docs) ? docs : prev.documents }
            : prev,
        );
      }
    } catch {
      /* ignore */
    }
  };

  const handleDeleteDocument = async (payload: DeleteDocumentPayload) => {
    const { id, publicUrl } = payload;
    const studentId = getStudentId();
    if (!studentId || studentId.startsWith("email:")) return;
    try {
      let deleteUrl = `/api/students/${studentId}/upload-cv?id=${encodeURIComponent(id)}`;
      if (publicUrl) {
        deleteUrl += `&url=${encodeURIComponent(publicUrl)}`;
      }
      const res = await fetch(deleteUrl, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setProfile((prev) =>
          prev
            ? { ...prev, documents: prev.documents.filter((d) => d.id !== id) }
            : prev,
        );
        toast.success("Đã xóa tài liệu");
      } else {
        toast.error(data.error || "Không thể xóa tài liệu");
      }
    } catch {
      toast.error("Có lỗi khi xóa tài liệu");
    }
  };

  const handleAnalyzeProfile = async () => {
    if (analysisInFlightRef.current) return;
    const studentId = getStudentId();
    if (!studentId) {
      toast.error("Không tìm thấy thông tin học sinh", {
        description: "Vui lòng đăng nhập lại để tiếp tục",
      });
      return;
    }

    analysisInFlightRef.current = true;
    setAnalysisLoading(true);
    setAnalysisResult(null);

    toast.info("Đang phân tích hồ sơ", {
      description:
        "AI đang phân tích hồ sơ của bạn. Vui lòng đợi trong giây lát...",
    });

    try {
      const response = await fetch(
        `/api/students/${studentId}/analyze-profile`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setAnalysisResult({
          error: data.error || "Có lỗi xảy ra khi phân tích hồ sơ",
          // Không set details để không hiển thị chi tiết lỗi
        });
        toast.error("Phân tích hồ sơ thất bại", {
          description: data.error || "Vui lòng thử lại sau",
        });
      } else {
        setAnalysisResult(data);
        toast.success("Phân tích hồ sơ hoàn tất", {
          description: "Đã tạo báo cáo phân tích chi tiết cho hồ sơ của bạn",
        });
      }
    } catch (error: any) {
      console.error("Error analyzing profile:", error);
      setAnalysisResult({
        error: "Có lỗi xảy ra khi kết nối đến server phân tích",
        details: error.message,
      });
      toast.error("Không thể kết nối đến server", {
        description: "Vui lòng kiểm tra kết nối mạng và thử lại",
      });
    } finally {
      analysisInFlightRef.current = false;
      setAnalysisLoading(false);
    }
  };

  // Loading state
  if (loading || sessionLoading) {
    return (
      <StudentPageContainer fullWidth>
        <PageLoading
          fullPage={false}
          message={sessionLoading ? 'Đang xác thực...' : 'Đang tải thông tin học sinh...'}
        />
      </StudentPageContainer>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <StudentPageContainer fullWidth>
        <div className="flex flex-col justify-center items-center min-h-[60vh] px-4">
          <div className="max-w-md w-full rounded-2xl border border-border shadow-sm bg-card overflow-hidden border-l-4 border-l-destructive">
            <div className="px-6 py-5 bg-destructive/5 border-b border-border">
              <h2 className="text-lg font-semibold text-destructive flex items-center gap-2">
                ⚠️ Lỗi tải dữ liệu
              </h2>
            </div>
            <div className="p-6">
              <p className="text-muted-foreground mb-4">
                {error || "Không tìm thấy thông tin học sinh"}
              </p>
              {process.env.NODE_ENV === "development" && (
                <div className="text-xs text-muted-foreground mb-4 p-3 rounded-xl bg-muted/50">
                  <strong>Debug:</strong> Student ID: {studentId || "null"} ·
                  Session: {session ? "yes" : "no"}
                </div>
              )}
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Tải lại trang
              </button>
            </div>
          </div>
        </div>
      </StudentPageContainer>
    );
  }

  return (
    <StudentPageContainer fullWidth>
      <div className="min-h-[60vh] pb-8">
        {/* Welcome Banner for New Students - dashboard style */}
        {isNewStudent && (
          <div className="relative rounded-2xl overflow-hidden mb-8 border border-primary/20 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,var(--tw-gradient-from),transparent)] from-primary/25 to-transparent" />
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 4L4 20v20l26 16 26-16V20L30 4z' fill='none' stroke='%230f4c81' stroke-width='1'/%3E%3C/svg%3E")`,
              }}
            />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6 px-6 py-8 sm:px-8 sm:py-10">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary uppercase tracking-wider">
                  Chào mừng
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mt-1">
                  🎉 Bắt đầu xây dựng hồ sơ du học
                </h2>
                <p className="text-muted-foreground mt-2 text-base max-w-xl leading-relaxed">
                  Hồ sơ của bạn đang trống. Điền thông tin cơ bản, thành tích
                  học tập và hoạt động ngoại khóa.
                </p>
                <button
                  onClick={handleEditClick}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Bắt đầu xây dựng hồ sơ
                </button>
              </div>
              <div className="hidden md:block relative w-48 h-32 rounded-xl overflow-hidden border border-border shadow-xl shrink-0">
                <img
                  src="/images/auth/left.jpg"
                  alt=""
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
              </div>
            </div>
          </div>
        )}

        <ProfilePage
          profile={profile}
          resolvedStudentId={getStudentId()}
          onEditClick={handleEditClick}
          onProfileUpdate={handleProfileUpdate}
        />
        {isModalOpen && profile && (
          <AcademicInfoModal
            studentId={getStudentId() || ""}
            onClose={handleCloseModal}
            onDocumentsChanged={handleRefreshDocuments}
            onSaved={() => {
              void handleRefreshDocuments();
              setProfileRefreshKey((k) => k + 1);
            }}
          />
        )}
      </div>
    </StudentPageContainer>
  );
}
