import { db } from '#modula/server/data/client'
import { getPageBuilderContent, savePageBuilderContent } from '#modula/server/utils/pageBuilder'
import type { PageBuilderColumnItem, PageBuilderSection } from '#modula/shared/pageBuilder'


interface RootPageImageReferenceItem {
  kind: 'section-background-image' | 'section-background-carousel' | 'column-image' | 'column-carousel'
  sectionId: string
  sectionLabel: string
  columnIndex?: number
  itemId?: string
  label: string
}

interface CmsPageImageReferenceItem {
  kind: 'section-background-image' | 'section-background-carousel' | 'column-image' | 'column-carousel'
  pageId: number
  pagePath: string
  pageTitle: string
  sectionId: string
  sectionLabel: string
  columnIndex?: number
  itemId?: string
  label: string
}

interface CmsSiteSettingsImageReferenceItem {
  fieldKey: 'logo' | 'favicon'
  label: string
}

type ImageUsageSeed = {
  imageId: number
  scopeType: string
  scopeId: string
  fieldKey: string
  label: string
  createdAt: Date
  updatedAt: Date
}

function dedupeImageUsages(usages: ImageUsageSeed[]) {
  const unique = new Map<string, ImageUsageSeed>()

  for (const usage of usages) {
    const key = [usage.imageId, usage.scopeType, usage.scopeId, usage.fieldKey].join('::')
    if (!unique.has(key)) {
      unique.set(key, usage)
    }
  }

  return [...unique.values()]
}

function getSectionLabel(section: PageBuilderSection) {
  for (const column of section.columns) {
    const titleItem = column.items.find((item): item is Extract<PageBuilderColumnItem, { type: 'title' }> => item.type === 'title')
    if (titleItem?.text?.fr?.trim()) return titleItem.text.fr.trim()
    if (titleItem?.text?.en?.trim()) return titleItem.text.en.trim()
  }
  return section.id
}

function replaceUrlInRootPage(content: Awaited<ReturnType<typeof getPageBuilderContent>>, oldUrl: string, newUrl: string) {
  let changed = false

  for (const section of content.sections) {
    if (section.backgroundImage.imageUrl === oldUrl) {
      section.backgroundImage.imageUrl = newUrl
      changed = true
    }

    for (const slide of section.backgroundCarousel) {
      if (slide.imageUrl === oldUrl) {
        slide.imageUrl = newUrl
        changed = true
      }
    }

    for (const column of section.columns) {
      for (const item of column.items) {
        if (item.type === 'image' && item.imageUrl === oldUrl) {
          item.imageUrl = newUrl
          changed = true
        }
        if (item.type === 'carousel') {
          for (const slide of item.slides) {
            if (slide.imageUrl === oldUrl) {
              slide.imageUrl = newUrl
              changed = true
            }
          }
        }
      }
    }
  }

  return changed
}

function removeUrlFromRootPage(content: Awaited<ReturnType<typeof getPageBuilderContent>>, targetUrl: string) {
  let changed = false

  for (const section of content.sections) {
    if (section.backgroundImage.imageUrl === targetUrl) {
      section.backgroundImage.imageUrl = ''
      section.backgroundImage.alt = { fr: '', en: '' }
      changed = true
    }

    const nextBackgroundCarousel = section.backgroundCarousel.filter((slide) => slide.imageUrl !== targetUrl)
    if (nextBackgroundCarousel.length !== section.backgroundCarousel.length) {
      section.backgroundCarousel = nextBackgroundCarousel
      changed = true
    }

    for (const column of section.columns) {
      for (const item of column.items) {
        if (item.type === 'image' && item.imageUrl === targetUrl) {
          item.imageUrl = ''
          item.alt = { fr: '', en: '' }
          changed = true
        }

        if (item.type === 'carousel') {
          const nextSlides = item.slides.filter((slide) => slide.imageUrl !== targetUrl)
          if (nextSlides.length !== item.slides.length) {
            item.slides = nextSlides
            changed = true
          }
        }
      }
    }
  }

  return changed
}

