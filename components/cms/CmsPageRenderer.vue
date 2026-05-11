<template>
  <div class="bg-base-100">
    <component
      :is="applicationComponent"
      v-if="showApplication && resolvedPage.applicationPosition === 'BEFORE_CONTENT'"
    />

    <HomePageRenderer
      v-if="showContent"
      :content="resolvedPage.content"
      :locale="locale"
    />

    <component
      :is="applicationComponent"
      v-if="showApplication && resolvedPage.applicationPosition === 'AFTER_CONTENT'"
    />
  </div>
</template>

<script setup lang="ts">
import type { ResolvedCmsPage } from '~/shared/cms'
import HomePageRenderer from '~/components/homepage/HomePageRenderer.vue'
import BasketsPage from '~/components/pages/BasketsPage.vue'

const props = defineProps<{
  resolvedPage: ResolvedCmsPage
  locale: string
}>()

const applicationComponent = computed(() => {
  switch (props.resolvedPage.rendererKey) {
    case 'baskets':
      return BasketsPage
    default:
      return null
  }
})

const showContent = computed(() =>
  props.resolvedPage.pageType !== 'APPLICATION'
  && Array.isArray(props.resolvedPage.content.sections)
  && props.resolvedPage.content.sections.length > 0
)

const showApplication = computed(() =>
  (props.resolvedPage.pageType === 'APPLICATION' || props.resolvedPage.pageType === 'HYBRID')
  && Boolean(applicationComponent.value)
)
</script>
