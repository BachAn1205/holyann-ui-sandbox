ALTER TABLE "essays" ADD COLUMN IF NOT EXISTS "target_goal_id" UUID;

CREATE INDEX IF NOT EXISTS "essays_target_goal_id_idx" ON "essays"("target_goal_id");

ALTER TABLE "essays" DROP CONSTRAINT IF EXISTS "essays_target_goal_id_fkey";

ALTER TABLE "essays" ADD CONSTRAINT "essays_target_goal_id_fkey" FOREIGN KEY ("target_goal_id") REFERENCES "student_target_goals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
