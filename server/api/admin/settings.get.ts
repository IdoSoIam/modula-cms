import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { getAdminPhone, getContactEmail, getGmailSenderEmail, getReservationNotificationEmail, getResendSenderEmail, getSettings, SETTING_KEYS, getFeatureFlags, getFarmPickupConfig } from '#modula/server/utils/settings'
import { listGoogleCalendars } from '#modula/server/utils/gmail'
import { getAllAdminEmailTemplateDefinitions } from '#modula/server/utils/adminEmailTemplates'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const allSettingKeys = [
    SETTING_KEYS.ADMIN_EMAIL,
    SETTING_KEYS.MAIL_SENDER_EMAIL,
    SETTING_KEYS.GMAIL_SENDER_EMAIL,
    SETTING_KEYS.RESERVATION_NOTIFICATION_EMAIL,
    SETTING_KEYS.CONTACT_EMAIL,
    SETTING_KEYS.ADMIN_PHONE,
    SETTING_KEYS.GMAIL_CONNECTED_EMAIL,
    SETTING_KEYS.RESEND_API_KEY,
    SETTING_KEYS.RESEND_FROM_EMAIL,
    SETTING_KEYS.MAIL_PRIMARY_PROVIDER,
    SETTING_KEYS.MAIL_SECONDARY_PROVIDER,
    SETTING_KEYS.GOOGLE_CALENDAR_ID,
    SETTING_KEYS.GOOGLE_CALENDAR_NAME,
    SETTING_KEYS.IN_DEVELOPMENT,
    SETTING_KEYS.ORDERS_OPEN_FROM,
    SETTING_KEYS.ORDERS_OPEN_TO,
    SETTING_KEYS.ORDERS_CLOSED_MESSAGE,
    SETTING_KEYS.REGISTER_ENABLED,
    SETTING_KEYS.SUBSCRIPTIONS_ENABLED,
    SETTING_KEYS.SHOP_ENABLED,
    SETTING_KEYS.SHOP_BASKETS_ENABLED,
    SETTING_KEYS.SHOP_VEGETABLES_ENABLED,
    SETTING_KEYS.ASSOCIATION_ROLES_ENABLED,
    SETTING_KEYS.EVENTS_ENABLED,
    SETTING_KEYS.NEWS_ENABLED,
    SETTING_KEYS.FARM_PICKUP_ADDRESS,
    SETTING_KEYS.FARM_PICKUP_DAY_OF_WEEK,
    SETTING_KEYS.FARM_PICKUP_START_TIME,
    SETTING_KEYS.FARM_PICKUP_END_TIME,
    SETTING_KEYS.FARM_PICKUP_TIME
  ]
  const s = await getSettings(allSettingKeys)
  const [featureFlags, farmPickup, gmailSenderEmail, resendSenderEmail, reservationNotificationEmail, contactEmail, adminPhone] = await Promise.all([
    getFeatureFlags(),
    getFarmPickupConfig(),
    getGmailSenderEmail(),
    getResendSenderEmail(),
    getReservationNotificationEmail(),
    getContactEmail(),
    getAdminPhone()
  ])

  let googleCalendars: Array<{ id: string; summary: string; primary: boolean; accessRole: string }> = []
  if (s[SETTING_KEYS.GMAIL_CONNECTED_EMAIL]) {
    try {
      googleCalendars = await listGoogleCalendars()
    } catch (error) {
      console.error('Unable to load Google calendars:', error)
    }
  }

  return {
    gmailSenderEmail: gmailSenderEmail ?? '',
    resendSenderEmail: resendSenderEmail ?? '',
    reservationNotificationEmail: reservationNotificationEmail ?? '',
    contactEmail: contactEmail ?? '',
    adminPhone: adminPhone ?? '',
    gmailConnectedEmail: s[SETTING_KEYS.GMAIL_CONNECTED_EMAIL] ?? null,
    resendApiKey: s[SETTING_KEYS.RESEND_API_KEY] ?? '',
    mailPrimaryProvider: s[SETTING_KEYS.MAIL_PRIMARY_PROVIDER] ?? 'gmail',
    mailSecondaryProvider: s[SETTING_KEYS.MAIL_SECONDARY_PROVIDER] ?? 'resend',
    googleCalendarId: s[SETTING_KEYS.GOOGLE_CALENDAR_ID] ?? '',
    googleCalendarName: s[SETTING_KEYS.GOOGLE_CALENDAR_NAME] ?? '',
    googleCalendars,
    inDevelopment: featureFlags.inDevelopment,
    registerEnabled: featureFlags.registerEnabled,
    subscriptionsEnabled: featureFlags.subscriptionsEnabled,
    featureFlags,
    farmPickup,
    ordersOpenFrom: s[SETTING_KEYS.ORDERS_OPEN_FROM] ?? '',
    ordersOpenTo: s[SETTING_KEYS.ORDERS_OPEN_TO] ?? '',
    ordersClosedMessage: s[SETTING_KEYS.ORDERS_CLOSED_MESSAGE] ?? '',
    templateDefinitions: await getAllAdminEmailTemplateDefinitions()
  }
})
