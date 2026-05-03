import { requireAdmin } from '~/server/utils/requireAdmin'
import { getSettings, SETTING_KEYS, DEFAULT_TEMPLATES } from '~/server/utils/settings'
import { listGoogleCalendars } from '~/server/utils/gmail'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const s = await getSettings([
    SETTING_KEYS.ADMIN_EMAIL,
    SETTING_KEYS.RESERVATION_TEMPLATE_CONFIRMED,
    SETTING_KEYS.RESERVATION_TEMPLATE_REJECTED,
    SETTING_KEYS.RESERVATION_TEMPLATE_CANCELLED,
    SETTING_KEYS.GMAIL_CONNECTED_EMAIL,
    SETTING_KEYS.GOOGLE_CALENDAR_ID,
    SETTING_KEYS.GOOGLE_CALENDAR_NAME,
    SETTING_KEYS.FACEBOOK_FLUX_DEACTIVATED,
    SETTING_KEYS.ORDERS_OPEN_FROM,
    SETTING_KEYS.ORDERS_OPEN_TO,
    SETTING_KEYS.ORDERS_CLOSED_MESSAGE
  ])

  let googleCalendars: Array<{ id: string; summary: string; primary: boolean; accessRole: string }> = []
  if (s[SETTING_KEYS.GMAIL_CONNECTED_EMAIL]) {
    try {
      googleCalendars = await listGoogleCalendars()
    } catch (error) {
      console.error('Unable to load Google calendars:', error)
    }
  }

  const parseTpl = (raw: string | undefined, fallback: { subject: string; body: string }) => {
    if (!raw) return fallback
    try { return JSON.parse(raw) } catch { return fallback }
  }

  return {
    adminEmail: s[SETTING_KEYS.ADMIN_EMAIL] ?? '',
    gmailConnectedEmail: s[SETTING_KEYS.GMAIL_CONNECTED_EMAIL] ?? null,
    googleCalendarId: s[SETTING_KEYS.GOOGLE_CALENDAR_ID] ?? '',
    googleCalendarName: s[SETTING_KEYS.GOOGLE_CALENDAR_NAME] ?? '',
    googleCalendars,
    facebookFluxDeactivated: s[SETTING_KEYS.FACEBOOK_FLUX_DEACTIVATED] === 'true',
    ordersOpenFrom: s[SETTING_KEYS.ORDERS_OPEN_FROM] ?? '',
    ordersOpenTo: s[SETTING_KEYS.ORDERS_OPEN_TO] ?? '',
    ordersClosedMessage: s[SETTING_KEYS.ORDERS_CLOSED_MESSAGE] ?? '',
    templates: {
      confirmed: parseTpl(s[SETTING_KEYS.RESERVATION_TEMPLATE_CONFIRMED], DEFAULT_TEMPLATES.confirmed),
      rejected: parseTpl(s[SETTING_KEYS.RESERVATION_TEMPLATE_REJECTED], DEFAULT_TEMPLATES.rejected),
      cancelled: parseTpl(s[SETTING_KEYS.RESERVATION_TEMPLATE_CANCELLED], DEFAULT_TEMPLATES.cancelled)
    }
  }
})
