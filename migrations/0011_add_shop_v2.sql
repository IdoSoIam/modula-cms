CREATE TABLE IF NOT EXISTS "Product" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "excerpt" TEXT,
  "description" TEXT,
  "imageUrl" TEXT,
  "price" NUMERIC NOT NULL DEFAULT 0,
  "unitLabel" TEXT,
  "active" INTEGER NOT NULL DEFAULT 1,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "Product_active_position_idx" ON "Product" ("active", "position");

CREATE TABLE IF NOT EXISTS "ProductLot" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "imageUrl" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'LOT' CHECK ("kind" IN ('SINGLE', 'LOT')),
  "price" NUMERIC NOT NULL DEFAULT 0,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "active" INTEGER NOT NULL DEFAULT 1,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "ProductLot_active_position_idx" ON "ProductLot" ("active", "position");

CREATE TABLE IF NOT EXISTS "ProductLotItem" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "productLotId" INTEGER NOT NULL,
  "productId" INTEGER NOT NULL,
  "quantity" NUMERIC NOT NULL,
  FOREIGN KEY ("productLotId") REFERENCES "ProductLot" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "ProductLotItem_productLotId_idx" ON "ProductLotItem" ("productLotId");
CREATE INDEX IF NOT EXISTS "ProductLotItem_productId_idx" ON "ProductLotItem" ("productId");
CREATE UNIQUE INDEX IF NOT EXISTS "ProductLotItem_productLotId_productId_key" ON "ProductLotItem" ("productLotId", "productId");

CREATE TABLE IF NOT EXISTS "ShopOrder" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "orderNumber" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('DRAFT', 'PENDING', 'PAID', 'CANCELLED')),
  "paymentProvider" TEXT NOT NULL DEFAULT 'OFFLINE' CHECK ("paymentProvider" IN ('OFFLINE', 'STRIPE')),
  "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID' CHECK ("paymentStatus" IN ('UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  "stripeCheckoutSessionId" TEXT UNIQUE,
  "customerName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "message" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'eur',
  "subtotal" NUMERIC NOT NULL DEFAULT 0,
  "total" NUMERIC NOT NULL DEFAULT 0,
  "checkoutUrl" TEXT,
  "paidAt" TEXT,
  "cancelledAt" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS "ShopOrder_status_createdAt_idx" ON "ShopOrder" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "ShopOrder_paymentStatus_createdAt_idx" ON "ShopOrder" ("paymentStatus", "createdAt");

CREATE TABLE IF NOT EXISTS "ShopOrderLine" (
  "id" INTEGER PRIMARY KEY AUTOINCREMENT,
  "orderId" INTEGER NOT NULL,
  "productLotId" INTEGER,
  "productId" INTEGER,
  "title" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" NUMERIC NOT NULL DEFAULT 0,
  "totalPrice" NUMERIC NOT NULL DEFAULT 0,
  "metaJson" TEXT NOT NULL DEFAULT '{}',
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TEXT NOT NULL,
  FOREIGN KEY ("orderId") REFERENCES "ShopOrder" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("productLotId") REFERENCES "ProductLot" ("id") ON DELETE SET NULL,
  FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "ShopOrderLine_orderId_idx" ON "ShopOrderLine" ("orderId");
CREATE INDEX IF NOT EXISTS "ShopOrderLine_productLotId_idx" ON "ShopOrderLine" ("productLotId");
CREATE INDEX IF NOT EXISTS "ShopOrderLine_productId_idx" ON "ShopOrderLine" ("productId");

INSERT INTO "Product" ("id", "name", "slug", "excerpt", "description", "imageUrl", "price", "unitLabel", "active", "position", "createdAt", "updatedAt")
SELECT
  v."id",
  v."name",
  lower(replace(replace(replace(trim(v."name"), ' ', '-'), '''', ''), '\"', '')),
  NULL,
  NULL,
  v."imageUrl",
  v."price",
  CASE
    WHEN v."unit" = 'KG' THEN 'kg'
    ELSE 'piece'
  END,
  v."active",
  0,
  v."createdAt",
  v."updatedAt"
FROM "Vegetable" v
WHERE EXISTS (SELECT 1 FROM "Vegetable")
  AND NOT EXISTS (SELECT 1 FROM "Product");

INSERT INTO "ProductLot" ("id", "name", "slug", "description", "imageUrl", "kind", "price", "stock", "active", "position", "createdAt", "updatedAt")
SELECT
  b."id",
  b."name",
  lower(replace(replace(replace(trim(b."name"), ' ', '-'), '''', ''), '\"', '')),
  b."description",
  b."imageUrl",
  'LOT',
  b."finalPrice",
  b."available",
  b."active",
  b."position",
  b."createdAt",
  b."updatedAt"
FROM "Basket" b
WHERE EXISTS (SELECT 1 FROM "Basket")
  AND NOT EXISTS (SELECT 1 FROM "ProductLot");

INSERT INTO "ProductLotItem" ("id", "productLotId", "productId", "quantity")
SELECT
  bi."id",
  bi."basketId",
  bi."vegetableId",
  bi."quantity"
FROM "BasketItem" bi
WHERE EXISTS (SELECT 1 FROM "BasketItem")
  AND NOT EXISTS (SELECT 1 FROM "ProductLotItem");

INSERT INTO "ShopOrder" (
  "id", "orderNumber", "status", "paymentProvider", "paymentStatus", "customerName", "email", "phone", "message",
  "currency", "subtotal", "total", "paidAt", "cancelledAt", "createdAt", "updatedAt"
)
SELECT
  r."id",
  'RSV-' || printf('%06d', r."id"),
  CASE
    WHEN r."status" = 'CONFIRMED' THEN 'PAID'
    WHEN r."status" IN ('REJECTED', 'CANCELLED') THEN 'CANCELLED'
    ELSE 'PENDING'
  END,
  'OFFLINE',
  CASE
    WHEN r."status" = 'CONFIRMED' THEN 'PAID'
    WHEN r."status" IN ('REJECTED', 'CANCELLED') THEN 'FAILED'
    ELSE 'UNPAID'
  END,
  r."customerName",
  r."email",
  r."phone",
  r."message",
  'eur',
  COALESCE(b."finalPrice", 0),
  COALESCE(b."finalPrice", 0),
  r."confirmedAt",
  CASE WHEN r."status" IN ('REJECTED', 'CANCELLED') THEN r."updatedAt" ELSE NULL END,
  r."createdAt",
  r."updatedAt"
FROM "Reservation" r
LEFT JOIN "Basket" b ON b."id" = r."basketId"
WHERE EXISTS (SELECT 1 FROM "Reservation")
  AND NOT EXISTS (SELECT 1 FROM "ShopOrder");

INSERT INTO "ShopOrderLine" (
  "orderId", "productLotId", "title", "quantity", "unitPrice", "totalPrice", "metaJson", "createdAt", "updatedAt"
)
SELECT
  r."id",
  r."basketId",
  COALESCE(b."name", 'Produit'),
  1,
  COALESCE(b."finalPrice", 0),
  COALESCE(b."finalPrice", 0),
  '{}',
  r."createdAt",
  r."updatedAt"
FROM "Reservation" r
LEFT JOIN "Basket" b ON b."id" = r."basketId"
WHERE EXISTS (SELECT 1 FROM "Reservation")
  AND NOT EXISTS (SELECT 1 FROM "ShopOrderLine");
