ALTER TABLE BillingDocumentTemplate ADD COLUMN brandName TEXT;
ALTER TABLE BillingDocumentTemplate ADD COLUMN logoUrl TEXT;
ALTER TABLE BillingDocumentTemplate ADD COLUMN accentColor TEXT;

CREATE TABLE BillingDocumentTemplate__tmp (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL DEFAULT 'CONTRACT' CHECK (kind IN ('INVOICE', 'CONTRACT', 'ASSURANCE')),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  brandName TEXT,
  logoUrl TEXT,
  accentColor TEXT,
  titleJson TEXT NOT NULL DEFAULT '{"fr":"","en":""}',
  contentJson TEXT NOT NULL DEFAULT '{"fr":"","en":""}',
  footerJson TEXT NOT NULL DEFAULT '{"fr":"","en":""}',
  active INTEGER NOT NULL DEFAULT 1,
  isDefault INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT NOT NULL
);

INSERT INTO BillingDocumentTemplate__tmp (
  id,
  kind,
  slug,
  name,
  description,
  brandName,
  logoUrl,
  accentColor,
  titleJson,
  contentJson,
  footerJson,
  active,
  isDefault,
  position,
  createdAt,
  updatedAt
)
SELECT
  id,
  CASE
    WHEN kind IN ('INVOICE', 'CONTRACT', 'ASSURANCE') THEN kind
    ELSE 'CONTRACT'
  END,
  slug,
  name,
  description,
  brandName,
  logoUrl,
  accentColor,
  titleJson,
  contentJson,
  footerJson,
  active,
  isDefault,
  position,
  createdAt,
  updatedAt
FROM BillingDocumentTemplate;

DROP TABLE BillingDocumentTemplate;
ALTER TABLE BillingDocumentTemplate__tmp RENAME TO BillingDocumentTemplate;

CREATE UNIQUE INDEX BillingDocumentTemplate_slug_key ON BillingDocumentTemplate (slug);
CREATE INDEX BillingDocumentTemplate_kind_active_position_idx
  ON BillingDocumentTemplate (kind, active, position);
CREATE INDEX BillingDocumentTemplate_kind_isDefault_idx
  ON BillingDocumentTemplate (kind, isDefault);
