ALTER TABLE "Product" ADD COLUMN "stripeTaxCode" TEXT;
ALTER TABLE "Product" ADD COLUMN "stripeTaxBehavior" TEXT CHECK ("stripeTaxBehavior" IN ('inclusive', 'exclusive'));

ALTER TABLE "ProductLot" ADD COLUMN "stripeTaxCode" TEXT;
ALTER TABLE "ProductLot" ADD COLUMN "stripeTaxBehavior" TEXT CHECK ("stripeTaxBehavior" IN ('inclusive', 'exclusive'));
