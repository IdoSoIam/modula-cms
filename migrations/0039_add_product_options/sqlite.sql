-- 0039_add_product_options (sqlite)
--
-- Diff summary:
-- Product: field added: optionGroupsJson

ALTER TABLE "Product" ADD COLUMN "optionGroupsJson" TEXT NOT NULL DEFAULT '[]';
