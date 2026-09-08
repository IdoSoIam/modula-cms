-- 0040_add_reusable_product_option_sets (sqlite)
--
-- Diff summary:
-- Added models: ProductOptionSet
-- Product: field added: excludedOptionSetIdsJson; field added: optionOverridesJson

ALTER TABLE "Product" ADD COLUMN "excludedOptionSetIdsJson" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Product" ADD COLUMN "optionOverridesJson" TEXT NOT NULL DEFAULT '[]';

CREATE TABLE "ProductOptionSet" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "categoryIdsJson" TEXT NOT NULL DEFAULT '[]',
  "productIdsJson" TEXT NOT NULL DEFAULT '[]',
  "saleTypesJson" TEXT NOT NULL DEFAULT '["SALE","RENTAL"]',
  "optionGroupsJson" TEXT NOT NULL DEFAULT '[]',
  "active" INTEGER NOT NULL DEFAULT 1,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL
);

CREATE INDEX "ProductOptionSet_active_position_idx" ON "ProductOptionSet" ("active", "position");
