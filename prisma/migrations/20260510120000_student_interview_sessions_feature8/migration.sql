-- Feature 8 (HOEX): phiên phỏng vấn thử — câu hỏi snapshot + kết quả JSON

CREATE TABLE IF NOT EXISTS "student_interview_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'in_progress',
    "mic_checked_at" TIMESTAMP(6),
    "questions_json" JSONB NOT NULL,
    "answers_json" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_interview_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "student_interview_sessions_user_id_created_at_idx"
    ON "student_interview_sessions" ("user_id", "created_at" DESC);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'student_interview_sessions_user_id_fkey'
    ) THEN
        ALTER TABLE "student_interview_sessions"
            ADD CONSTRAINT "student_interview_sessions_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
