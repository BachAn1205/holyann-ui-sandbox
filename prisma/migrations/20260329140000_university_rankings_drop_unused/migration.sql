-- Xóa toàn bộ bảng xếp hạng + nguyện vọng phụ thuộc, rồi bỏ cột không còn dùng (không có trong QS 2026 CSV).
TRUNCATE TABLE "university_rankings" RESTART IDENTITY CASCADE;

ALTER TABLE "university_rankings" DROP COLUMN IF EXISTS "city";
ALTER TABLE "university_rankings" DROP COLUMN IF EXISTS "founded_year";
ALTER TABLE "university_rankings" DROP COLUMN IF EXISTS "total_students";
ALTER TABLE "university_rankings" DROP COLUMN IF EXISTS "website";
ALTER TABLE "university_rankings" DROP COLUMN IF EXISTS "description";
ALTER TABLE "university_rankings" DROP COLUMN IF EXISTS "strong_subjects";
