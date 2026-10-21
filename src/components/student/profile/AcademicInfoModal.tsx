"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Save,
  Upload,
  ImageIcon,
  X as XIcon,
  Loader2,
  ListChecks,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { uploadFileServerAction } from "@/actions/upload";
import S3Uploader from "@/components/S3Uploader";
import { VerifyStatusBadge } from "@/components/student/profile/components/VerifyStatusBadge";
import {
  clampProjectTier,
  normalizeProjectGroupFromDb,
  type Feature1ProjectGroup,
} from "@/lib/feature1-project";
import type { YearlyBudgetCurrency } from "@/lib/yearly-budget";
import { cn } from "@/lib/utils";
import "@/app/(student)/student/profile/profile-creative.css";

/** Ném lỗi khi API trả về 4xx/5xx — tránh toast thành công khi DB không lưu. */
async function throwIfNotOk(res: Response, context: string): Promise<void> {
  if (res.ok) return;
  let detail = res.statusText || "Lỗi không xác định";
  try {
    const data = await res.json();
    if (data && typeof data.error === "string") detail = data.error;
  } catch {
    try {
      const text = await res.text();
      if (text) detail = text.slice(0, 240);
    } catch {
      /* ignore */
    }
  }
  if (res.status === 400) throw new Error(detail);
  throw new Error(`${context}: ${detail}`);
}

