export interface NewsArticleSummary {
  id: number
  title: string
  slug: string
  excerpt: string | null
  coverUrl: string | null
  publishedAt: string | null
}

export function usePublicArticles() {
  const { locale } = useI18n()

  return useFetch<NewsArticleSummary[]>('/api/articles', {
    key: () => `public-articles:${locale.value}`,
    watch: [locale],
    default: () => []
  })
}
