-- CreateEnum
CREATE TYPE "SkillScope" AS ENUM ('yearly', 'monthly');

-- CreateEnum
CREATE TYPE "SkillTag" AS ENUM ('skill', 'project', 'personal');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('folder', 'link', 'note', 'file');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('in_progress', 'completed', 'overdue');

-- CreateEnum
CREATE TYPE "AssignmentEventType" AS ENUM ('created', 'reassigned', 'completed');

-- CreateEnum
CREATE TYPE "AssignmentEventStatus" AS ENUM ('started', 'incomplete', 'in_progress', 'completed');

-- CreateTable
CREATE TABLE "tracker_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tracker_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "years" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "year_number" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "months" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "year_id" UUID NOT NULL,
    "month_index" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "months_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "year_id" UUID NOT NULL,
    "parent_skill_id" UUID,
    "scope" "SkillScope" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "tag" "SkillTag" NOT NULL DEFAULT 'skill',
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "estimated_days" INTEGER,
    "started_at" TIMESTAMPTZ,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_resources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "skill_id" UUID NOT NULL,
    "parent_id" UUID,
    "type" "ResourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "content" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "month_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "skill_id" UUID NOT NULL,
    "month_id" UUID NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'in_progress',
    "current_target_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "month_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assignment_id" UUID NOT NULL,
    "event_date" DATE NOT NULL,
    "event_type" "AssignmentEventType" NOT NULL,
    "status" "AssignmentEventStatus" NOT NULL,
    "note" TEXT,
    "sequence" INTEGER NOT NULL,

    CONSTRAINT "assignment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_pins" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assignment_id" UUID NOT NULL,
    "pinned_date" DATE NOT NULL,
    "is_reassignment" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "date_pins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "years_user_id_idx" ON "years"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "years_user_id_year_number_key" ON "years"("user_id", "year_number");

-- CreateIndex
CREATE INDEX "months_year_id_idx" ON "months"("year_id");

-- CreateIndex
CREATE UNIQUE INDEX "months_year_id_month_index_key" ON "months"("year_id", "month_index");

-- CreateIndex
CREATE INDEX "skills_year_id_scope_idx" ON "skills"("year_id", "scope");

-- CreateIndex
CREATE INDEX "skills_parent_skill_id_idx" ON "skills"("parent_skill_id");

-- CreateIndex
CREATE INDEX "skill_resources_skill_id_idx" ON "skill_resources"("skill_id");

-- CreateIndex
CREATE INDEX "skill_resources_parent_id_idx" ON "skill_resources"("parent_id");

-- CreateIndex
CREATE INDEX "month_assignments_month_id_idx" ON "month_assignments"("month_id");

-- CreateIndex
CREATE INDEX "month_assignments_skill_id_idx" ON "month_assignments"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "month_assignments_skill_id_month_id_key" ON "month_assignments"("skill_id", "month_id");

-- CreateIndex
CREATE INDEX "assignment_events_assignment_id_sequence_idx" ON "assignment_events"("assignment_id", "sequence");

-- CreateIndex
CREATE INDEX "date_pins_assignment_id_idx" ON "date_pins"("assignment_id");

-- CreateIndex
CREATE INDEX "date_pins_pinned_date_idx" ON "date_pins"("pinned_date");

-- AddForeignKey
ALTER TABLE "years" ADD CONSTRAINT "years_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tracker_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "months" ADD CONSTRAINT "months_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_year_id_fkey" FOREIGN KEY ("year_id") REFERENCES "years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_parent_skill_id_fkey" FOREIGN KEY ("parent_skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_resources" ADD CONSTRAINT "skill_resources_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_resources" ADD CONSTRAINT "skill_resources_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "skill_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "month_assignments" ADD CONSTRAINT "month_assignments_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "month_assignments" ADD CONSTRAINT "month_assignments_month_id_fkey" FOREIGN KEY ("month_id") REFERENCES "months"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_events" ADD CONSTRAINT "assignment_events_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "month_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_pins" ADD CONSTRAINT "date_pins_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "month_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
