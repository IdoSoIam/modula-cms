-- 0033_add_rental_booking_mode (d1)
--
-- Diff summary:
-- Product: field added: rentalBookingMode; field added: rentalDurationsJson; field added: rentalSlotStepMinutes

ALTER TABLE "Product" ADD COLUMN "rentalBookingMode" TEXT NOT NULL DEFAULT 'MULTI_DAY';
ALTER TABLE "Product" ADD COLUMN "rentalDurationsJson" TEXT NOT NULL DEFAULT '[60,120,240]';
ALTER TABLE "Product" ADD COLUMN "rentalSlotStepMinutes" INTEGER NOT NULL DEFAULT 30;
