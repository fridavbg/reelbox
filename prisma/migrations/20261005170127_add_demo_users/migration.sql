-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_anonymous" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "users_is_anonymous_created_at_idx" ON "users"("is_anonymous", "created_at");
