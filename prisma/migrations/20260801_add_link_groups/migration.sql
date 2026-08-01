-- AlterTable
ALTER TABLE "Link" ADD COLUMN "isGroup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "parentId" TEXT;

-- CreateIndex
CREATE INDEX "Link_parentId_idx" ON "Link"("parentId");

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Link"("id") ON DELETE SET NULL ON UPDATE CASCADE;
