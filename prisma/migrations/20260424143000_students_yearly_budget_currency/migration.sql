-- Ngân sách: thêm loại tiền (USD / VND); giá trị yearly_budget vẫn là DECIMAL(15,2)
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "yearly_budget_currency" VARCHAR(8);

UPDATE "students"
SET "yearly_budget_currency" = 'USD'
WHERE "yearly_budget" IS NOT NULL
  AND ("yearly_budget_currency" IS NULL OR TRIM("yearly_budget_currency") = '');
