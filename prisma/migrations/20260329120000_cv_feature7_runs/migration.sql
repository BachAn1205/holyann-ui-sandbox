-- Feature 7: CV verify snapshot + analysis/enhance runs per CV document

ALTER TABLE "student_cv_documents" ADD COLUMN IF NOT EXISTS "cv_verified_at" TIMESTAMP(6);
ALTER TABLE "student_cv_documents" ADD COLUMN IF NOT EXISTS "cv_validation" JSONB;

CREATE TABLE IF NOT EXISTS "cv_analysis_runs" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "cv_document_id" UUID NOT NULL,
    "run_kind" VARCHAR(20) NOT NULL,
    "input_data" JSONB,
    "output_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cv_analysis_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "cv_analysis_runs_cv_document_id_idx" ON "cv_analysis_runs"("cv_document_id");
CREATE INDEX IF NOT EXISTS "cv_analysis_runs_student_id_idx" ON "cv_analysis_runs"("student_id");
CREATE INDEX IF NOT EXISTS "cv_analysis_runs_cv_document_id_created_at_idx" ON "cv_analysis_runs"("cv_document_id", "created_at");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cv_analysis_runs_student_id_fkey'
  ) THEN
    ALTER TABLE "cv_analysis_runs"
      ADD CONSTRAINT "cv_analysis_runs_student_id_fkey"
      FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cv_analysis_runs_cv_document_id_fkey'
  ) THEN
    ALTER TABLE "cv_analysis_runs"
      ADD CONSTRAINT "cv_analysis_runs_cv_document_id_fkey"
      FOREIGN KEY ("cv_document_id") REFERENCES "student_cv_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
