import { prisma } from '../../prisma/client'
import { getPageBuilderContent, savePageBuilderContent } from '~/server/utils/pageBuilder'
import type { PageBuilderColumnItem, PageBuilderSection } from '~/shared/pageBuilder'

interface RootPageImageReferenceItem {
  kind: 'section-background-image' | 'section-background-carousel' | 'column-image' | 'column-carousel'
  sectionId: string
  sectionLabel: string
  columnIndex?: number
  itemId?: string
  label: string
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

export async function updateImageReferences(oldUrl: string, newUrl: string) {
  await prisma.vegetable.updateMany({
    where: { imageUrl: oldUrl },
    data: { imageUrl: newUrl }
  })
  await prisma.basket.updateMany({
    where: { imageUrl: oldUrl },
    data: { imageUrl: newUrl }
  })
  await prisma.article.updateMany({
    where: { coverUrl: oldUrl },
    data: { coverUrl: newUrl }
  })
  await prisma.$executeRawUnsafe(
    'UPDATE "Article" SET "content" = REPLACE("content", ?, ?) WHERE "content" LIKE ?',
    oldUrl,
    newUrl,
    `%${oldUrl}%`
  )

  const rootPageContent = await getPageBuilderContent()
  if (replaceUrlInRootPage(rootPageContent, oldUrl, newUrl)) {
    await savePageBuilderContent(rootPageContent)
  }
}

export async function countImageReferences(url: string) {
  const [vegetables, baskets, articles, articleContentMatches, rootPage] = await Promise.all([
    prisma.vegetable.count({ where: { imageUrl: url } }),
    prisma.basket.count({ where: { imageUrl: url } }),
    prisma.article.count({ where: { coverUrl: url } }),
    prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(
      'SELECT COUNT(*) as count FROM "Article" WHERE "content" LIKE ?',
      `%${url}%`
    ),
    getRootPageImageReferences(url)
  ])

  return {
    vegetables,
    baskets,
    articles,
    articleContent: Number(articleContentMatches[0]?.count ?? 0),
    rootPage
  }
}
