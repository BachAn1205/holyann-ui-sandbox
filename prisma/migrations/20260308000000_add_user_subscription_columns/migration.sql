-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_plan" VARCHAR(20);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_start" TIMESTAMP(6);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscription_end" TIMESTAMP(6);
