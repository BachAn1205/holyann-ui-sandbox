-- Drop legacy essay/CV improve snapshot tables (replaced by essay_analysis_runs for luận only).
DROP TABLE IF EXISTS "essay_improve_results";
DROP TABLE IF EXISTS "cv_improve_results";

CREATE TABLE "essay_analysis_runs" (
    "id" UUID NOT NULL,
    "essay_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "run_kind" VARCHAR(20) NOT NULL,
    "input_data" JSONB,
    "output_data" JSONB NOT NULL,
    "rating" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "essay_analysis_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "essay_analysis_runs_essay_id_idx" ON "essay_analysis_runs"("essay_id");
CREATE INDEX "essay_analysis_runs_student_id_idx" ON "essay_analysis_runs"("student_id");
CREATE INDEX "essay_analysis_runs_essay_id_created_at_idx" ON "essay_analysis_runs"("essay_id", "created_at");

ALTER TABLE "essay_analysis_runs" ADD CONSTRAINT "essay_analysis_runs_essay_id_fkey" FOREIGN KEY ("essay_id") REFERENCES "essays"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "essay_analysis_runs" ADD CONSTRAINT "essay_analysis_runs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
