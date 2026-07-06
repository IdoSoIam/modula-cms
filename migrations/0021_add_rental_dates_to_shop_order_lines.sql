ALTER TABLE "ShopOrderLine" ADD COLUMN "rentalStartDate" TEXT;
ALTER TABLE "ShopOrderLine" ADD COLUMN "rentalEndDate" TEXT;

CREATE INDEX IF NOT EXISTS "ShopOrderLine_productId_rentalStartDate_idx"
  ON "ShopOrderLine"("productId", "rentalStartDate");

CREATE INDEX IF NOT EXISTS "ShopOrderLine_productLotId_rentalStartDate_idx"
  ON "ShopOrderLine"("productLotId", "rentalStartDate");
