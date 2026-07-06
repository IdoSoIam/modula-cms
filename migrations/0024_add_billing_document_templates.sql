CREATE TABLE "BillingDocumentTemplate" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "kind" TEXT NOT NULL DEFAULT 'CONTRACT',
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "titleJson" TEXT NOT NULL DEFAULT '{"fr":"","en":""}',
  "contentJson" TEXT NOT NULL DEFAULT '{"fr":"","en":""}',
  "footerJson" TEXT NOT NULL DEFAULT '{"fr":"","en":""}',
  "active" INTEGER NOT NULL DEFAULT 1,
  "isDefault" INTEGER NOT NULL DEFAULT 0,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "BillingDocumentTemplate_slug_key"
ON "BillingDocumentTemplate"("slug");

CREATE INDEX "BillingDocumentTemplate_kind_active_position_idx"
ON "BillingDocumentTemplate"("kind", "active", "position");

CREATE INDEX "BillingDocumentTemplate_kind_isDefault_idx"
ON "BillingDocumentTemplate"("kind", "isDefault");
