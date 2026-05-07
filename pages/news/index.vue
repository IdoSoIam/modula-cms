<script setup lang="ts">
import FacebookFeed from '~/components/FacebookFeed.vue'

definePageMeta({
  layout: 'default'
})

interface ArticleSummary {
  id: number
  title: string
  slug: string
  excerpt: string | null
  coverUrl: string | null
  publishedAt: string | null
}

type SortOption = 'dateDesc' | 'dateAsc' | 'title'
type ViewMode = 'grid' | 'list'

const { locale, t } = useI18n()
const localePath = useLocalePath()
const router = useRouter()

usePageSeo({
  title: computed(() => t('pages.news.title')),
  description: computed(() => locale.value === 'en'
    ? 'Read the latest farm news, updates and seasonal highlights from Ferme du Campeyrigoux.'
    : 'Suivez les actualités, les nouveautés et les temps forts de saison de la Ferme du Campeyrigoux.')
})

const siteConfig = await useSiteConfig()
const useArticles = computed(() => siteConfig.value?.facebookFluxDeactivated === true)

const { data: articlesRaw, pending: articlesPending } = await useAsyncData<ArticleSummary[]>(
  'public-articles',
  () => $fetch<ArticleSummary[]>('/api/articles' as string),
  { watch: [useArticles], immediate: true }
)

const sortBy = ref<SortOption>('dateDesc')
const viewMode = ref<ViewMode>('grid')

const sortedArticles = computed(() => {
  const list = [...(articlesRaw.value || [])]
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

const navigateToArticle = (slug: string) => {
  router.push(localePath(`/news/${slug}`))
}

const formatDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''
</script>

<template>
  <div class="bg-base-100">
    <div class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 class="text-4xl font-bold text-center mb-8">{{ $t('pages.news.title') }}</h1>

      <div class="max-w-4xl mx-auto">
        <FacebookFeed v-if="!useArticles" />

        <template v-else>
          <div v-if="articlesPending" class="text-center py-12">
            <span class="loading loading-spinner loading-lg" />
          </div>
          <div v-else-if="!articlesRaw?.length" class="text-center py-12 opacity-60">
            {{ $t('pages.news.noArticles') }}
          </div>
          <div v-else>
            <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div class="flex items-center gap-2">
                <span class="text-sm opacity-70">{{ t('pages.news.sortBy') }}:</span>
                <select v-model="sortBy" class="select select-bordered select-sm">
                  <option value="dateDesc">{{ t('pages.news.sortDateDesc') }}</option>
                  <option value="dateAsc">{{ t('pages.news.sortDateAsc') }}</option>
                  <option value="title">{{ t('pages.news.sortTitle') }}</option>
                </select>
              </div>
              <div class="join">
                <button
                  class="join-item btn btn-sm"
                  :class="viewMode === 'grid' ? 'btn-active' : ''"
                  @click="viewMode = 'grid'"
                >
                  <Icon name="mdi:grid" size="18" />
                </button>
                <button
                  class="join-item btn btn-sm"
                  :class="viewMode === 'list' ? 'btn-active' : ''"
                  @click="viewMode = 'list'"
                >
                  <Icon name="mdi:view-list" size="18" />
                </button>
              </div>
            </div>

            <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                v-for="a in sortedArticles"
                :key="a.id"
                class="card bg-base-200 shadow hover:shadow-xl transition cursor-pointer"
                @click="navigateToArticle(a.slug)"
              >
                <figure v-if="a.coverUrl" class="h-48">
                  <img :src="a.coverUrl" :alt="a.title" class="object-cover w-full h-full" />
                </figure>
                <div class="card-body">
                  <h2 class="card-title">{{ a.title }}</h2>
                  <p v-if="a.publishedAt" class="text-xs opacity-60">
                    {{ $t('pages.news.publishedOn') }} {{ formatDate(a.publishedAt) }}
                  </p>
                  <p v-if="a.excerpt" class="opacity-80 line-clamp-3">{{ a.excerpt }}</p>
                  <div class="card-actions justify-end mt-2">
                    <span class="link link-primary text-sm">{{ $t('pages.news.readMore') }} -></span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="grid gap-4">
              <div
                v-for="a in sortedArticles"
                :key="a.id"
                class="card bg-base-200 shadow hover:shadow-xl transition lg:card-side cursor-pointer"
                @click="navigateToArticle(a.slug)"
              >
                <figure v-if="a.coverUrl" class="lg:w-48 shrink-0">
                  <img :src="a.coverUrl" :alt="a.title" class="object-cover w-full h-48 lg:h-full" />
                </figure>
                <div class="card-body">
                  <h2 class="card-title">{{ a.title }}</h2>
                  <p v-if="a.publishedAt" class="text-xs opacity-60">
                    {{ $t('pages.news.publishedOn') }} {{ formatDate(a.publishedAt) }}
                  </p>
                  <p v-if="a.excerpt" class="opacity-80 line-clamp-2">{{ a.excerpt }}</p>
                  <div class="card-actions justify-end mt-2">
                    <span class="link link-primary text-sm">{{ $t('pages.news.readMore') }} -></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