async function getRootPageImageReferences(url: string) {
  const content = await getPageBuilderContent()
  const items: RootPageImageReferenceItem[] = []

  content.sections.forEach((section) => {
    const sectionLabel = getSectionLabel(section)

    if (section.backgroundImage.imageUrl === url) {
      items.push({
        kind: 'section-background-image',
        sectionId: section.id,
        sectionLabel,
        label: `Section "${sectionLabel}" - fond`
      })
    }

    section.backgroundCarousel.forEach((slide, slideIndex) => {
      if (slide.imageUrl !== url) return
      items.push({
        kind: 'section-background-carousel',
        sectionId: section.id,
        sectionLabel,
        itemId: slide.id,
        label: `Section "${sectionLabel}" - carousel de fond (slide ${slideIndex + 1})`
      })
    })

    section.columns.forEach((column, columnIndex) => {
      column.items.forEach((item) => {
        if (item.type === 'image' && item.imageUrl === url) {
          items.push({
            kind: 'column-image',
            sectionId: section.id,
            sectionLabel,
            columnIndex: columnIndex + 1,
            itemId: item.id,
            label: `Section "${sectionLabel}" - colonne ${columnIndex + 1} - image`
          })
        }

        if (item.type === 'carousel') {
          item.slides.forEach((slide, slideIndex) => {
            if (slide.imageUrl !== url) return
            items.push({
              kind: 'column-carousel',
              sectionId: section.id,
              sectionLabel,
              columnIndex: columnIndex + 1,
              itemId: item.id,
              label: `Section "${sectionLabel}" - colonne ${columnIndex + 1} - carousel (slide ${slideIndex + 1})`
            })
          })
        }
      })
    })
  })

  return {
    count: items.length,
    items
  }
}

function rootUsageToReferenceItem(usage: { scopeId: string, fieldKey: string, label: string }): RootPageImageReferenceItem | null {
  if (usage.fieldKey === 'section-background-image') {
    return {
      kind: 'section-background-image',
      sectionId: usage.scopeId,
      sectionLabel: usage.scopeId,
      label: usage.label
    }
  }

  if (usage.fieldKey.startsWith('section-background-carousel:')) {
    return {
      kind: 'section-background-carousel',
      sectionId: usage.scopeId,
      sectionLabel: usage.scopeId,
      itemId: usage.fieldKey.slice('section-background-carousel:'.length),
      label: usage.label
    }
  }

  if (usage.fieldKey.startsWith('column-image:')) {
    const [, columnIndex, itemId] = usage.fieldKey.split(':')
    return {
      kind: 'column-image',
      sectionId: usage.scopeId,
      sectionLabel: usage.scopeId,
      columnIndex: Number(columnIndex) || undefined,
      itemId,
      label: usage.label
    }
  }

  if (usage.fieldKey.startsWith('column-carousel:')) {
    const [, columnIndex, itemId] = usage.fieldKey.split(':')
    return {
      kind: 'column-carousel',
      sectionId: usage.scopeId,
      sectionLabel: usage.scopeId,
      columnIndex: Number(columnIndex) || undefined,
      itemId,
      label: usage.label
    }
  }

  return null
}

function cmsUsageToReferenceItem(
  usage: { scopeId: string, fieldKey: string, label: string },
  pageById: Map<number, { path: string, title: string }>
): CmsPageImageReferenceItem | null {
  const pageId = Number(usage.scopeId)
  if (!Number.isInteger(pageId) || pageId <= 0) return null

  const page = pageById.get(pageId)
  const pagePath = page?.path || usage.scopeId
  const pageTitle = page?.title || usage.scopeId

  if (usage.fieldKey.startsWith('section-background-image:')) {
    const sectionId = usage.fieldKey.slice('section-background-image:'.length)
    return {
      kind: 'section-background-image',
      pageId,
      pagePath,
      pageTitle,
      sectionId,
      sectionLabel: sectionId,
      label: usage.label
    }
  }

  if (usage.fieldKey.startsWith('section-background-carousel:')) {
    const [, sectionId, itemId] = usage.fieldKey.split(':')
    return {
      kind: 'section-background-carousel',
      pageId,
      pagePath,
      pageTitle,
      sectionId: sectionId!,
      sectionLabel: sectionId!,
      itemId,
      label: usage.label
    }
  }

  if (usage.fieldKey.startsWith('column-image:')) {
    const [, sectionId, columnIndex, itemId] = usage.fieldKey.split(':')
    return {
      kind: 'column-image',
      pageId,
      pagePath,
      pageTitle,
      sectionId: sectionId!,
      sectionLabel: sectionId!,
      columnIndex: Number(columnIndex) || undefined,
      itemId,
      label: usage.label
    }
  }

  if (usage.fieldKey.startsWith('column-carousel:')) {
    const [, sectionId, columnIndex, itemId] = usage.fieldKey.split(':')
    return {
      kind: 'column-carousel',
      pageId,
      pagePath,
      pageTitle,
      sectionId: sectionId!,
      sectionLabel: sectionId!,
      columnIndex: Number(columnIndex) || undefined,
      itemId,
      label: usage.label
    }
  }

  return null
}

