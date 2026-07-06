ALTER TABLE "Product" RENAME COLUMN "stripeTaxCode" TO "paymentTaxCode";
ALTER TABLE "Product" RENAME COLUMN "stripeTaxBehavior" TO "paymentTaxBehavior";

ALTER TABLE "ProductLot" RENAME COLUMN "stripeTaxCode" TO "paymentTaxCode";
ALTER TABLE "ProductLot" RENAME COLUMN "stripeTaxBehavior" TO "paymentTaxBehavior";

ALTER TABLE "ShopOrder" RENAME COLUMN "stripeCheckoutSessionId" TO "providerSessionId";
ALTER TABLE "ShopOrder" RENAME COLUMN "stripePaymentIntentId" TO "providerPaymentIntentId";
ALTER TABLE "ShopOrder" RENAME COLUMN "stripePaymentIntentStatus" TO "providerPaymentStatus";
ALTER TABLE "ShopOrder" RENAME COLUMN "stripeLastEventId" TO "providerLastEventId";

DROP INDEX IF EXISTS "ShopOrder_stripeCheckoutSessionId_key";
DROP INDEX IF EXISTS "ShopOrder_stripePaymentIntentId_key";

CREATE UNIQUE INDEX IF NOT EXISTS "ShopOrder_providerSessionId_key" ON "ShopOrder" ("providerSessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "ShopOrder_providerPaymentIntentId_key" ON "ShopOrder" ("providerPaymentIntentId");
