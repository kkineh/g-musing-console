/*
  Warnings:

  - The required column `requestId` was added to the `Turn` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Chat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT,
    "title" TEXT,
    "sessionId" TEXT,
    "memberId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Chat_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Chat" ("createdAt", "id", "memberId", "sessionId", "title", "type", "updatedAt", "userId") SELECT "createdAt", "id", "memberId", "sessionId", "title", "type", "updatedAt", "userId" FROM "Chat";
DROP TABLE "Chat";
ALTER TABLE "new_Chat" RENAME TO "Chat";
CREATE INDEX "Chat_createdAt_idx" ON "Chat"("createdAt");
CREATE INDEX "Chat_type_idx" ON "Chat"("type");
CREATE INDEX "Chat_memberId_idx" ON "Chat"("memberId");
CREATE TABLE "new_Turn" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seq" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "requestId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "rawResult" TEXT,
    "references" TEXT,
    "trace" TEXT,
    "pendingQuestions" TEXT,
    "answeredInput" TEXT,
    "elapsedMs" INTEGER,
    "tokens" INTEGER,
    "filesRead" INTEGER,
    "dbQueries" INTEGER,
    "error" TEXT,
    "chatId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "Turn_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Turn" ("answer", "answeredInput", "chatId", "completedAt", "createdAt", "dbQueries", "elapsedMs", "error", "filesRead", "id", "pendingQuestions", "question", "rawResult", "references", "seq", "status", "tokens", "trace") SELECT "answer", "answeredInput", "chatId", "completedAt", "createdAt", "dbQueries", "elapsedMs", "error", "filesRead", "id", "pendingQuestions", "question", "rawResult", "references", "seq", "status", "tokens", "trace" FROM "Turn";
DROP TABLE "Turn";
ALTER TABLE "new_Turn" RENAME TO "Turn";
CREATE UNIQUE INDEX "Turn_requestId_key" ON "Turn"("requestId");
CREATE INDEX "Turn_status_idx" ON "Turn"("status");
CREATE UNIQUE INDEX "Turn_chatId_seq_key" ON "Turn"("chatId", "seq");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
