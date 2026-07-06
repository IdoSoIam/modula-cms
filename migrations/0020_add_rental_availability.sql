ALTER TABLE "Product" ADD COLUMN "rentalAvailableFrom" TEXT;
ALTER TABLE "Product" ADD COLUMN "rentalAvailableTo" TEXT;
ALTER TABLE "Product" ADD COLUMN "rentalMinDays" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Product" ADD COLUMN "rentalMaxDays" INTEGER;

ALTER TABLE "ProductLot" ADD COLUMN "rentalAvailableFrom" TEXT;
ALTER TABLE "ProductLot" ADD COLUMN "rentalAvailableTo" TEXT;
ALTER TABLE "ProductLot" ADD COLUMN "rentalMinDays" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "ProductLot" ADD COLUMN "rentalMaxDays" INTEGER;

ALTER TABLE "ShopOrder" ADD COLUMN "rentalStartDate" TEXT;
ALTER TABLE "ShopOrder" ADD COLUMN "rentalEndDate" TEXT;

CREATE INDEX IF NOT EXISTS "ShopOrder_status_rentalStartDate_idx" ON "ShopOrder"("status", "rentalStartDate");
