-- 0037_add_cms_page_application_config (sqlite)
--
-- Diff summary:
-- CmsPage: field added: applicationConfigJson

ALTER TABLE "CmsPage" ADD COLUMN "applicationConfigJson" TEXT NOT NULL DEFAULT '{}';
