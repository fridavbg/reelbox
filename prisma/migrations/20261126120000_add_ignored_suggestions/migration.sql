-- CreateTable
CREATE TABLE "ignored_suggestions" (
    "post_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ignored_suggestions_pkey" PRIMARY KEY ("post_id","name_key")
);

-- CreateIndex
CREATE INDEX "ignored_suggestions_user_id_idx" ON "ignored_suggestions"("user_id");

-- AddForeignKey
ALTER TABLE "ignored_suggestions" ADD CONSTRAINT "ignored_suggestions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ignored_suggestions" ADD CONSTRAINT "ignored_suggestions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

