ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MARKETING';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PostStatus') THEN
        CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS "marketing_posts" (
    "id" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "slug" VARCHAR(500) NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "category" VARCHAR(100),
    "thumbnail_url" VARCHAR(500),
    "cta_text" VARCHAR(100),
    "cta_link" VARCHAR(500),
    "deadline" TIMESTAMP(6),
    "target_publish_date" TIMESTAMP(6),
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "meta_title" VARCHAR(255),
    "meta_description" TEXT,
    "author_id" UUID NOT NULL,
    "placement" VARCHAR(100),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "marketing_posts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "marketing_posts_slug_key" UNIQUE ("slug"),
    CONSTRAINT "marketing_posts_author_id_fkey"
      FOREIGN KEY ("author_id") REFERENCES "users"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "marketing_posts_author_id_idx" ON "marketing_posts"("author_id");
CREATE INDEX IF NOT EXISTS "marketing_posts_status_idx" ON "marketing_posts"("status");
CREATE INDEX IF NOT EXISTS "marketing_posts_target_publish_date_idx" ON "marketing_posts"("target_publish_date");
CREATE INDEX IF NOT EXISTS "marketing_posts_created_at_idx" ON "marketing_posts"("created_at");
CREATE INDEX IF NOT EXISTS "marketing_posts_category_idx" ON "marketing_posts"("category");

