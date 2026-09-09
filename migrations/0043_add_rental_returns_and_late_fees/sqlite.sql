-- 0043_add_rental_returns_and_late_fees (sqlite)
--
-- Diff summary:
-- Added models: RentalReturn
-- Product: field added: rentalLateFeeAmount; field added: rentalLateFeeEnabled; field added: rentalLateFeeGraceMinutes; field added: rentalLateFeeMaximum; field added: rentalLateFeeMinimum; field added: rentalLateFeeMode; field added: rentalLateFeeMultiplier; field added: rentalLateFeeVatRate

-- Adds configurable late-return rules to products and immutable return tracking.

ALTER TABLE "Product" ADD COLUMN "rentalLateFeeEnabled" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "rentalLateFeeMode" TEXT NOT NULL DEFAULT 'PER_HOUR_STARTED' CHECK ("rentalLateFeeMode" IN ('FIXED', 'PER_HOUR_STARTED', 'PER_DAY_STARTED', 'HOURLY_MULTIPLIER', 'DAILY_MULTIPLIER'));
ALTER TABLE "Product" ADD COLUMN "rentalLateFeeAmount" REAL;
ALTER TABLE "Product" ADD COLUMN "rentalLateFeeMultiplier" REAL;
ALTER TABLE "Product" ADD COLUMN "rentalLateFeeGraceMinutes" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN "rentalLateFeeMinimum" REAL;
ALTER TABLE "Product" ADD COLUMN "rentalLateFeeMaximum" REAL;
ALTER TABLE "Product" ADD COLUMN "rentalLateFeeVatRate" REAL;

CREATE TABLE "RentalReturn" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "orderId" INTEGER NOT NULL,
  "orderLineId" INTEGER NOT NULL,
  "productId" INTEGER,
  "actorUserId" INTEGER,
  "scheduledReturnAt" TEXT NOT NULL,
  "actualReturnAt" TEXT NOT NULL,
  "status" TEXT NOT NULL CHECK ("status" IN ('RETURNED_ON_TIME', 'RETURNED_LATE_PENDING', 'LATE_FEE_DUE', 'LATE_FEE_WAIVED', 'LATE_FEE_PAID')),
  "lateMinutes" INTEGER NOT NULL DEFAULT 0,
  "graceMinutes" INTEGER NOT NULL DEFAULT 0,
  "calculationMode" TEXT CHECK ("calculationMode" IS NULL OR "calculationMode" IN ('FIXED', 'PER_HOUR_STARTED', 'PER_DAY_STARTED', 'HOURLY_MULTIPLIER', 'DAILY_MULTIPLIER')),
  "configuredAmount" REAL,
  "baseRate" REAL,
  "multiplier" REAL,
  "minimumAmount" REAL,
  "maximumAmount" REAL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "subtotalExclTax" REAL NOT NULL DEFAULT 0,
  "vatRate" REAL NOT NULL DEFAULT 0,
  "vatAmount" REAL NOT NULL DEFAULT 0,
  "totalInclTax" REAL NOT NULL DEFAULT 0,
  "waiverReason" TEXT,
  "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID' CHECK ("paymentStatus" IN ('UNPAID', 'PAID', 'CANCELLED')),
  "paidAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL,
  CONSTRAINT "RentalReturn_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShopOrder" ("id") ON DELETE CASCADE,
  CONSTRAINT "RentalReturn_orderLineId_fkey" FOREIGN KEY ("orderLineId") REFERENCES "ShopOrderLine" ("id") ON DELETE CASCADE,
  CONSTRAINT "RentalReturn_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL,
  CONSTRAINT "RentalReturn_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX "RentalReturn_orderLineId_key" ON "RentalReturn" ("orderLineId");
CREATE INDEX "RentalReturn_orderId_status_idx" ON "RentalReturn" ("orderId", "status");
CREATE INDEX "RentalReturn_status_actualReturnAt_idx" ON "RentalReturn" ("status", "actualReturnAt");
CREATE INDEX "RentalReturn_productId_idx" ON "RentalReturn" ("productId");
CREATE INDEX "RentalReturn_actorUserId_idx" ON "RentalReturn" ("actorUserId");
