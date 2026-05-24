-- CreateEnum
CREATE TYPE "VaultItemKind" AS ENUM ('folder', 'link');

-- AlterTable
ALTER TABLE "user_bookmarks" ADD COLUMN     "kind" "VaultItemKind" NOT NULL DEFAULT 'link',
ADD COLUMN     "parent_id" UUID,
ALTER COLUMN "url" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "user_bookmarks_parent_id_idx" ON "user_bookmarks"("parent_id");

-- AddForeignKey
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "user_bookmarks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
