-- CreateEnum
CREATE TYPE "BookmarkCategory" AS ENUM ('vault', 'profile');

-- CreateTable
CREATE TABLE "user_bookmarks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "category" "BookmarkCategory" NOT NULL,
    "platform" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "note" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_bookmarks_user_id_category_idx" ON "user_bookmarks"("user_id", "category");

-- CreateIndex
CREATE INDEX "user_bookmarks_user_id_category_platform_idx" ON "user_bookmarks"("user_id", "category", "platform");

-- AddForeignKey
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tracker_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
