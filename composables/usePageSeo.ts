import { computed, toValue, type MaybeRefOrGetter } from 'vue'

const SITE_NAME = 'Ferme du Campeyrigoux'

interface PageSeoOptions {
  title: MaybeRefOrGetter<string>
  description: MaybeRefOrGetter<string>
  noindex?: MaybeRefOrGetter<boolean>
  type?: MaybeRefOrGetter<'website' | 'article'>
}

export const usePageSeo = (options: PageSeoOptions) => {
  const title = computed(() => toValue(options.title))
  const description = computed(() => toValue(options.description))
  const noindex = computed(() => Boolean(toValue(options.noindex)))
  const type = computed(() => toValue(options.type) || 'website')
  const fullTitle = computed(() => {
    if (!title.value) return SITE_NAME
    return `${title.value} | ${SITE_NAME}`
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
