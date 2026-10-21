-- Kết quả verify AI (feature7 verify-document) theo đường dẫn file Supabase hoex-documents
CREATE TABLE IF NOT EXISTS "student_document_verifications" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "storage_path" VARCHAR(1024) NOT NULL,
    "ai_valid" BOOLEAN,
    "verify_error" TEXT,
    "ai_detail" JSONB,
    "checked_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_document_verifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "student_document_verifications_student_id_storage_path_key" ON "student_document_verifications"("student_id", "storage_path");

CREATE INDEX IF NOT EXISTS "student_document_verifications_student_id_idx" ON "student_document_verifications"("student_id");

ALTER TABLE "student_document_verifications" ADD CONSTRAINT "student_document_verifications_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