export async function syncImageUsageTable() {
  const [images, vegetables, baskets, products, productLots, articles, cmsPages] = await Promise.all([
    db.image.findMany({
      select: { id: true, url: true }
    }),
    db.vegetable.findMany({
      select: { id: true, name: true, imageUrl: true }
    }),
    db.basket.findMany({
      select: { id: true, name: true, imageUrl: true }
    }),
    db.product.findMany({
      select: { id: true, name: true, imageUrl: true }
    }).catch(() => []),
    db.productLot.findMany({
      select: { id: true, name: true, imageUrl: true }
    }).catch(() => []),
    db.article.findMany({
      select: { id: true, title: true, slug: true, coverUrl: true, content: true }
    }),
    db.cmsPage.findMany({
      select: {
        id: true,
        path: true,
        title: true,
        translationsJson: true
      }
    }).catch(() => [])
  ])

  const imageIdByUrl: Map<string, number> = new Map(images.map((image: any) => [String(image.url), Number(image.id)]))
  const usages: ImageUsageSeed[] = []
  const now = new Date()
  const { getCmsSiteSettings } = await import('./cms')
  const cmsSiteSettings = await getCmsSiteSettings().catch(() => null)

  for (const vegetable of vegetables) {
    const imageId = vegetable.imageUrl ? imageIdByUrl.get(vegetable.imageUrl) as number | undefined : undefined
    if (!imageId) continue
    usages.push({
      imageId,
      scopeType: 'vegetable',
      scopeId: String(vegetable.id),
      fieldKey: 'imageUrl',
      label: `Legume "${vegetable.name}"`,
      createdAt: now,
      updatedAt: now
    })
  }

  for (const basket of baskets) {
    const imageId = basket.imageUrl ? imageIdByUrl.get(basket.imageUrl) as number | undefined : undefined
    if (!imageId) continue
    usages.push({
      imageId,
      scopeType: 'basket',
      scopeId: String(basket.id),
      fieldKey: 'imageUrl',
      label: `Panier "${basket.name}"`,
      createdAt: now,
      updatedAt: now
    })
  }

  for (const product of products) {
    const imageId = product.imageUrl ? imageIdByUrl.get(product.imageUrl) as number | undefined : undefined
    if (!imageId) continue
    usages.push({
      imageId,
      scopeType: 'product',
      scopeId: String(product.id),
      fieldKey: 'imageUrl',
      label: `Produit "${product.name}"`,
      createdAt: now,
      updatedAt: now
    })
  }

  for (const productLot of productLots) {
    const imageId = productLot.imageUrl ? imageIdByUrl.get(productLot.imageUrl) as number | undefined : undefined
    if (!imageId) continue
    usages.push({
      imageId,
      scopeType: 'product-lot',
      scopeId: String(productLot.id),
      fieldKey: 'imageUrl',
      label: `Lot produit "${productLot.name}"`,
      createdAt: now,
      updatedAt: now
    })
  }

  for (const article of articles) {
    const coverImageId = article.coverUrl ? imageIdByUrl.get(article.coverUrl) : undefined
    if (coverImageId) {
      usages.push({
        imageId: coverImageId,
        scopeType: 'article',
        scopeId: String(article.id),
        fieldKey: 'coverUrl',
        label: `Article "${article.title}" - image de couverture`,
        createdAt: now,
        updatedAt: now
      })
    }

    for (const image of images) {
      if (!article.content.includes(image.url)) continue
      usages.push({
        imageId: image.id,
        scopeType: 'article-content',
        scopeId: String(article.id),
        fieldKey: article.slug || String(article.id),
        label: `Article "${article.title}" - contenu`,
        createdAt: now,
        updatedAt: now
      })
    }
  }

  if (cmsSiteSettings?.logo?.src) {
    const logoImageId = imageIdByUrl.get(cmsSiteSettings.logo.src)
    if (logoImageId) {
      usages.push({
        imageId: logoImageId,
        scopeType: 'cms-site-settings',
        scopeId: 'global',
        fieldKey: 'logo',
        label: 'Reglages globaux - logo',
        createdAt: now,
        updatedAt: now
      })
    }
  }

  if (cmsSiteSettings?.favicon?.src) {
    const faviconImageId = imageIdByUrl.get(cmsSiteSettings.favicon.src)
    if (faviconImageId) {
      usages.push({
        imageId: faviconImageId,
        scopeType: 'cms-site-settings',
        scopeId: 'global',
        fieldKey: 'favicon',
        label: 'Reglages globaux - favicon',
        createdAt: now,
        updatedAt: now
      })
    }
  }

  for (const page of cmsPages) {
    let translations: Record<string, any> = {}

    try {
      translations = page.translationsJson ? JSON.parse(page.translationsJson) : {}
    } catch {
      translations = {}
    }

    const contents = Object.values(translations)
      .map((translation: any) => translation?.content)
      .filter((content: any) => content && Array.isArray(content.sections))

    for (const content of contents) {
      for (const section of content.sections) {
        const sectionLabel = getSectionLabel(section)
        const pageLabel = page.title?.trim() || page.path
        const backgroundImageId = section.backgroundImage?.imageUrl
          ? imageIdByUrl.get(section.backgroundImage.imageUrl)
          : undefined

        if (backgroundImageId) {
          usages.push({
            imageId: backgroundImageId,
            scopeType: 'cms-page',
            scopeId: String(page.id),
            fieldKey: `section-background-image:${section.id}`,
            label: `Page "${pageLabel}" (${page.path}) - section "${sectionLabel}" - fond`,
            createdAt: now,
            updatedAt: now
          })
        }

        for (const slide of section.backgroundCarousel || []) {
          const imageId = slide.imageUrl ? imageIdByUrl.get(slide.imageUrl) : undefined
          if (!imageId) continue
          usages.push({
            imageId,
            scopeType: 'cms-page',
            scopeId: String(page.id),
            fieldKey: `section-background-carousel:${section.id}:${slide.id}`,
            label: `Page "${pageLabel}" (${page.path}) - section "${sectionLabel}" - carousel de fond`,
            createdAt: now,
            updatedAt: now
          })
        }

        section.columns?.forEach((column: any, columnIndex: number) => {
          column.items?.forEach((item: any) => {
            if (item.type === 'image') {
              const imageId = item.imageUrl ? imageIdByUrl.get(item.imageUrl) : undefined
              if (!imageId) return
              usages.push({
                imageId,
                scopeType: 'cms-page',
                scopeId: String(page.id),
                fieldKey: `column-image:${section.id}:${columnIndex + 1}:${item.id}`,
                label: `Page "${pageLabel}" (${page.path}) - section "${sectionLabel}" - colonne ${columnIndex + 1} - image`,
                createdAt: now,
                updatedAt: now
              })
            }

            if (item.type === 'carousel') {
              item.slides?.forEach((slide: any) => {
                const imageId = slide.imageUrl ? imageIdByUrl.get(slide.imageUrl) : undefined
                if (!imageId) return
                usages.push({
                  imageId,
                  scopeType: 'cms-page',
                  scopeId: String(page.id),
                  fieldKey: `column-carousel:${section.id}:${columnIndex + 1}:${item.id}:${slide.id}`,
                  label: `Page "${pageLabel}" (${page.path}) - section "${sectionLabel}" - colonne ${columnIndex + 1} - carousel`,
                  createdAt: now,
                  updatedAt: now
                })
              })
            }
          })
        })
      }
    }
  }

  const dedupedUsages = dedupeImageUsages(usages)

  await db.imageUsage.deleteMany()

  if (dedupedUsages.length) {
    await db.imageUsage.createMany({
      data: dedupedUsages
    })
  }
}

