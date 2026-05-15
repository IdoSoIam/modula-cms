import { requireAdmin } from '~/server/utils/requireAdmin'
import { createCustomAdminEmailTemplate } from '~/server/utils/adminEmailTemplates'

interface Body {
  label?: string
  description?: string
  group?: string
  subgroup?: string
  variables?: string[]
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<Body>(event)

  if (!body.label?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Le libellé du template est requis'
    })
  }

  const definition = await createCustomAdminEmailTemplate({
    label: body.label,
    description: body.description,
    group: body.group,
    subgroup: body.subgroup,
    variables: body.variables
  })

  return { definition }
})

