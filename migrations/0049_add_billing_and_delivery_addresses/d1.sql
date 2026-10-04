-- 0049_add_billing_and_delivery_addresses (d1)
--
-- Diff summary:
-- ShopOrder: field added: billingAddress; field added: billingCity; field added: billingCountry; field added: billingPostalCode; field added: deliveryCountry
-- User: field added: billingCity; field added: billingCountry; field added: billingPostalCode; field added: billingStreet

ALTER TABLE "User" ADD COLUMN "billingStreet" TEXT;
ALTER TABLE "User" ADD COLUMN "billingCity" TEXT;
ALTER TABLE "User" ADD COLUMN "billingPostalCode" TEXT;
ALTER TABLE "User" ADD COLUMN "billingCountry" TEXT;

ALTER TABLE "ShopOrder" ADD COLUMN "deliveryCountry" TEXT;
ALTER TABLE "ShopOrder" ADD COLUMN "billingAddress" TEXT;
ALTER TABLE "ShopOrder" ADD COLUMN "billingCity" TEXT;
ALTER TABLE "ShopOrder" ADD COLUMN "billingPostalCode" TEXT;
ALTER TABLE "ShopOrder" ADD COLUMN "billingCountry" TEXT;
