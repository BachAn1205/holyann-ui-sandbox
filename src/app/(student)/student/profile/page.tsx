"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { ProfilePage, ProfilePageSkeleton } from "@/components/student/profile";
import AcademicInfoModal from "@/components/student/profile/AcademicInfoModal";
import { StudentPageContainer } from "@/components/student";
import { StudentProfile } from "@/components/types";
import { useAuthSession } from "@/hooks/useAuthSession";
import { formatYearlyBudgetLabel } from "@/lib/yearly-budget";
export default function ProfilePageWrapper() {
  const {
    session,
    isLoading: sessionLoading,
    isAuthenticated,
  } = useAuthSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [resolvedStudentId, setResolvedStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const analysisInFlightRef = useRef(false);
  const [uploadAvatarLoading, setUploadAvatarLoading] = useState(false);
  /** Nguyện vọng (2 thẻ) đã hiển thị xong — sau đó mới fetch upload-cv. */
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

          // GPA hiện tại: Tính trung bình cộng của 4 năm (9,10,11,12) nếu có
          gpa: (() => {
            const gpaDetails = data.academicProfile?.gpa_transcript_details;
            if (!gpaDetails) return 0;

            const grades = [
              parseFloat(gpaDetails.grade9),
              parseFloat(gpaDetails.grade10),
              parseFloat(gpaDetails.grade11),
              parseFloat(gpaDetails.grade12),
            ].filter((g) => !isNaN(g) && g > 0);

            if (grades.length === 0) return 0;

            const sum = grades.reduce((acc, val) => acc + val, 0);
            return parseFloat((sum / grades.length).toFixed(2));
          })(),

          gpaScale: 10,
          englishCertificates: Array.isArray(
            data.academicProfile?.english_certificates,
          )
            ? data.academicProfile.english_certificates.map((c: any) => ({
                type: c.type || "",
                score: String(c.score ?? ""),
                level: c.level || "",
              }))
            : [],
          englishLevel: (() => {
            const certs = data.academicProfile?.english_certificates;
            if (!Array.isArray(certs) || certs.length === 0)
              return "Chưa cập nhật";
            return (
              certs
                .map((c: any) => {
                  const level = c.level ? ` ${c.level}` : '';
                  const score = c.score ? ` - ${c.score}` : '';
                  return `${c.type || ""}${level}${score}`.trim();
                })
                .filter(Boolean)
                .join(", ") || "Chưa cập nhật"
            );
          })(),
          targetMajor: ":",
          targetCountry: ":",
          ...(() => {
            const fromTable = Array.isArray(data.targetGoals)
              ? data.targetGoals
                  .filter(
                    (g: { faculty_name?: string | null; university_name?: string | null }) =>
                      g.faculty_name?.trim() && g.university_name?.trim(),
                  )
                  .map(
                    (g: {
                      faculty_name: string;
                      university_name: string;
                      university_id?: number | null;
                    }) => ({
                      facultyName: g.faculty_name,
                      universityName: g.university_name,
                      universityId: g.university_id ?? null,
                    }),
                  )
              : [];
            const legacy =
              data.studentInfo?.target_set_at &&
              data.studentInfo?.target_faculty_name &&
              data.studentInfo?.target_university_name
                ? [
                    {
                      facultyName: data.studentInfo.target_faculty_name,
                      universityName: data.studentInfo.target_university_name,
                      universityId: data.studentInfo.target_university_id ?? null,
                    },
                  ]
                : [];
            const list = fromTable.length > 0 ? fromTable : legacy;
            return {
              targetGoals: list.length > 0 ? list : undefined,
              targetGoal: list[0] ?? null,
            };
          })(),

          // Map extracurriculars (giữ category để hiển thị tag)
          extracurriculars: [
            ...(data.background?.academic_extracurriculars?.map((act: any) => ({
              id: act.id,
              title: act.activity_name || "Hoạt động",
              role: act.role || "Thành viên",
              year: act.start_date
                ? new Date(act.start_date).getFullYear().toString()
                : ":",
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
                  : ":",
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

          gpaTranscriptByGrade: (() => {
            const d = data.academicProfile?.gpa_transcript_details as
              | Record<string, unknown>
              | null
              | undefined;
            if (!d) return undefined;
            return {
              grade9: String(d.grade9 ?? ""),
              grade10: String(d.grade10 ?? ""),
              grade11: String(d.grade11 ?? ""),
              grade12: String(d.grade12 ?? ""),
            };
          })(),
          subjectScoresList: Array.isArray(data.background?.subject_scores)
            ? data.background.subject_scores.map(
                (s: { subject?: string; score?: number; group?: string | null }) => ({
                  subject: s.subject || "",
                  score: Number(s.score) || 0,
                  group: s.group ?? null,
                }),
              )
            : undefined,

          relatedInfo: {
            currentSchool: data.studentInfo?.current_school ?? null,
            currentGrade: data.studentInfo?.current_grade ?? null,
            yearlyBudget: formatYearlyBudgetLabel(
              data.studentInfo?.yearly_budget,
              data.studentInfo?.yearly_budget_currency,
            ),
            talents: data.studentInfo?.talents ?? null,
            hobbies: data.studentInfo?.hobbies ?? null,
            personalDesire: data.studentInfo?.personal_desire ?? null,
            parents: Array.isArray(data.parents)
              ? data.parents.map((p: any) => ({
                  id: p.id,
                  fullName: p.full_name || "",
                  relationship: p.relationship ?? null,
                  phone: p.phone_number ?? null,
                  email: p.email ?? null,
                  jobTitle: p.job_title ?? null,
                }))
              : [],
          },
        };

        setProfile(mappedProfile);
        setResolvedStudentId(actualStudentId);
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
  };

  const handleSaveProfile = async (updatedProfile: StudentProfile) => {
    const studentId = getStudentId();
    if (!studentId) return;
    try {
      const res = await fetch(`/api/students/${studentId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basicInfo: {
            full_name: updatedProfile.name,
            phone_number: updatedProfile.phone,
            email: updatedProfile.email,
            avatar_url: updatedProfile.avatarUrl,
            date_of_birth: updatedProfile.dob,
            current_address: updatedProfile.address,
          },
          studentInfo: {
            date_of_birth: updatedProfile.dob,
            current_address: updatedProfile.address,
          },
        }),
      });
      if (res.ok) {
        setProfile(updatedProfile);
        toast.success("Cập nhật thông tin thành công");
      } else {
        const data = await res.json();
        toast.error(data.error || "Cập nhật thất bại");
      }
    } catch {
      toast.error("Có lỗi khi cập nhật");
    }
  };

  const handleSaveBasicInfo = async (data: {
    name: string;
    email: string;
    phone: string;
    dob: string;
    address: string;
  }) => {
    const studentId = getStudentId();
    if (!studentId || !profile) return;
    // Chuẩn hóa ngày sinh (dd/MM/yyyy) sang ISO (YYYY-MM-DD) để API parse đúng
    const dobForApi =
      data.dob && data.dob !== "Chưa cập nhật"
        ? (() => {
            try {
              const [d, m, y] = data.dob.split("/");
              if (d && m && y)
                return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
            } catch {}
            return data.dob;
          })()
        : data.dob;
    try {
      const res = await fetch(`/api/students/${studentId}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          basicInfo: {
            full_name: data.name,
            phone_number: data.phone,
            email: data.email,
            date_of_birth: dobForApi,
            current_address: data.address,
          },
          studentInfo: {
            date_of_birth: dobForApi,
            current_address: data.address,
          },
        }),
      });
      if (res.ok) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                name: data.name,
                email: data.email,
                phone: data.phone,
                dob: data.dob,
                address: data.address,
              }
            : prev,
        );
        toast.success("Đã lưu thông tin cá nhân");
      } else {
        const err = await res.json();
        toast.error(err.error || "Lưu thất bại");
      }
    } catch {
      toast.error("Có lỗi khi lưu");
    }
  };

  const handleRefreshDocuments = async () => {
    if (!resolvedStudentId) return;
    try {
      const docsRes = await fetch(
        `/api/students/${resolvedStudentId}/upload-cv`,
      );
      if (docsRes.ok) {
        const docs = await docsRes.json();
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                documents: Array.isArray(docs) ? docs : prev.documents,
              }
            : prev,
        );
      }
    } catch (_) {
      /* ignore */
    }
  };

  const handleDeleteDocument = async (payload: {
    id: string;
    name: string;
    publicUrl?: string;
  }) => {
    const { id, publicUrl } = payload;
    const studentId = resolvedStudentId ?? getStudentId();
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

  const handleUploadAvatar = async (file: File) => {
    const studentId = getStudentId();
    if (!studentId) return;
    setUploadAvatarLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`/api/students/${studentId}/upload-avatar`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.avatarUrl) {
        setProfile((prev) =>
          prev ? { ...prev, avatarUrl: data.avatarUrl } : prev,
        );
        toast.success("Cập nhật ảnh đại diện thành công");
      } else {
        toast.error(data.error || "Không thể cập nhật ảnh");
      }
    } catch {
      toast.error("Có lỗi khi tải ảnh lên");
    } finally {
      setUploadAvatarLoading(false);
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
        "Holie Mate đang phân tích hồ sơ của bạn. Vui lòng đợi trong giây lát...",
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

  // Loading state: hiển thị skeleton thay vì spinner để UX mượt hơn
  if (loading || sessionLoading) {
    return (
      <StudentPageContainer fullWidth className="profile-creative-page-bg min-h-screen">
        <div className="min-h-[60vh]">
          <ProfilePageSkeleton />
        </div>
      </StudentPageContainer>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <StudentPageContainer fullWidth className="profile-creative-page-bg min-h-screen">
        <div className="flex flex-col justify-center items-center min-h-[60vh] px-4">
          <div className="max-w-md w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="text-red-600 dark:text-red-400 text-xl font-semibold mb-2">
              ⚠️ Lỗi tải dữ liệu
            </div>
            <div className="text-red-700 dark:text-red-300 mb-4">
              {error || "Không tìm thấy thông tin học sinh"}
            </div>
            {process.env.NODE_ENV === "development" && (
              <div className="text-xs text-muted-foreground mb-4 p-3 bg-muted rounded">
                <strong>Debug Info:</strong>
                <br />
                Student ID: {studentId || "null"}
                <br />
                Session: {session ? "exists" : "null"}
                <br />
                Authenticated: {isAuthenticated ? "yes" : "no"}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tải lại trang
            </button>
          </div>
        </div>
      </StudentPageContainer>
    );
  }

  return (
    <StudentPageContainer fullWidth className="profile-creative-page-bg min-h-screen">
      <div className="w-full">
        <ProfilePage
          profile={profile}
          resolvedStudentId={resolvedStudentId}
          onEditClick={handleEditClick}
          onUploadAvatar={handleUploadAvatar}
          uploadAvatarLoading={uploadAvatarLoading}
          onSaveBasicInfo={handleSaveBasicInfo}
        />
        {isModalOpen && profile && (
          <AcademicInfoModal
            studentId={resolvedStudentId ?? getStudentId() ?? ""}
            onClose={() => {
              handleCloseModal();
              void handleRefreshDocuments();
              setProfileRefreshKey((k) => k + 1);
            }}
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
