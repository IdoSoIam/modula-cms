<template>
  <CmsResolvedPageView v-if="resolvedPage" :resolved-page="resolvedPage" />
</template>

<script setup lang="ts">
definePageMeta({
  i18n: false,
})

import type { ResolvedCmsPage } from '#modula/shared/cms'
import CmsResolvedPageView from '#modula/components/cms/CmsResolvedPageView.vue'

const { contentLocale, pathWithoutLocale } = useContentLocale()

const { data: resolvedPage, error } = await useFetch<ResolvedCmsPage>('/api/cms/resolve', {
  key: computed(() => `cms-entry:${pathWithoutLocale.value}:${contentLocale.value}`),
  query: computed(() => ({
    path: pathWithoutLocale.value,
    locale: contentLocale.value
  })),
  watch: [contentLocale, pathWithoutLocale]
})

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode || 404,
    statusMessage: error.value.statusMessage || 'Page introuvable'
  })
}
</script>
