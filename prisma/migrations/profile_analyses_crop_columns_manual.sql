-- Rút gọn bảng profile_analyses: chỉ giữ id, student_id, full_result, swot_data, input_data,
-- score_aca, score_lan, score_hdnk, score_skill, created_at, updated_at. Spike lấy từ full_result.
-- Chạy thủ công trên Supabase (hoặc DB tương ứng).

-- Xóa index cũ (nếu có)
DROP INDEX IF EXISTS profile_analyses_analysis_date_idx;
DROP INDEX IF EXISTS profile_analyses_main_spike_idx;

-- Xóa các cột không dùng
ALTER TABLE profile_analyses DROP COLUMN IF EXISTS analysis_date;
ALTER TABLE profile_analyses DROP COLUMN IF EXISTS academic_data;
ALTER TABLE profile_analyses DROP COLUMN IF EXISTS extracurricular_data;
ALTER TABLE profile_analyses DROP COLUMN IF EXISTS skill_data;
ALTER TABLE profile_analyses DROP COLUMN IF EXISTS overall_score;
ALTER TABLE profile_analyses DROP COLUMN IF EXISTS academic_score;
ALTER TABLE profile_analyses DROP COLUMN IF EXISTS extracurricular_score;
ALTER TABLE profile_analyses DROP COLUMN IF EXISTS summary;
ALTER TABLE profile_analyses DROP COLUMN IF EXISTS score_usa;
ALTER TABLE profile_analyses DROP COLUMN IF EXISTS score_asia;
ALTER TABLE profile_analyses DROP COLUMN IF EXISTS score_europe;
ALTER TABLE profile_analyses DROP COLUMN IF EXISTS main_spike;
ALTER TABLE profile_analyses DROP COLUMN IF EXISTS spike_sharpness;
ALTER TABLE profile_analyses DROP COLUMN IF EXISTS spike_score;
ALTER TABLE profile_analyses DROP COLUMN IF EXISTS all_spike_scores;

-- Index mới cho truy vấn theo student + created_at
CREATE INDEX IF NOT EXISTS profile_analyses_student_id_created_at_idx ON profile_analyses (student_id, created_at);
