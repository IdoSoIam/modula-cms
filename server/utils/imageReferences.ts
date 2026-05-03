import { prisma } from '../../prisma/client'

export async function updateImageReferences(oldUrl: string, newUrl: string) {
  await prisma.$transaction([
    prisma.vegetable.updateMany({
      where: { imageUrl: oldUrl },
      data: { imageUrl: newUrl }
    }),
    prisma.basket.updateMany({
      where: { imageUrl: oldUrl },
      data: { imageUrl: newUrl }
    }),
    prisma.article.updateMany({
      where: { coverUrl: oldUrl },
      data: { coverUrl: newUrl }
    }),
    prisma.$executeRawUnsafe(
      'UPDATE `Article` SET `content` = REPLACE(`content`, ?, ?) WHERE `content` LIKE ?',
      oldUrl,
      newUrl,
      `%${oldUrl}%`
    )
  ])
}

export async function countImageReferences(url: string) {
  const [vegetables, baskets, articles, articleContentMatches] = await Promise.all([
    prisma.vegetable.count({ where: { imageUrl: url } }),
    prisma.basket.count({ where: { imageUrl: url } }),
    prisma.article.count({ where: { coverUrl: url } }),
    prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(
      'SELECT COUNT(*) as count FROM `Article` WHERE `content` LIKE ?',
      `%${url}%`
    )
  ])

  return {
    vegetables,
    baskets,
    articles,
    articleContent: Number(articleContentMatches[0]?.count ?? 0)
  }
}
