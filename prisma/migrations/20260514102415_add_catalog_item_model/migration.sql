-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT,
    "imagePath" TEXT,
    "ogImagePath" TEXT,
    "studioProductId" TEXT,
    "studioTemplateId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_slug_key" ON "CatalogItem"("slug");

-- CreateIndex
CREATE INDEX "CatalogItem_isActive_idx" ON "CatalogItem"("isActive");

-- CreateIndex
CREATE INDEX "CatalogItem_isFeatured_idx" ON "CatalogItem"("isFeatured");

-- CreateIndex
CREATE INDEX "CatalogItem_sortOrder_idx" ON "CatalogItem"("sortOrder");

-- CreateIndex
CREATE INDEX "CatalogItem_studioProductId_idx" ON "CatalogItem"("studioProductId");

-- CreateIndex
CREATE INDEX "CatalogItem_studioTemplateId_idx" ON "CatalogItem"("studioTemplateId");

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_studioProductId_fkey" FOREIGN KEY ("studioProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_studioTemplateId_fkey" FOREIGN KEY ("studioTemplateId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;
