-- Feature1: snapshot areas { A, B, C } + suitability theo vùng (khớp output-analysis.json)
ALTER TABLE "profile_analyses" ADD COLUMN IF NOT EXISTS "areas" JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE "profile_analyses" ADD COLUMN IF NOT EXISTS "suitability_a" DOUBLE PRECISION;
ALTER TABLE "profile_analyses" ADD COLUMN IF NOT EXISTS "suitability_b" DOUBLE PRECISION;
ALTER TABLE "profile_analyses" ADD COLUMN IF NOT EXISTS "suitability_c" DOUBLE PRECISION;
