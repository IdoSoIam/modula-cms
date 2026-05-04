import { requireAdmin } from '~/server/utils/requireAdmin'
import { getSettings, SETTING_KEYS, getFeatureFlags, getFarmPickupConfig } from '~/server/utils/settings'
import { listGoogleCalendars } from '~/server/utils/gmail'
import { TEMPLATE_DEFINITIONS, resolveReservationTemplate, ALL_TEMPLATE_SETTING_KEYS } from '~/server/utils/reservationEmailContent'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const allSettingKeys = [
    SETTING_KEYS.ADMIN_EMAIL,
    SETTING_KEYS.GMAIL_CONNECTED_EMAIL,
    SETTING_KEYS.GOOGLE_CALENDAR_ID,
    SETTING_KEYS.GOOGLE_CALENDAR_NAME,
    SETTING_KEYS.FACEBOOK_FLUX_DEACTIVATED,
    SETTING_KEYS.ORDERS_OPEN_FROM,
    SETTING_KEYS.ORDERS_OPEN_TO,
    SETTING_KEYS.ORDERS_CLOSED_MESSAGE,
    SETTING_KEYS.REGISTER_ENABLED,
    SETTING_KEYS.SUBSCRIPTIONS_ENABLED,
    SETTING_KEYS.FARM_PICKUP_ADDRESS,
    SETTING_KEYS.FARM_PICKUP_DAY_OF_WEEK,
    SETTING_KEYS.FARM_PICKUP_START_TIME,
    SETTING_KEYS.FARM_PICKUP_END_TIME,
    SETTING_KEYS.FARM_PICKUP_TIME,
    ...ALL_TEMPLATE_SETTING_KEYS
  ]
  const s = await getSettings(allSettingKeys)
  const [featureFlags, farmPickup] = await Promise.all([getFeatureFlags(), getFarmPickupConfig()])

  let googleCalendars: Array<{ id: string; summary: string; primary: boolean; accessRole: string }> = []
  if (s[SETTING_KEYS.GMAIL_CONNECTED_EMAIL]) {
    try {
      googleCalendars = await listGoogleCalendars()
    } catch (error) {
      console.error('Unable to load Google calendars:', error)
    }
  }

  const templates: Record<string, { fr: { subject: string; body: string }; en: { subject: string; body: string } }> = {}
  for (const template of TEMPLATE_DEFINITIONS) {
    const raw = s[template.settingKey]
    templates[template.action] = {
      fr: resolveReservationTemplate(raw, template.action, 'fr'),
      en: resolveReservationTemplate(raw, template.action, 'en')
    }
  }

  return {
    adminEmail: s[SETTING_KEYS.ADMIN_EMAIL] ?? '',
    gmailConnectedEmail: s[SETTING_KEYS.GMAIL_CONNECTED_EMAIL] ?? null,
    googleCalendarId: s[SETTING_KEYS.GOOGLE_CALENDAR_ID] ?? '',
    googleCalendarName: s[SETTING_KEYS.GOOGLE_CALENDAR_NAME] ?? '',
    googleCalendars,
    facebookFluxDeactivated: s[SETTING_KEYS.FACEBOOK_FLUX_DEACTIVATED] === 'true',
    registerEnabled: featureFlags.registerEnabled,
    subscriptionsEnabled: featureFlags.subscriptionsEnabled,
    farmPickup,
    ordersOpenFrom: s[SETTING_KEYS.ORDERS_OPEN_FROM] ?? '',
    ordersOpenTo: s[SETTING_KEYS.ORDERS_OPEN_TO] ?? '',
    ordersClosedMessage: s[SETTING_KEYS.ORDERS_CLOSED_MESSAGE] ?? '',
    templateDefinitions: TEMPLATE_DEFINITIONS,
    templates
  }
})
