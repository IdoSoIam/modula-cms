<template>
  <div class="bg-base-100">
    <HomeHeroSection v-if="content.hero.enabled" :content="content" :locale="locale" />

    <template v-for="section in enabledSections" :key="section.id">
      <HomeTwoColumnsSection
        v-if="section.type === 'two-columns'"
        :section="section"
        :locale="locale"
      />
      <HomeOneColumnSection
        v-else
        :section="section"
        :locale="locale"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { HomePageContent } from '~/shared/homePage'
import HomeHeroSection from '~/components/homepage/HomeHeroSection.vue'
import HomeOneColumnSection from '~/components/homepage/HomeOneColumnSection.vue'
import HomeTwoColumnsSection from '~/components/homepage/HomeTwoColumnsSection.vue'

const props = defineProps<{
  content: HomePageContent
  locale: string
}>()

const enabledSections = computed(() => props.content.sections.filter(section => section.enabled))
</script>
