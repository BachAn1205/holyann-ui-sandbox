-- AlterTable student_task_progress: add student_note
ALTER TABLE "student_task_progress" ADD COLUMN IF NOT EXISTS "student_note" TEXT;

-- AlterTable mentor_custom_deadlines: add student_note
ALTER TABLE "mentor_custom_deadlines" ADD COLUMN IF NOT EXISTS "student_note" TEXT;
