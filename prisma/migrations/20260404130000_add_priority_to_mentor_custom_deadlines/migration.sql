ALTER TABLE "mentor_custom_deadlines"
ADD COLUMN "priority" VARCHAR(20);

UPDATE "mentor_custom_deadlines"
SET "priority" = 'MEDIUM'
WHERE "priority" IS NULL;

ALTER TABLE "mentor_custom_deadlines"
ALTER COLUMN "priority" SET DEFAULT 'MEDIUM',
ALTER COLUMN "priority" SET NOT NULL;

ALTER TABLE "mentor_custom_deadlines"
ADD CONSTRAINT "mentor_custom_deadlines_priority_check"
CHECK ("priority" IN ('LOW', 'MEDIUM', 'HIGH'));
