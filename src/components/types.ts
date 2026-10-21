export type DocumentType = 'transcript' | 'certificate' | 'letter' | 'essay' | 'other';

export type ActivityCategory = 'academic' | 'non_academic';

export interface Extracurricular {
    id: string;
    title: string;
    role: string;
    year: string;
    description: string;
    category?: ActivityCategory;
    organization?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    scale?: string | null;
    region?: string | null;
}

/** Thành tích trên thẻ hồ sơ — có thể mở rộng chi tiết */
export type ProfileAchievementItem =
    | string
    | {
          id: string;
          /** Tiêu đề (tên giải) */
          text: string;
          category?: 'academic' | 'non_academic';
          issuingOrganization?: string | null;
          description?: string | null;
          awardLevel?: string | null;
          awardDate?: string | null;
          awardCategory?: string | null;
          rank?: number | null;
          region?: string | null;
          year?: number | null;
      };

export interface Document {
    id: string;
    name: string;
    type: DocumentType;
    /** Nhãn theo nơi upload (GPA, chứng chỉ, …) — từ API upload-cv */
    categoryLabel?: string;
    uploadDate: string;
    size: string;
    /** URL công khai (Supabase hoặc S3) — dùng khi xóa object trên S3 nếu khớp bucket */
    url?: string;
    /** true = AI xác minh đạt; false = không đạt; null/undefined = chưa kiểm tra hoặc lỗi AI */
    verifyValid?: boolean | null;
    verifyError?: string | null;
}

/** Một chứng chỉ ngoại ngữ (IELTS, TOEFL, ...) */
export interface EnglishCertificate {
    type: string;
    score: string;
    level?: string; // Cấp độ (optional) - VD: HSK 1-6, TOPIK 1-6, JLPT N1-N5
}

/** Thông tin tab «Thông tin liên quan» — đồng bộ với modal cập nhật hồ sơ */
export interface StudentRelatedInfo {
    currentSchool: string | null;
    currentGrade: string | null;
    yearlyBudget: string | null;
    talents: string | null;
    hobbies: string | null;
    personalDesire: string | null;
    parents: Array<{
        id: string;
        fullName: string;
        relationship: string | null;
        phone: string | null;
        email: string | null;
        jobTitle: string | null;
    }>;
}

export interface StudentProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    dob: string;
    avatarUrl: string;
    gpa: number;
    gpaScale: number;
    /** Chuỗi hiển thị (vd: "IELTS 7.0, TOEFL 100") - từ englishCertificates nếu có */
    englishLevel: string;
    /** Danh sách chứng chỉ ngoại ngữ để thêm/sửa/xóa */
    englishCertificates?: EnglishCertificate[];
    satScore?: number;
    targetMajor: string;
    targetCountry: string;
    /** Mục tiêu chính (trùng phần tử đầu của targetGoals khi có nhiều mục tiêu) */
    targetGoal?: {
        facultyName: string;
        universityName: string;
        universityId?: number | null;
    } | null;
    /** Tất cả mục tiêu (trang Target), thứ tự ưu tiên */
    targetGoals?: {
        facultyName: string;
        universityName: string;
        universityId?: number | null;
    }[];
    extracurriculars: Extracurricular[];
    achievements: ProfileAchievementItem[];
    documents: Document[];
    relatedInfo?: StudentRelatedInfo;
    /** GPA theo từng khối (bảng điểm) — hiển thị trên card học thuật */
    gpaTranscriptByGrade?: {
        grade9: string;
        grade10: string;
        grade11: string;
        grade12: string;
    };
    /** Điểm từng môn (thang 10) */
    subjectScoresList?: Array<{
        subject: string;
        score: number;
        group?: string | null;
    }>;
}

export interface SwotItem {
    id: string;
    text: string;
    category: 'strength' | 'weakness' | 'opportunity' | 'threat';
}

export interface StrategyItem {
    title: string;
    description: string;
}

export interface SwotData {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    strategicAdvice: StrategyItem[];
    scores: {
        academic: number;
        extracurricular: number;
        skills: number;
        language: number;
        leadership: number;
    }
}

export interface Task {
    id: string;
    progressId?: string | null;
    title: string;
    deadline: string;
    deadlineRaw?: Date | string | null; // Raw deadline date from database for calculations
    isCompleted: boolean;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | null;
    category?: string; // e.g., "Hồ sơ học thuật", "Tài liệu cần thiết"
    stageId: number;

    // New fields for file upload feature
    task_type?: string | null; // e.g. FILE_UPLOAD, SYSTEM_TEST
    requiresFile?: boolean;    // Does this task require a file upload?
    uploadedFile?: string;     // Name of the uploaded file (if any)
    feedback?: string;         // Mentor feedback
    linkTo?: string;           // Link to navigate when task is clicked (for test tasks)
    linkToManageUpload?: boolean; // CV task: complete by uploading on manage-upload page
    isLocked?: boolean;        // Task is locked (completed from database, cannot be manually changed)
    status?: string;           // PENDING, IN_PROGRESS, SUBMITTED, COMPLETED, NEEDS_REVISION
    mentorNote?: string;       // Mentor's note for revision
    studentNote?: string;      // Student feedback thread
    completedAt?: Date;        // Timestamp when the task was completed
    isCustomTask?: boolean;    // true when task comes from mentor custom deadlines

    // Database progress information
    progress?: {
        status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'COMPLETED' | 'NEEDS_REVISION';
        submission_url?: string;
        mentor_note?: string;
        completed_at?: Date;
        created_at?: Date;
        updated_at?: Date;
    };
}

export interface Stage {
    id: number;
    name: string;
    description: string;
    isUnlocked: boolean;
}

export type TestType = 'MBTI' | 'GRIT' | 'RIASEC';

export type MBTIDimension = 'E/I' | 'S/N' | 'T/F' | 'J/P';
export type GritComponent = 'passion' | 'perseverance';

// Legacy interface for backward compatibility
export interface Question {
    id: number;
    text: string;
    type: TestType;

    // For MBTI
    optionA?: string;
    optionB?: string;
    dimension?: string | MBTIDimension;
    positiveDirection?: boolean;

    // For RIASEC
    category?: string;

    // For GRIT
    component?: GritComponent;
    reverse?: boolean;
}

export interface TestQuestion {
    id: string;
    question: string;
    reverse?: boolean; // true = reverse score (6 - answer)
}

// Specific test question types with id field
// For MBTI (Legacy - A/B options)
export interface MBTIQuestion {
    id: number;
    type: TestType;
    text: string;
    dimension: MBTIDimension;
    positiveDirection: boolean;
}

export interface RIASECQuestion {
}

export interface GritQuestion {
    id: number;
    text: string;
    component: GritComponent;
}

// Test Result interface
export interface TestResult {
    type: TestType;
    scores: Record<string, number>;
    rawLabel: string;
    description: string;
    /** Giải thích AI (FastAPI detail_test_explain), optional khi chưa gọi AI */
    detailTestExplain?: string;
}

// Major Recommendation interface
export interface MajorRecommendation {
    name: string;
    category: string;
    matchReason: string;
    careerPaths: string[];
    requiredSkills: string[];
    matchPercentage?: number;
}