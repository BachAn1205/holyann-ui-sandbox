-- Xóa cột mục tiêu cũ (đã thay bằng target_faculty_name, target_university_id, target_university_name từ trang Target).
ALTER TABLE students DROP COLUMN IF EXISTS intended_major;
ALTER TABLE students DROP COLUMN IF EXISTS target_country;
