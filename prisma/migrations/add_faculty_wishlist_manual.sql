-- Bảng nguyện vọng ngành (chọn từ gợi ý, có thứ tự ưu tiên).
-- Chạy trong Supabase SQL Editor hoặc: psql $DATABASE_URL -f prisma/migrations/add_faculty_wishlist_manual.sql

CREATE TABLE IF NOT EXISTS "faculty_wishlist" (
  "id" UUID NOT NULL PRIMARY KEY,
  "student_id" UUID NOT NULL,
  "faculty_name" VARCHAR(500) NOT NULL,
  "sort_order" INT NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "faculty_wishlist_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "faculty_wishlist_student_id_idx" ON "faculty_wishlist"("student_id");
