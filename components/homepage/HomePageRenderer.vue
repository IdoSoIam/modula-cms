<template>
  <div class="bg-base-100">
    <HomeColumnsSection
      v-for="section in enabledSections"
      :key="section.id"
      :section="section"
      :sections="content.sections"
      :section-index="content.sections.findIndex(item => item.id === section.id)"
      :locale="locale"
      :editable="editable"
      @edit="$emit('edit', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { HomePageContent } from '~/shared/homePage'
import type { HomePageEditTarget } from '~/shared/homePageEditor'
import HomeColumnsSection from '~/components/homepage/HomeColumnsSection.vue'

const props = defineProps<{
  content: HomePageContent
  locale: string
  editable?: boolean
}>()

defineEmits<{
  edit: [target: HomePageEditTarget]
}>()

const enabledSections = computed(() => props.content.sections.filter(section => section.enabled))
</script>
