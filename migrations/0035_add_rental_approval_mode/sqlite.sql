-- 0035_add_rental_approval_mode (sqlite)
--
-- Diff summary:
-- Product: field added: rentalApprovalMode

ALTER TABLE "Product" ADD COLUMN "rentalApprovalMode" TEXT NOT NULL DEFAULT 'AUTO'
  CHECK ("rentalApprovalMode" IN ('AUTO', 'MANUAL'));
