-- 0044_add_product_rental_rate_grid (sqlite)
--
-- Diff summary:
-- Product: field added: rentalRatesJson

ALTER TABLE "Product" ADD COLUMN "rentalRatesJson" TEXT NOT NULL DEFAULT '[]';
