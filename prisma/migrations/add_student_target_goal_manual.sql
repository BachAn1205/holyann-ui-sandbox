-- Mục tiêu (1 lần): ngành + trường. Chỉ được thiết lập một lần.
ALTER TABLE students ADD COLUMN IF NOT EXISTS target_faculty_name VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS target_university_id INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS target_university_name VARCHAR(500);
ALTER TABLE students ADD COLUMN IF NOT EXISTS target_set_at TIMESTAMP(6);
