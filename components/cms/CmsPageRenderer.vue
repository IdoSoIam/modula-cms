<template>
  <div class="bg-base-100">
    <component
      :is="applicationComponent"
      v-if="showApplication && resolvedPage.applicationPosition === 'BEFORE_CONTENT'"
    />

    <PageRenderer
      v-if="showContent"
      :content="resolvedPage.content"
      :locale="locale"
      :editable="editable"
      @edit="$emit('edit', $event)"
    />

    <component
      :is="applicationComponent"
      v-if="showApplication && resolvedPage.applicationPosition === 'AFTER_CONTENT'"
    />
  </div>
</template>

<script setup lang="ts">
import type { ResolvedCmsPage } from '~/shared/cms'
import type { PageBuilderEditTarget } from '~/shared/pageBuilderEditor'
import PageRenderer from '~/components/page-builder/PageRenderer.vue'
import BasketsPage from '~/components/pages/BasketsPage.vue'

const props = defineProps<{
  resolvedPage: ResolvedCmsPage
  locale: string
  editable?: boolean
}>()

defineEmits<{
  edit: [target: PageBuilderEditTarget]
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
