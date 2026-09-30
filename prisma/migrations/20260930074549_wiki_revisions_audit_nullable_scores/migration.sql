/*
  Warnings:

  - Added the required column `updatedAt` to the `Score` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "WikiRevision" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "docId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "editedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WikiRevision_docId_fkey" FOREIGN KEY ("docId") REFERENCES "WikiDoc" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WikiRevision_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Score" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pathAccuracy" INTEGER,
    "scopeMatch" INTEGER,
    "convention" INTEGER,
    "contentAccuracy" INTEGER,
    "askBackSafety" INTEGER,
    "average" REAL NOT NULL,
    "note" TEXT,
    "turnId" INTEGER NOT NULL,
    "scoredById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Score_turnId_fkey" FOREIGN KEY ("turnId") REFERENCES "Turn" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Score_scoredById_fkey" FOREIGN KEY ("scoredById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Score" ("askBackSafety", "average", "contentAccuracy", "convention", "createdAt", "updatedAt", "id", "note", "pathAccuracy", "scopeMatch", "scoredById", "turnId") SELECT "askBackSafety", "average", "contentAccuracy", "convention", "createdAt", "createdAt", "id", "note", "pathAccuracy", "scopeMatch", "scoredById", "turnId" FROM "Score";
DROP TABLE "Score";
ALTER TABLE "new_Score" RENAME TO "Score";
CREATE UNIQUE INDEX "Score_turnId_key" ON "Score"("turnId");
CREATE INDEX "Score_createdAt_idx" ON "Score"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WikiRevision_docId_createdAt_idx" ON "WikiRevision"("docId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
