-- Metadata bắt buộc cho phân tích luận (feature 4), nhập tại Quản lý tài liệu.
ALTER TABLE "essays" ADD COLUMN IF NOT EXISTS "essay_prompt" TEXT;
ALTER TABLE "essays" ADD COLUMN IF NOT EXISTS "target_words" INTEGER;
ALTER TABLE "essays" ADD COLUMN IF NOT EXISTS "target_culture" VARCHAR(40);
ALTER TABLE "essays" ADD COLUMN IF NOT EXISTS "applicant_core_strengths" JSONB;
ALTER TABLE "essays" ADD COLUMN IF NOT EXISTS "target_program_entities" JSONB;
ALTER TABLE "essays" ADD COLUMN IF NOT EXISTS "target_major" VARCHAR(500);
