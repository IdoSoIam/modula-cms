<template>
  <CmsPageRenderer :resolved-page="resolvedPage" :locale="locale" />
</template>

<script setup lang="ts">
import type { ResolvedCmsPage } from '~/shared/cms'
import CmsPageRenderer from '~/components/cms/CmsPageRenderer.vue'

const props = defineProps<{
  resolvedPage: ResolvedCmsPage
}>()

const { locale } = useI18n()

usePageSeo({
  title: computed(() => props.resolvedPage.seo.metaTitle || props.resolvedPage.title),
  description: computed(() => props.resolvedPage.seo.metaDescription || ''),
  noindex: computed(() => props.resolvedPage.seo.noindex)
})
</script>
