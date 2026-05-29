-- AlterTable
ALTER TABLE "Design" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentDesignId" TEXT;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_parentDesignId_fkey" FOREIGN KEY ("parentDesignId") REFERENCES "Design"("id") ON DELETE SET NULL ON UPDATE CASCADE;
