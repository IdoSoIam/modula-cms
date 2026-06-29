import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getSiteDefaultLocale, getSiteLocales, getSiteLocaleLabels } from '#modula/server/utils/settings'
import { getAdminPublicDictionary } from '#modula/server/utils/publicDictionary'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const [siteLocales, siteDefaultLocale, localeLabels] = await Promise.all([
    getSiteLocales(),
    getSiteDefaultLocale(),
    getSiteLocaleLabels()
  ])
  const publicDictionary = await getAdminPublicDictionary(siteLocales)
  return { siteLocales, siteDefaultLocale, localeLabels, publicDictionary }
})