export async function listImageUsageAssociations(imageId: number) {
  return await db.imageUsage.findMany({
    where: { imageId },
    orderBy: [
      { scopeType: 'asc' },
      { label: 'asc' }
    ]
  })
}

export async function updateImageReferences(oldUrl: string, newUrl: string) {
  await db.vegetable.updateMany({
    where: { imageUrl: oldUrl },
    data: { imageUrl: newUrl }
  })
  await db.basket.updateMany({
    where: { imageUrl: oldUrl },
    data: { imageUrl: newUrl }
  })
  await db.product.updateMany({
    where: { imageUrl: oldUrl },
    data: { imageUrl: newUrl }
  })
  await db.productLot.updateMany({
    where: { imageUrl: oldUrl },
    data: { imageUrl: newUrl }
  })
  await db.article.updateMany({
    where: { coverUrl: oldUrl },
    data: { coverUrl: newUrl }
  })
  await db.$executeRawUnsafe(
    'UPDATE "Article" SET "content" = REPLACE("content", ?, ?) WHERE "content" LIKE ?',
    oldUrl,
    newUrl,
    `%${oldUrl}%`
  )

  const rootPageContent = await getPageBuilderContent()
  if (replaceUrlInRootPage(rootPageContent, oldUrl, newUrl)) {
    await savePageBuilderContent(rootPageContent)
  }

  await syncImageUsageTable()
}

