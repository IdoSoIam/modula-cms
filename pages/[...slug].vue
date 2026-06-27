<template>
  <NewsListPage
    v-if="renderNewsArticles"
    :show-articles="true"
    :settings="newsPageSettings"
  />
  <CmsResolvedPageView
    v-else-if="resolvedPage"
    :resolved-page="resolvedPage"
  />
</template>

<script setup lang="ts">
import type { ResolvedCmsPage } from '#modula/shared/cms'
import type { CmsNewsPageSettings } from '#modula/shared/cms'
import CmsResolvedPageView from '#modula/components/cms/CmsResolvedPageView.vue'
import NewsListPage from '#modula/components/pages/NewsListPage.vue'

definePageMeta({
  i18n: false,
})

const route = useRoute()
const segments = computed(() => {
  const value = route.params.slug
  if (Array.isArray(value)) return value
  if (typeof value === 'string') return [value]
  return []
})
const { contentLocale, pathWithoutLocale } = useContentLocale()
const cmsPath = computed(() => pathWithoutLocale.value)

const siteConfig = await ensureSiteConfigState()

const { data: resolvedPage, error } = await useFetch<ResolvedCmsPage>('/api/cms/resolve', {
  key: computed(() => `cms-resolve:${cmsPath.value}:${contentLocale.value}`),
  query: computed(() => ({
    path: cmsPath.value,
    locale: contentLocale.value
  })),
  watch: [cmsPath, contentLocale]
})

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || 'Page introuvable'
  })
}

const renderNewsArticles = resolvedPage.value?.rendererKey === 'news'

const newsPageSettings = (siteConfig?.cms?.settings?.newsPage ?? null) as CmsNewsPageSettings | null

if (renderNewsArticles) {
  await usePublicArticles()
}

</script>
