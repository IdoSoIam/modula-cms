-- 0045_add_product_rental_pricing_strategy (d1)
--
-- Diff summary:
-- Product: field added: rentalPricingStrategy

ALTER TABLE "Product" ADD COLUMN "rentalPricingStrategy" TEXT NOT NULL DEFAULT 'LINEAR';
