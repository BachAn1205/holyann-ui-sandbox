export type TabId = 'overview' | 'cv' | 'essay';

export const ESSAY_LIMIT_WORDS = 650;
export const ESSAY_MIN_WORDS = 10;

export interface CvDoc {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
  size: string;
}

export interface EssayComment {
  id: string;
  content: string;
  author: { id: string; full_name: string | null; email: string };
  created_at: string;
}

export interface ProfileDataState {
  feature1_output?: {
    summary?: {
      total_pillar_scores?: Record<string, number>;
      main_spike?: string;
      sharpness?: string;
    };
  };
  feature2_output?: {
    assessment?: {
      mbti?: { personality_type?: string };
      grit?: { score?: number; level?: string };
      riasec?: { code?: string };
    };
  };
  feature3_output?: {
    summary?: Record<string, unknown>;
    universities?: {
      REACH?: { universities?: { id?: string; name: string; country?: string; ranking?: number }[] };
      MATCH?: { universities?: { id?: string; name: string; country?: string; ranking?: number }[] };
      SAFETY?: { universities?: { id?: string; name: string; country?: string; ranking?: number }[] };
    };
  };
}
