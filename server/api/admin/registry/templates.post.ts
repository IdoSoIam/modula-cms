import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { createRegistryTemplate } from '#modula/server/utils/cmsRegistry'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{
    slug?: string
    label?: { fr?: string, en?: string }
    description?: { fr?: string, en?: string }
    icon?: string
    previewImage?: string
    highlights?: Array<{ fr?: string, en?: string }>
    themeNames?: string[]
  }>(event)

  if (!body?.slug?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Template slug required' })
  }

  return await createRegistryTemplate({
    slug: body.slug.trim(),
    label: {
      fr: body.label?.fr?.trim() || body.slug.trim(),
      en: body.label?.en?.trim() || body.slug.trim()
    },
    description: {
      fr: body.description?.fr?.trim() || '',
      en: body.description?.en?.trim() || ''
    },
    icon: body.icon?.trim() || 'mdi:view-dashboard-edit-outline',
    previewImage: body.previewImage?.trim() || '',
    highlights: Array.isArray(body.highlights)
      ? body.highlights.map(item => ({ fr: item?.fr?.trim() || '', en: item?.en?.trim() || '' }))
      : [],
    themeNames: Array.isArray(body.themeNames) ? body.themeNames.map(item => String(item).trim()).filter(Boolean) : []
  })
})
