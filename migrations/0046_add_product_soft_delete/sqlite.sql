-- 0046_add_product_soft_delete (sqlite)
--
-- Diff summary:
-- Product: field added: deletedAt

ALTER TABLE "Product" ADD COLUMN "deletedAt" TEXT;
