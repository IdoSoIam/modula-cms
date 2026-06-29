import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { normalizeFeatureFlags, normalizeVatRate, saveShopDefaultVatRate, saveSiteLocales, setSetting, SETTING_KEYS } from '#modula/server/utils/settings'
import { findAdminEmailTemplateDefinition } from '#modula/server/utils/adminEmailTemplates'
import { savePublicDictionary } from '#modula/server/utils/publicDictionary'
import type { CmsLocalizedText } from '#modula/shared/cms'

interface Body {
  gmailSenderEmail?: string
  resendSenderEmail?: string
  reservationNotificationEmail?: string
  contactEmail?: string
  adminPhone?: string
  resendApiKey?: string
  mailPrimaryProvider?: 'gmail' | 'resend'
  mailSecondaryProvider?: 'gmail' | 'resend'
  googleCalendarId?: string
  googleCalendarName?: string
  inDevelopment?: boolean
  registerEnabled?: boolean
  subscriptionsEnabled?: boolean
  onlinePaymentsEnabled?: boolean
  featureFlags?: {
    inDevelopment?: boolean
    registerEnabled?: boolean
    subscriptionsEnabled?: boolean
    onlinePaymentsEnabled?: boolean
    shop?: {
      enabled?: boolean
      basketsEnabled?: boolean
      vegetablesEnabled?: boolean
    }
    associationRolesEnabled?: boolean
    eventsEnabled?: boolean
    newsEnabled?: boolean
  }
  farmPickupAddress?: string
  farmPickupDayOfWeek?: number
  farmPickupStartTime?: string
  farmPickupEndTime?: string
  ordersOpenFrom?: string
  ordersOpenTo?: string
  ordersClosedMessage?: string
  imagePersistVariants?: boolean
  shopDefaultVatRate?: number
  siteLocales?: string[]
  siteDefaultLocale?: string
  localeLabels?: Record<string, { short: string; long: string }>
  publicDictionary?: Record<string, CmsLocalizedText>
  templates?: Record<string, Record<string, { subject: string; body: string } | undefined>>
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<Body>(event)
  const resolvedInDevelopment = typeof body.inDevelopment === 'boolean'
    ? body.inDevelopment
    : body.featureFlags?.inDevelopment ?? false
  const resolvedRegisterEnabled = typeof body.registerEnabled === 'boolean'
    ? body.registerEnabled
    : body.featureFlags?.registerEnabled ?? false
  const resolvedSubscriptionsEnabled = typeof body.subscriptionsEnabled === 'boolean'
    ? body.subscriptionsEnabled
    : body.featureFlags?.subscriptionsEnabled ?? false
  const resolvedOnlinePaymentsEnabled = typeof body.onlinePaymentsEnabled === 'boolean'
    ? body.onlinePaymentsEnabled
    : body.featureFlags?.onlinePaymentsEnabled ?? true
  const featureFlags = normalizeFeatureFlags({
    inDevelopment: resolvedInDevelopment,
    registerEnabled: resolvedRegisterEnabled,
    subscriptionsEnabled: resolvedSubscriptionsEnabled,
    onlinePaymentsEnabled: resolvedOnlinePaymentsEnabled,
    shop: {
      enabled: body.featureFlags?.shop?.enabled ?? false,
      basketsEnabled: body.featureFlags?.shop?.basketsEnabled ?? false,
      vegetablesEnabled: body.featureFlags?.shop?.vegetablesEnabled ?? false
    },
    associationRolesEnabled: body.featureFlags?.associationRolesEnabled ?? false,
    eventsEnabled: body.featureFlags?.eventsEnabled ?? false,
    newsEnabled: body.featureFlags?.newsEnabled ?? false
  })

