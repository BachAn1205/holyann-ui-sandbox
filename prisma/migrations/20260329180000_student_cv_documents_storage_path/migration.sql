-- Thêm key S3 tường minh cho Feature 7 (verify / analysis / enhance).
ALTER TABLE "student_cv_documents" ADD COLUMN IF NOT EXISTS "storage_path" VARCHAR(1024);
