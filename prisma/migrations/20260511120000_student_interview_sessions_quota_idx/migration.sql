-- Mock interview (Feature 8): index phục vụ đếm phiên theo user + status + updated_at (quota 6 tháng / theo ngày)

CREATE INDEX IF NOT EXISTS "student_interview_sessions_user_id_status_updated_at_idx"
    ON "student_interview_sessions" ("user_id", "status", "updated_at" DESC);
