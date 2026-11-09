-- CreateTable
CREATE TABLE "ItemFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "itemId" TEXT,
    "sourceKey" TEXT,
    "itemType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ItemFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ItemFile_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ItemFile_itemId_key" ON "ItemFile"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ItemFile_sourceKey_key" ON "ItemFile"("sourceKey");

-- CreateIndex
CREATE INDEX "ItemFile_userId_idx" ON "ItemFile"("userId");
