-- 0037_add_cms_page_application_config (d1)
--
-- Diff summary:
-- CmsPage: field added: applicationConfigJson

ALTER TABLE "CmsPage" ADD COLUMN "applicationConfigJson" TEXT NOT NULL DEFAULT '{}';
