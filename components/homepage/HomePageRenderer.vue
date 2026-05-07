<template>
  <div class="bg-base-100">
    <HomeHeroSection v-if="content.hero.enabled" :content="content" :locale="locale" :editable="editable" @edit="$emit('edit', $event)" />

    <template v-for="section in enabledSections" :key="section.id">
      <HomeTwoColumnsSection
        v-if="section.type === 'two-columns'"
        :section="section"
        :locale="locale"
        :editable="editable"
        @edit="$emit('edit', $event)"
      />
      <HomeOneColumnSection
        v-else
        :section="section"
        :locale="locale"
        :editable="editable"
        @edit="$emit('edit', $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { HomePageContent } from '~/shared/homePage'
import type { HomePageEditTarget } from '~/shared/homePageEditor'
import HomeHeroSection from '~/components/homepage/HomeHeroSection.vue'
import HomeOneColumnSection from '~/components/homepage/HomeOneColumnSection.vue'
import HomeTwoColumnsSection from '~/components/homepage/HomeTwoColumnsSection.vue'

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
