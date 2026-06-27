export interface NewsArticleSummary {
  id: number
  title: string
  slug: string
  excerpt: string | null
  coverUrl: string | null
  publishedAt: string | null
}

export function usePublicArticles() {
  const { contentLocale } = useContentLocale()

  return useFetch<NewsArticleSummary[]>('/api/articles', {
    key: () => `public-articles:${contentLocale.value}`,
    watch: [contentLocale],
    default: () => []
  })
}
