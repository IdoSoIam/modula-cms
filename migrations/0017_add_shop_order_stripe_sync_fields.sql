ALTER TABLE "ShopOrder" ADD COLUMN "stripePaymentIntentId" TEXT;
ALTER TABLE "ShopOrder" ADD COLUMN "stripePaymentIntentStatus" TEXT;
ALTER TABLE "ShopOrder" ADD COLUMN "stripeLastEventId" TEXT;
ALTER TABLE "ShopOrder" ADD COLUMN "paymentFailureReason" TEXT;
ALTER TABLE "ShopOrder" ADD COLUMN "refundedAt" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "ShopOrder_stripePaymentIntentId_key" ON "ShopOrder" ("stripePaymentIntentId");
