-- 0042_rental_deposit_actions (d1)
--
-- Diff summary:
-- Added models: RentalDepositAction

CREATE TABLE "RentalDepositAction" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "depositId" INTEGER NOT NULL,
  "actorUserId" INTEGER,
  "action" TEXT NOT NULL CHECK ("action" IN ('MARKED_PAID', 'RELEASED', 'PARTIALLY_RETAINED', 'RETAINED')),
  "releasedAmount" REAL NOT NULL DEFAULT 0,
  "retainedAmount" REAL NOT NULL DEFAULT 0,
  "note" TEXT,
  "providerReference" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL,
  CONSTRAINT "RentalDepositAction_depositId_fkey" FOREIGN KEY ("depositId") REFERENCES "RentalDeposit" ("id") ON DELETE CASCADE,
  CONSTRAINT "RentalDepositAction_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL
);

CREATE INDEX "RentalDepositAction_depositId_createdAt_idx" ON "RentalDepositAction" ("depositId", "createdAt");
CREATE INDEX "RentalDepositAction_actorUserId_idx" ON "RentalDepositAction" ("actorUserId");
