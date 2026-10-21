'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, Phone, User, Brain, ClipboardList, FileText, School, Mic } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MentorEmbeddedChecklistSection from '@/components/mentor/students/MentorEmbeddedChecklistSection';
import EssayTab from '@/components/mentor/student/EssayTab';
import WishlistTab from '@/components/mentor/student/WishlistTab';
import { MentorStudentProfileTabContent } from '@/components/mentor/students/MentorStudentProfileTabContent';
import { MentorAiEvaluationTab } from '@/components/mentor/students/MentorAiEvaluationTab';
import { MentorStudentMockInterviewTabContent } from '@/components/mentor/students/MentorStudentMockInterviewTabContent';

interface EmbeddedStudentDetailPanelProps {
  studentId?: string | null;
}

interface StudentInfo {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  avatar_url: string | null;
  date_of_birth?: string | null;
  current_address?: string | null;
  current_school?: string | null;
  current_grade?: string | null;
  yearly_budget?: number | null;
  yearly_budget_currency?: string | null;
  yearly_budget_label?: string | null;
  talents?: string | null;
  hobbies?: string | null;
  personal_desire?: string | null;
}

interface ParentRow {
  id: string;
  full_name: string;
  relationship: string | null;
  phone_number: string | null;
  email: string | null;
  job_title: string | null;
}

interface TargetGoal {
  id: string;
  faculty_name: string;
  university_name: string | null;
}

interface SchoolWishlistItem {
  id: string;
  university_name: string | null;
  country: string | null;
  qs_rank: number | null;
}

interface FacultyWishlistItem {
  id: string;
  faculty_name: string;
}

interface SubjectScoreRow {
  id: string;
  subject: string;
  score: number;
  year: number | null;
  semester: number | null;
  group: string | null;
}

interface ProfileDetailResponse {
  student: StudentInfo;
  academicProfile: {
    gpa_transcript_details?: any;
    english_certificates?: any;
    standardized_tests?: any;
    proof_images?: any;
  } | null;
  targetGoals: TargetGoal[];
  schoolWishlist: SchoolWishlistItem[];
  facultyWishlist: FacultyWishlistItem[];
  parents?: ParentRow[];
  subjectScores?: SubjectScoreRow[];
  activities: {
    academic_extracurriculars: any[];
    non_academic_extracurriculars: any[];
    research_experiences: any[];
    work_experiences: any[];
    personal_projects: any[];
  };
  achievements: {
    academic_awards: any[];
    non_academic_awards: any[];
  };
}

function SkeletonBlock() {
  return (
    <div className="space-y-4">
      <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-36 w-full animate-pulse rounded-xl bg-muted" />
        <div className="h-36 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

function Placeholder() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
      <p className="text-sm font-medium text-foreground">Hãy chọn 1 student để làm việc</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Chọn một dòng trong bảng danh sách học viên để tải thông tin chi tiết.
      </p>
    </div>
  );
}

const TAB_VALUES = ['profile', 'checklist', 'ai', 'mockInterview', 'docs', 'wishlist'] as const;

