<template>
  <div class="bg-base-100">
    <PageColumnsSection
      v-for="(section, sectionIndex) in enabledSections"
      :key="section.id"
      :section="section"
      :sections="content.sections"
      :section-index="content.sections.findIndex(item => item.id === section.id)"
      :locale="locale"
      :editable="editable"
      :priority="sectionIndex === 0"
      @edit="$emit('edit', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { PageBuilderContent } from '~/shared/pageBuilder'
import type { PageBuilderEditTarget } from '~/shared/pageBuilderEditor'
import PageColumnsSection from '~/components/page-builder/PageColumnsSection.vue'

const props = defineProps<{
  content: PageBuilderContent
  locale: string
  editable?: boolean
}>()

defineEmits<{
  edit: [target: PageBuilderEditTarget]
}>()

const enabledSections = computed(() => props.content.sections.filter(section => section.enabled))
</script>
