ALTER TABLE "BillingDocumentTemplate"
ADD COLUMN "invoiceOptionsJson" TEXT NOT NULL DEFAULT '{"showDeliveryMethod":true}';
