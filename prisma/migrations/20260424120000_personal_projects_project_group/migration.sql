-- Feature1 projects: persist group (research | science_tech | culture_business)
ALTER TABLE "personal_projects" ADD COLUMN IF NOT EXISTS "project_group" VARCHAR(32);
