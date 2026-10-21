-- Xóa bảng gợi ý trường (Module 3 / trang target đã bỏ).
-- Chạy trong Supabase SQL Editor hoặc: psql $DATABASE_URL -f prisma/migrations/drop_student_university_recommendations_manual.sql

DROP TABLE IF EXISTS "student_university_recommendations";
