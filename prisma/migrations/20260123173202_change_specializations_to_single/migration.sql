/*
  Warnings:

  - You are about to drop the column `specializations` on the `mentors` table. All the data in the column will be lost.
  - Added the required column `specialization` to the `mentors` table without a default value. This is not possible if the table is not empty.

*/

-- AlterTable: Thêm cột mới với default value tạm thời
ALTER TABLE "mentors" ADD COLUMN "specialization" "MentorType";

-- Migrate data: Lấy giá trị đầu tiên từ array specializations
UPDATE "mentors"
SET "specialization" = (specializations[1])::text::"MentorType"
WHERE specializations IS NOT NULL AND array_length(specializations, 1) > 0;

-- Set default cho những mentor chưa có specialization
UPDATE "mentors"
SET "specialization" = 'AS'::"MentorType"
WHERE "specialization" IS NULL;

-- Make column NOT NULL
ALTER TABLE "mentors" ALTER COLUMN "specialization" SET NOT NULL;

-- Drop old column
ALTER TABLE "mentors" DROP COLUMN "specializations";
