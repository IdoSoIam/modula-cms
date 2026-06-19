CREATE TABLE IF NOT EXISTS "ProductCategory" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "active" INTEGER NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProductCategory_slug_key" ON "ProductCategory"("slug");
CREATE INDEX IF NOT EXISTS "ProductCategory_active_position_idx" ON "ProductCategory"("active", "position");

ALTER TABLE "Product" ADD COLUMN "saleType" TEXT NOT NULL DEFAULT 'SALE';
ALTER TABLE "Product" ADD COLUMN "categoryId" INTEGER;
CREATE INDEX IF NOT EXISTS "Product_saleType_idx" ON "Product"("saleType");
CREATE INDEX IF NOT EXISTS "Product_categoryId_idx" ON "Product"("categoryId");

ALTER TABLE "ProductLot" ADD COLUMN "saleType" TEXT NOT NULL DEFAULT 'SALE';
ALTER TABLE "ProductLot" ADD COLUMN "categoryId" INTEGER;
CREATE INDEX IF NOT EXISTS "ProductLot_saleType_idx" ON "ProductLot"("saleType");
CREATE INDEX IF NOT EXISTS "ProductLot_categoryId_idx" ON "ProductLot"("categoryId");

INSERT INTO "ProductCategory" ("name", "slug", "description", "position", "active", "createdAt", "updatedAt")
SELECT DISTINCT
  TRIM("unitLabel") AS "name",
  LOWER(REPLACE(REPLACE(REPLACE(TRIM("unitLabel"), ' ', '-'), '/', '-'), '_', '-')) AS "slug",
  NULL AS "description",
  0 AS "position",
  1 AS "active",
  CURRENT_TIMESTAMP AS "createdAt",
  CURRENT_TIMESTAMP AS "updatedAt"
FROM "Product"
WHERE "unitLabel" IS NOT NULL
  AND TRIM("unitLabel") <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM "ProductCategory" pc
    WHERE pc."slug" = LOWER(REPLACE(REPLACE(REPLACE(TRIM("Product"."unitLabel"), ' ', '-'), '/', '-'), '_', '-'))
  );
