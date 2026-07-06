<template>
  <div class="bg-base-100">
    <NewsListPage
      v-if="showApplication && isRendererEnabled(resolvedPage.rendererKey) && resolvedPage.rendererKey === 'news' && resolvedPage.applicationPosition === 'BEFORE_CONTENT'"
      v-bind="newsPageProps"
    />
    <ShopPage
      v-else-if="showApplication && isRendererEnabled(resolvedPage.rendererKey) && resolvedPage.rendererKey === 'shop' && resolvedPage.applicationPosition === 'BEFORE_CONTENT'"
      v-bind="shopPageProps"
    />
    <EventsPage
      v-else-if="showApplication && isRendererEnabled(resolvedPage.rendererKey) && resolvedPage.rendererKey === 'events' && resolvedPage.applicationPosition === 'BEFORE_CONTENT'"
      v-bind="eventsPageProps"
    />
    <PlanningPage
      v-else-if="showApplication && isRendererEnabled(resolvedPage.rendererKey) && resolvedPage.rendererKey === 'planning' && resolvedPage.applicationPosition === 'BEFORE_CONTENT'"
      v-bind="planningPageProps"
    />

    <PageRenderer
      v-if="showContent"
      :content="resolvedPage.content"
      :locale="locale"
      :editable="editable"
      @edit="$emit('edit', $event)"
    />

    <NewsListPage
      v-if="showApplication && isRendererEnabled(resolvedPage.rendererKey) && resolvedPage.rendererKey === 'news' && resolvedPage.applicationPosition === 'AFTER_CONTENT'"
      v-bind="newsPageProps"
    />
    <ShopPage
      v-else-if="showApplication && isRendererEnabled(resolvedPage.rendererKey) && resolvedPage.rendererKey === 'shop' && resolvedPage.applicationPosition === 'AFTER_CONTENT'"
      v-bind="shopPageProps"
    />
    <EventsPage
      v-else-if="showApplication && isRendererEnabled(resolvedPage.rendererKey) && resolvedPage.rendererKey === 'events' && resolvedPage.applicationPosition === 'AFTER_CONTENT'"
      v-bind="eventsPageProps"
    />
    <PlanningPage
      v-else-if="showApplication && isRendererEnabled(resolvedPage.rendererKey) && resolvedPage.rendererKey === 'planning' && resolvedPage.applicationPosition === 'AFTER_CONTENT'"
      v-bind="planningPageProps"
    />

  </div>
</template>

<script setup lang="ts">
import { pickCmsLocalizedText } from '#modula/shared/cms'
import type { ResolvedCmsPage } from '#modula/shared/cms'
import type { PageBuilderEditTarget } from '#modula/shared/pageBuilderEditor'
import PageRenderer from '#modula/components/page-builder/PageRenderer.vue'
import EventsPage from '#modula/components/pages/EventsPage.vue'
import NewsListPage from '#modula/components/pages/NewsListPage.vue'
import PlanningPage from '#modula/components/pages/PlanningPage.vue'
import ShopPage from '#modula/components/pages/ShopPage.vue'

const props = defineProps<{
  resolvedPage: ResolvedCmsPage
  locale: string
  editable?: boolean
}>()

defineEmits<{
  edit: [target: PageBuilderEditTarget]
}>()

const initialSiteConfig = await ensureSiteConfigState({ locale: props.locale })
const siteConfig = useSiteConfigState()
const cmsSettings = computed(() => siteConfig.value?.cms?.settings ?? initialSiteConfig?.cms?.settings)
const featureFlags = computed(() => siteConfig.value?.featureFlags ?? initialSiteConfig?.featureFlags)
const isRendererEnabled = (rendererKey: string) => {
  const flags = featureFlags.value
  if (!flags) return true
  if (rendererKey === 'news') return flags.newsEnabled
  if (rendererKey === 'events' || rendererKey === 'planning') return flags.eventsEnabled
  if (rendererKey === 'shop') return flags.shop.enabled
  return true
}

const shopPageProps = computed(() => ({
  settings: cmsSettings.value?.basketsPage ?? null,
  pageTitleOverride: props.resolvedPage.title ?? '',
  pageSubtitleOverride: pickCmsLocalizedText(props.locale, cmsSettings.value?.basketsPage?.subtitle) || ''
}))

const newsPageProps = computed(() => ({
  settings: cmsSettings.value?.newsPage ?? null,
  pageTitleOverride: props.resolvedPage.title ?? '',
  pageSubtitleOverride: pickCmsLocalizedText(props.locale, cmsSettings.value?.newsPage?.subtitle) || '',
  showArticles: true
}))

const eventsPageProps = computed(() => ({
  settings: cmsSettings.value?.eventsPage ?? null,
  pageTitleOverride: props.resolvedPage.title ?? '',
  pageSubtitleOverride: pickCmsLocalizedText(props.locale, cmsSettings.value?.eventsPage?.subtitle) || ''
}))

const planningPageProps = computed(() => ({
  settings: cmsSettings.value?.planningPage ?? null,
  pageTitleOverride: props.resolvedPage.title ?? '',
  pageSubtitleOverride: pickCmsLocalizedText(props.locale, cmsSettings.value?.planningPage?.subtitle) || ''
}))

const showContent = computed(() =>
  props.resolvedPage.pageType !== 'APPLICATION'
  && Array.isArray(props.resolvedPage.content.sections)
  && props.resolvedPage.content.sections.length > 0
)

const showApplication = computed(() =>
  (props.resolvedPage.pageType === 'APPLICATION' || props.resolvedPage.pageType === 'HYBRID')
  && (props.resolvedPage.rendererKey === 'news' || props.resolvedPage.rendererKey === 'shop' || props.resolvedPage.rendererKey === 'events' || props.resolvedPage.rendererKey === 'planning')
)
</script>
