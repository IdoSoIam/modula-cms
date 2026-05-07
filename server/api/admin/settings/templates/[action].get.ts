import { requireAdmin } from '~/server/utils/requireAdmin'
import { getSetting } from '~/server/utils/settings'
import { TEMPLATE_DEFINITIONS, resolveReservationTemplate, type TemplateAction } from '~/server/utils/reservationEmailContent'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const action = getRouterParam(event, 'action') as TemplateAction | undefined
  const definition = TEMPLATE_DEFINITIONS.find((template) => template.action === action)

  if (!action || !definition) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Template introuvable'
    })
  }

  const raw = await getSetting(definition.settingKey)

  return {
    action,
    templates: {
      fr: resolveReservationTemplate(raw, action, 'fr'),
      en: resolveReservationTemplate(raw, action, 'en')
    }
  }
})