  if (typeof body.gmailSenderEmail === 'string') {
    await setSetting(SETTING_KEYS.GMAIL_SENDER_EMAIL, body.gmailSenderEmail.trim())
  }
  if (typeof body.resendSenderEmail === 'string') {
    await setSetting(SETTING_KEYS.RESEND_FROM_EMAIL, body.resendSenderEmail.trim())
    await setSetting(SETTING_KEYS.MAIL_SENDER_EMAIL, body.resendSenderEmail.trim())
  }
  if (typeof body.reservationNotificationEmail === 'string') {
    await setSetting(SETTING_KEYS.RESERVATION_NOTIFICATION_EMAIL, body.reservationNotificationEmail.trim())
    await setSetting(SETTING_KEYS.ADMIN_EMAIL, body.reservationNotificationEmail.trim())
  }
  if (typeof body.contactEmail === 'string') {
    await setSetting(SETTING_KEYS.CONTACT_EMAIL, body.contactEmail.trim())
  }
  if (typeof body.adminPhone === 'string') {
    await setSetting(SETTING_KEYS.ADMIN_PHONE, body.adminPhone.trim())
  }
  if (typeof body.resendApiKey === 'string') {
    await setSetting(SETTING_KEYS.RESEND_API_KEY, body.resendApiKey.trim())
  }
  if (body.mailPrimaryProvider === 'gmail' || body.mailPrimaryProvider === 'resend') {
    await setSetting(SETTING_KEYS.MAIL_PRIMARY_PROVIDER, body.mailPrimaryProvider)
  }
  if (body.mailSecondaryProvider === 'gmail' || body.mailSecondaryProvider === 'resend') {
    await setSetting(SETTING_KEYS.MAIL_SECONDARY_PROVIDER, body.mailSecondaryProvider)
  }
  if (typeof body.googleCalendarId === 'string') {
    await setSetting(SETTING_KEYS.GOOGLE_CALENDAR_ID, body.googleCalendarId.trim())
  }
  if (typeof body.googleCalendarName === 'string') {
    await setSetting(SETTING_KEYS.GOOGLE_CALENDAR_NAME, body.googleCalendarName.trim())
  }
  if (typeof body.inDevelopment === 'boolean' || typeof body.featureFlags?.inDevelopment === 'boolean') {
    await setSetting(SETTING_KEYS.IN_DEVELOPMENT, featureFlags.inDevelopment ? 'true' : 'false')
  }
  if (typeof body.registerEnabled === 'boolean' || typeof body.featureFlags?.registerEnabled === 'boolean') {
    await setSetting(SETTING_KEYS.REGISTER_ENABLED, featureFlags.registerEnabled ? 'true' : 'false')
  }
  if (typeof body.subscriptionsEnabled === 'boolean' || typeof body.featureFlags?.subscriptionsEnabled === 'boolean') {
    await setSetting(SETTING_KEYS.SUBSCRIPTIONS_ENABLED, featureFlags.subscriptionsEnabled ? 'true' : 'false')
  }
  if (typeof body.onlinePaymentsEnabled === 'boolean' || typeof body.featureFlags?.onlinePaymentsEnabled === 'boolean') {
    await setSetting(SETTING_KEYS.PAYMENTS_ENABLED, featureFlags.onlinePaymentsEnabled ? 'true' : 'false')
  }
  if (typeof body.featureFlags?.shop?.enabled === 'boolean' || typeof body.featureFlags?.shop?.basketsEnabled === 'boolean' || typeof body.featureFlags?.shop?.vegetablesEnabled === 'boolean') {
    await setSetting(SETTING_KEYS.SHOP_ENABLED, featureFlags.shop.enabled ? 'true' : 'false')
    await setSetting(SETTING_KEYS.SHOP_BASKETS_ENABLED, featureFlags.shop.basketsEnabled ? 'true' : 'false')
    await setSetting(SETTING_KEYS.SHOP_VEGETABLES_ENABLED, featureFlags.shop.vegetablesEnabled ? 'true' : 'false')
  }
  if (typeof body.featureFlags?.associationRolesEnabled === 'boolean') {
    await setSetting(SETTING_KEYS.ASSOCIATION_ROLES_ENABLED, featureFlags.associationRolesEnabled ? 'true' : 'false')
  }
  if (typeof body.featureFlags?.eventsEnabled === 'boolean') {
    await setSetting(SETTING_KEYS.EVENTS_ENABLED, featureFlags.eventsEnabled ? 'true' : 'false')
  }
  if (typeof body.featureFlags?.newsEnabled === 'boolean') {
    await setSetting(SETTING_KEYS.NEWS_ENABLED, featureFlags.newsEnabled ? 'true' : 'false')
  }
  if (typeof body.farmPickupAddress === 'string') {
    await setSetting(SETTING_KEYS.FARM_PICKUP_ADDRESS, body.farmPickupAddress.trim())
  }
  if (typeof body.farmPickupDayOfWeek === 'number') {
    await setSetting(SETTING_KEYS.FARM_PICKUP_DAY_OF_WEEK, String(body.farmPickupDayOfWeek))
  }
  if (typeof body.farmPickupStartTime === 'string') {
    await setSetting(SETTING_KEYS.FARM_PICKUP_START_TIME, body.farmPickupStartTime.trim())
  }
  if (typeof body.farmPickupEndTime === 'string') {
    await setSetting(SETTING_KEYS.FARM_PICKUP_END_TIME, body.farmPickupEndTime.trim())
  }
  if (typeof body.ordersOpenFrom === 'string') {
    await setSetting(SETTING_KEYS.ORDERS_OPEN_FROM, body.ordersOpenFrom.trim())
  }
  if (typeof body.ordersOpenTo === 'string') {
    await setSetting(SETTING_KEYS.ORDERS_OPEN_TO, body.ordersOpenTo.trim())
  }
  if (typeof body.ordersClosedMessage === 'string') {
    await setSetting(SETTING_KEYS.ORDERS_CLOSED_MESSAGE, body.ordersClosedMessage.trim())
  }
  if (typeof body.imagePersistVariants === 'boolean') {
    await setSetting(SETTING_KEYS.IMAGE_PERSIST_VARIANTS, body.imagePersistVariants ? 'true' : 'false')
  }
  if (body.shopDefaultVatRate !== undefined) {
    const vatRate = Number(body.shopDefaultVatRate)
    if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
      throw createError({ statusCode: 400, statusMessage: 'Taux de TVA invalide' })
    }
    await saveShopDefaultVatRate(normalizeVatRate(vatRate, 20))
  }
  if (body.siteLocales) {
    const normalizedLocales = body.siteLocales
      .map(l => String(l || '').trim().toLowerCase())
      .filter((l, i, arr) => l && arr.indexOf(l) === i)
    if (normalizedLocales.length < 1) {
      throw createError({ statusCode: 400, statusMessage: 'Le site doit avoir au moins une langue active.' })
    }
    await saveSiteLocales(body.siteLocales, body.siteDefaultLocale)
  }
  if (body.localeLabels) {
    await setSetting(SETTING_KEYS.SITE_LOCALE_LABELS, JSON.stringify(body.localeLabels))
  }
  if (body.publicDictionary) {
    await savePublicDictionary(body.publicDictionary)
  }
  if (body.templates) {
    for (const [action, locales] of Object.entries(body.templates)) {
      const templateDefinition = await findAdminEmailTemplateDefinition(action)
      if (!templateDefinition) continue
      const value: Record<string, { subject: string; body: string }> = {}
      for (const [localeCode, template] of Object.entries(locales || {})) {
        if (!template) continue
        value[String(localeCode || '').trim().toLowerCase()] = {
          subject: String(template.subject || ''),
          body: String(template.body || '')
        }
      }
      if (Object.keys(value).length) {
        await setSetting(templateDefinition.settingKey, JSON.stringify(value))
      }
    }
  }
  return { ok: true }
})
