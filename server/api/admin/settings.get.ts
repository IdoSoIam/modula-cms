import { requireAdmin } from '~/server/utils/requireAdmin'
import { getSettings, SETTING_KEYS, DEFAULT_TEMPLATES } from '~/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const s = await getSettings([
    SETTING_KEYS.ADMIN_EMAIL,
    SETTING_KEYS.RESERVATION_TEMPLATE_CONFIRMED,
    SETTING_KEYS.RESERVATION_TEMPLATE_REJECTED,
    SETTING_KEYS.GMAIL_CONNECTED_EMAIL
  ])

  const parseTpl = (raw: string | undefined, fallback: { subject: string; body: string }) => {
    if (!raw) return fallback
    try { return JSON.parse(raw) } catch { return fallback }
  }

  return {
    adminEmail: s[SETTING_KEYS.ADMIN_EMAIL] ?? '',
    gmailConnectedEmail: s[SETTING_KEYS.GMAIL_CONNECTED_EMAIL] ?? null,
    templates: {
      confirmed: parseTpl(s[SETTING_KEYS.RESERVATION_TEMPLATE_CONFIRMED], DEFAULT_TEMPLATES.confirmed),
      rejected: parseTpl(s[SETTING_KEYS.RESERVATION_TEMPLATE_REJECTED], DEFAULT_TEMPLATES.rejected)
    }
  }
})
