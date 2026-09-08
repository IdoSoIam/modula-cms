-- 0038_add_rental_deposits (d1)
--
-- Diff summary:
-- Added models: RentalDeposit
-- Product: field added: rentalDepositAllowOnlinePayment; field added: rentalDepositAllowOnsitePayment; field added: rentalDepositAmount

ALTER TABLE "Product" ADD COLUMN "rentalDepositAmount" REAL;
ALTER TABLE "Product" ADD COLUMN "rentalDepositAllowOnsitePayment" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Product" ADD COLUMN "rentalDepositAllowOnlinePayment" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "RentalDeposit" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "orderId" INTEGER NOT NULL,
  "amount" REAL NOT NULL DEFAULT 0,
  "paymentMode" TEXT NOT NULL DEFAULT 'ONSITE',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "providerSessionId" TEXT,
  "providerPaymentIntentId" TEXT,
  "providerPaymentStatus" TEXT,
  "failureReason" TEXT,
  "paidAt" TEXT,
  "releasedAt" TEXT,
  "retainedAmount" REAL NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL,
  CONSTRAINT "RentalDeposit_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "ShopOrder" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "RentalDeposit_orderId_key" ON "RentalDeposit" ("orderId");
CREATE UNIQUE INDEX "RentalDeposit_providerSessionId_key" ON "RentalDeposit" ("providerSessionId");
CREATE UNIQUE INDEX "RentalDeposit_providerPaymentIntentId_key" ON "RentalDeposit" ("providerPaymentIntentId");
CREATE INDEX "RentalDeposit_status_createdAt_idx" ON "RentalDeposit" ("status", "createdAt");
