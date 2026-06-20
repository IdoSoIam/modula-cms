ALTER TABLE "ShopOrder" ADD COLUMN "userId" INTEGER;
ALTER TABLE "ShopOrder" ADD COLUMN "deliveryType" TEXT;
ALTER TABLE "ShopOrder" ADD COLUMN "pickupPointId" INTEGER;
ALTER TABLE "ShopOrder" ADD COLUMN "deliveryTourId" INTEGER;
ALTER TABLE "ShopOrder" ADD COLUMN "deliveryAddress" TEXT;
ALTER TABLE "ShopOrder" ADD COLUMN "deliveryCity" TEXT;
ALTER TABLE "ShopOrder" ADD COLUMN "deliveryPostalCode" TEXT;
ALTER TABLE "ShopOrder" ADD COLUMN "fulfillmentDate" TEXT;
ALTER TABLE "ShopOrder" ADD COLUMN "fulfillmentTime" TEXT;
ALTER TABLE "ShopOrder" ADD COLUMN "fulfillmentLocation" TEXT;

CREATE INDEX IF NOT EXISTS "ShopOrder_userId_idx" ON "ShopOrder" ("userId");
CREATE INDEX IF NOT EXISTS "ShopOrder_pickupPointId_idx" ON "ShopOrder" ("pickupPointId");
CREATE INDEX IF NOT EXISTS "ShopOrder_deliveryTourId_idx" ON "ShopOrder" ("deliveryTourId");
