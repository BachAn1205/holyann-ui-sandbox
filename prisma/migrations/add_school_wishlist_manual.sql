-- Bảng nguyện vọng trường (chọn từ trang Danh sách trường – API dùng university_rankings).
-- Chạy trong Supabase SQL Editor hoặc: psql $DATABASE_URL -f prisma/migrations/add_school_wishlist_manual.sql
-- Nếu bảng đã tạo trước đó với FK sang universities: DROP TABLE IF EXISTS "school_wishlist"; rồi chạy lại script.

CREATE TABLE IF NOT EXISTS "school_wishlist" (
  "id" UUID NOT NULL PRIMARY KEY,
  "student_id" UUID NOT NULL,
  "university_id" INT NOT NULL,
  "sort_order" INT NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "school_wishlist_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "school_wishlist_university_id_fkey"
    FOREIGN KEY ("university_id") REFERENCES "university_rankings"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "school_wishlist_student_university_key" UNIQUE ("student_id", "university_id")
);

CREATE INDEX IF NOT EXISTS "school_wishlist_student_id_idx" ON "school_wishlist"("student_id");
