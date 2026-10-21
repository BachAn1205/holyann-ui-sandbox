-- CreateTable
CREATE TABLE "mentor_custom_deadlines" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "mentor_id" UUID NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "deadline" TIMESTAMP(6),
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "mentor_custom_deadlines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "mentor_custom_deadlines_student_id_idx" ON "mentor_custom_deadlines"("student_id");

-- CreateIndex
CREATE INDEX "mentor_custom_deadlines_mentor_id_idx" ON "mentor_custom_deadlines"("mentor_id");

-- CreateIndex
CREATE INDEX "mentor_custom_deadlines_deadline_idx" ON "mentor_custom_deadlines"("deadline");

-- AddForeignKey
ALTER TABLE "mentor_custom_deadlines" ADD CONSTRAINT "mentor_custom_deadlines_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentor_custom_deadlines" ADD CONSTRAINT "mentor_custom_deadlines_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "mentors"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
