/*
  Warnings:

  - The required column `publicId` was added to the `Chat` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "publicId" TEXT NOT NULL,
    "type" TEXT,
    "title" TEXT,
    "sessionId" TEXT,
    "companyId" TEXT,
    "memberId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastStatus" TEXT NOT NULL DEFAULT 'QUEUED',
    "totalMs" INTEGER,
    "scoreAvg" REAL,
    CONSTRAINT "Chat_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Chat_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- 기존 행에는 publicId가 없다. cuid를 SQL에서 만들 수 없으므로 같은 성격의
-- 추측 불가능한 난수 16진수로 채운다. 새로 만들어지는 행은 Prisma가 cuid를 넣는다.
INSERT INTO "new_Chat" ("companyId", "createdAt", "id", "lastStatus", "memberId", "publicId", "scoreAvg", "sessionId", "title", "totalMs", "type", "updatedAt") SELECT "companyId", "createdAt", "id", "lastStatus", "memberId", lower(hex(randomblob(12))), "scoreAvg", "sessionId", "title", "totalMs", "type", "updatedAt" FROM "Chat";
DROP TABLE "Chat";
ALTER TABLE "new_Chat" RENAME TO "Chat";
CREATE UNIQUE INDEX "Chat_publicId_key" ON "Chat"("publicId");
CREATE INDEX "Chat_createdAt_idx" ON "Chat"("createdAt");
CREATE INDEX "Chat_type_idx" ON "Chat"("type");
CREATE INDEX "Chat_companyId_idx" ON "Chat"("companyId");
CREATE INDEX "Chat_memberId_idx" ON "Chat"("memberId");
CREATE INDEX "Chat_lastStatus_idx" ON "Chat"("lastStatus");
CREATE INDEX "Chat_scoreAvg_idx" ON "Chat"("scoreAvg");
CREATE INDEX "Chat_totalMs_idx" ON "Chat"("totalMs");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
