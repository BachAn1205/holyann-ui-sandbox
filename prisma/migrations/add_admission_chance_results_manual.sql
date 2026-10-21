-- Bảng kết quả đánh giá cơ hội trúng tuyển (Feature 3 - Reach/Match/Safe).
-- Chạy trong Supabase SQL Editor hoặc: psql $DATABASE_URL -f prisma/migrations/add_admission_chance_results_manual.sql

CREATE TABLE IF NOT EXISTS "admission_chance_results" (
  "id" UUID NOT NULL PRIMARY KEY,
  "student_id" UUID NOT NULL,
  "summary" JSONB NOT NULL DEFAULT '{}',
  "faculties" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admission_chance_results_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "admission_chance_results_student_id_idx" ON "admission_chance_results"("student_id");
CREATE INDEX IF NOT EXISTS "admission_chance_results_student_created_idx" ON "admission_chance_results"("student_id", "created_at");
