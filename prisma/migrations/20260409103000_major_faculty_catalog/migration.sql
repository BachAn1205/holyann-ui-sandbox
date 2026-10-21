CREATE TABLE "major_faculty_catalog" (
    "id" SERIAL NOT NULL,
    "job_zone" INTEGER,
    "occupation_code" VARCHAR(32),
    "occupation_name" VARCHAR(500) NOT NULL,
    "data_level" VARCHAR(20),
    "major_group_code" VARCHAR(32),
    "industry_group" VARCHAR(255),
    "major_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "major_faculty_catalog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "major_faculty_catalog_industry_group_idx" ON "major_faculty_catalog"("industry_group");
CREATE INDEX "major_faculty_catalog_occupation_name_idx" ON "major_faculty_catalog"("occupation_name");
CREATE INDEX "major_faculty_catalog_occupation_code_idx" ON "major_faculty_catalog"("occupation_code");
