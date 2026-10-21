/**
 * Profile Analysis Types (Feature 1)
 * Định nghĩa kiểu dữ liệu cho phân tích hồ sơ AI
 */

// ============ INPUT TYPES ============

export interface SubjectScore {
  subject: string;
  score: number;
}

export interface AcademicAward {
  award_name: string;
  year?: number;
  rank?: number;
  region?: 'international' | 'national' | 'province' | 'city' | 'school' | 'local';
  category?: 'science' | 'social' | 'language';
}

export interface LanguageTest {
  language_name: string;
  score: string;
}

export interface StandardizedTest {
  test_name: string;
  score: string;
}

export interface ActionActivity {
  action_name: string;
  role: 'LEADER' | 'CORE' | 'MEMBER' | 'HELP';
  scale?: number;
  region?: 'international' | 'national' | 'province' | 'city' | 'school' | 'local';
}

export interface NonAcademicAward {
  award_name: string;
  category?: 'art' | 'music' | 'sport' | 'athletic';
  year?: number;
  rank?: number;
  region?: 'international' | 'national' | 'province' | 'city' | 'school' | 'local';
}

export interface PersonalProject {
  project_name: string;
  group: 'research' | 'science_tech' | 'culture_business' | string;
  tier: number;
}

export interface Skill {
  skill_name: string;
  proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
}

export interface ProfileAnalysisInput {
  academic: {
    gpa: number;
    subject_scores?: SubjectScore[];
    academic_awards?: AcademicAward[];
  };
  language_and_standardized: {
    languages?: LanguageTest[];
    standardized_tests?: StandardizedTest[];
  };
  action: {
    actions?: ActionActivity[];
  };
  non_academic_awards?: NonAcademicAward[];
  personal_projects?: PersonalProject[];
  skill: {
    skills?: Skill[];
  };
}

// ============ OUTPUT TYPES ============

export interface RegionScore {
  Vùng: string;
  'Điểm số (Score)': number;
  'Xếp loại (Rating)': 'High' | 'Med' | 'Low';
  'Chi tiết': {
    'Học thuật (Aca)': number;
    'Ngôn ngữ (Lan)': number;
    'Hoạt động ngoại khóa (HDNK)': number;
    'Kỹ năng (Skill)': number;
  };
}

export interface SwotAnalysis {
  'Strengths (Điểm mạnh)': string[];
  'Weaknesses (Điểm yếu)': string[];
  'Opportunities (Cơ hội)': string[];
  'Threats (Thách thức)': string[];
}

export interface SpikeBreakdown {
  awards?: number;
  tests?: number;
  gpa?: number;
  consistency?: number;
  projects?: number;
  duration?: number;
  magnitude?: number;
  scale?: number;
  skills?: number;
}

export interface SpikeDetail {
  name: string;
  score: number;
  sharpness: 'Exceptional' | 'High' | 'Med' | 'Low';
  evidence_count: number;
  breakdown: SpikeBreakdown;
}

export interface SpikeIdentification {
  'Loại Spike hiện tại': string;
  'Spike ID': string;
  'Điểm số': number;
  'Bằng chứng định hình': string[];
  'Độ sắc (Sharpness)': string;
  'Chi tiết điểm (Breakdown)': SpikeBreakdown;
  'Nhận xét': string;
  'Tất cả Spike Scores': Record<string, SpikeDetail>;
}

export interface PillarScores {
  'Học thuật (Aca)': number;
  'Ngôn ngữ (Lan)': number;
  'Hoạt động ngoại khóa (HDNK)': number;
  'Kỹ năng (Skill)': number;
}

export interface AnalysisSummary {
  success: boolean;
  total_pillar_scores: {
    aca: number;
    lan: number;
    hdnk: number;
    skill: number;
  };
  main_spike: string;
  sharpness: string;
}

export interface ProfileAnalysisOutput {
  'A. Đánh giá điểm số (Weighted Score Evaluation)': {
    'Khu vực': RegionScore[];
  };
  'B. Phân tích SWOT': SwotAnalysis;
  'C. Nhận diện Spike (Yếu tố cốt lõi)': SpikeIdentification;
  'D. Điểm số gốc (Pillar Scores)': PillarScores;
  summary: AnalysisSummary;
}

// ============ API RESPONSE TYPES ============

export interface ProfileAnalysisApiResponse {
  success: boolean;
  data?: ProfileAnalysisOutput;
  validation_warnings?: string[];
  error?: string;
  details?: unknown;
}

// ============ DATABASE TYPES ============

export interface SavedProfileAnalysis {
  id: string;
  student_id: string;
  analysis_date: Date;
  // Input data
  input_data: ProfileAnalysisInput;
  // Full AI response
  full_result: ProfileAnalysisOutput;
  // Summary scores (for quick access)
  pillar_scores: {
    aca: number;
    lan: number;
    hdnk: number;
    skill: number;
  };
  regional_scores: {
    usa: number;
    asia: number;
    europe: number;
  };
  main_spike: string;
  spike_sharpness: string;
  // SWOT
  swot_data: SwotAnalysis;
  // Metadata
  created_at: Date;
  updated_at: Date;
}
