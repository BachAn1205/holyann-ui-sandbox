ALTER TABLE "mentor_custom_deadlines"
ADD COLUMN IF NOT EXISTS "stage_order" INTEGER;

UPDATE "mentor_custom_deadlines"
SET "stage_order" = ((regexp_match("stage", '[0-9]+'))[1])::INT
WHERE "stage_order" IS NULL
  AND "stage" IS NOT NULL
  AND "stage" ~ '[0-9]+';

CREATE INDEX IF NOT EXISTS "mentor_custom_deadlines_stage_order_idx"
ON "mentor_custom_deadlines"("stage_order");