export default function EmbeddedStudentDetailPanel({ studentId }: EmbeddedStudentDetailPanelProps) {
  const searchParams = useSearchParams();
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [targetGoals, setTargetGoals] = useState<TargetGoal[]>([]);
  const [schoolWishlist, setSchoolWishlist] = useState<SchoolWishlistItem[]>([]);
  const [facultyWishlist, setFacultyWishlist] = useState<FacultyWishlistItem[]>([]);
  const [academicProfile, setAcademicProfile] = useState<ProfileDetailResponse['academicProfile']>(null);
  const [activities, setActivities] = useState<ProfileDetailResponse['activities']>({
    academic_extracurriculars: [],
    non_academic_extracurriculars: [],
    research_experiences: [],
    work_experiences: [],
    personal_projects: [],
  });
  const [achievements, setAchievements] = useState<ProfileDetailResponse['achievements']>({
    academic_awards: [],
    non_academic_awards: [],
  });
  const [subjectScores, setSubjectScores] = useState<SubjectScoreRow[]>([]);
  const [parents, setParents] = useState<ParentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'checklist' | 'ai' | 'mockInterview' | 'docs' | 'wishlist'
  >('profile');

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    setActiveTab('profile');
    fetch(`/api/mentor/students/${studentId}/profile-detail`, {
      cache: 'no-store',
      credentials: 'include',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ProfileDetailResponse | null) => {
        setStudent(data?.student ?? null);
        setTargetGoals(Array.isArray(data?.targetGoals) ? data.targetGoals : []);
        setSchoolWishlist(Array.isArray(data?.schoolWishlist) ? data.schoolWishlist : []);
        setFacultyWishlist(Array.isArray(data?.facultyWishlist) ? data.facultyWishlist : []);
        setAcademicProfile(data?.academicProfile ?? null);
        setActivities(
          data?.activities ?? {
            academic_extracurriculars: [],
            non_academic_extracurriculars: [],
            research_experiences: [],
            work_experiences: [],
            personal_projects: [],
          }
        );
        setAchievements(
          data?.achievements ?? {
            academic_awards: [],
            non_academic_awards: [],
          }
        );
        setSubjectScores(Array.isArray(data?.subjectScores) ? data.subjectScores : []);
        setParents(Array.isArray(data?.parents) ? data.parents : []);
      })
      .catch(() => {
        setStudent(null);
        setTargetGoals([]);
        setSchoolWishlist([]);
        setFacultyWishlist([]);
        setAcademicProfile(null);
        setActivities({
          academic_extracurriculars: [],
          non_academic_extracurriculars: [],
          research_experiences: [],
          work_experiences: [],
          personal_projects: [],
        });
        setAchievements({
          academic_awards: [],
          non_academic_awards: [],
        });
        setSubjectScores([]);
        setParents([]);
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  /** Deep link: `/mentor/students?studentId=…&tab=wishlist` (và các tab khác). */
  useEffect(() => {
    if (!studentId) return;
    const raw = searchParams.get('tab');
    if (raw && (TAB_VALUES as readonly string[]).includes(raw)) {
      setActiveTab(raw as (typeof TAB_VALUES)[number]);
    }
  }, [studentId, searchParams]);

  const studentInitial = useMemo(() => (student?.full_name?.charAt(0) || 'S').toUpperCase(), [student]);

  if (!studentId) return <Placeholder />;
  if (loading) return <SkeletonBlock />;
  if (!student) {
    return (
      <div className="rounded-2xl border border-border bg-card px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">Không tải được thông tin học viên</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
            {studentInitial}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-lg font-bold text-foreground">{student.full_name}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                {student.email}
              </span>
              {student.phone_number ? (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-4 w-4" />
                  {student.phone_number}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border bg-muted/30 px-4 py-3 dark:bg-muted/20">
          <p className="font-heading text-base font-bold text-primary">Khu vực làm việc với học viên</p>
        </div>
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-4">
            <TabsList className="flex h-auto w-full flex-wrap justify-stretch gap-1 bg-muted/40 p-1">
              <TabsTrigger value="profile" className="min-h-9 flex-1 gap-1.5 px-2 text-xs sm:text-sm">
                <User className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Hồ sơ học sinh</span>
                <span className="sm:hidden">Hồ sơ</span>
              </TabsTrigger>
              <TabsTrigger value="checklist" className="min-h-9 flex-1 gap-1.5 px-2 text-xs sm:text-sm">
                <ClipboardList className="h-4 w-4 shrink-0" />
                Checklist
              </TabsTrigger>
              <TabsTrigger value="ai" className="min-h-9 flex-1 gap-1.5 px-2 text-xs sm:text-sm">
                <Brain className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Đánh giá AI</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger value="mockInterview" className="min-h-9 flex-1 gap-1.5 px-2 text-xs sm:text-sm">
                <Mic className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Phỏng vấn thử</span>
                <span className="sm:hidden">PV thử</span>
              </TabsTrigger>
              <TabsTrigger value="docs" className="min-h-9 flex-1 gap-1.5 px-2 text-xs sm:text-sm">
                <FileText className="h-4 w-4 shrink-0" />
                Luận, CV
              </TabsTrigger>
              <TabsTrigger value="wishlist" className="min-h-9 min-w-32 flex-[1.1] gap-1.5 px-2 text-xs sm:text-sm leading-tight">
                <School className="h-4 w-4 shrink-0" />
                <span className="text-left">Nguyện vọng Trường & Ngành</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <MentorStudentProfileTabContent
                student={student}
                academicProfile={academicProfile}
                subjectScores={subjectScores}
                targetGoals={targetGoals}
                schoolWishlist={schoolWishlist}
                facultyWishlist={facultyWishlist}
                parents={parents}
                activities={activities}
                achievements={achievements}
              />
            </TabsContent>

            <TabsContent value="checklist" className="space-y-6">
              <MentorEmbeddedChecklistSection key={studentId} studentId={studentId} />
            </TabsContent>

            <TabsContent value="ai">
              <MentorAiEvaluationTab key={studentId} studentId={studentId} />
            </TabsContent>

            <TabsContent value="mockInterview">
              <MentorStudentMockInterviewTabContent studentId={studentId} />
            </TabsContent>

            <TabsContent value="docs">
              <EssayTab studentId={studentId} />
            </TabsContent>

            <TabsContent value="wishlist" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Danh sách trường và ngành học viên đề xuất; trạng thái <strong className="text-foreground">Đang chờ duyệt</strong> cần cố vấn
                duyệt hoặc từ chối.
              </p>
              <WishlistTab studentId={studentId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

