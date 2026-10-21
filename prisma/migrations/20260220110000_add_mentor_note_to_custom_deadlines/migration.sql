-- AlterTable mentor_custom_deadlines: add mentor_note (ghi chú/feedback của mentor, khác description)
ALTER TABLE "mentor_custom_deadlines" ADD COLUMN IF NOT EXISTS "mentor_note" TEXT;
