import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { db } from '#modula/server/data/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const images = await db.image.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      variants: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          storageKey: true,
          mimeType: true,
          size: true,
          width: true,
          height: true,
          fit: true,
          quality: true,
          format: true,
          createdAt: true
        }
      }
    }
  })

  const imageIds = images.map((item: any) => Number(item.id)).filter(Number.isFinite)
  const [allUsages, cmsPages] = await Promise.all([
    imageIds.length
      ? db.imageUsage.findMany({
          where: { imageId: { in: imageIds } },
          orderBy: [
            { scopeType: 'asc' },
            { label: 'asc' }
          ]
        }).catch(() => [])
      : [],
    db.cmsPage.findMany({
      select: {
        id: true,
        path: true,
        title: true
      }
    }).catch(() => [])
  ])
  const cmsPageById = new Map<number, { path: string; title: string }>(
    cmsPages.map((page: any) => [Number(page.id), { path: String(page.path), title: String(page.title) }])
  )
  const usagesByImageId = new Map<number, any[]>()
  for (const usage of allUsages as any[]) {
    const imageId = Number(usage.imageId)
    const entries = usagesByImageId.get(imageId) || []
    entries.push(usage)
    usagesByImageId.set(imageId, entries)
  }

  return images.map((item: any) => {
    const usages = usagesByImageId.get(Number(item.id)) || []
    const references = buildReferences(usages, cmsPageById)

    return {
      id: item.id,
      filename: item.filename,
      url: item.url,
      mimeType: item.mimeType,
      size: item.size,
      width: item.width,
      height: item.height,
      uploadedById: item.uploadedById,
      createdAt: item.createdAt,
      variants: item.variants?.map((variant: any) => ({
        ...variant,
        usages,
        references
      })),
      usages,
      references
    }
  })
})

function buildReferences(usages: any[], cmsPageById: Map<number, { path: string; title: string }>) {
  const cmsSiteSettingsItems = usages
    .filter((usage: any) => usage.scopeType === 'cms-site-settings' && (usage.fieldKey === 'logo' || usage.fieldKey === 'favicon'))
    .map((usage: any) => ({
      fieldKey: usage.fieldKey,
      label: usage.label
    }))
  const cmsPageItems = usages
    .filter((usage: any) => usage.scopeType === 'cms-page')
    .map((usage: any) => {
      const pageId = Number(usage.scopeId)
      const page = cmsPageById.get(pageId)
      return {
        pageId,
        pagePath: page?.path || String(usage.scopeId),
        pageTitle: page?.title || String(usage.scopeId),
        label: usage.label,
        fieldKey: usage.fieldKey
      }
    })
  const rootItems = usages
    .filter((usage: any) => usage.scopeType === 'root-page')
    .map((usage: any) => ({
      scopeId: usage.scopeId,
      fieldKey: usage.fieldKey,
      label: usage.label
    }))

  return {
    products: usages.filter((usage: any) => usage.scopeType === 'product').length,
    productLots: 0,
    articles: usages.filter((usage: any) => usage.scopeType === 'article').length,
    articleContent: usages.filter((usage: any) => usage.scopeType === 'article-content').length,
    cmsSiteSettings: {
      count: cmsSiteSettingsItems.length,
      items: cmsSiteSettingsItems
    },
    cmsPages: {
      count: cmsPageItems.length,
      items: cmsPageItems
    },
    rootPage: {
      count: rootItems.length,
      items: rootItems
    }
  }
}
