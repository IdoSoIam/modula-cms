-- 0050_add_product_category_fields (sqlite)
--
-- Diff summary:
-- ProductCategory: field added: fieldsJson

ALTER TABLE "ProductCategory" ADD COLUMN "fieldsJson" TEXT NOT NULL DEFAULT '[]';

UPDATE "ProductCategory"
SET "fieldsJson" = '[{"key":"capacity","label":"Capacité maximale","type":"NUMBER","required":true,"purpose":"RENTAL_PARTY_CAPACITY"}]'
WHERE "slug" = 'boat';
