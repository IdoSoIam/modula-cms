import { requireAdmin } from '~/server/utils/requireAdmin'
import { setSetting, SETTING_KEYS } from '~/server/utils/settings'

interface Body {
  adminEmail?: string
  googleCalendarId?: string
  googleCalendarName?: string
  facebookFluxDeactivated?: boolean
  ordersOpenFrom?: string
  ordersOpenTo?: string
  ordersClosedMessage?: string
  templates?: {
    confirmed?: { subject: string; body: string }
    rejected?: { subject: string; body: string }
    cancelled?: { subject: string; body: string }
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<Body>(event)

  if (typeof body.adminEmail === 'string') {
    await setSetting(SETTING_KEYS.ADMIN_EMAIL, body.adminEmail.trim())
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
  if (typeof body.ordersOpenFrom === 'string') {
    await setSetting(SETTING_KEYS.ORDERS_OPEN_FROM, body.ordersOpenFrom.trim())
  }
  if (typeof body.ordersOpenTo === 'string') {
    await setSetting(SETTING_KEYS.ORDERS_OPEN_TO, body.ordersOpenTo.trim())
  }
  if (typeof body.ordersClosedMessage === 'string') {
    await setSetting(SETTING_KEYS.ORDERS_CLOSED_MESSAGE, body.ordersClosedMessage.trim())
  }
  if (body.templates?.confirmed) {
    await setSetting(SETTING_KEYS.RESERVATION_TEMPLATE_CONFIRMED, JSON.stringify(body.templates.confirmed))
  }
  if (body.templates?.rejected) {
    await setSetting(SETTING_KEYS.RESERVATION_TEMPLATE_REJECTED, JSON.stringify(body.templates.rejected))
  }
  if (body.templates?.cancelled) {
    await setSetting(SETTING_KEYS.RESERVATION_TEMPLATE_CANCELLED, JSON.stringify(body.templates.cancelled))
  }
  return { ok: true }
})
