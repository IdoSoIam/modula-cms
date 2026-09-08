-- 0034_add_rental_pricing (d1)
--
-- Diff summary:
-- Product: field added: rentalDailyPrice; field added: rentalHourlyPrice

ALTER TABLE "Product" ADD COLUMN "rentalHourlyPrice" REAL;
ALTER TABLE "Product" ADD COLUMN "rentalDailyPrice" REAL;

UPDATE "Product"
SET "rentalHourlyPrice" = "price"
WHERE "saleType" = 'RENTAL' AND "rentalBookingMode" = 'SINGLE_DAY';

UPDATE "Product"
SET "rentalDailyPrice" = "price"
WHERE "saleType" = 'RENTAL' AND "rentalBookingMode" = 'MULTI_DAY';
