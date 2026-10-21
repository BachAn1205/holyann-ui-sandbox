/*
  Warnings:

  - You are about to drop the column `category` on the `checklist_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `default_deadline_days` on the `checklist_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `feedback` on the `checklist_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `is_active` on the `checklist_tasks` table. All the data in the column will be lost.
  - You are about to drop the column `requires_file` on the `checklist_tasks` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'NEEDS_REVISION');

-- DropIndex
DROP INDEX "checklist_tasks_stage_id_idx";

-- AlterTable
ALTER TABLE "checklist_tasks" DROP COLUMN "category",
DROP COLUMN "default_deadline_days",
DROP COLUMN "feedback",
DROP COLUMN "is_active",
DROP COLUMN "requires_file",
ADD COLUMN     "is_required" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "link_to" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "student_task_progress" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "task_id" UUID,
    "custom_title" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "mentor_note" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_task_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_task_progress_student_id_task_id_key" ON "student_task_progress"("student_id", "task_id");

-- AddForeignKey
ALTER TABLE "student_task_progress" ADD CONSTRAINT "student_task_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_task_progress" ADD CONSTRAINT "student_task_progress_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "checklist_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
