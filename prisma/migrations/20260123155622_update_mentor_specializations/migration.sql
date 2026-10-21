/*
  Warnings:

  - You are about to drop the column `created_by` on the `mentor_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `expires_at` on the `mentor_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `mentor_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `mentor_acs_id` on the `mentor_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `mentor_ard_id` on the `mentor_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `mentor_as_id` on the `mentor_assignments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[student_id,type]` on the table `mentor_assignments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mentor_id` to the `mentor_assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `mentor_assignments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "mentor_assignments" DROP CONSTRAINT "mentor_assignments_created_by_fkey";

-- DropForeignKey
ALTER TABLE "mentor_assignments" DROP CONSTRAINT "mentor_assignments_mentor_acs_id_fkey";

-- DropForeignKey
ALTER TABLE "mentor_assignments" DROP CONSTRAINT "mentor_assignments_mentor_ard_id_fkey";

-- DropForeignKey
ALTER TABLE "mentor_assignments" DROP CONSTRAINT "mentor_assignments_mentor_as_id_fkey";

-- DropForeignKey
ALTER TABLE "mentor_assignments" DROP CONSTRAINT "mentor_assignments_student_id_fkey";

-- DropIndex
DROP INDEX "mentor_assignments_mentor_acs_id_idx";

-- DropIndex
DROP INDEX "mentor_assignments_mentor_ard_id_idx";

-- DropIndex
DROP INDEX "mentor_assignments_mentor_as_id_idx";

-- DropIndex
DROP INDEX "mentor_assignments_student_id_is_active_key";

-- AlterTable
ALTER TABLE "mentor_assignments" DROP COLUMN "created_by",
DROP COLUMN "expires_at",
DROP COLUMN "is_active",
DROP COLUMN "mentor_acs_id",
DROP COLUMN "mentor_ard_id",
DROP COLUMN "mentor_as_id",
ADD COLUMN     "mentor_id" UUID NOT NULL,
ADD COLUMN     "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "type" "MentorType" NOT NULL;

-- AlterTable
ALTER TABLE "mentors" ADD COLUMN     "specializations" "MentorType"[] DEFAULT ARRAY[]::"MentorType"[];

-- CreateIndex
CREATE INDEX "mentor_assignments_mentor_id_idx" ON "mentor_assignments"("mentor_id");

-- CreateIndex
CREATE UNIQUE INDEX "mentor_assignments_student_id_type_key" ON "mentor_assignments"("student_id", "type");

-- AddForeignKey
ALTER TABLE "mentor_assignments" ADD CONSTRAINT "mentor_assignments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_assignments" ADD CONSTRAINT "mentor_assignments_mentor_profile_fkey" FOREIGN KEY ("mentor_id") REFERENCES "mentors"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_assignments" ADD CONSTRAINT "mentor_assignments_mentor_user_fkey" FOREIGN KEY ("mentor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
