-- 0045_add_product_rental_pricing_strategy (sqlite)
--
-- Diff summary:
-- Product: field added: rentalPricingStrategy

ALTER TABLE "Product" ADD COLUMN "rentalPricingStrategy" TEXT NOT NULL DEFAULT 'LINEAR';
