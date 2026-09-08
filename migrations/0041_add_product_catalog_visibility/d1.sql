-- 0041_add_product_catalog_visibility (d1)
--
-- Diff summary:
-- Product: field added: catalogVisible

ALTER TABLE "Product" ADD COLUMN "catalogVisible" INTEGER NOT NULL DEFAULT 1;
