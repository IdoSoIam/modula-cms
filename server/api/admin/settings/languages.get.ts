import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getSiteDefaultLocale, getSiteLocales, getLlmApiKey, getSiteLocaleLabels } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const [siteLocales, siteDefaultLocale, siteLlmApiKey, localeLabels] = await Promise.all([
    getSiteLocales(),
    getSiteDefaultLocale(),
    getLlmApiKey(),
    getSiteLocaleLabels()
  ])
  return { siteLocales, siteDefaultLocale, siteLlmApiKey, localeLabels }
})
