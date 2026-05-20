<template>
  <div class="bg-base-100">
    <NewsListPage
      v-if="showApplication && resolvedPage.rendererKey === 'news' && resolvedPage.applicationPosition === 'BEFORE_CONTENT'"
      v-bind="newsPageProps"
    />
    <BasketsPage
      v-else-if="showApplication && resolvedPage.rendererKey === 'baskets' && resolvedPage.applicationPosition === 'BEFORE_CONTENT'"
      v-bind="basketsPageProps"
    />

    <PageRenderer
      v-if="showContent"
      :content="resolvedPage.content"
      :locale="locale"
      :editable="editable"
      @edit="$emit('edit', $event)"
    />

    <NewsListPage
      v-if="showApplication && resolvedPage.rendererKey === 'news' && resolvedPage.applicationPosition === 'AFTER_CONTENT'"
      v-bind="newsPageProps"
    />
    <BasketsPage
      v-else-if="showApplication && resolvedPage.rendererKey === 'baskets' && resolvedPage.applicationPosition === 'AFTER_CONTENT'"
      v-bind="basketsPageProps"
    />

  </div>
</template>

<script setup lang="ts">
import type { ResolvedCmsPage } from '~/shared/cms'
import type { PageBuilderEditTarget } from '~/shared/pageBuilderEditor'
import PageRenderer from '~/components/page-builder/PageRenderer.vue'
import BasketsPage from '~/components/pages/BasketsPage.vue'
import NewsListPage from '~/components/pages/NewsListPage.vue'

const props = defineProps<{
  resolvedPage: ResolvedCmsPage
  locale: string
  editable?: boolean
}>()

defineEmits<{
  edit: [target: PageBuilderEditTarget]
}>()

const siteConfig = await useSiteConfig()
const cmsSettings = computed(() => siteConfig.value?.cms?.settings)
const newsShowArticles = siteConfig.value?.facebookFluxDeactivated === true

const basketsPageProps = computed(() => ({
  settings: cmsSettings.value?.basketsPage ?? null
}))

const newsPageProps = computed(() => ({
  settings: cmsSettings.value?.newsPage ?? null,
  showArticles: newsShowArticles
}))

const showContent = computed(() =>
  props.resolvedPage.pageType !== 'APPLICATION'
  && Array.isArray(props.resolvedPage.content.sections)
  && props.resolvedPage.content.sections.length > 0
)

const showApplication = computed(() =>
  (props.resolvedPage.pageType === 'APPLICATION' || props.resolvedPage.pageType === 'HYBRID')
  && (props.resolvedPage.rendererKey === 'news' || props.resolvedPage.rendererKey === 'baskets')
)
</script>
