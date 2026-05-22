<template>
  <div class="bg-base-100">
    <div class="mx-auto w-full py-10 sm:px-6 lg:px-8" :class="[containerClass, preview ? '' : ' px-4']">
      <header class="mx-auto mb-8 max-w-4xl text-center">
        <h1 class="text-4xl font-bold">{{ pageTitle }}</h1>
        <p v-if="pageSubtitle" class="mx-auto mt-3 max-w-2xl opacity-70">{{ pageSubtitle }}</p>
      </header>

      <div class="max-w-4xl mx-auto">
        <div v-if="showArticles">
          <div v-if="articlesPending && !articles?.length" class="py-12 text-center">
            <span class="loading loading-spinner loading-lg" />
          </div>
          <div v-else-if="!articles?.length" class="py-12 text-center opacity-60">
            {{ $t('pages.news.noArticles') }}
          </div>
          <div v-else>
            <div v-if="effectiveSettings.showSort || effectiveSettings.showViewToggle" class="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div v-if="effectiveSettings.showSort" class="flex items-center gap-2">
                <span class="text-sm opacity-70">{{ t('pages.news.sortBy') }}:</span>
                <select v-model="sortBy" class="select select-bordered select-sm">
                  <option value="dateDesc">{{ t('pages.news.sortDateDesc') }}</option>
                  <option value="dateAsc">{{ t('pages.news.sortDateAsc') }}</option>
                  <option value="title">{{ t('pages.news.sortTitle') }}</option>
                </select>
              </div>
              <div v-if="effectiveSettings.showViewToggle" class="join">
                <button type="button" class="join-item btn btn-sm" :class="viewMode === 'grid' ? 'btn-active' : ''" @click="viewMode = 'grid'">
                  <Icon name="mdi:grid" size="18" />
                </button>
                <button type="button" class="join-item btn btn-sm" :class="viewMode === 'list' ? 'btn-active' : ''" @click="viewMode = 'list'">
                  <Icon name="mdi:view-list" size="18" />
                </button>
              </div>
            </div>

            <div v-if="viewMode === 'grid'" class="grid grid-cols-1 gap-6 md:grid-cols-2" :class="gridColumnsClass">
              <article
                v-for="a in sortedArticles"
                :key="a.id"
                class="card cursor-pointer shadow transition hover:shadow-xl"
                :style="cardStyle"
                @click="navigateToArticle(a.slug)"
              >
                <figure v-if="effectiveSettings.showCoverImage && a.coverUrl" class="h-48">
                  <AppImage
                    :src="a.coverUrl"
                    :alt="a.title"
                    class="h-full w-full object-cover"
                    width="640"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    loading="lazy"
                  />
                </figure>
                <div class="card-body">
                  <h2 class="card-title">{{ a.title }}</h2>
                  <p v-if="effectiveSettings.showPublishedDate && a.publishedAt" class="text-xs opacity-60">
                    {{ $t('pages.news.publishedOn') }} {{ formatDate(a.publishedAt) }}
                  </p>
                  <p v-if="effectiveSettings.showExcerpt && a.excerpt" class="opacity-80" :class="excerptClass">{{ a.excerpt }}</p>
                  <div class="card-actions mt-2 justify-end">
                    <span class="link link-primary text-sm">{{ $t('pages.news.readMore') }} -></span>
                  </div>
                </div>
              </article>
            </div>

            <div v-else class="grid gap-4">
              <article
                v-for="a in sortedArticles"
                :key="a.id"
                class="card cursor-pointer shadow transition hover:shadow-xl lg:card-side"
                :style="cardStyle"
                @click="navigateToArticle(a.slug)"
              >
                <figure v-if="effectiveSettings.showCoverImage && a.coverUrl" class="shrink-0 lg:w-48">
                  <AppImage :src="a.coverUrl" :alt="a.title" class="h-48 w-full object-cover lg:h-full" sizes="(max-width: 1024px) 100vw, 320px" loading="lazy" />
                </figure>
                <div class="card-body">
                  <h2 class="card-title">{{ a.title }}</h2>
                  <p v-if="effectiveSettings.showPublishedDate && a.publishedAt" class="text-xs opacity-60">
                    {{ $t('pages.news.publishedOn') }} {{ formatDate(a.publishedAt) }}
                  </p>
                  <p v-if="effectiveSettings.showExcerpt && a.excerpt" class="opacity-80" :class="listExcerptClass">{{ a.excerpt }}</p>
                  <div class="card-actions mt-2 justify-end">
                    <span class="link link-primary text-sm">{{ $t('pages.news.readMore') }} -></span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>

        <NewsFacebookContent v-else />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CmsNewsPageSettings } from '~/shared/cms'
