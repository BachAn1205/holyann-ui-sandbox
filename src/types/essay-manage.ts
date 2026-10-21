/** Essay + metadata phân tích luận (feature 4), đồng bộ API manage-upload & trang cải thiện luận. */
export type EssayManageRow = {
  id: string;
  slot_index: number;
  title: string | null;
  content: string;
  essay_prompt: string | null;
  target_words: number | null;
  target_culture: string | null;
  applicant_core_strengths: unknown;
  target_program_entities: unknown;
  target_major: string | null;
  target_goal_id: string | null;
  target_goal?: {
    id: string;
    faculty_name: string;
    university_name: string;
  } | null;
};
