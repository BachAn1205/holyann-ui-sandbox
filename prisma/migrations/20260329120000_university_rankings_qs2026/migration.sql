-- QS 2026: bỏ unique qs_rank (trùng hạng), thêm cột chỉ số & hạng chi tiết
ALTER TABLE "university_rankings" DROP CONSTRAINT IF EXISTS "university_rankings_qs_rank_key";

ALTER TABLE "university_rankings" ALTER COLUMN "qs_overall_score" DROP NOT NULL;
ALTER TABLE "university_rankings" ALTER COLUMN "country_code" DROP NOT NULL;
ALTER TABLE "university_rankings" ALTER COLUMN "type" TYPE VARCHAR(80);

ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "previous_rank" VARCHAR(40);
ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "size" VARCHAR(10);
ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "focus" VARCHAR(10);
ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "research_level" VARCHAR(10);
ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "isd_score" DOUBLE PRECISION;
ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "irn_score" DOUBLE PRECISION;
ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "eo_score" DOUBLE PRECISION;
ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "sus_score" DOUBLE PRECISION;
ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "ar_rank" VARCHAR(32);
ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "er_rank" VARCHAR(32);
ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "fsr_rank" VARCHAR(32);
ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "cpf_rank" VARCHAR(32);
ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "ifr_rank" VARCHAR(32);
ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "isr_rank" VARCHAR(32);
ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "isd_rank" VARCHAR(32);
ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "irn_rank" VARCHAR(32);
ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "eo_rank" VARCHAR(32);
ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "sus_rank" VARCHAR(32);
ALTER TABLE "university_rankings" ADD COLUMN IF NOT EXISTS "ranking_year" INTEGER NOT NULL DEFAULT 2026;

CREATE INDEX IF NOT EXISTS "university_rankings_qs_rank_idx" ON "university_rankings"("qs_rank");
CREATE INDEX IF NOT EXISTS "university_rankings_country_idx" ON "university_rankings"("country");
CREATE INDEX IF NOT EXISTS "university_rankings_region_idx" ON "university_rankings"("region");