import { createDefaultCmsSiteSettings, pickCmsLocalizedText } from '~/shared/cms'
import { formatLocalizedDate } from '~/shared/date'
import NewsFacebookContent from '~/components/pages/NewsFacebookContent.vue'

type SortOption = 'dateDesc' | 'dateAsc' | 'title'
type ViewMode = 'grid' | 'list'

const props = defineProps<{
  settings?: CmsNewsPageSettings | null
  forceArticles?: boolean
  showArticles?: boolean
  disableSeo?: boolean
  preview?: boolean
}>()

const { locale, t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()

const showArticles = props.forceArticles === true || props.showArticles === true

const defaultSettings = createDefaultCmsSiteSettings().newsPage
const siteConfig = await useSiteConfig()
const effectiveSettings = computed(() => props.settings || siteConfig.value?.cms?.settings?.newsPage || defaultSettings)

const { data: articles, pending: articlesPending } = showArticles
  ? usePublicArticles()
  : { data: ref(null), pending: ref(false) }

const sortBy = ref<SortOption>('dateDesc')
const viewMode = ref<ViewMode>(effectiveSettings.value.defaultViewMode)

watch(effectiveSettings, (value) => {
  viewMode.value = value.defaultViewMode
}, { deep: true })

const pageTitle = computed(() => pickCmsLocalizedText(locale.value, effectiveSettings.value.title) || t('pages.news.title'))
const pageSubtitle = computed(() => pickCmsLocalizedText(locale.value, effectiveSettings.value.subtitle))

if (!props.disableSeo) {
  usePageSeo({
    title: computed(() => pageTitle.value || t('pages.news.title')),
    description: computed(() => pageSubtitle.value || (locale.value === 'en'
      ? 'Read the latest farm news, updates and seasonal highlights from Ferme du Campeyrigoux.'
      : 'Suivez les actualités, les nouveautés et les temps forts de saison de la Ferme du Campeyrigoux.'))
  })
}

const sortedArticles = computed(() => {
  const list = [...(articles.value || [])]
  switch (sortBy.value) {
    case 'dateDesc':
      return list.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''))
    case 'dateAsc':
      return list.sort((a, b) => (a.publishedAt || '').localeCompare(b.publishedAt || ''))
    case 'title':
      return list.sort((a, b) => a.title.localeCompare(b.title))
    default:
      return list
  }
})

const containerClass = computed(() => {
  switch (effectiveSettings.value.containerWidth) {
    case 'narrow': return 'max-w-3xl'
    case 'medium': return 'max-w-4xl'
    case 'default': return 'max-w-5xl'
    case 'wide': return 'max-w-6xl'
    case 'xwide': return 'max-w-7xl'
    case 'edge': return 'max-w-[90rem]'
    case 'full': return 'max-w-none'
    default: return 'max-w-6xl'
  }
})

const gridColumnsClass = computed(() => {
  switch (effectiveSettings.value.gridColumns) {
    case 1: return 'lg:grid-cols-1'
    case 3: return 'lg:grid-cols-3'
    default: return 'lg:grid-cols-2'
  }
})

const excerptClass = computed(() => effectiveSettings.value.excerptLines === 2 ? 'line-clamp-2' : effectiveSettings.value.excerptLines === 4 ? 'line-clamp-4' : 'line-clamp-3')
const listExcerptClass = computed(() => effectiveSettings.value.excerptLines <= 2 ? 'line-clamp-2' : 'line-clamp-3')

const tokenToCssVar = (token?: string | null) => {
  if (!token) return ''
  if (token === 'white') return 'rgba(255,255,255,1)'
  if (token === 'white-90') return 'rgba(255,255,255,.9)'
  if (token === 'white-70') return 'rgba(255,255,255,.7)'
  if (token === 'white-10') return 'rgba(255,255,255,.1)'
  if (token === 'transparent') return 'transparent'
  return `var(--color-${token})`
}

const cardStyle = computed(() => ({
  backgroundColor: tokenToCssVar(effectiveSettings.value.cardBackgroundColor?.token || 'base-200')
}))

const navigateToArticle = (slug: string) => {
  router.push(localePath(`/news/${slug}`))
}

const formatDate = (value: string | null) =>
  formatLocalizedDate(value, locale.value, { day: '2-digit', month: 'long', year: 'numeric' })
</script>