function formatDateForInput(dateValue: unknown): string {
  if (!dateValue) return "";
  try {
    const date = new Date(dateValue as string);
    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

const EMPTY_ACADEMIC_AWARD = {
  award_name: "",
  issuing_organization: "",
  award_level: "",
  award_date: "",
  description: "",
  category: "",
  year: "",
  rank: "",
  region: "",
};

const EMPTY_NON_ACADEMIC_AWARD = {
  award_name: "",
  category: "",
  issuing_organization: "",
  award_level: "",
  award_date: "",
  description: "",
  year: "",
  rank: "",
  region: "",
};

const EMPTY_ACADEMIC_ACTIVITY = {
  activity_name: "",
  organization: "",
  role: "",
  start_date: "",
  end_date: "",
  description: "",
  scale: "",
  region: "",
  impact_tier: 1,
};

const EMPTY_NON_ACADEMIC_ACTIVITY = {
  activity_name: "",
  organization: "",
  role: "",
  start_date: "",
  end_date: "",
  description: "",
  scale: "",
  region: "",
};

const EMPTY_WORK_EXPERIENCE = {
  company_name: "",
  job_title: "",
  start_date: "",
  end_date: "",
  description: "",
};

function AcademicInfoModalSkeleton() {
  return (
    <div className="flex flex-col flex-1 min-h-0 px-8 pb-6 pt-3 overflow-y-auto">
      <div className="shrink-0 mb-4">
        <div className="inline-flex w-full max-w-xl bg-muted/60 dark:bg-muted p-1 rounded-xl gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-9 flex-1 rounded-lg bg-muted animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden space-y-4 min-h-[280px]">
        <div className="rounded-2xl border border-border bg-card/50 p-5 space-y-4">
          <div className="h-5 w-44 rounded-md bg-muted animate-pulse" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-11 rounded-lg bg-muted/80 animate-pulse" />
            <div className="h-11 rounded-lg bg-muted/80 animate-pulse" />
          </div>
          <div className="h-11 rounded-lg bg-muted/70 animate-pulse max-w-full" />
          <div className="h-24 rounded-xl bg-muted/50 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-9 w-24 rounded-lg bg-muted/60 animate-pulse" />
            <div className="h-9 w-28 rounded-lg bg-muted/60 animate-pulse" />
          </div>
        </div>
        <div className="rounded-xl border border-dashed border-border/80 p-4 space-y-2">
          <div className="h-3 w-32 rounded bg-muted/70 animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground pt-4 flex items-center justify-center gap-2">
        <Loader2 className="size-4 animate-spin text-primary shrink-0" />
        Đang tải dữ liệu hồ sơ...
      </p>
    </div>
  );
}
type VerificationEntry = {
  verifyValid: boolean | null;
  verifyError: string | null;
};

interface AcademicInfoModalProps {
  studentId: string;
  onClose: () => void;
  /** Gọi sau khi tải minh chứng lên S3 (để làm mới «Tài liệu đính kèm» trên profile). */
  onDocumentsChanged?: () => void;
  /** Sau khi «Lưu tất cả» thành công — refetch dữ liệu trang (modal vẫn mở). */
  onSaved?: () => void;
}

export default function AcademicInfoModal({
  studentId,
  onClose,
  onDocumentsChanged,
  onSaved,
}: AcademicInfoModalProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Proof images state for each section
  const [gpaProofImages, setGpaProofImages] = useState<string[]>([]);
  const [englishCertProofImages, setEnglishCertProofImages] = useState<
    string[]
  >([]);
  const [standardizedTestProofImages, setStandardizedTestProofImages] =
    useState<string[]>([]);
  const [subjectScoreProofImages, setSubjectScoreProofImages] = useState<
    string[]
  >([]);

  // Ref đánh dấu proof_images đã được load từ DB (tránh ghi đè rỗng khi chưa load xong)
  const proofImagesLoadedRef = useRef(false);

  /** Trạng thái verify Holie Mate theo URL — trùng nguồn với « Tài liệu đính kèm » (student_document_verifications) */
  const [verificationByUrl, setVerificationByUrl] = useState<
    Record<string, VerificationEntry>
  >({});
  const [verifyingProofUrl, setVerifyingProofUrl] = useState<string | null>(
    null,
  );

  const getProofVerification = (url: string): VerificationEntry | undefined => {
    return verificationByUrl[url] ?? verificationByUrl[decodeURIComponent(url)];
  };

  const mergeProofVerification = (url: string, v: VerificationEntry) => {
    setVerificationByUrl((prev) => ({ ...prev, [url]: v }));
  };

  const handleVerifyProof = async (url: string) => {
    if (!studentId || !url || verifyingProofUrl) return;
    setVerifyingProofUrl(url);
    try {
      const filename = decodeURIComponent(
        url.split("/").pop()?.split("?")[0] || "document",
      );
      const res = await fetch(
        `/api/students/${studentId}/verify-uploaded-file`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicUrl: url,
            filename,
          }),
        },
      );
      const data = (await res.json()) as {
        error?: string;
        verifyError?: string;
        documentVerify?: { valid?: unknown };
      };
      if (!res.ok) throw new Error(data.error || "Kiểm tra thất bại");

      const valid = data.documentVerify?.valid;
      const nextVerification = {
        verifyValid: typeof valid === "boolean" ? valid : null,
        verifyError: data.verifyError ?? null,
      };
      mergeProofVerification(url, nextVerification);
      onDocumentsChanged?.();
      toast.success("Đã kiểm tra minh chứng (AI)", {
        description:
          typeof valid === "boolean"
            ? valid
              ? "AI: đạt kiểm tra nội dung."
              : "AI: chưa đạt kiểm tra nội dung."
            : data.verifyError?.slice(0, 160),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Lỗi kiểm tra");
    } finally {
      setVerifyingProofUrl(null);
    }
  };

  const renderProofVerificationControls = (url: string) => (
    <div className="flex flex-col items-center gap-1">
      <VerifyStatusBadge
        verifyValid={getProofVerification(url)?.verifyValid}
        verifyError={getProofVerification(url)?.verifyError}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 px-2 text-[11px]"
        disabled={!studentId || verifyingProofUrl !== null}
        onClick={() => void handleVerifyProof(url)}
      >
        {verifyingProofUrl === url ? (
          <Loader2 className="mr-1 size-3 animate-spin" />
        ) : (
          <ListChecks className="mr-1 size-3" />
        )}
        Verify
      </Button>
    </div>
  );

  useEffect(() => {
    if (!studentId || loading) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/students/${studentId}/document-verification-map`,
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          entries?: Array<{
            url: string;
            verifyValid: boolean | null;
            verifyError: string | null;
          }>;
        };
        const next: Record<string, VerificationEntry> = {};
        for (const e of data.entries ?? []) {
          next[e.url] = {
            verifyValid: e.verifyValid,
            verifyError: e.verifyError,
          };
        }
        if (!cancelled) setVerificationByUrl(next);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, loading]);

  // Uploading states
  const [uploadingGpa, setUploadingGpa] = useState(false);
  const [uploadingEnglishCert, setUploadingEnglishCert] = useState(false);
  const [uploadingStandardizedTest, setUploadingStandardizedTest] =
    useState(false);
  const [uploadingSubjectScore, setUploadingSubjectScore] = useState(false);

  // File input refs
  const gpaFileRef = useRef<HTMLInputElement>(null);
  const englishCertFileRef = useRef<HTMLInputElement>(null);
  const standardizedTestFileRef = useRef<HTMLInputElement>(null);
  const subjectScoreFileRef = useRef<HTMLInputElement>(null);

  // Generic upload handler
  const handleProofImageUpload = async (
    file: File,
    setImages: React.Dispatch<React.SetStateAction<string[]>>,
    setUploading: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    if (!file) return;
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Chỉ hỗ trợ file PNG, JPG, WEBP");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File vượt quá 10MB");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", studentId);
      formData.append("category", "academic");
      const result = await uploadFileServerAction(formData);
      if (result.success && result.url) {
        setImages((prev) => [...prev, result.url!]);
        // Đánh dấu tab academic đã chỉnh sửa để trigger save
        markTabModified("academic");
        onDocumentsChanged?.();
        mergeProofVerification(result.url!, {
          verifyValid: null,
          verifyError: null,
        });
        toast.success("Đã tải minh chứng", {
          description:
            "Xác minh AI thực hiện tại mục Tài liệu đính kèm trên trang hồ sơ — chỉ file đã xác minh thành công mới dùng cho phân tích profile.",
        });
      } else {
        toast.error(result.error || "Tải file thất bại");
      }
    } catch {
      toast.error("Có lỗi khi tải file");
    } finally {
      setUploading(false);
    }
  };

  // Track which tabs have been modified
  const [modifiedTabs, setModifiedTabs] = useState<Set<string>>(new Set());

  // Helper to mark tab as modified
  const markTabModified = (tab: string) => {
    setModifiedTabs((prev) => new Set(prev).add(tab));
  };

  // Wrapper functions that auto-track modifications
  const updateBasicInfo = (updates: Partial<typeof basicInfo>) => {
    setBasicInfo((prev) => ({ ...prev, ...updates }));
    markTabModified("basic");
  };

  const updateGpaData = (updates: Partial<typeof gpaData>) => {
    setGpaData((prev) => ({ ...prev, ...updates }));
    markTabModified("academic");
  };

  const updateEnglishCerts = (certs: typeof englishCerts) => {
    setEnglishCerts(certs);
    markTabModified("academic");
  };

  const updateStandardizedTests = (tests: typeof standardizedTests) => {
    setStandardizedTests(tests);
    markTabModified("academic");
  };

  const updateSubjectScores = (scores: typeof subjectScores) => {
    setSubjectScores(scores);
    markTabModified("academic");
  };

  const updateStudentGoals = (goals: Partial<typeof studentGoals>) => {
    setStudentGoals((prev) => ({ ...prev, ...goals }));
    markTabModified("other");
  };

  const updateAcademicAwards = (awards: typeof academicAwards) => {
    setAcademicAwards(awards);
    markTabModified("profile");
  };

  const updateNonAcademicAwards = (awards: typeof nonAcademicAwards) => {
    setNonAcademicAwards(awards);
    markTabModified("profile");
  };

  const updateAcademicActivities = (activities: typeof academicActivities) => {
    setAcademicActivities(activities);
    markTabModified("profile");
  };

  const updateNonAcademicActivities = (
    activities: typeof nonAcademicActivities,
  ) => {
    setNonAcademicActivities(activities);
    markTabModified("profile");
  };

  const updateWorkExperiences = (experiences: typeof workExperiences) => {
    setWorkExperiences(experiences);
    markTabModified("profile");
  };

  const updatePersonalProjects = (projects: typeof personalProjects) => {
    setPersonalProjects(projects);
    markTabModified("profile");
  };

  type SkillFormRow = { skill_name: string; proficiency: string };

  const updateHardSkills = (list: SkillFormRow[]) => {
    setHardSkills(list);
    markTabModified("profile");
  };

  const updateSoftSkills = (list: SkillFormRow[]) => {
    setSoftSkills(list);
    markTabModified("profile");
  };

  const updateParentsInfo = (parents: typeof parentsInfo) => {
    setParentsInfo(parents);
    markTabModified("other");
  };

  // Basic Info State
  const [basicInfo, setBasicInfo] = useState({
    full_name: "",
    date_of_birth: "",
    current_school: "",
    current_grade: "",
    current_address: "",
    phone_number: "",
    email: "",
    talents: "",
    hobbies: "",
  });

  const [gpaData, setGpaData] = useState({
    grade9: "",
    grade10: "",
    grade11: "",
    grade12: "",
  });
  const [isGpaScale4, setIsGpaScale4] = useState(false);
  const [isSubjectScoreScale4, setIsSubjectScoreScale4] = useState(false);

  const [englishCerts, setEnglishCerts] = useState<any[]>([
    { type: "", score: "", date: "", level: "", proof_images: [] },
  ]);

  const [standardizedTests, setStandardizedTests] = useState<any[]>([
    { type: "", score: "", date: "", proof_images: [] },
  ]);

  // Profile Info State
  const [academicAwards, setAcademicAwards] = useState<any[]>([
    {
      award_name: "",
      issuing_organization: "",
      award_level: "",
      award_date: "",
      description: "",
      category: "",
      year: "",
      rank: "",
      region: "",
    },
  ]);
  const [nonAcademicAwards, setNonAcademicAwards] = useState<any[]>([
    {
      award_name: "",
      category: "",
      issuing_organization: "",
      award_level: "",
      award_date: "",
      description: "",
      year: "",
      rank: "",
      region: "",
    },
  ]);
  const [academicActivities, setAcademicActivities] = useState<any[]>([
    {
      activity_name: "",
      organization: "",
      role: "",
      start_date: "",
      end_date: "",
      description: "",
      scale: "",
      region: "",
      impact_tier: 1,
    },
  ]);
  const [nonAcademicActivities, setNonAcademicActivities] = useState<any[]>([
    {
      activity_name: "",
      organization: "",
      role: "",
      start_date: "",
      end_date: "",
      description: "",
      scale: "",
      region: "",
    },
  ]);
  const [workExperiences, setWorkExperiences] = useState<any[]>([
    {
      company_name: "",
      job_title: "",
      start_date: "",
      end_date: "",
      description: "",
    },
  ]);
  // NEW: Additional State for Feature 1
  const [subjectScores, setSubjectScores] = useState<any[]>([
    { subject: "", score: "", year: "", semester: "", group: "natural" },
  ]);
  const [personalProjects, setPersonalProjects] = useState<
    Array<{
      project_name: string;
      group: Feature1ProjectGroup;
      tier: number;
      proof_images?: string[];
    }>
  >([
    {
      project_name: "",
      group: "science_tech",
      tier: 3,
      proof_images: [],
    },
  ]);
  const [hardSkills, setHardSkills] = useState<SkillFormRow[]>([
    { skill_name: "", proficiency: "" },
  ]);
  const [softSkills, setSoftSkills] = useState<SkillFormRow[]>([
    { skill_name: "", proficiency: "" },
  ]);

  const [studentGoals, setStudentGoals] = useState({
    yearly_budget: "",
    yearly_budget_currency: "USD" as YearlyBudgetCurrency,
    personal_desire: "",
  });

  // Parents Info State
  const [parentsInfo, setParentsInfo] = useState<any[]>([
    { full_name: "", relationship: "", phone_number: "", email: "" },
  ]);

  const loadProfileFromApi = useCallback(
    async (options?: { showLoading?: boolean }) => {
      if (!studentId) return;

      const showLoading = options?.showLoading !== false;
      try {
        if (showLoading) setLoading(true);
        const response = await fetch(`/api/students/${studentId}/profile`);

        if (!response.ok) {
          throw new Error("Failed to fetch student data");
        }

        const data = await response.json();

        // Populate Basic Info
        const dobValue =
          data.basicInfo?.date_of_birth || data.studentInfo?.date_of_birth;
        setBasicInfo({
          full_name: data.basicInfo?.full_name || "",
          date_of_birth: formatDateForInput(dobValue),
          current_school: data.studentInfo?.current_school || "",
          current_grade: data.studentInfo?.current_grade || "",
          current_address: data.basicInfo?.current_address || "",
          phone_number: data.basicInfo?.phone_number || "",
          email: data.basicInfo?.email || "",
          talents: data.studentInfo?.talents || "",
          hobbies: data.studentInfo?.hobbies || "",
        });

        // Populate GPA Data
        setGpaData({
          grade9: data.academicProfile?.gpa_transcript_details?.grade9 || "",
          grade10: data.academicProfile?.gpa_transcript_details?.grade10 || "",
          grade11: data.academicProfile?.gpa_transcript_details?.grade11 || "",
          grade12: data.academicProfile?.gpa_transcript_details?.grade12 || "",
        });

        // Populate English Certificates
        if (data.academicProfile?.english_certificates?.length > 0) {
          setEnglishCerts(
            data.academicProfile.english_certificates.map((cert: any) => ({
              ...cert,
              proof_images: Array.isArray(cert.proof_images)
                ? cert.proof_images
                : [],
            })),
          );
        } else {
          setEnglishCerts([
            { type: "", score: "", date: "", level: "", proof_images: [] },
          ]);
        }

        // Populate Standardized Tests
        if (data.academicProfile?.standardized_tests?.length > 0) {
          setStandardizedTests(
            data.academicProfile.standardized_tests.map((test: any) => ({
              ...test,
              proof_images: Array.isArray(test.proof_images)
                ? test.proof_images
                : [],
            })),
          );
        } else {
          setStandardizedTests([
            { type: "", score: "", date: "", proof_images: [] },
          ]);
        }

        // Populate Proof Images từ DB
        const rawProofImages = data.academicProfile?.proof_images;
        let proofImages: Record<string, string[]> = {};
        if (rawProofImages) {
          // Xử lý cả trường hợp Prisma trả về string JSON hoặc object trực tiếp
          if (typeof rawProofImages === "string") {
            try {
              proofImages = JSON.parse(rawProofImages);
            } catch {
              proofImages = {};
            }
          } else if (
            typeof rawProofImages === "object" &&
            !Array.isArray(rawProofImages)
          ) {
            proofImages = rawProofImages as Record<string, string[]>;
          }
        }
        if (Array.isArray(proofImages?.gpa) && proofImages.gpa.length > 0) {
          setGpaProofImages(proofImages.gpa);
        }
        if (
          Array.isArray(proofImages?.english_cert) &&
          proofImages.english_cert.length > 0
        ) {
          setEnglishCertProofImages(proofImages.english_cert);
        }
        if (
          Array.isArray(proofImages?.standardized_test) &&
          proofImages.standardized_test.length > 0
        ) {
          setStandardizedTestProofImages(proofImages.standardized_test);
        }
        if (
          Array.isArray(proofImages?.subject_score) &&
          proofImages.subject_score.length > 0
        ) {
          setSubjectScoreProofImages(proofImages.subject_score);
        }
        // Đánh dấu đã load xong proof_images từ DB
        proofImagesLoadedRef.current = true;

        // Populate Intended Major

        // Populate Academic Awards (set trực tiếp — không markTabModified)
        if (data.background?.academic_awards?.length > 0) {
          setAcademicAwards(
            data.background.academic_awards.map((a: any) => ({
              ...a,
              award_name: a.award_name || "",
              issuing_organization: a.issuing_organization || "",
              award_level: a.award_level || "",
              award_date: a.award_date || "",
              description: a.description || "",
              category: a.category || "",
              year: a.year != null && a.year !== "" ? String(a.year) : "",
              rank: a.rank != null && a.rank !== "" ? String(a.rank) : "",
              region: a.region || "",
            })),
          );
        } else {
          setAcademicAwards([{ ...EMPTY_ACADEMIC_AWARD }]);
        }

        // Populate Non-Academic Awards
        if (data.background?.non_academic_awards?.length > 0) {
          setNonAcademicAwards(
            data.background.non_academic_awards.map((a: any) => ({
              ...a,
              award_name: a.award_name || "",
              category: a.category || "",
              issuing_organization: a.issuing_organization || "",
              award_level: a.award_level || "",
              award_date: a.award_date || "",
              description: a.description || "",
              year: a.year != null && a.year !== "" ? String(a.year) : "",
              rank: a.rank != null && a.rank !== "" ? String(a.rank) : "",
              region: a.region || "",
            })),
          );
        } else {
          setNonAcademicAwards([{ ...EMPTY_NON_ACADEMIC_AWARD }]);
        }

        // Populate Academic Activities
        if (data.background?.academic_extracurriculars?.length > 0) {
          setAcademicActivities(
            data.background.academic_extracurriculars.map((a: any) => ({
              ...a,
              activity_name: a.activity_name || "",
              organization: a.organization || "",
              role: a.role || "",
              start_date: a.start_date || "",
              end_date: a.end_date || "",
              description: a.description || "",
              scale: a.scale || "",
              region: a.region || "",
              impact_tier: a.impact_tier ?? 1,
            })),
          );
        } else {
          setAcademicActivities([{ ...EMPTY_ACADEMIC_ACTIVITY }]);
        }

        // Populate Non-Academic Activities
        if (data.background?.non_academic_extracurriculars?.length > 0) {
          setNonAcademicActivities(
            data.background.non_academic_extracurriculars.map((a: any) => ({
              ...a,
              activity_name: a.activity_name || "",
              organization: a.organization || "",
              role: a.role || "",
              start_date: a.start_date || "",
              end_date: a.end_date || "",
              description: a.description || "",
              scale: a.scale || "",
              region: a.region || "",
            })),
          );
        } else {
          setNonAcademicActivities([{ ...EMPTY_NON_ACADEMIC_ACTIVITY }]);
        }

        // Populate Work Experiences
        if (data.background?.work_experiences?.length > 0) {
          setWorkExperiences(
            data.background.work_experiences.map((w: any) => ({
              ...w,
              company_name: w.company_name || "",
              job_title: w.job_title || "",
              start_date: w.start_date || "",
              end_date: w.end_date || "",
              description:
                w.responsibilities ?? w.description ?? w.achievements ?? "",
            })),
          );
        } else {
          setWorkExperiences([{ ...EMPTY_WORK_EXPERIENCE }]);
        }

        // Populate Student Goals
        setStudentGoals({
          yearly_budget:
            data.studentInfo?.yearly_budget != null &&
            data.studentInfo?.yearly_budget !== ""
              ? String(Number(data.studentInfo.yearly_budget))
              : "",
          yearly_budget_currency:
            String(data.studentInfo?.yearly_budget_currency || "")
              .trim()
              .toUpperCase() === "VND"
              ? "VND"
              : "USD",
          personal_desire: data.studentInfo?.personal_desire || "",
        });

        // Populate Parents Info
        if (data.parents?.length > 0) {
          setParentsInfo(
            data.parents.map((p: any) => ({
              ...p,
              full_name: p.full_name || "",
              relationship: p.relationship || "",
              phone_number: p.phone_number || "",
              email: p.email || "",
            })),
          );
        } else {
          setParentsInfo([
            {
              full_name: "",
              relationship: "",
              phone_number: "",
              email: "",
            },
          ]);
        }

        // Populate NEW: Subject Scores
        if (data.background?.subject_scores?.length > 0) {
          setSubjectScores(
            data.background.subject_scores.map((s: any) => ({
              ...s,
              subject: s.subject || "",
              score: s.score || "",
              year: s.year || "",
              semester: s.semester || "",
              group: s.group || "natural",
            })),
          );
        } else {
          setSubjectScores([
            { subject: "", score: "", year: "", semester: "", group: "natural" },
          ]);
        }

        // Personal Projects — Feature1: name, group, tier
        if (data.background?.personal_projects?.length > 0) {
          setPersonalProjects(
            data.background.personal_projects.map((p: any) => ({
              project_name: p.project_name || "",
              group: normalizeProjectGroupFromDb(p.project_group, p.topic),
              tier: clampProjectTier(p.tier),
              proof_images: [],
            })),
          );
        } else {
          setPersonalProjects([
            {
              project_name: "",
              group: "science_tech" as Feature1ProjectGroup,
              tier: 3,
              proof_images: [],
            },
          ]);
        }

        // Populate NEW: Skills (cứng / mềm — category trong DB)
        if (data.skills?.length > 0) {
          const hardRows = data.skills
            .filter((s: any) => String(s.category || "") !== "Soft")
            .map((s: any) => ({
              skill_name: s.skill_name || "",
              proficiency: s.proficiency || "",
            }));
          const softRows = data.skills
            .filter((s: any) => String(s.category || "") === "Soft")
            .map((s: any) => ({
              skill_name: s.skill_name || "",
              proficiency: s.proficiency || "",
            }));
          setHardSkills(
            hardRows.length > 0
              ? hardRows
              : [{ skill_name: "", proficiency: "" }],
          );
          setSoftSkills(
            softRows.length > 0
              ? softRows
              : [{ skill_name: "", proficiency: "" }],
          );
        } else {
          setHardSkills([{ skill_name: "", proficiency: "" }]);
          setSoftSkills([{ skill_name: "", proficiency: "" }]);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
        alert("Có lỗi xảy ra khi tải thông tin học sinh");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [studentId],
  );

  useEffect(() => {
    void loadProfileFromApi({ showLoading: true });
  }, [loadProfileFromApi]);

  // Save functions for each tab
  const saveBasicInfo = async () => {
    // Validate phone number
    if (basicInfo.phone_number && basicInfo.phone_number.length !== 10) {
      toast.error("Số điện thoại không hợp lệ", {
        description: "Số điện thoại của học viên cần đủ 10 số",
      });
      throw new Error("Invalid phone number");
    }

    let yearlyBudgetPayload: number | "" = "";
    const budgetStr = String(studentGoals.yearly_budget ?? "").trim();
    if (budgetStr !== "") {
      const n = Number(budgetStr.replace(/,/g, ""));
      if (!Number.isFinite(n) || n < 0) {
        toast.error("Ngân sách không hợp lệ", {
          description:
            "Chỉ nhập số tiền (ví dụ 30000). Chọn USD hoặc VND ở ô bên cạnh — không ghi chữ trong ô số.",
        });
        throw new Error("Invalid yearly budget");
      }
      yearlyBudgetPayload = n;
    }

    const res = await fetch(`/api/students/${studentId}/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        basicInfo,
        studentInfo: {
          yearly_budget: yearlyBudgetPayload,
          yearly_budget_currency: studentGoals.yearly_budget_currency,
          personal_desire: studentGoals.personal_desire,
        },
      }),
    });
    await throwIfNotOk(res, "Không lưu được thông tin cơ bản");
  };

  const saveAcademicInfo = async () => {
    // Clean up english certs: filter out __CUSTOM__ placeholder
    const cleanedEnglishCerts = englishCerts
      .filter((c) => c.type && c.type !== "__CUSTOM__")
      .map((c) => ({
        ...c,
        // If type was custom input, keep the actual value
        type: c.type,
      }));

    // Process GPA logic
    const processedGpaData = { ...gpaData };
    if (isGpaScale4) {
      for (const key of Object.keys(processedGpaData)) {
        const val = parseFloat(
          processedGpaData[key as keyof typeof processedGpaData],
        );
        if (!isNaN(val)) {
          processedGpaData[key as keyof typeof processedGpaData] = (
            val * 2.5
          ).toFixed(2);
        }
      }
    }

    console.log(
      "PAYLOAD TO SEND - isGpaScale4:",
      isGpaScale4,
      "processedGpaData:",
      processedGpaData,
    );

    const academicRes = await fetch(`/api/students/${studentId}/academic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gpa_transcript_details: processedGpaData,
        english_certificates: cleanedEnglishCerts,
        standardized_tests: standardizedTests.filter((t) => t.type),
        // Chỉ lưu proof_images khi đã load xong từ DB (tránh ghi đè rỗng)
        ...(proofImagesLoadedRef.current && {
          proof_images: {
            gpa: gpaProofImages,
            english_cert: englishCertProofImages,
            standardized_test: standardizedTestProofImages,
            subject_score: subjectScoreProofImages,
          },
        }),
      }),
    });
    await throwIfNotOk(academicRes, "Không lưu được thông tin học tập");

    // Save subject scores
    const subDelRes = await fetch(`/api/students/${studentId}/subject-scores`, {
      method: "DELETE",
    });
    await throwIfNotOk(subDelRes, "Không cập nhật được điểm môn học");
    for (const score of subjectScores.filter((s) => s.subject && s.score)) {
      const subPostRes = await fetch(`/api/students/${studentId}/subject-scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: score.subject,
          score: score.score,
          year: score.year || null,
          semester: score.semester || null,
          group: score.group || null,
        }),
      });
      await throwIfNotOk(subPostRes, "Không lưu được một điểm môn học");
    }
  };

  const saveProfileInfo = async () => {
    // Delete old profile data
    await Promise.all([
      fetch(`/api/students/${studentId}/academic-awards`, { method: "DELETE" }),
      fetch(`/api/students/${studentId}/non-academic-awards`, {
        method: "DELETE",
      }),
      fetch(`/api/students/${studentId}/academic-extracurriculars`, {
        method: "DELETE",
      }),
      fetch(`/api/students/${studentId}/non-academic-extracurriculars`, {
        method: "DELETE",
      }),
      fetch(`/api/students/${studentId}/work-experiences`, {
        method: "DELETE",
      }),
      fetch(`/api/students/${studentId}/personal-projects`, {
        method: "DELETE",
      }),
      fetch(`/api/students/${studentId}/skills`, { method: "DELETE" }),
    ]);

    // Insert new profile data
    const insertPromises = [];

    for (const award of academicAwards.filter((a) => a.award_name)) {
      insertPromises.push(
        fetch(`/api/students/${studentId}/academic-awards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(award),
        }),
      );
    }

    for (const award of nonAcademicAwards.filter((a) => a.award_name)) {
      insertPromises.push(
        fetch(`/api/students/${studentId}/non-academic-awards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(award),
        }),
      );
    }

    for (const activity of academicActivities.filter((a) => a.activity_name)) {
      insertPromises.push(
        fetch(`/api/students/${studentId}/academic-extracurriculars`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(activity),
        }),
      );
    }

    for (const activity of nonAcademicActivities.filter(
      (a) => a.activity_name,
    )) {
      insertPromises.push(
        fetch(`/api/students/${studentId}/non-academic-extracurriculars`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(activity),
        }),
      );
    }

    for (const work of workExperiences.filter((w) => w.company_name)) {
      insertPromises.push(
        fetch(`/api/students/${studentId}/work-experiences`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_name: work.company_name,
            job_title: work.job_title,
            start_date: work.start_date,
            end_date: work.end_date,
            responsibilities: work.description ?? work.responsibilities ?? null,
          }),
        }),
      );
    }

    for (const project of personalProjects.filter((p) =>
      String(p.project_name || "").trim(),
    )) {
      insertPromises.push(
        fetch(`/api/students/${studentId}/personal-projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_name: String(project.project_name).trim(),
            project_group: project.group,
            tier: project.tier != null ? Number(project.tier) : null,
            topic: null,
            description: null,
            duration_months: null,
            impact: null,
          }),
        }),
      );
    }

    for (const skill of hardSkills.filter((s) => s.skill_name.trim())) {
      insertPromises.push(
        fetch(`/api/students/${studentId}/skills`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skill_name: skill.skill_name,
            proficiency: skill.proficiency || null,
            category: "Hard",
          }),
        }),
      );
    }
    for (const skill of softSkills.filter((s) => s.skill_name.trim())) {
      insertPromises.push(
        fetch(`/api/students/${studentId}/skills`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skill_name: skill.skill_name,
            proficiency: skill.proficiency || null,
            category: "Soft",
          }),
        }),
      );
    }

    const insertResponses = await Promise.all(insertPromises);
    for (const res of insertResponses) {
      await throwIfNotOk(res, "Không lưu được một mục hoạt động hoặc thành tích");
    }
  };

  const saveParentsInfo = async () => {
    // Validate parent phone numbers
    const invalidParentPhone = parentsInfo.find(
      (parent) => parent.phone_number && parent.phone_number.length !== 10,
    );
    if (invalidParentPhone) {
      toast.error("Số điện thoại không hợp lệ", {
        description: "Số điện thoại của phụ huynh cần đủ 10 số",
      });
      throw new Error("Invalid parent phone number");
    }

    const parentsDelRes = await fetch(`/api/students/${studentId}/parents`, {
      method: "DELETE",
    });
    await throwIfNotOk(parentsDelRes, "Không cập nhật được thông tin phụ huynh");

    for (const parent of parentsInfo.filter((p) => p.full_name)) {
      const pr = await fetch(`/api/students/${studentId}/parents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parent),
      });
      await throwIfNotOk(pr, "Không lưu được thông tin một phụ huynh");
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);

    const tabsToSave =
      modifiedTabs.size > 0
        ? Array.from(modifiedTabs)
        : ["basic", "academic", "profile", "other"];

    toast.info("Đang lưu thông tin", {
      description: "Đang cập nhật thông tin...",
    });

    try {
      const savePromises = [];

      if (tabsToSave.includes("basic")) {
        savePromises.push(saveBasicInfo());
      }

      if (tabsToSave.includes("academic")) {
        savePromises.push(saveAcademicInfo());
      }

      if (tabsToSave.includes("profile")) {
        savePromises.push(saveProfileInfo());
      }

      if (tabsToSave.includes("other")) {
        savePromises.push(saveBasicInfo());
        savePromises.push(saveParentsInfo());
      }

      await Promise.all(savePromises);

      toast.success("Lưu thông tin thành công", {
        description: `Đã cập nhật thông tin của bạn`,
      });

      // Reset modified tabs
      setModifiedTabs(new Set());
      await loadProfileFromApi({ showLoading: false });
      onSaved?.();
    } catch (error) {
      console.error("Error saving data:", error);
      const detail =
        error instanceof Error
          ? error.message
          : "Vui lòng thử lại sau hoặc liên hệ hỗ trợ";
      toast.error("Có lỗi xảy ra khi lưu thông tin", {
        description: detail,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        hideClose
        className={cn(
          "profile-creative-root max-w-6xl h-[90vh] flex flex-col gap-0 p-0 pt-0 sm:pt-0 rounded-2xl overflow-hidden bg-card text-foreground border border-[color-mix(in_srgb,#0f4c81_12%,transparent)] dark:border-white/15 pc-sticker-shadow",
        )}
      >
        <div className="profile-creative-scope flex flex-col flex-1 min-h-0 overflow-hidden antialiased">
          {/* Header — nút đóng cùng hàng tiêu đề */}
          <DialogHeader className="flex-shrink-0 space-y-0 gap-0 border-b border-[color-mix(in_srgb,#0f4c81_10%,transparent)] bg-[color-mix(in_srgb,#0f4c81_4%,transparent)] px-6 py-4 text-left dark:border-white/10 dark:bg-sky-500/5">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="pc-display text-2xl sm:text-3xl text-[#111827] dark:text-foreground m-0 leading-snug pr-2">
                Cập nhật hồ sơ học sinh
              </DialogTitle>
              <DialogClose asChild>
                <button
                  type="button"
                  className="pc-chip-ghost shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2"
                  aria-label="Đóng"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </DialogClose>
            </div>
            <p className="pc-read-sans text-sm text-[#111827]/80 dark:text-muted-foreground mt-2 leading-snug max-w-2xl">
              Chỉnh sửa thông tin và hồ sơ học viên
            </p>
          </DialogHeader>

          {loading ? (
            <AcademicInfoModalSkeleton />
          ) : (
            <>
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex flex-col flex-1 min-h-0"
              >
                {/* Tabs - Segmented Control style */}
                <div className="flex-shrink-0 px-6 pt-4 pb-0">
                  <TabsList className="inline-flex w-full max-w-full flex-wrap sm:flex-nowrap border-2 border-[#111827]/10 dark:border-white/10 bg-muted/35 dark:bg-slate-900/60 p-1 rounded-xl gap-1">
                    <TabsTrigger
                      value="basic"
                      className="rounded-lg px-3 sm:px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-[#111827]/20 dark:data-[state=active]:border-white/20 data-[state=active]:shadow-[3px_3px_0_0_rgba(59,130,246,0.35)] transition-all border-2 border-transparent"
                    >
                      Thông tin cá nhân
                    </TabsTrigger>
                    <TabsTrigger
                      value="academic"
                      className="rounded-lg px-3 sm:px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-[#111827]/20 dark:data-[state=active]:border-white/20 data-[state=active]:shadow-[3px_3px_0_0_rgba(59,130,246,0.35)] transition-all border-2 border-transparent"
                    >
                      Thông tin học tập
                    </TabsTrigger>
                    <TabsTrigger
                      value="profile"
                      className="rounded-lg px-3 sm:px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-[#111827]/20 dark:data-[state=active]:border-white/20 data-[state=active]:shadow-[3px_3px_0_0_rgba(59,130,246,0.35)] transition-all border-2 border-transparent"
                    >
                      Hoạt động & thành tích
                    </TabsTrigger>
                    <TabsTrigger
                      value="other"
                      className="rounded-lg px-3 sm:px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white data-[state=active]:border-2 data-[state=active]:border-[#111827]/20 dark:data-[state=active]:border-white/20 data-[state=active]:shadow-[3px_3px_0_0_rgba(59,130,246,0.35)] transition-all border-2 border-transparent"
                    >
                      Thông tin liên quan
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                  {/* Tab 1: Thông tin liên lạc của học viên */}
                  <TabsContent value="basic" className="space-y-5 mt-0">
                    <section className="rounded-2xl border border-border pc-sticker-shadow overflow-hidden border-l-4 border-l-blue-400/60 bg-card bg-linear-to-br from-blue-500/5 to-transparent">
                      {/* Section Header */}
                      <div className="px-5 py-4 border-b border-border flex items-center gap-3 bg-blue-500/5">
                        <h3 className="pc-display text-lg text-slate-900 dark:text-slate-50 mb-1">
                          Thông tin liên lạc của học viên
                        </h3>
                      </div>
                      {/* Grid of mini-cards like profile page */}
                      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="p-3 sm:p-4 rounded-xl border border-border bg-muted/20">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Họ và tên học viên *
                          </p>
                          <Input
                            value={basicInfo.full_name}
                            disabled
                            placeholder="Nhập họ tên đầy đủ"
                            className="opacity-60 cursor-not-allowed border-0 bg-transparent p-0 h-auto text-sm font-medium focus-visible:ring-0 shadow-none"
                          />
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl border border-border bg-muted/20">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Ngày sinh
                          </p>
                          <Input
                            type="date"
                            value={basicInfo.date_of_birth}
                            onChange={(e) =>
                              updateBasicInfo({ date_of_birth: e.target.value })
                            }
                            placeholder="Chọn ngày sinh"
                            className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 shadow-none"
                            max={new Date().toISOString().split("T")[0]}
                          />
                          {basicInfo.date_of_birth && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(
                                basicInfo.date_of_birth,
                              ).toLocaleDateString("vi-VN")}
                            </p>
                          )}
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl border border-border bg-muted/20">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Lớp - Trường đang theo học
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={basicInfo.current_grade}
                              onChange={(e) =>
                                updateBasicInfo({
                                  current_grade: e.target.value,
                                })
                              }
                              placeholder="VD: 12"
                              className="border-border bg-background text-sm focus-visible:ring-1 focus-visible:ring-blue-400"
                            />
                            <Input
                              value={basicInfo.current_school}
                              onChange={(e) =>
                                updateBasicInfo({
                                  current_school: e.target.value,
                                })
                              }
                              placeholder="Tên trường"
                              className="border-border bg-background text-sm focus-visible:ring-1 focus-visible:ring-blue-400"
                            />
                          </div>
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl border border-border bg-muted/20">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Nơi ở hiện tại
                          </p>
                          <Input
                            value={basicInfo.current_address}
                            onChange={(e) =>
                              updateBasicInfo({
                                current_address: e.target.value,
                              })
                            }
                            placeholder="Địa chỉ"
                            className="border-border bg-background text-sm focus-visible:ring-1 focus-visible:ring-blue-400"
                          />
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl border border-border bg-muted/20">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Số điện thoại
                          </p>
                          <Input
                            type="tel"
                            value={basicInfo.phone_number}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, "");
                              if (value.length <= 10) {
                                updateBasicInfo({ phone_number: value });
                              }
                            }}
                            placeholder="0XXXXXXXXX"
                            className="border-border bg-background text-sm focus-visible:ring-1 focus-visible:ring-blue-400"
                            maxLength={10}
                          />
                          {basicInfo.phone_number &&
                            basicInfo.phone_number.length < 10 && (
                              <p className="text-xs text-amber-600 mt-1">
                                Cần đủ 10 số ({basicInfo.phone_number.length}
                                /10)
                              </p>
                            )}
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl border border-border bg-muted/20">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Email cá nhân
                          </p>
                          <Input
                            type="email"
                            value={basicInfo.email}
                            disabled
                            placeholder="email@example.com"
                            className="opacity-60 cursor-not-allowed border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 shadow-none"
                          />
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl border border-border bg-muted/20">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Năng khiếu
                          </p>
                          <Input
                            value={basicInfo.talents}
                            onChange={(e) =>
                              updateBasicInfo({ talents: e.target.value })
                            }
                            placeholder="VD: Toán học, Vẽ, ..."
                            className="border-border bg-background text-sm focus-visible:ring-1 focus-visible:ring-blue-400"
                          />
                        </div>
                        <div className="p-3 sm:p-4 rounded-xl border border-border bg-muted/20 sm:col-span-2">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Sở thích
                          </p>
                          <Textarea
                            value={basicInfo.hobbies}
                            onChange={(e) =>
                              updateBasicInfo({ hobbies: e.target.value })
                            }
                            placeholder="Mô tả sở thích của bạn..."
                            className="border-border bg-background text-sm focus-visible:ring-1 focus-visible:ring-blue-400 resize-none"
                            rows={3}
                          />
                        </div>
                      </div>
                    </section>
                  </TabsContent>

                  {/* Tab 2: Học tập */}
                  <TabsContent value="academic" className="space-y-5 mt-0">
                    {/* GPA */}
                    <div className="rounded-2xl border border-border pc-sticker-shadow overflow-hidden bg-card bg-linear-to-br from-amber-500/5 to-transparent border-l-4 border-l-amber-400/60 p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="pc-display text-lg text-foreground mb-5">
                            GPA (Lớp 9, 10, 11, 12)
                          </h3>
                        </div>
                        {/* Custom Pill Toggle Base 4.0 | 10.0 */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground mr-1">
                            Hệ
                          </span>
                          <div className="flex items-center bg-muted/30 p-1 rounded-lg border border-border">
                            <button
                              type="button"
                              onClick={() => {
                                if (isGpaScale4) return;
                                setIsGpaScale4(true);
                                const newData = { ...gpaData };
                                for (const key of Object.keys(newData)) {
                                  const val = parseFloat(
                                    newData[key as keyof typeof newData],
                                  );
                                  if (!isNaN(val))
                                    newData[key as keyof typeof newData] = (
                                      val / 2.5
                                    ).toFixed(2);
                                }
                                setGpaData(newData);
                                markTabModified("academic");
                              }}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                isGpaScale4
                                  ? "bg-amber-500 text-white shadow-sm"
                                  : "text-muted-foreground hover:bg-muted/50"
                              }`}
                            >
                              4.0
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!isGpaScale4) return;
                                setIsGpaScale4(false);
                                const newData = { ...gpaData };
                                for (const key of Object.keys(newData)) {
                                  const val = parseFloat(
                                    newData[key as keyof typeof newData],
                                  );
                                  if (!isNaN(val))
                                    newData[key as keyof typeof newData] = (
                                      val * 2.5
                                    ).toFixed(2);
                                }
                                setGpaData(newData);
                                markTabModified("academic");
                              }}
                              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                !isGpaScale4
                                  ? "bg-slate-700 text-white shadow-sm"
                                  : "text-muted-foreground hover:bg-muted/50"
                              }`}
                            >
                              10.0
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 mt-6">
                        {["grade9", "grade10", "grade11", "grade12"].map(
                          (grade, idx) => (
                            <div
                              key={grade}
                              className="p-3 sm:p-4 rounded-xl border border-border bg-muted/10"
                            >
                              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                                Lớp {9 + idx}
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                max="10"
                                min="0"
                                value={gpaData[grade as keyof typeof gpaData]}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value);
                                  const maxGpa = isGpaScale4 ? 4 : 10;
                                  if (
                                    e.target.value === "" ||
                                    (!isNaN(value) &&
                                      value >= 0 &&
                                      value <= maxGpa)
                                  ) {
                                    updateGpaData({ [grade]: e.target.value });
                                  }
                                }}
                                placeholder="0.00"
                                className="bg-background border-border focus-visible:ring-1 focus-visible:ring-amber-400 font-medium"
                              />
                            </div>
                          ),
                        )}
                      </div>
                      {/* Proof images */}
                      <div className="mt-4 flex items-center justify-between gap-3">
                        {gpaProofImages.length > 0 ? (
                          <details className="group flex-1">
                            <summary className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600 cursor-pointer list-none transition-colors">
                              <ImageIcon className="w-4 h-4" />
                              <span>
                                Xem minh chứng ({gpaProofImages.length})
                              </span>
                            </summary>
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                              {gpaProofImages.map((url, i) => (
                                <div
                                  key={i}
                                  className="flex flex-col items-center gap-1"
                                >
                                  <div className="relative group/img">
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {/\.(jpg|jpeg|png|webp|gif)$/i.test(
                                        url,
                                      ) ? (
                                        <img
                                          src={url}
                                          alt={`GPA proof ${i + 1}`}
                                          className="w-20 h-20 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity shadow-sm"
                                        />
                                      ) : (
                                        <div className="w-20 h-20 rounded-lg border border-border bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shadow-sm">
                                          {url.toLowerCase().includes(".pdf")
                                            ? "PDF"
                                            : "DOC"}
                                        </div>
                                      )}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setGpaProofImages((prev) =>
                                          prev.filter((_, idx) => idx !== i),
                                        );
                                        markTabModified("academic");
                                      }}
                                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity shadow-sm"
                                    >
                                      <XIcon className="w-3 h-3" />
                                    </button>
                                  </div>
                                  {renderProofVerificationControls(url)}
                                </div>
                              ))}
                            </div>
                          </details>
                        ) : (
                          <span />
                        )}
                        <S3Uploader
                          compact
                          academicSubpath="gpa"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onUploadSuccess={(fileUrl, verify) => {
                            setGpaProofImages((prev) => [...prev, fileUrl]);
                            proofImagesLoadedRef.current = true;
                            markTabModified("academic");
                            mergeProofVerification(fileUrl, {
                              verifyValid: verify?.verifyValid ?? null,
                              verifyError: verify?.verifyError ?? null,
                            });
                            toast.success("Tải minh chứng GPA thành công", {
                              description:
                                "Xác minh AI tại thẻ Tài liệu đính kèm trên trang hồ sơ.",
                            });
                          }}
                        />
                      </div>
                    </div>

                    {/* Chứng chỉ Tiếng Anh */}
                    <div className="rounded-2xl border border-border pc-sticker-shadow overflow-hidden bg-card bg-linear-to-br from-amber-500/5 to-transparent border-l-4 border-l-amber-400/60 p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="pc-display text-lg text-foreground mb-5">
                          Chứng chỉ ngoại ngữ (IELTS, DET, JLPT, HSK...)
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateEnglishCerts([
                              ...englishCerts,
                              {
                                type: "",
                                score: "",
                                date: "",
                                level: "",
                                proof_images: [],
                              },
                            ])
                          }
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Thêm
                        </Button>
                      </div>
                      {englishCerts.map((cert, index) => {
                        // Kiểm tra xem chứng chỉ này có cần cấp độ không
                        const hasLevel = ["HSK", "TOPIK", "JLPT"].includes(
                          cert.type,
                        );

                        return (
                          <div
                            key={index}
                            className={`grid ${hasLevel ? "grid-cols-5" : "grid-cols-4"} gap-3 mb-3 items-end`}
                          >
                            <div>
                              <Label className="text-sm">Loại chứng chỉ</Label>
                              {cert.type === "__CUSTOM__" ||
                              (cert.type &&
                                ![
                                  "IELTS",
                                  "DET",
                                  "TOEIC",
                                  "HSK",
                                  "TOPIK",
                                  "JLPT",
                                  "",
                                ].includes(cert.type)) ? (
                                <div className="flex gap-2 mt-1">
                                  <Input
                                    value={
                                      cert.type === "__CUSTOM__"
                                        ? ""
                                        : cert.type
                                    }
                                    onChange={(e) => {
                                      const newCerts = [...englishCerts];
                                      newCerts[index].type =
                                        e.target.value || "__CUSTOM__";
                                      updateEnglishCerts(newCerts);
                                    }}
                                    placeholder="Nhập loại chứng chỉ"
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const newCerts = [...englishCerts];
                                      newCerts[index].type = "";
                                      updateEnglishCerts(newCerts);
                                    }}
                                    title="Quay lại dropdown"
                                  >
                                    ↩
                                  </Button>
                                </div>
                              ) : (
                                <Select
                                  value={cert.type}
                                  onValueChange={(value) => {
                                    const newCerts = [...englishCerts];
                                    if (value === "other") {
                                      newCerts[index].type = "__CUSTOM__";
                                    } else {
                                      newCerts[index].type = value;
                                    }
                                    // Reset level khi đổi loại chứng chỉ
                                    if (
                                      !["HSK", "TOPIK", "JLPT"].includes(value)
                                    ) {
                                      newCerts[index].level = "";
                                    }
                                    updateEnglishCerts(newCerts);
                                  }}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Chọn" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="IELTS">IELTS</SelectItem>
                                    <SelectItem value="DET">
                                      DET (Duolingo)
                                    </SelectItem>
                                    <SelectItem value="TOEIC">TOEIC</SelectItem>
                                    <SelectItem value="HSK">
                                      HSK (Tiếng Trung)
                                    </SelectItem>
                                    <SelectItem value="TOPIK">
                                      TOPIK (Tiếng Hàn)
                                    </SelectItem>
                                    <SelectItem value="JLPT">
                                      JLPT (Tiếng Nhật)
                                    </SelectItem>
                                    <SelectItem value="other">
                                      Khác...
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </div>

                            {/* Cấp độ - Chỉ hiển thị cho HSK, TOPIK, JLPT */}
                            {hasLevel && (
                              <div>
                                <Label className="text-sm">Cấp độ</Label>
                                <Select
                                  value={cert.level || ""}
                                  onValueChange={(value) => {
                                    const newCerts = [...englishCerts];
                                    newCerts[index].level = value;
                                    updateEnglishCerts(newCerts);
                                  }}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Chọn cấp độ" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {cert.type === "HSK" && (
                                      <>
                                        <SelectItem value="1">HSK 1</SelectItem>
                                        <SelectItem value="2">HSK 2</SelectItem>
                                        <SelectItem value="3">HSK 3</SelectItem>
                                        <SelectItem value="4">HSK 4</SelectItem>
                                        <SelectItem value="5">HSK 5</SelectItem>
                                        <SelectItem value="6">HSK 6</SelectItem>
                                        <SelectItem value="7">HSK 7</SelectItem>
                                        <SelectItem value="8">HSK 8</SelectItem>
                                        <SelectItem value="9">HSK 9</SelectItem>
                                      </>
                                    )}
                                    {cert.type === "TOPIK" && (
                                      <>
                                        <SelectItem value="1">
                                          TOPIK 1
                                        </SelectItem>
                                        <SelectItem value="2">
                                          TOPIK 2
                                        </SelectItem>
                                        <SelectItem value="3">
                                          TOPIK 3
                                        </SelectItem>
                                        <SelectItem value="4">
                                          TOPIK 4
                                        </SelectItem>
                                        <SelectItem value="5">
                                          TOPIK 5
                                        </SelectItem>
                                        <SelectItem value="6">
                                          TOPIK 6
                                        </SelectItem>
                                      </>
                                    )}
                                    {cert.type === "JLPT" && (
                                      <>
                                        <SelectItem value="N5">
                                          N5 (Cơ bản)
                                        </SelectItem>
                                        <SelectItem value="N4">N4</SelectItem>
                                        <SelectItem value="N3">
                                          N3 (Trung cấp)
                                        </SelectItem>
                                        <SelectItem value="N2">N2</SelectItem>
                                        <SelectItem value="N1">
                                          N1 (Nâng cao)
                                        </SelectItem>
                                      </>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            <div>
                              <Label className="text-sm">Điểm số</Label>
                              <Input
                                placeholder="VD: 7.5"
                                value={cert.score}
                                onChange={(e) => {
                                  const newCerts = [...englishCerts];
                                  newCerts[index].score = e.target.value;
                                  updateEnglishCerts(newCerts);
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Ngày thi</Label>
                              <Input
                                type="date"
                                value={cert.date}
                                onChange={(e) => {
                                  const newCerts = [...englishCerts];
                                  newCerts[index].date = e.target.value;
                                  updateEnglishCerts(newCerts);
                                }}
                                className="mt-1"
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                updateEnglishCerts(
                                  englishCerts.filter((_, i) => i !== index),
                                )
                              }
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>

                            <div className="col-span-full mt-3 flex items-center justify-between gap-3">
                              {Array.isArray(cert.proof_images) &&
                              cert.proof_images.length > 0 ? (
                                <details className="group flex-1">
                                  <summary className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600 cursor-pointer list-none transition-colors">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>
                                      Xem minh chứng ({cert.proof_images.length}
                                      )
                                    </span>
                                  </summary>
                                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border/50 pt-3">
                                    {cert.proof_images.map(
                                      (url: string, imgIndex: number) => (
                                        <div
                                          key={imgIndex}
                                          className="flex flex-col items-center gap-1"
                                        >
                                          <div className="relative group/img">
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <img
                                                src={url}
                                                alt={`English cert proof ${imgIndex + 1}`}
                                                className="h-20 w-20 rounded-lg border border-border object-cover shadow-sm transition-opacity hover:opacity-80"
                                              />
                                            </a>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const newCerts = [
                                                  ...englishCerts,
                                                ];
                                                newCerts[index].proof_images =
                                                  newCerts[
                                                    index
                                                  ].proof_images.filter(
                                                    (_: string, i: number) =>
                                                      i !== imgIndex,
                                                  );
                                                updateEnglishCerts(newCerts);
                                              }}
                                              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-sm transition-opacity group-hover/img:opacity-100"
                                            >
                                              <XIcon className="w-3 h-3" />
                                            </button>
                                          </div>
                                          {renderProofVerificationControls(url)}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </details>
                              ) : (
                                <span />
                              )}
                              <S3Uploader
                                compact
                                academicSubpath="chung-chi-ngoai-ngu"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onUploadSuccess={(fileUrl, verify) => {
                                  const newCerts = [...englishCerts];
                                  newCerts[index].proof_images = [
                                    ...(newCerts[index].proof_images || []),
                                    fileUrl,
                                  ];
                                  updateEnglishCerts(newCerts);
                                  proofImagesLoadedRef.current = true;
                                  mergeProofVerification(fileUrl, {
                                    verifyValid: verify?.verifyValid ?? null,
                                    verifyError: verify?.verifyError ?? null,
                                  });
                                  toast.success(
                                    "Tải minh chứng chứng chỉ thành công",
                                    {
                                      description:
                                        "Xác minh AI tại thẻ Tài liệu đính kèm trên trang hồ sơ.",
                                    },
                                  );
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bài thi chuẩn hóa */}
                    <div className="rounded-2xl border border-border pc-sticker-shadow overflow-hidden bg-card bg-linear-to-br from-amber-500/5 to-transparent border-l-4 border-l-amber-400/60 p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="pc-display text-lg text-foreground mb-5">
                          Bài thi chuẩn hóa (SAT, ACT,...)
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateStandardizedTests([
                              ...standardizedTests,
                              {
                                type: "",
                                score: "",
                                date: "",
                                proof_images: [],
                              },
                            ])
                          }
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Thêm
                        </Button>
                      </div>
                      {standardizedTests.map((test, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-4 gap-3 mb-3 items-end"
                        >
                          <div>
                            <Label className="text-sm">Loại bài thi</Label>
                            <Select
                              value={test.type}
                              onValueChange={(value) => {
                                const newTests = [...standardizedTests];
                                newTests[index].type = value;
                                updateStandardizedTests(newTests);
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Chọn" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SAT">SAT</SelectItem>
                                <SelectItem value="ACT">ACT</SelectItem>
                                <SelectItem value="AP">AP</SelectItem>
                                <SelectItem value="IB">IB</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm">Điểm số</Label>
                            <Input
                              placeholder="VD: 1450"
                              value={test.score}
                              onChange={(e) => {
                                const newTests = [...standardizedTests];
                                newTests[index].score = e.target.value;
                                updateStandardizedTests(newTests);
                              }}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Ngày thi</Label>
                            <Input
                              type="date"
                              value={test.date}
                              onChange={(e) => {
                                const newTests = [...standardizedTests];
                                newTests[index].date = e.target.value;
                                updateStandardizedTests(newTests);
                              }}
                              className="mt-1"
                            />
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              updateStandardizedTests(
                                standardizedTests.filter((_, i) => i !== index),
                              )
                            }
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>

                          <div className="col-span-full mt-3 flex items-center justify-between gap-3">
                            {Array.isArray(test.proof_images) &&
                            test.proof_images.length > 0 ? (
                              <details className="group flex-1">
                                <summary className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600 cursor-pointer list-none transition-colors">
                                  <ImageIcon className="w-4 h-4" />
                                  <span>
                                    Xem minh chứng ({test.proof_images.length})
                                  </span>
                                </summary>
                                <div className="mt-3 flex flex-wrap gap-2 border-t border-border/50 pt-3">
                                  {test.proof_images.map(
                                    (url: string, imgIndex: number) => (
                                      <div
                                        key={imgIndex}
                                        className="flex flex-col items-center gap-1"
                                      >
                                        <div className="relative group/img">
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <img
                                              src={url}
                                              alt={`Standardized test proof ${imgIndex + 1}`}
                                              className="h-20 w-20 rounded-lg border border-border object-cover shadow-sm transition-opacity hover:opacity-80"
                                            />
                                          </a>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const newTests = [
                                                ...standardizedTests,
                                              ];
                                              newTests[index].proof_images =
                                                newTests[
                                                  index
                                                ].proof_images.filter(
                                                  (_: string, i: number) =>
                                                    i !== imgIndex,
                                                );
                                              updateStandardizedTests(newTests);
                                            }}
                                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-sm transition-opacity group-hover/img:opacity-100"
                                          >
                                            <XIcon className="w-3 h-3" />
                                          </button>
                                        </div>
                                        {renderProofVerificationControls(url)}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </details>
                            ) : (
                              <span />
                            )}
                            <S3Uploader
                              compact
                              academicSubpath="bai-thi-chuan-hoa"
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onUploadSuccess={(fileUrl, verify) => {
                                const newTests = [...standardizedTests];
                                newTests[index].proof_images = [
                                  ...(newTests[index].proof_images || []),
                                  fileUrl,
                                ];
                                updateStandardizedTests(newTests);
                                proofImagesLoadedRef.current = true;
                                mergeProofVerification(fileUrl, {
                                  verifyValid: verify?.verifyValid ?? null,
                                  verifyError: verify?.verifyError ?? null,
                                });
                                toast.success(
                                  "Tải minh chứng bài thi thành công",
                                  {
                                    description:
                                      "Xác minh AI tại thẻ Tài liệu đính kèm trên trang hồ sơ.",
                                  },
                                );
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* NEW: Điểm từng môn học */}
                    <div className="rounded-2xl border border-border pc-sticker-shadow overflow-hidden bg-card bg-linear-to-br from-amber-500/5 to-transparent border-l-4 border-l-amber-400/60 p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className="pc-display text-lg text-foreground">
                            Điểm từng môn học (Subject Scores)
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Custom Pill Toggle Base 4.0 | 10.0 */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground mr-1">
                              Hệ
                            </span>
                            <div className="flex items-center bg-muted/30 p-1 rounded-lg border border-border">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isSubjectScoreScale4) return;
                                  setIsSubjectScoreScale4(true);
                                  const newScores = subjectScores.map((s) => {
                                    const val = parseFloat(s.score);
                                    if (!isNaN(val))
                                      return {
                                        ...s,
                                        score: (val / 2.5)
                                          .toFixed(2)
                                          .replace(/\.00$/, ""),
                                      };
                                    return s;
                                  });
                                  updateSubjectScores(newScores);
                                }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                  isSubjectScoreScale4
                                    ? "bg-amber-500 text-white shadow-sm"
                                    : "text-muted-foreground hover:bg-muted/50"
                                }`}
                              >
                                4.0
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isSubjectScoreScale4) return;
                                  setIsSubjectScoreScale4(false);
                                  const newScores = subjectScores.map((s) => {
                                    const val = parseFloat(s.score);
                                    if (!isNaN(val))
                                      return {
                                        ...s,
                                        score: (val * 2.5)
                                          .toFixed(2)
                                          .replace(/\.00$/, ""),
                                      };
                                    return s;
                                  });
                                  updateSubjectScores(newScores);
                                }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                                  !isSubjectScoreScale4
                                    ? "bg-slate-700 text-white shadow-sm"
                                    : "text-muted-foreground hover:bg-muted/50"
                                }`}
                              >
                                10.0
                              </button>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateSubjectScores([
                                ...subjectScores,
                                {
                                  subject: "",
                                  score: "",
                                  year: "",
                                  semester: "",
                                  group: "natural",
                                },
                              ])
                            }
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Thêm
                          </Button>
                        </div>
                      </div>
                      {subjectScores.map((score, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-6 gap-3 mb-3 items-end"
                        >
                          <div>
                            <Label className="text-sm">Môn học</Label>
                            <Input
                              value={score.subject}
                              onChange={(e) => {
                                const newScores = [...subjectScores];
                                newScores[index].subject = e.target.value;
                                updateSubjectScores(newScores);
                              }}
                              placeholder="VD: Toán, Vật Lý"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Điểm</Label>
                            <Input
                              type="number"
                              step="0.01"
                              max={isSubjectScoreScale4 ? "4" : "10"}
                              min="0"
                              value={score.score}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                const maxScore = isSubjectScoreScale4 ? 4 : 10;
                                if (
                                  e.target.value === "" ||
                                  (!isNaN(value) &&
                                    value >= 0 &&
                                    value <= maxScore)
                                ) {
                                  const newScores = [...subjectScores];
                                  newScores[index].score = e.target.value;
                                  updateSubjectScores(newScores);
                                }
                              }}
                              placeholder="0.00"
                              className="mt-1 bg-background border-border focus-visible:ring-1 focus-visible:ring-amber-400 font-medium"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Nhóm</Label>
                            <Select
                              value={score.group || "natural"}
                              onValueChange={(value) => {
                                const newScores = [...subjectScores];
                                newScores[index].group = value;
                                updateSubjectScores(newScores);
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Chọn" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="natural">
                                  Tự nhiên
                                </SelectItem>
                                <SelectItem value="language">
                                  Ngôn ngữ
                                </SelectItem>
                                <SelectItem value="social">Xã hội</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm">Năm</Label>
                            <Input
                              type="number"
                              value={score.year}
                              onChange={(e) => {
                                const newScores = [...subjectScores];
                                newScores[index].year = e.target.value;
                                updateSubjectScores(newScores);
                              }}
                              placeholder="2024"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Học kỳ</Label>
                            <Select
                              value={score.semester}
                              onValueChange={(value) => {
                                const newScores = [...subjectScores];
                                newScores[index].semester = value;
                                updateSubjectScores(newScores);
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Chọn" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">HK1</SelectItem>
                                <SelectItem value="2">HK2</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              updateSubjectScores(
                                subjectScores.filter((_, i) => i !== index),
                              )
                            }
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      {/* Proof images: bảng điểm môn học */}
                      <div className="mt-4 flex items-center justify-between gap-3">
                        {subjectScoreProofImages.length > 0 ? (
                          <details className="group flex-1">
                            <summary className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600 cursor-pointer list-none transition-colors">
                              <ImageIcon className="w-4 h-4" />
                              <span>
                                Xem minh chứng ({subjectScoreProofImages.length}
                                )
                              </span>
                            </summary>
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                              {subjectScoreProofImages.map((url, i) => (
                                <div
                                  key={i}
                                  className="flex flex-col items-center gap-1"
                                >
                                  <div className="relative group/img">
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <img
                                        src={url}
                                        alt={`Subject Score proof ${i + 1}`}
                                        className="w-20 h-20 object-cover rounded-lg border border-border hover:opacity-80 transition-opacity shadow-sm"
                                      />
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSubjectScoreProofImages((prev) =>
                                          prev.filter((_, idx) => idx !== i),
                                        );
                                        markTabModified("academic");
                                      }}
                                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity shadow-sm"
                                    >
                                      <XIcon className="w-3 h-3" />
                                    </button>
                                  </div>
                                  {renderProofVerificationControls(url)}
                                </div>
                              ))}
                            </div>
                          </details>
                        ) : (
                          <span />
                        )}
                        <S3Uploader
                          compact
                          academicSubpath="bang-diem-mon-hoc"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onUploadSuccess={(fileUrl, verify) => {
                            setSubjectScoreProofImages((prev) => [
                              ...prev,
                              fileUrl,
                            ]);
                            proofImagesLoadedRef.current = true;
                            markTabModified("academic");
                            mergeProofVerification(fileUrl, {
                              verifyValid: verify?.verifyValid ?? null,
                              verifyError: verify?.verifyError ?? null,
                            });
                            toast.success(
                              "Tải minh chứng bảng điểm thành công",
                              {
                                description:
                                  "Xác minh AI tại thẻ Tài liệu đính kèm trên trang hồ sơ.",
                              },
                            );
                          }}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab 3: Hoạt động & thành tích — input feature phân tích profile */}
                  <TabsContent value="profile" className="space-y-5 mt-0">
                    {/* Giải thưởng học thuật */}
                    <div className="rounded-2xl border border-border pc-sticker-shadow overflow-hidden bg-card bg-linear-to-br from-amber-500/5 to-transparent border-l-4 border-l-amber-400/60 p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="pc-display text-lg text-foreground mb-4">
                          Giải thưởng học thuật
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateAcademicAwards([
                              ...academicAwards,
                              {
                                award_name: "",
                                issuing_organization: "",
                                award_level: "",
                                award_date: "",
                                description: "",
                                category: "",
                                year: "",
                                rank: "",
                                region: "",
                                proof_images: [],
                              },
                            ])
                          }
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Thêm
                        </Button>
                      </div>
                      {academicAwards.map((award, index) => (
                        <div
                          key={index}
                          className="bg-card p-4 rounded-lg mb-3 border border-border"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">Tên giải thưởng</Label>
                              <Input
                                value={award.award_name}
                                onChange={(e) => {
                                  const newAwards = [...academicAwards];
                                  newAwards[index].award_name = e.target.value;
                                  updateAcademicAwards(newAwards);
                                }}
                                placeholder="VD: Học sinh giỏi Toán"
                                className="mt-1"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-sm">
                                Đơn vị trao giải / tổ chức
                              </Label>
                              <Input
                                value={award.issuing_organization ?? ""}
                                onChange={(e) => {
                                  const newAwards = [...academicAwards];
                                  newAwards[index].issuing_organization =
                                    e.target.value;
                                  updateAcademicAwards(newAwards);
                                }}
                                placeholder="VD: Bộ GD&ĐT, Trường THPT…"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Loại (Category)</Label>
                              <Select
                                value={award.category || ""}
                                onValueChange={(value) => {
                                  const newAwards = [...academicAwards];
                                  newAwards[index].category = value;
                                  updateAcademicAwards(newAwards);
                                }}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Chọn" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="science">
                                    Khoa học/Logic
                                  </SelectItem>
                                  <SelectItem value="social">Xã hội</SelectItem>
                                  <SelectItem value="language">
                                    Ngôn ngữ
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm">
                                Cấp giải (Region)
                              </Label>
                              <Select
                                value={award.region || ""}
                                onValueChange={(value) => {
                                  const newAwards = [...academicAwards];
                                  newAwards[index].region = value;
                                  updateAcademicAwards(newAwards);
                                }}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Chọn" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="international">
                                    Quốc tế
                                  </SelectItem>
                                  <SelectItem value="national">
                                    Quốc gia
                                  </SelectItem>
                                  <SelectItem value="province">
                                    Tỉnh/Thành
                                  </SelectItem>
                                  <SelectItem value="city">
                                    Thành phố
                                  </SelectItem>
                                  <SelectItem value="school">Trường</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm">Hạng (Rank)</Label>
                              <Input
                                type="number"
                                value={award.rank ?? ""}
                                onChange={(e) => {
                                  const newAwards = [...academicAwards];
                                  newAwards[index].rank = e.target.value;
                                  updateAcademicAwards(newAwards);
                                }}
                                placeholder="VD: 1, 2, 3"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Năm</Label>
                              <Input
                                type="number"
                                value={award.year ?? ""}
                                onChange={(e) => {
                                  const newAwards = [...academicAwards];
                                  newAwards[index].year = e.target.value;
                                  updateAcademicAwards(newAwards);
                                }}
                                placeholder="2024"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Ngày nhận</Label>
                              <Input
                                type="date"
                                value={formatDateForInput(award.award_date)}
                                onChange={(e) => {
                                  const newAwards = [...academicAwards];
                                  newAwards[index].award_date = e.target.value;
                                  updateAcademicAwards(newAwards);
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div className="col-span-2 flex gap-2">
                              <div className="flex-1">
                                <Label className="text-sm">Mô tả</Label>
                                <Textarea
                                  value={award.description}
                                  onChange={(e) => {
                                    const newAwards = [...academicAwards];
                                    newAwards[index].description =
                                      e.target.value;
                                    updateAcademicAwards(newAwards);
                                  }}
                                  placeholder="Mô tả chi tiết..."
                                  className="mt-1"
                                  rows={2}
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  updateAcademicAwards(
                                    academicAwards.filter(
                                      (_, i) => i !== index,
                                    ),
                                  )
                                }
                                className="mt-6"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                            {/* Proof images row */}
                            <div className="col-span-2 mt-3 flex items-center justify-between gap-3">
                              {Array.isArray(award.proof_images) &&
                              award.proof_images.length > 0 ? (
                                <details className="group flex-1">
                                  <summary className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600 cursor-pointer list-none transition-colors">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>
                                      Xem minh chứng (
                                      {award.proof_images.length})
                                    </span>
                                  </summary>
                                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border/50 pt-3">
                                    {award.proof_images.map(
                                      (url: string, imgIndex: number) => (
                                        <div
                                          key={imgIndex}
                                          className="flex flex-col items-center gap-1"
                                        >
                                          <div className="relative group/img">
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <img
                                                src={url}
                                                alt={`Award proof ${imgIndex + 1}`}
                                                className="h-20 w-20 rounded-lg border border-border object-cover shadow-sm transition-opacity hover:opacity-80"
                                              />
                                            </a>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const n = [...academicAwards];
                                                n[index].proof_images = n[
                                                  index
                                                ].proof_images.filter(
                                                  (_: string, i: number) =>
                                                    i !== imgIndex,
                                                );
                                                updateAcademicAwards(n);
                                              }}
                                              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-sm transition-opacity group-hover/img:opacity-100"
                                            >
                                              <XIcon className="w-3 h-3" />
                                            </button>
                                          </div>
                                          {renderProofVerificationControls(url)}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </details>
                              ) : (
                                <span />
                              )}
                              <S3Uploader
                                compact
                                academicSubpath="giai-thuong-hoc-thuat"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onUploadSuccess={(fileUrl, verify) => {
                                  const n = [...academicAwards];
                                  n[index].proof_images = [
                                    ...(n[index].proof_images || []),
                                    fileUrl,
                                  ];
                                  updateAcademicAwards(n);
                                  proofImagesLoadedRef.current = true;
                                  mergeProofVerification(fileUrl, {
                                    verifyValid: verify?.verifyValid ?? null,
                                    verifyError: verify?.verifyError ?? null,
                                  });
                                  toast.success("Tải minh chứng thành công", {
                                    description:
                                      "Xác minh AI tại thẻ Tài liệu đính kèm trên trang hồ sơ.",
                                  });
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Các giải thưởng khác */}
                    <div className="rounded-2xl border border-border pc-sticker-shadow overflow-hidden bg-card bg-linear-to-br from-amber-500/5 to-transparent border-l-4 border-l-amber-400/60 p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="pc-display text-lg text-foreground mb-4">
                          CÁC GIẢI THƯỞNG KHÁC (NGHỆ THUẬT, THỂ THAO,...)
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateNonAcademicAwards([
                              ...nonAcademicAwards,
                              {
                                award_name: "",
                                category: "",
                                issuing_organization: "",
                                award_level: "",
                                award_date: "",
                                description: "",
                                year: "",
                                rank: "",
                                region: "",
                                proof_images: [],
                              },
                            ])
                          }
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Thêm
                        </Button>
                      </div>
                      {nonAcademicAwards.map((award, index) => (
                        <div
                          key={index}
                          className="bg-card p-4 rounded-lg mb-3 border border-border"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">Tên giải thưởng</Label>
                              <Input
                                value={award.award_name}
                                onChange={(e) => {
                                  const newAwards = [...nonAcademicAwards];
                                  newAwards[index].award_name = e.target.value;
                                  updateNonAcademicAwards(newAwards);
                                }}
                                placeholder="VD: Giải nhất bóng đá"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Lĩnh vực</Label>
                              <Select
                                value={award.category}
                                onValueChange={(value) => {
                                  const newAwards = [...nonAcademicAwards];
                                  newAwards[index].category = value;
                                  updateNonAcademicAwards(newAwards);
                                }}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Chọn" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="sport">
                                    Thể thao
                                  </SelectItem>
                                  <SelectItem value="art">
                                    Nghệ thuật / Âm nhạc
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm">Ngày nhận</Label>
                              <Input
                                type="date"
                                value={award.award_date}
                                onChange={(e) => {
                                  const newAwards = [...nonAcademicAwards];
                                  newAwards[index].award_date = e.target.value;
                                  updateNonAcademicAwards(newAwards);
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div className="col-span-2 flex gap-2">
                              <div className="flex-1">
                                <Label className="text-sm">Mô tả</Label>
                                <Textarea
                                  value={award.description}
                                  onChange={(e) => {
                                    const newAwards = [...nonAcademicAwards];
                                    newAwards[index].description =
                                      e.target.value;
                                    updateNonAcademicAwards(newAwards);
                                  }}
                                  className="mt-1"
                                  rows={2}
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  updateNonAcademicAwards(
                                    nonAcademicAwards.filter(
                                      (_, i) => i !== index,
                                    ),
                                  )
                                }
                                className="mt-6"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                            {/* Proof images row */}
                            <div className="col-span-2 mt-3 flex items-center justify-between gap-3">
                              {Array.isArray(award.proof_images) &&
                              award.proof_images.length > 0 ? (
                                <details className="group flex-1">
                                  <summary className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600 cursor-pointer list-none transition-colors">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>
                                      Xem minh chứng (
                                      {award.proof_images.length})
                                    </span>
                                  </summary>
                                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border/50 pt-3">
                                    {award.proof_images.map(
                                      (url: string, imgIndex: number) => (
                                        <div
                                          key={imgIndex}
                                          className="flex flex-col items-center gap-1"
                                        >
                                          <div className="relative group/img">
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <img
                                                src={url}
                                                alt={`Award proof ${imgIndex + 1}`}
                                                className="h-20 w-20 rounded-lg border border-border object-cover shadow-sm transition-opacity hover:opacity-80"
                                              />
                                            </a>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const n = [
                                                  ...nonAcademicAwards,
                                                ];
                                                n[index].proof_images = n[
                                                  index
                                                ].proof_images.filter(
                                                  (_: string, i: number) =>
                                                    i !== imgIndex,
                                                );
                                                updateNonAcademicAwards(n);
                                              }}
                                              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-sm transition-opacity group-hover/img:opacity-100"
                                            >
                                              <XIcon className="w-3 h-3" />
                                            </button>
                                          </div>
                                          {renderProofVerificationControls(url)}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </details>
                              ) : (
                                <span />
                              )}
                              <S3Uploader
                                compact
                                academicSubpath="giai-thuong-phi-hoc-thuat"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onUploadSuccess={(fileUrl, verify) => {
                                  const n = [...nonAcademicAwards];
                                  n[index].proof_images = [
                                    ...(n[index].proof_images || []),
                                    fileUrl,
                                  ];
                                  updateNonAcademicAwards(n);
                                  proofImagesLoadedRef.current = true;
                                  mergeProofVerification(fileUrl, {
                                    verifyValid: verify?.verifyValid ?? null,
                                    verifyError: verify?.verifyError ?? null,
                                  });
                                  toast.success("Tải minh chứng thành công", {
                                    description:
                                      "Xác minh AI tại thẻ Tài liệu đính kèm trên trang hồ sơ.",
                                  });
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Hoạt động ngoại khóa liên quan đến ngành học */}
                    <div className="rounded-2xl border border-border pc-sticker-shadow overflow-hidden bg-card bg-linear-to-br from-amber-500/5 to-transparent border-l-4 border-l-amber-400/60 p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="pc-display text-lg text-foreground mb-5">
                          Hoạt động ngoại khóa liên quan đến ngành học
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateAcademicActivities([
                              ...academicActivities,
                              {
                                activity_name: "",
                                organization: "",
                                role: "",
                                start_date: "",
                                end_date: "",
                                description: "",
                                scale: "",
                                region: "",
                                impact_tier: 1,
                                proof_images: [],
                              },
                            ])
                          }
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Thêm
                        </Button>
                      </div>
                      {academicActivities.map((activity, index) => (
                        <div
                          key={index}
                          className="bg-card p-4 rounded-lg mb-3 border border-border"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">Tên hoạt động</Label>
                              <Input
                                value={activity.activity_name}
                                onChange={(e) => {
                                  const newActivities = [...academicActivities];
                                  newActivities[index].activity_name =
                                    e.target.value;
                                  updateAcademicActivities(newActivities);
                                }}
                                placeholder="VD: CLB Toán học"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Vai trò</Label>
                              <Select
                                value={activity.role}
                                onValueChange={(value) => {
                                  const newActivities = [...academicActivities];
                                  newActivities[index].role = value;
                                  updateAcademicActivities(newActivities);
                                }}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Chọn vai trò" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="LEADER">
                                    Trưởng nhóm / Chủ tịch
                                  </SelectItem>
                                  <SelectItem value="CORE">
                                    Thành viên nòng cốt
                                  </SelectItem>
                                  <SelectItem value="MEMBER">
                                    Thành viên
                                  </SelectItem>
                                  <SelectItem value="HELP">Hỗ trợ</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm">Cấp độ</Label>
                              <Select
                                value={String(activity.impact_tier ?? 1)}
                                onValueChange={(value) => {
                                  const newActivities = [...academicActivities];
                                  newActivities[index].impact_tier = parseInt(
                                    value,
                                    10,
                                  );
                                  updateAcademicActivities(newActivities);
                                }}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Chọn cấp độ" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Trường</SelectItem>
                                  <SelectItem value="2">
                                    Tỉnh/Thành phố
                                  </SelectItem>
                                  <SelectItem value="3">Quốc gia</SelectItem>
                                  <SelectItem value="4">Quốc tế</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-sm">Từ</Label>
                                <Input
                                  type="date"
                                  value={activity.start_date}
                                  onChange={(e) => {
                                    const newActivities = [
                                      ...academicActivities,
                                    ];
                                    newActivities[index].start_date =
                                      e.target.value;
                                    updateAcademicActivities(newActivities);
                                  }}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Đến</Label>
                                <Input
                                  type="date"
                                  value={activity.end_date}
                                  onChange={(e) => {
                                    const newActivities = [
                                      ...academicActivities,
                                    ];
                                    newActivities[index].end_date =
                                      e.target.value;
                                    updateAcademicActivities(newActivities);
                                  }}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div className="col-span-2 flex gap-2">
                              <div className="flex-1">
                                <Label className="text-sm">Mô tả</Label>
                                <Textarea
                                  value={activity.description}
                                  onChange={(e) => {
                                    const newActivities = [
                                      ...academicActivities,
                                    ];
                                    newActivities[index].description =
                                      e.target.value;
                                    updateAcademicActivities(newActivities);
                                  }}
                                  className="mt-1"
                                  rows={2}
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  updateAcademicActivities(
                                    academicActivities.filter(
                                      (_, i) => i !== index,
                                    ),
                                  )
                                }
                                className="mt-6"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                            {/* Proof images row */}
                            <div className="col-span-2 mt-3 flex items-center justify-between gap-3">
                              {Array.isArray(activity.proof_images) &&
                              activity.proof_images.length > 0 ? (
                                <details className="group flex-1">
                                  <summary className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600 cursor-pointer list-none transition-colors">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>
                                      Xem minh chứng (
                                      {activity.proof_images.length})
                                    </span>
                                  </summary>
                                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border/50 pt-3">
                                    {activity.proof_images.map(
                                      (url: string, imgIndex: number) => (
                                        <div
                                          key={imgIndex}
                                          className="flex flex-col items-center gap-1"
                                        >
                                          <div className="relative group/img">
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <img
                                                src={url}
                                                alt={`Activity proof ${imgIndex + 1}`}
                                                className="h-20 w-20 rounded-lg border border-border object-cover shadow-sm transition-opacity hover:opacity-80"
                                              />
                                            </a>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const n = [
                                                  ...academicActivities,
                                                ];
                                                n[index].proof_images = n[
                                                  index
                                                ].proof_images.filter(
                                                  (_: string, i: number) =>
                                                    i !== imgIndex,
                                                );
                                                updateAcademicActivities(n);
                                              }}
                                              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-sm transition-opacity group-hover/img:opacity-100"
                                            >
                                              <XIcon className="w-3 h-3" />
                                            </button>
                                          </div>
                                          {renderProofVerificationControls(url)}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </details>
                              ) : (
                                <span />
                              )}
                              <S3Uploader
                                compact
                                academicSubpath="hoat-dong-hoc-thuat"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onUploadSuccess={(fileUrl, verify) => {
                                  const n = [...academicActivities];
                                  n[index].proof_images = [
                                    ...(n[index].proof_images || []),
                                    fileUrl,
                                  ];
                                  updateAcademicActivities(n);
                                  proofImagesLoadedRef.current = true;
                                  mergeProofVerification(fileUrl, {
                                    verifyValid: verify?.verifyValid ?? null,
                                    verifyError: verify?.verifyError ?? null,
                                  });
                                  toast.success("Tải minh chứng thành công", {
                                    description:
                                      "Xác minh AI tại thẻ Tài liệu đính kèm trên trang hồ sơ.",
                                  });
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Hoạt động ngoại khóa ngoài ngành học */}
                    <div className="rounded-2xl border border-border pc-sticker-shadow overflow-hidden bg-card bg-linear-to-br from-amber-500/5 to-transparent border-l-4 border-l-amber-400/60 p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="pc-display text-lg text-foreground mb-5">
                          Hoạt động ngoại khóa ngoài ngành học
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateNonAcademicActivities([
                              ...nonAcademicActivities,
                              {
                                activity_name: "",
                                organization: "",
                                role: "",
                                start_date: "",
                                end_date: "",
                                description: "",
                                scale: "",
                                region: "",
                                proof_images: [],
                              },
                            ])
                          }
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Thêm
                        </Button>
                      </div>
                      {nonAcademicActivities.map((activity, index) => (
                        <div
                          key={index}
                          className="bg-card p-4 rounded-lg mb-3 border border-border"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">Tên hoạt động</Label>
                              <Input
                                value={activity.activity_name}
                                onChange={(e) => {
                                  const newActivities = [
                                    ...nonAcademicActivities,
                                  ];
                                  newActivities[index].activity_name =
                                    e.target.value;
                                  updateNonAcademicActivities(newActivities);
                                }}
                                placeholder="VD: Thiện nguyện"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Vai trò</Label>
                              <Select
                                value={activity.role}
                                onValueChange={(value) => {
                                  const newActivities = [
                                    ...nonAcademicActivities,
                                  ];
                                  newActivities[index].role = value;
                                  updateNonAcademicActivities(newActivities);
                                }}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Chọn vai trò" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="LEADER">
                                    Trưởng nhóm / Chủ tịch
                                  </SelectItem>
                                  <SelectItem value="CORE">
                                    Thành viên nòng cốt
                                  </SelectItem>
                                  <SelectItem value="MEMBER">
                                    Thành viên
                                  </SelectItem>
                                  <SelectItem value="HELP">Hỗ trợ</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-sm">Từ</Label>
                                <Input
                                  type="date"
                                  value={activity.start_date}
                                  onChange={(e) => {
                                    const newActivities = [
                                      ...nonAcademicActivities,
                                    ];
                                    newActivities[index].start_date =
                                      e.target.value;
                                    updateNonAcademicActivities(newActivities);
                                  }}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Đến</Label>
                                <Input
                                  type="date"
                                  value={activity.end_date}
                                  onChange={(e) => {
                                    const newActivities = [
                                      ...nonAcademicActivities,
                                    ];
                                    newActivities[index].end_date =
                                      e.target.value;
                                    updateNonAcademicActivities(newActivities);
                                  }}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div className="col-span-2 flex gap-2">
                              <div className="flex-1">
                                <Label className="text-sm">Mô tả</Label>
                                <Textarea
                                  value={activity.description}
                                  onChange={(e) => {
                                    const newActivities = [
                                      ...nonAcademicActivities,
                                    ];
                                    newActivities[index].description =
                                      e.target.value;
                                    updateNonAcademicActivities(newActivities);
                                  }}
                                  className="mt-1"
                                  rows={2}
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  updateNonAcademicActivities(
                                    nonAcademicActivities.filter(
                                      (_, i) => i !== index,
                                    ),
                                  )
                                }
                                className="mt-6"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                            {/* Proof images row */}
                            <div className="col-span-2 mt-3 flex items-center justify-between gap-3">
                              {Array.isArray(activity.proof_images) &&
                              activity.proof_images.length > 0 ? (
                                <details className="group flex-1">
                                  <summary className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600 cursor-pointer list-none transition-colors">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>
                                      Xem minh chứng (
                                      {activity.proof_images.length})
                                    </span>
                                  </summary>
                                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border/50 pt-3">
                                    {activity.proof_images.map(
                                      (url: string, imgIndex: number) => (
                                        <div
                                          key={imgIndex}
                                          className="flex flex-col items-center gap-1"
                                        >
                                          <div className="relative group/img">
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <img
                                                src={url}
                                                alt={`Activity proof ${imgIndex + 1}`}
                                                className="h-20 w-20 rounded-lg border border-border object-cover shadow-sm transition-opacity hover:opacity-80"
                                              />
                                            </a>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const n = [
                                                  ...nonAcademicActivities,
                                                ];
                                                n[index].proof_images = n[
                                                  index
                                                ].proof_images.filter(
                                                  (_: string, i: number) =>
                                                    i !== imgIndex,
                                                );
                                                updateNonAcademicActivities(n);
                                              }}
                                              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-sm transition-opacity group-hover/img:opacity-100"
                                            >
                                              <XIcon className="w-3 h-3" />
                                            </button>
                                          </div>
                                          {renderProofVerificationControls(url)}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </details>
                              ) : (
                                <span />
                              )}
                              <S3Uploader
                                compact
                                academicSubpath="hoat-dong-phi-hoc-thuat"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onUploadSuccess={(fileUrl, verify) => {
                                  const n = [...nonAcademicActivities];
                                  n[index].proof_images = [
                                    ...(n[index].proof_images || []),
                                    fileUrl,
                                  ];
                                  updateNonAcademicActivities(n);
                                  proofImagesLoadedRef.current = true;
                                  mergeProofVerification(fileUrl, {
                                    verifyValid: verify?.verifyValid ?? null,
                                    verifyError: verify?.verifyError ?? null,
                                  });
                                  toast.success("Tải minh chứng thành công", {
                                    description:
                                      "Xác minh AI tại thẻ Tài liệu đính kèm trên trang hồ sơ.",
                                  });
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Kinh nghiệm làm việc */}
                    <div className="rounded-2xl border border-border pc-sticker-shadow overflow-hidden bg-card bg-linear-to-br from-amber-500/5 to-transparent border-l-4 border-l-amber-400/60 p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="pc-display text-lg text-foreground mb-5">
                          Kinh nghiệm làm việc
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateWorkExperiences([
                              ...workExperiences,
                              {
                                company_name: "",
                                job_title: "",
                                start_date: "",
                                end_date: "",
                                description: "",
                                proof_images: [],
                              },
                            ])
                          }
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Thêm
                        </Button>
                      </div>
                      {workExperiences.map((work, index) => (
                        <div
                          key={index}
                          className="bg-card p-4 rounded-lg mb-3 border border-border"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">Tên công ty</Label>
                              <Input
                                value={work.company_name}
                                onChange={(e) => {
                                  const newWorks = [...workExperiences];
                                  newWorks[index].company_name = e.target.value;
                                  updateWorkExperiences(newWorks);
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Vị trí</Label>
                              <Input
                                value={work.job_title}
                                onChange={(e) => {
                                  const newWorks = [...workExperiences];
                                  newWorks[index].job_title = e.target.value;
                                  updateWorkExperiences(newWorks);
                                }}
                                className="mt-1"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-sm">Từ</Label>
                                <Input
                                  type="date"
                                  value={work.start_date}
                                  onChange={(e) => {
                                    const newWorks = [...workExperiences];
                                    newWorks[index].start_date = e.target.value;
                                    updateWorkExperiences(newWorks);
                                  }}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Đến</Label>
                                <Input
                                  type="date"
                                  value={work.end_date}
                                  onChange={(e) => {
                                    const newWorks = [...workExperiences];
                                    newWorks[index].end_date = e.target.value;
                                    updateWorkExperiences(newWorks);
                                  }}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div className="col-span-2 flex gap-2">
                              <div className="flex-1">
                                <Label className="text-sm">
                                  Mô tả công việc
                                </Label>
                                <Textarea
                                  value={work.description}
                                  onChange={(e) => {
                                    const newWorks = [...workExperiences];
                                    newWorks[index].description =
                                      e.target.value;
                                    updateWorkExperiences(newWorks);
                                  }}
                                  className="mt-1"
                                  rows={2}
                                />
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  updateWorkExperiences(
                                    workExperiences.filter(
                                      (_, i) => i !== index,
                                    ),
                                  )
                                }
                                className="mt-6"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                            {/* Proof images row */}
                            <div className="col-span-2 mt-3 flex items-center justify-between gap-3">
                              {Array.isArray(work.proof_images) &&
                              work.proof_images.length > 0 ? (
                                <details className="group flex-1">
                                  <summary className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600 cursor-pointer list-none transition-colors">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>
                                      Xem minh chứng ({work.proof_images.length}
                                      )
                                    </span>
                                  </summary>
                                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border/50 pt-3">
                                    {work.proof_images.map(
                                      (url: string, imgIndex: number) => (
                                        <div
                                          key={imgIndex}
                                          className="flex flex-col items-center gap-1"
                                        >
                                          <div className="relative group/img">
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <img
                                                src={url}
                                                alt={`Work proof ${imgIndex + 1}`}
                                                className="h-20 w-20 rounded-lg border border-border object-cover shadow-sm transition-opacity hover:opacity-80"
                                              />
                                            </a>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const n = [...workExperiences];
                                                n[index].proof_images = n[
                                                  index
                                                ].proof_images.filter(
                                                  (_: string, i: number) =>
                                                    i !== imgIndex,
                                                );
                                                updateWorkExperiences(n);
                                              }}
                                              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-sm transition-opacity group-hover/img:opacity-100"
                                            >
                                              <XIcon className="w-3 h-3" />
                                            </button>
                                          </div>
                                          {renderProofVerificationControls(url)}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </details>
                              ) : (
                                <span />
                              )}
                              <S3Uploader
                                compact
                                academicSubpath="kinh-nghiem-lam-viec"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onUploadSuccess={(fileUrl, verify) => {
                                  const n = [...workExperiences];
                                  n[index].proof_images = [
                                    ...(n[index].proof_images || []),
                                    fileUrl,
                                  ];
                                  updateWorkExperiences(n);
                                  proofImagesLoadedRef.current = true;
                                  mergeProofVerification(fileUrl, {
                                    verifyValid: verify?.verifyValid ?? null,
                                    verifyError: verify?.verifyError ?? null,
                                  });
                                  toast.success("Tải minh chứng thành công", {
                                    description:
                                      "Xác minh AI tại thẻ Tài liệu đính kèm trên trang hồ sơ.",
                                  });
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Dự án (Projects) — chỉ dự án cá nhân Feature1 */}
                    <div className="rounded-2xl border border-border pc-sticker-shadow overflow-hidden bg-card bg-linear-to-br from-amber-500/5 to-transparent border-l-4 border-l-amber-400/60 p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="pc-display text-lg text-foreground">
                          Dự án cá nhân (Projects)
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updatePersonalProjects([
                              ...personalProjects,
                              {
                                project_name: "",
                                group: "science_tech",
                                tier: 3,
                                proof_images: [],
                              },
                            ])
                          }
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Thêm
                        </Button>
                      </div>
                      {personalProjects.map((project, index) => (
                        <div
                          key={index}
                          className="bg-card p-4 rounded-lg mb-3 border border-border"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <Label className="text-sm">
                                Tên dự án (name)
                              </Label>
                              <Input
                                value={project.project_name}
                                onChange={(e) => {
                                  const newProjects = [...personalProjects];
                                  newProjects[index].project_name =
                                    e.target.value;
                                  updatePersonalProjects(newProjects);
                                }}
                                placeholder="VD: App quản lý học tập (deploy)"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Nhóm (group)</Label>
                              <Select
                                value={project.group}
                                onValueChange={(value) => {
                                  const newProjects = [...personalProjects];
                                  newProjects[index].group =
                                    value as Feature1ProjectGroup;
                                  updatePersonalProjects(newProjects);
                                }}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Chọn nhóm" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="science_tech">
                                    Khoa học &amp; công nghệ (science_tech)
                                  </SelectItem>
                                  <SelectItem value="research">
                                    Nghiên cứu (research)
                                  </SelectItem>
                                  <SelectItem value="culture_business">
                                    Văn hóa &amp; kinh doanh (culture_business)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm">Tier (1–5)</Label>
                              <Input
                                type="number"
                                min={1}
                                max={5}
                                value={project.tier ?? ""}
                                onChange={(e) => {
                                  const newProjects = [...personalProjects];
                                  const v =
                                    e.target.value === ""
                                      ? 3
                                      : parseInt(e.target.value, 10);
                                  newProjects[index].tier = Number.isNaN(v)
                                    ? 3
                                    : Math.min(5, Math.max(1, v));
                                  updatePersonalProjects(newProjects);
                                }}
                                className="mt-1 w-24"
                              />
                            </div>
                            <div className="sm:col-span-2 flex justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                type="button"
                                onClick={() =>
                                  updatePersonalProjects(
                                    personalProjects.filter(
                                      (_, i) => i !== index,
                                    ),
                                  )
                                }
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                            {/* Proof images row */}
                            <div className="col-span-2 mt-3 flex items-center justify-between gap-3">
                              {Array.isArray(project.proof_images) &&
                              project.proof_images.length > 0 ? (
                                <details className="group flex-1">
                                  <summary className="flex items-center gap-1.5 text-sm font-medium text-blue-500 hover:text-blue-600 cursor-pointer list-none transition-colors">
                                    <ImageIcon className="w-4 h-4" />
                                    <span>
                                      Xem minh chứng (
                                      {project.proof_images.length})
                                    </span>
                                  </summary>
                                  <div className="mt-3 flex flex-wrap gap-2 border-t border-border/50 pt-3">
                                    {project.proof_images.map(
                                      (url: string, imgIndex: number) => (
                                        <div
                                          key={imgIndex}
                                          className="flex flex-col items-center gap-1"
                                        >
                                          <div className="relative group/img">
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                            >
                                              <img
                                                src={url}
                                                alt={`Project proof ${imgIndex + 1}`}
                                                className="h-20 w-20 rounded-lg border border-border object-cover shadow-sm transition-opacity hover:opacity-80"
                                              />
                                            </a>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const n = [...personalProjects];
                                                n[index].proof_images = (
                                                  n[index].proof_images ?? []
                                                ).filter(
                                                  (_: string, i: number) =>
                                                    i !== imgIndex,
                                                );
                                                updatePersonalProjects(n);
                                              }}
                                              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 shadow-sm transition-opacity group-hover/img:opacity-100"
                                            >
                                              <XIcon className="w-3 h-3" />
                                            </button>
                                          </div>
                                          {renderProofVerificationControls(url)}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </details>
                              ) : (
                                <span />
                              )}
                              <S3Uploader
                                compact
                                academicSubpath="du-an-ca-nhan"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onUploadSuccess={(fileUrl, verify) => {
                                  const n = [...personalProjects];
                                  n[index].proof_images = [
                                    ...(n[index].proof_images || []),
                                    fileUrl,
                                  ];
                                  updatePersonalProjects(n);
                                  proofImagesLoadedRef.current = true;
                                  mergeProofVerification(fileUrl, {
                                    verifyValid: verify?.verifyValid ?? null,
                                    verifyError: verify?.verifyError ?? null,
                                  });
                                  toast.success("Tải minh chứng thành công", {
                                    description:
                                      "Xác minh AI tại thẻ Tài liệu đính kèm trên trang hồ sơ.",
                                  });
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Kỹ năng cứng */}
                    <div className="rounded-2xl border border-border pc-sticker-shadow overflow-hidden bg-card bg-linear-to-br from-amber-500/5 to-transparent border-l-4 border-l-amber-400/60 p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="pc-display text-lg text-foreground">
                          Kỹ năng cứng (Hard skills)
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateHardSkills([
                              ...hardSkills,
                              { skill_name: "", proficiency: "" },
                            ])
                          }
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Thêm
                        </Button>
                      </div>
                      {hardSkills.map((skill, index) => (
                        <div
                          key={`hard-${index}`}
                          className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 mb-3 items-end"
                        >
                          <div>
                            <Label className="text-sm">Tên kỹ năng</Label>
                            <Input
                              value={skill.skill_name}
                              onChange={(e) => {
                                const next = [...hardSkills];
                                next[index].skill_name = e.target.value;
                                updateHardSkills(next);
                              }}
                              placeholder="VD: Python, Photoshop"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Trình độ</Label>
                            <Select
                              value={skill.proficiency}
                              onValueChange={(value) => {
                                const next = [...hardSkills];
                                next[index].proficiency = value;
                                updateHardSkills(next);
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Chọn" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BEGINNER">Sơ cấp</SelectItem>
                                <SelectItem value="INTERMEDIATE">
                                  Trung cấp
                                </SelectItem>
                                <SelectItem value="ADVANCED">
                                  Cao cấp
                                </SelectItem>
                                <SelectItem value="EXPERT">
                                  Chuyên gia
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="shrink-0"
                            onClick={() =>
                              updateHardSkills(
                                hardSkills.filter((_, i) => i !== index),
                              )
                            }
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Kỹ năng mềm */}
                    <div className="rounded-2xl border border-border pc-sticker-shadow overflow-hidden bg-card bg-linear-to-br from-amber-500/5 to-transparent border-l-4 border-l-amber-400/60 p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="pc-display text-lg text-foreground">
                          Kỹ năng mềm (Soft skills)
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateSoftSkills([
                              ...softSkills,
                              { skill_name: "", proficiency: "" },
                            ])
                          }
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Thêm
                        </Button>
                      </div>
                      {softSkills.map((skill, index) => (
                        <div
                          key={`soft-${index}`}
                          className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 mb-3 items-end"
                        >
                          <div>
                            <Label className="text-sm">Tên kỹ năng</Label>
                            <Input
                              value={skill.skill_name}
                              onChange={(e) => {
                                const next = [...softSkills];
                                next[index].skill_name = e.target.value;
                                updateSoftSkills(next);
                              }}
                              placeholder="VD: Giao tiếp, Làm việc nhóm"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Trình độ</Label>
                            <Select
                              value={skill.proficiency}
                              onValueChange={(value) => {
                                const next = [...softSkills];
                                next[index].proficiency = value;
                                updateSoftSkills(next);
                              }}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Chọn" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BEGINNER">Sơ cấp</SelectItem>
                                <SelectItem value="INTERMEDIATE">
                                  Trung cấp
                                </SelectItem>
                                <SelectItem value="ADVANCED">
                                  Cao cấp
                                </SelectItem>
                                <SelectItem value="EXPERT">
                                  Chuyên gia
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="shrink-0"
                            onClick={() =>
                              updateSoftSkills(
                                softSkills.filter((_, i) => i !== index),
                              )
                            }
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Tab: Thông tin khác */}
                  <TabsContent value="other" className="space-y-5 mt-0">
                    <div className="rounded-2xl border border-border pc-sticker-shadow overflow-hidden bg-card bg-linear-to-br from-amber-500/5 to-transparent border-l-4 border-l-amber-400/60 p-4 sm:p-5">
                      <h3 className="pc-display text-lg text-foreground mb-4">
                        Thông tin khác
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2 flex flex-col sm:flex-row gap-3 sm:items-end">
                          <div className="flex-1 min-w-0">
                            <Label className="text-sm">
                              Ngân sách gia đình / năm (chỉ số tiền)
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              inputMode="decimal"
                              value={studentGoals.yearly_budget}
                              onChange={(e) =>
                                updateStudentGoals({
                                  ...studentGoals,
                                  yearly_budget: e.target.value,
                                })
                              }
                              placeholder="Ví dụ: 30000"
                              className="mt-1"
                            />
                          </div>
                          <div className="w-full sm:w-40 shrink-0">
                            <Label className="text-sm">Loại tiền</Label>
                            <Select
                              value={studentGoals.yearly_budget_currency}
                              onValueChange={(value) =>
                                updateStudentGoals({
                                  ...studentGoals,
                                  yearly_budget_currency:
                                    value as YearlyBudgetCurrency,
                                })
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Tiền tệ" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="VND">VND</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-sm">Mong muốn cá nhân</Label>
                          <Textarea
                            value={studentGoals.personal_desire}
                            onChange={(e) =>
                              updateStudentGoals({
                                ...studentGoals,
                                personal_desire: e.target.value,
                              })
                            }
                            placeholder="Mô tả mong muốn và mục tiêu cá nhân..."
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Phụ huynh / người giám hộ */}
                    <div className="rounded-2xl border border-border pc-sticker-shadow overflow-hidden bg-card bg-linear-to-br from-amber-500/5 to-transparent border-l-4 border-l-amber-400/60 p-4 sm:p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="pc-display text-lg text-foreground mb-1">
                          Thông tin liên lạc của phụ huynh / người giám hộ
                        </h3>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateParentsInfo([
                              ...parentsInfo,
                              {
                                full_name: "",
                                relationship: "",
                                phone_number: "",
                                email: "",
                              },
                            ])
                          }
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Thêm
                        </Button>
                      </div>
                      {parentsInfo.map((parent, index) => (
                        <div
                          key={index}
                          className="bg-card p-6 rounded-lg mb-4 border border-border"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">
                                Họ và tên phụ huynh/người giám hộ
                              </Label>
                              <Input
                                value={parent.full_name}
                                onChange={(e) => {
                                  const newParents = [...parentsInfo];
                                  newParents[index].full_name = e.target.value;
                                  updateParentsInfo(newParents);
                                }}
                                placeholder="Nhập họ tên đầy đủ"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">
                                Mối quan hệ với học viên
                              </Label>
                              <Select
                                value={parent.relationship}
                                onValueChange={(value) => {
                                  const newParents = [...parentsInfo];
                                  newParents[index].relationship = value;
                                  updateParentsInfo(newParents);
                                }}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Chọn" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Bố">Bố</SelectItem>
                                  <SelectItem value="Mẹ">Mẹ</SelectItem>
                                  <SelectItem value="Người giám hộ">
                                    Người giám hộ
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">
                                Số điện thoại của phụ huynh/người giám hộ
                              </Label>
                              <Input
                                type="tel"
                                value={parent.phone_number}
                                onChange={(e) => {
                                  const value = e.target.value.replace(
                                    /\D/g,
                                    "",
                                  );
                                  if (value.length <= 10) {
                                    const newParents = [...parentsInfo];
                                    newParents[index].phone_number = value;
                                    updateParentsInfo(newParents);
                                  }
                                }}
                                placeholder="0XXXXXXXXX"
                                className="mt-1"
                                maxLength={10}
                              />
                              {parent.phone_number &&
                                parent.phone_number.length < 10 && (
                                  <p className="text-xs text-accent mt-1">
                                    Số điện thoại cần đủ 10 số (
                                    {parent.phone_number.length}/10)
                                  </p>
                                )}
                            </div>
                            <div>
                              <Label className="text-sm font-medium">
                                Email của phụ huynh/người giám hộ
                              </Label>
                              <div className="flex gap-2 mt-1">
                                <Input
                                  type="email"
                                  value={parent.email}
                                  onChange={(e) => {
                                    const newParents = [...parentsInfo];
                                    newParents[index].email = e.target.value;
                                    updateParentsInfo(newParents);
                                  }}
                                  placeholder="email@example.com"
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    updateParentsInfo(
                                      parentsInfo.filter((_, i) => i !== index),
                                    )
                                  }
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </div>
                {/* End scrollable content area */}
              </Tabs>

              {/* Sticky Footer */}
              <div className="flex-shrink-0 sticky bottom-0 z-10 flex justify-end gap-3 border-t-2 border-[#111827]/10 dark:border-white/10 bg-linear-to-r from-background/98 via-blue-50/40 to-violet-50/25 dark:from-card/98 dark:via-slate-900/95 dark:to-slate-900/98 px-8 py-4 backdrop-blur-md rounded-b-2xl">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={saving}
                  className="pc-chip-ghost rounded-xl px-6 py-2.5 font-semibold text-foreground hover:bg-muted/80 transition-all"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleSaveAll}
                  disabled={saving}
                  className="pc-chip-primary rounded-xl px-6 py-2.5 font-semibold bg-[#3b82f6] hover:bg-[#2563eb] text-white border-[#111827]/25 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Lưu tất cả
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