export async function removeImageReferences(url: string) {
  await db.vegetable.updateMany({
    where: { imageUrl: url },
    data: { imageUrl: null }
  })

  await db.basket.updateMany({
    where: { imageUrl: url },
    data: { imageUrl: null }
  })
  await db.product.updateMany({
    where: { imageUrl: url },
    data: { imageUrl: null }
  })
  await db.productLot.updateMany({
    where: { imageUrl: url },
    data: { imageUrl: null }
  })

  await db.article.updateMany({
    where: { coverUrl: url },
    data: { coverUrl: null }
  })

  await db.$executeRawUnsafe(
    'UPDATE "Article" SET "content" = REPLACE("content", ?, ?) WHERE "content" LIKE ?',
    url,
    '',
    `%${url}%`
  )

  const rootPageContent = await getPageBuilderContent()
  if (removeUrlFromRootPage(rootPageContent, url)) {
    await savePageBuilderContent(rootPageContent)
  }

  await syncImageUsageTable()
}

export async function countImageReferences(url: string) {
  const image = await db.image.findFirst({
    where: { url },
    select: { id: true }
  })

  if (!image) {
    return {
      vegetables: 0,
      baskets: 0,
      products: 0,
      productLots: 0,
      articles: 0,
      articleContent: 0,
      cmsSiteSettings: {
        count: 0,
        items: [] as CmsSiteSettingsImageReferenceItem[]
      },
      cmsPages: {
        count: 0,
        items: [] as CmsPageImageReferenceItem[]
      },
      rootPage: {
        count: 0,
        items: [] as RootPageImageReferenceItem[]
      }
    }
  }

  const usages = await listImageUsageAssociations(image.id)
  const cmsPages = await db.cmsPage.findMany({
    select: {
      id: true,
      path: true,
      title: true
    }
  }).catch(() => [])
  const cmsPageById: Map<number, { path: string; title: string }> = new Map(cmsPages.map((page: any) => [Number(page.id), { path: String(page.path), title: String(page.title) }]))
  const rootItems = usages
    .filter((usage: any) => usage.scopeType === 'root-page')
    .map(rootUsageToReferenceItem)
    .filter((item: any): item is RootPageImageReferenceItem => Boolean(item))
  const cmsPageItems = usages
    .filter((usage: any) => usage.scopeType === 'cms-page')
    .map((usage: any) => cmsUsageToReferenceItem(usage, cmsPageById))
    .filter((item: any): item is CmsPageImageReferenceItem => Boolean(item))
  const cmsSiteSettingsItems = usages
    .filter((usage: any) => usage.scopeType === 'cms-site-settings' && (usage.fieldKey === 'logo' || usage.fieldKey === 'favicon'))
    .map((usage: any) => ({
      fieldKey: usage.fieldKey as 'logo' | 'favicon',
      label: usage.label
    }))

  return {
    vegetables: usages.filter((usage: any) => usage.scopeType === 'vegetable').length,
    baskets: usages.filter((usage: any) => usage.scopeType === 'basket').length,
    products: usages.filter((usage: any) => usage.scopeType === 'product').length,
    productLots: usages.filter((usage: any) => usage.scopeType === 'product-lot').length,
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
