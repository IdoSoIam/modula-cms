import { requireAdmin } from '~/server/utils/requireAdmin'
import { setSetting, SETTING_KEYS } from '~/server/utils/settings'

interface Body {
  adminEmail?: string
  templates?: {
    confirmed?: { subject: string; body: string }
    rejected?: { subject: string; body: string }
  }
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<Body>(event)

  if (typeof body.adminEmail === 'string') {
    await setSetting(SETTING_KEYS.ADMIN_EMAIL, body.adminEmail.trim())
  }
  if (body.templates?.confirmed) {
    await setSetting(SETTING_KEYS.RESERVATION_TEMPLATE_CONFIRMED, JSON.stringify(body.templates.confirmed))
  }
  if (body.templates?.rejected) {
    await setSetting(SETTING_KEYS.RESERVATION_TEMPLATE_REJECTED, JSON.stringify(body.templates.rejected))
  }
  return { ok: true }
})
