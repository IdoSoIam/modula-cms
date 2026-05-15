import { computed, toValue, type MaybeRefOrGetter } from 'vue'

interface PageSeoOptions {
  title: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string>
  noindex?: MaybeRefOrGetter<boolean>
  type?: MaybeRefOrGetter<'website' | 'article'>
}

export const usePageSeo = (options: PageSeoOptions) => {
  const siteConfig = useSiteConfigState()
  const title = computed(() => toValue(options.title))
  const description = computed(() => toValue(options.description))
  const noindex = computed(() => Boolean(toValue(options.noindex)))
  const type = computed(() => toValue(options.type) || 'website')
  const siteName = computed(() => siteConfig.value?.siteName || 'Site name')
  const fullTitle = computed(() => {
    if (!title.value) return siteName.value
    return `${title.value} | ${siteName.value}`
  })

  useSeoMeta({
    title: fullTitle,
    ogTitle: fullTitle,
    twitterTitle: fullTitle,
    description,
    ogDescription: description,
    twitterDescription: description,
    robots: computed(() => (noindex.value ? 'noindex, nofollow' : 'index, follow')),
    ogType: type,
    twitterCard: 'summary_large_image'
  })
}

export const useNoIndexSeo = (title: MaybeRefOrGetter<string>, description?: MaybeRefOrGetter<string>) => {
  usePageSeo({
    title,
    description: description ?? '',
    noindex: true
  })
}
