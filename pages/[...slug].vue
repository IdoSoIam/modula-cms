<template>
  <CmsResolvedPageView v-if="resolvedPage" :resolved-page="resolvedPage" />
</template>

<script setup lang="ts">
import type { ResolvedCmsPage } from '~/shared/cms'
import CmsResolvedPageView from '~/components/cms/CmsResolvedPageView.vue'

const route = useRoute()
const segments = computed(() => {
  const value = route.params.slug
  if (Array.isArray(value)) return value
  if (typeof value === 'string') return [value]
  return []
})
const cmsPath = computed(() => `/${segments.value.join('/')}`.replace(/\/+/g, '/'))
const { locale } = useI18n()

const { data: resolvedPage, error } = await useFetch<ResolvedCmsPage>('/api/cms/resolve', {
  query: computed(() => ({
    path: cmsPath.value,
    locale: locale.value
  }))
})

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || 'Page introuvable'
  })
}
</script>
