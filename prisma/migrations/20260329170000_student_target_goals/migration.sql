-- Mục tiêu đa dạng theo gói; đồng bộ từ cột legacy students.target_* nếu có.
CREATE TABLE "student_target_goals" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "faculty_name" VARCHAR(255) NOT NULL,
    "university_id" INTEGER,
    "university_name" VARCHAR(500) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_target_goals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "student_target_goals_student_id_idx" ON "student_target_goals"("student_id");

ALTER TABLE "student_target_goals" ADD CONSTRAINT "student_target_goals_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "student_target_goals" ("id", "student_id", "faculty_name", "university_id", "university_name", "sort_order", "created_at")
SELECT gen_random_uuid(), "user_id", "target_faculty_name", "target_university_id", "target_university_name", 0, COALESCE("target_set_at", CURRENT_TIMESTAMP)
FROM "students"
WHERE "target_set_at" IS NOT NULL
  AND "target_faculty_name" IS NOT NULL
  AND TRIM("target_faculty_name") <> ''
  AND "target_university_name" IS NOT NULL
  AND TRIM("target_university_name") <> '';
