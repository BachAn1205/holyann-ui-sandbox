-- RIASEC: cột có trong schema, chưa có trong bảng gốc
ALTER TABLE "riasec_tests" ADD COLUMN IF NOT EXISTS "result_description" TEXT;
ALTER TABLE "riasec_tests" ADD COLUMN IF NOT EXISTS "detail_test_explain" TEXT;

-- Grit: giải thích AI
ALTER TABLE "grit_tests" ADD COLUMN IF NOT EXISTS "detail_test_explain" TEXT;

-- Gợi ý ngành: bảng có thể đã tạo tay (manual); IF NOT EXISTS an toàn khi deploy Prisma
CREATE TABLE IF NOT EXISTS "faculty_recommendations" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "assessment_summary" JSONB,
    "faculties" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "faculty_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "faculty_recommendations_student_id_idx" ON "faculty_recommendations"("student_id");
CREATE INDEX IF NOT EXISTS "faculty_recommendations_student_id_created_at_idx" ON "faculty_recommendations"("student_id", "created_at");
