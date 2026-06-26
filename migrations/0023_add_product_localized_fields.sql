ALTER TABLE "Product" ADD COLUMN "nameJson" TEXT NOT NULL DEFAULT '{"fr":"","en":""}';
ALTER TABLE "Product" ADD COLUMN "excerptJson" TEXT NOT NULL DEFAULT '{"fr":"","en":""}';
ALTER TABLE "Product" ADD COLUMN "descriptionJson" TEXT NOT NULL DEFAULT '{"fr":"","en":""}';
ALTER TABLE "Product" ADD COLUMN "unitLabelJson" TEXT NOT NULL DEFAULT '{"fr":"","en":""}';

UPDATE "Product"
SET
  "nameJson" = json_object('fr', COALESCE("name", ''), 'en', COALESCE("name", '')),
  "excerptJson" = json_object('fr', COALESCE("excerpt", ''), 'en', COALESCE("excerpt", '')),
  "descriptionJson" = json_object('fr', COALESCE("description", ''), 'en', COALESCE("description", '')),
  "unitLabelJson" = json_object('fr', COALESCE("unitLabel", ''), 'en', COALESCE("unitLabel", ''));
