-- AlterTable: feature1 profile fields (group, impact_tier, tier, experiments)
ALTER TABLE "student_backgrounds" ADD COLUMN IF NOT EXISTS "experiments" JSONB DEFAULT '[]';
ALTER TABLE "subject_scores" ADD COLUMN IF NOT EXISTS "group" VARCHAR(50);
ALTER TABLE "academic_extracurriculars" ADD COLUMN IF NOT EXISTS "impact_tier" INTEGER;
ALTER TABLE "personal_projects" ADD COLUMN IF NOT EXISTS "tier" INTEGER;
