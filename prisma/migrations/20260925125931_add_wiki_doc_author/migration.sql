/*
  Warnings:

  - Added the required column `author` to the `WikiDoc` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WikiDoc" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_WikiDoc" ("body", "category", "createdAt", "id", "slug", "title", "updatedAt", "author") SELECT "body", "category", "createdAt", "id", "slug", "title", "updatedAt", '' FROM "WikiDoc";
DROP TABLE "WikiDoc";
ALTER TABLE "new_WikiDoc" RENAME TO "WikiDoc";
CREATE UNIQUE INDEX "WikiDoc_slug_key" ON "WikiDoc"("slug");
CREATE INDEX "WikiDoc_category_idx" ON "WikiDoc"("category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
