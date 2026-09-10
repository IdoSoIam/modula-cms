-- 0048_repair_product_gallery (sqlite)
-- Repairs 0047, which was recorded without applying its generated TODO.

ALTER TABLE "Product" ADD COLUMN "galleryJson" TEXT NOT NULL DEFAULT '[]';
