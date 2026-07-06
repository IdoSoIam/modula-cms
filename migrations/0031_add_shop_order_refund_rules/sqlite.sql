ALTER TABLE "Product"
ADD COLUMN "allowCustomerCancellation" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Product"
ADD COLUMN "allowRefundRequestAfterEngagement" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "ShopOrder__new" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "orderNumber" TEXT NOT NULL UNIQUE,
  "userId" INTEGER,
  "language" TEXT NOT NULL DEFAULT 'fr',
  "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('DRAFT', 'PENDING', 'CONFIRMED', 'IN_PREPARATION', 'READY', 'IN_DELIVERY', 'COMPLETED', 'CANCELLED')),
  "paymentProvider" TEXT NOT NULL DEFAULT 'OFFLINE' CHECK ("paymentProvider" IN ('OFFLINE', 'STRIPE')),
  "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID' CHECK ("paymentStatus" IN ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  "providerSessionId" TEXT UNIQUE,
  "providerPaymentIntentId" TEXT UNIQUE,
  "providerPaymentStatus" TEXT,
  "providerLastEventId" TEXT,
  "paymentFailureReason" TEXT,
  "afterSalesStatus" TEXT NOT NULL DEFAULT 'NONE' CHECK ("afterSalesStatus" IN ('NONE', 'REFUND_REQUESTED', 'REFUND_REJECTED')),
  "refundRequestReason" TEXT,
  "refundRequestNote" TEXT,
  "refundRequestedAt" TEXT,
  "refundReviewedAt" TEXT,
  "customerName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "message" TEXT,
  "deliveryType" TEXT CHECK ("deliveryType" IN ('ONSITE', 'PICKUP', 'TOUR')),
  "pickupPointId" INTEGER,
  "deliveryTourId" INTEGER,
  "deliveryAddress" TEXT,
  "deliveryCity" TEXT,
  "deliveryPostalCode" TEXT,
  "rentalStartDate" TEXT,
  "rentalEndDate" TEXT,
  "fulfillmentDate" TEXT,
  "fulfillmentTime" TEXT,
  "fulfillmentLocation" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'eur',
  "subtotal" NUMERIC NOT NULL DEFAULT 0,
  "total" NUMERIC NOT NULL DEFAULT 0,
  "checkoutUrl" TEXT,
  "paidAt" TEXT,
  "refundedAt" TEXT,
  "cancelledAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL,
  FOREIGN KEY ("deliveryTourId") REFERENCES "DeliveryTour" ("id") ON DELETE SET NULL,
  FOREIGN KEY ("pickupPointId") REFERENCES "PickupPoint" ("id") ON DELETE SET NULL,
  FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL
);

INSERT INTO "ShopOrder__new" (
  "id", "orderNumber", "userId", "language", "status", "paymentProvider", "paymentStatus",
  "providerSessionId", "providerPaymentIntentId", "providerPaymentStatus", "providerLastEventId", "paymentFailureReason",
  "afterSalesStatus", "refundRequestReason", "refundRequestNote", "refundRequestedAt", "refundReviewedAt",
  "customerName", "email", "phone", "message", "deliveryType", "pickupPointId", "deliveryTourId",
  "deliveryAddress", "deliveryCity", "deliveryPostalCode", "rentalStartDate", "rentalEndDate",
  "fulfillmentDate", "fulfillmentTime", "fulfillmentLocation", "currency", "subtotal", "total",
  "checkoutUrl", "paidAt", "refundedAt", "cancelledAt", "createdAt", "updatedAt"
)
SELECT
  "id",
  "orderNumber",
  "userId",
  COALESCE("language", 'fr'),
  CASE
    WHEN "status" = 'CANCELLED' THEN 'CANCELLED'
    WHEN "paymentStatus" = 'REFUNDED' THEN 'CANCELLED'
    WHEN "status" = 'PAID' THEN 'CONFIRMED'
    ELSE COALESCE("status", 'PENDING')
  END,
  "paymentProvider",
  "paymentStatus",
  "providerSessionId",
  "providerPaymentIntentId",
  "providerPaymentStatus",
  "providerLastEventId",
  "paymentFailureReason",
  'NONE',
  NULL,
  NULL,
  NULL,
  NULL,
  "customerName",
  "email",
  "phone",
  "message",
  "deliveryType",
  "pickupPointId",
  "deliveryTourId",
  "deliveryAddress",
  "deliveryCity",
  "deliveryPostalCode",
  "rentalStartDate",
  "rentalEndDate",
  "fulfillmentDate",
  "fulfillmentTime",
  "fulfillmentLocation",
  "currency",
  "subtotal",
  "total",
  "checkoutUrl",
  "paidAt",
  "refundedAt",
  "cancelledAt",
  "createdAt",
  "updatedAt"
FROM "ShopOrder";

DROP TABLE "ShopOrder";

ALTER TABLE "ShopOrder__new" RENAME TO "ShopOrder";

CREATE INDEX IF NOT EXISTS "ShopOrder_status_createdAt_idx" ON "ShopOrder" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "ShopOrder_paymentStatus_createdAt_idx" ON "ShopOrder" ("paymentStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "ShopOrder_status_rentalStartDate_idx" ON "ShopOrder" ("status", "rentalStartDate");
CREATE INDEX IF NOT EXISTS "ShopOrder_userId_idx" ON "ShopOrder" ("userId");
CREATE INDEX IF NOT EXISTS "ShopOrder_pickupPointId_idx" ON "ShopOrder" ("pickupPointId");
CREATE INDEX IF NOT EXISTS "ShopOrder_deliveryTourId_idx" ON "ShopOrder" ("deliveryTourId");
