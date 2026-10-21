-- Đảm bảo có thể trùng qs_rank (tie ranks); một số DB vẫn giữ unique cũ.
ALTER TABLE "university_rankings" DROP CONSTRAINT IF EXISTS "university_rankings_qs_rank_key";
