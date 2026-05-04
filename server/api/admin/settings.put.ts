import { requireAdmin } from '~/server/utils/requireAdmin'
import { setSetting, SETTING_KEYS } from '~/server/utils/settings'

interface Body {
  adminEmail?: string
  googleCalendarId?: string
  googleCalendarName?: string
  facebookFluxDeactivated?: boolean
  registerEnabled?: boolean
  subscriptionsEnabled?: boolean
  farmPickupAddress?: string
  farmPickupDayOfWeek?: number
  farmPickupStartTime?: string
  farmPickupEndTime?: string
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
