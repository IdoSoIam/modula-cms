import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { canManageSystemRegistryTemplates, updateRegistryTemplate } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing template slug' })
  }

  const body = await readBody<{
    label?: { fr?: string, en?: string }
    description?: { fr?: string, en?: string }
    icon?: string
    previewImage?: string
    highlights?: Array<{ fr?: string, en?: string }>
    themeNames?: string[]
    scope?: 'custom' | 'system'
  }>(event)
  const scope = body?.scope === 'system' ? 'system' : 'custom'
  if (scope === 'system' && !canManageSystemRegistryTemplates()) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden', message: 'Cette instance ne peut pas modifier les modèles système.' })
  }

  return await updateRegistryTemplate(slug, {
    label: body?.label ? { fr: body.label.fr?.trim() || '', en: body.label.en?.trim() || '' } : undefined,
    description: body?.description ? { fr: body.description.fr?.trim() || '', en: body.description.en?.trim() || '' } : undefined,
    icon: body?.icon?.trim() || undefined,
    previewImage: body?.previewImage?.trim() || undefined,
    highlights: Array.isArray(body?.highlights)
      ? body!.highlights!.map(item => ({ fr: item?.fr?.trim() || '', en: item?.en?.trim() || '' }))
      : undefined,
    themeNames: Array.isArray(body?.themeNames) ? body!.themeNames!.map(item => String(item).trim()).filter(Boolean) : undefined
  }, scope)
})
