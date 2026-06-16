import type { CmsDbDriver, CmsStorageDriver } from '#modula/shared/platform'
import { bootstrapCmsInstallation, getCmsInstallStatus } from '#modula/server/utils/install'
import { FALLBACK_SITE_TEMPLATE_KEY, isCmsSiteTemplateKey, type CmsSiteTemplateKey } from '#modula/shared/siteTemplates'

interface InstallBody {
  siteName?: string
  taglineFr?: string
  taglineEn?: string
  defaultLocale?: 'fr' | 'en'
  dbDriver?: CmsDbDriver
  storageDriver?: CmsStorageDriver
  adminEmail?: string
  adminPassword?: string
  adminFirstName?: string
  adminLastName?: string
  siteTemplate?: CmsSiteTemplateKey
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')

  const status = await getCmsInstallStatus()
  if (status.installed) {
    throw createError({ statusCode: 409, statusMessage: 'Installation already completed', message: 'L’installation est déjà terminée.' })
  }

  const body = await readBody<InstallBody>(event)
  const siteName = body.siteName?.trim() || ''
  const defaultLocale = body.defaultLocale === 'en' ? 'en' : 'fr'
  const dbDriver = 'sqlite'
  const storageDriver = 'fs'
  const siteTemplate = isCmsSiteTemplateKey(body.siteTemplate) ? body.siteTemplate : FALLBACK_SITE_TEMPLATE_KEY
  const adminEmail = body.adminEmail?.trim().toLowerCase() || ''
  const adminPassword = body.adminPassword?.trim() || ''

  if (!siteName) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid installation payload', message: 'Le nom du site est requis.' })
  }
  if (!adminEmail) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid installation payload', message: 'L’email administrateur est requis.' })
  }
  if (adminPassword.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid installation payload', message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  }

  try {
    return await bootstrapCmsInstallation(event, {
      siteName,
      taglineFr: body.taglineFr?.trim(),
      taglineEn: body.taglineEn?.trim(),
      defaultLocale,
      dbDriver,
      storageDriver,
      adminEmail,
      adminPassword,
      adminFirstName: body.adminFirstName?.trim(),
      adminLastName: body.adminLastName?.trim(),
      siteTemplate
    })
  } catch (error: any) {
    if (error?.statusCode) {
      throw error
    }

    if (error?.code === 'P2002') {
      throw createError({ statusCode: 409, statusMessage: 'Duplicate resource', message: 'Cet email existe déjà.' })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Installation failed',
      message: error?.message || error?.data?.message || 'Impossible de terminer l’installation.'
    })
  }
})
