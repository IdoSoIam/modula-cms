PRAGMA foreign_keys = OFF;

DROP INDEX IF EXISTS "ShopOrderLine_productLotId_idx";
DROP INDEX IF EXISTS "ShopOrderLine_productLotId_rentalStartDate_idx";

ALTER TABLE "ShopOrderLine" RENAME TO "ShopOrderLine__old_0027";

CREATE TABLE "ShopOrderLine" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "orderId" INTEGER NOT NULL,
  "productId" INTEGER,
  "title" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" NUMERIC NOT NULL DEFAULT 0,
  "totalPrice" NUMERIC NOT NULL DEFAULT 0,
  "rentalStartDate" TEXT,
  "rentalEndDate" TEXT,
  "metaJson" TEXT NOT NULL DEFAULT '{}',
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL,
  FOREIGN KEY ("orderId") REFERENCES "ShopOrder" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL
);

INSERT INTO "ShopOrderLine" (
  "id",
  "orderId",
  "productId",
  "title",
  "quantity",
  "unitPrice",
  "totalPrice",
  "rentalStartDate",
  "rentalEndDate",
  "metaJson",
  "createdAt",
  "updatedAt"
)
SELECT
  "id",
  "orderId",
  "productId",
  "title",
  "quantity",
  "unitPrice",
  "totalPrice",
  "rentalStartDate",
  "rentalEndDate",
  "metaJson",
  "createdAt",
  "updatedAt"
FROM "ShopOrderLine__old_0027";

DROP TABLE "ShopOrderLine__old_0027";

CREATE INDEX IF NOT EXISTS "ShopOrderLine_orderId_idx" ON "ShopOrderLine" ("orderId");
CREATE INDEX IF NOT EXISTS "ShopOrderLine_productId_idx" ON "ShopOrderLine" ("productId");
CREATE INDEX IF NOT EXISTS "ShopOrderLine_productId_rentalStartDate_idx" ON "ShopOrderLine" ("productId", "rentalStartDate");

DROP TABLE IF EXISTS "ProductLotItem";
DROP TABLE IF EXISTS "ProductLot";

PRAGMA foreign_keys = ON;
