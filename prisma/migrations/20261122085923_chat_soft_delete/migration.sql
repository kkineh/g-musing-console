-- AlterTable
ALTER TABLE "Chat" ADD COLUMN "deletedAt" DATETIME;

-- CreateIndex
CREATE INDEX "Chat_deletedAt_idx" ON "Chat"("deletedAt");
