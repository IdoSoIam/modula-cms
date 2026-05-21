<template>
  <CmsResolvedPageView v-if="resolvedPage" :resolved-page="resolvedPage" />
</template>

<script setup lang="ts">
import type { ResolvedCmsPage } from '~/shared/cms'
import CmsResolvedPageView from '~/components/cms/CmsResolvedPageView.vue'

const { locale } = useI18n()

const { data: resolvedPage, error } = await useFetch<ResolvedCmsPage>('/api/cms/resolve', {
  query: computed(() => ({
    path: '/',
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
