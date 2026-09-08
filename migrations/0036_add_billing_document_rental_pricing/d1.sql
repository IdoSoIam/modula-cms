-- 0036_add_billing_document_rental_pricing (d1)
--
-- Diff summary:
-- BillingDocumentTemplate: field added: rentalDailyPrice; field added: rentalHourlyPrice; field added: requiredForRental

ALTER TABLE "BillingDocumentTemplate" ADD COLUMN "rentalHourlyPrice" REAL;
ALTER TABLE "BillingDocumentTemplate" ADD COLUMN "rentalDailyPrice" REAL;
ALTER TABLE "BillingDocumentTemplate" ADD COLUMN "requiredForRental" INTEGER NOT NULL DEFAULT 0;
