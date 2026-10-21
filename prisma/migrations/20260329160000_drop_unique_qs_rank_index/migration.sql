-- Unique trên qs_rank là INDEX (không phải CONSTRAINT); bỏ để cho phép trùng hạng QS.
DROP INDEX IF EXISTS "university_rankings_qs_rank_key";
