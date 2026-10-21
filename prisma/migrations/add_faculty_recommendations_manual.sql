-- Chỉ thêm bảng faculty_recommendations, không đụng bảng khác.
-- Chạy trong Supabase SQL Editor hoặc: psql $DATABASE_URL -f prisma/migrations/add_faculty_recommendations_manual.sql

CREATE TABLE IF NOT EXISTS "faculty_recommendations" (
  "id" UUID NOT NULL PRIMARY KEY,
  "student_id" UUID NOT NULL,
  "assessment_summary" JSONB,
  "faculties" JSONB,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "faculty_recommendations_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "faculty_recommendations_student_id_idx" ON "faculty_recommendations"("student_id");
CREATE INDEX IF NOT EXISTS "faculty_recommendations_student_id_created_at_idx" ON "faculty_recommendations"("student_id", "created_at");
