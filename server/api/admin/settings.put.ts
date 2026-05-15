import { requireAdmin } from '~/server/utils/requireAdmin'
import { setSetting, SETTING_KEYS } from '~/server/utils/settings'
import { findAdminEmailTemplateDefinition } from '~/server/utils/adminEmailTemplates'

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
  facebookFluxDeactivated?: boolean
  inDevelopment?: boolean
  registerEnabled?: boolean
  subscriptionsEnabled?: boolean
  farmPickupAddress?: string
  farmPickupDayOfWeek?: number
  farmPickupStartTime?: string
  farmPickupEndTime?: string
  ordersOpenFrom?: string
  ordersOpenTo?: string
  ordersClosedMessage?: string
  templates?: Record<string, { fr?: { subject: string; body: string }; en?: { subject: string; body: string } }>
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<Body>(event)

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
  if (typeof body.facebookFluxDeactivated === 'boolean') {
    await setSetting(SETTING_KEYS.FACEBOOK_FLUX_DEACTIVATED, body.facebookFluxDeactivated ? 'true' : 'false')
  }
  if (typeof body.inDevelopment === 'boolean') {
    await setSetting(SETTING_KEYS.IN_DEVELOPMENT, body.inDevelopment ? 'true' : 'false')
  }
  if (typeof body.registerEnabled === 'boolean') {
    await setSetting(SETTING_KEYS.REGISTER_ENABLED, body.registerEnabled ? 'true' : 'false')
  }
  if (typeof body.subscriptionsEnabled === 'boolean') {
    await setSetting(SETTING_KEYS.SUBSCRIPTIONS_ENABLED, body.subscriptionsEnabled ? 'true' : 'false')
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
  if (body.templates) {
    for (const [action, locales] of Object.entries(body.templates)) {
      const templateDefinition = await findAdminEmailTemplateDefinition(action)
      if (!templateDefinition) continue
      if (locales.fr || locales.en) {
        const value: Record<string, { subject: string; body: string }> = {}
        if (locales.fr) value.fr = locales.fr
        if (locales.en) value.en = locales.en
        await setSetting(templateDefinition.settingKey, JSON.stringify(value))
      }
    }
  }
  return { ok: true }
})
