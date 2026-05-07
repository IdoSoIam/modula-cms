<template>
  <HomePageRenderer v-if="homePageContent" :content="homePageContent" :locale="locale" />
</template>

<script setup lang="ts">
import type { HomePageContent } from '~/shared/homePage'
import HomePageRenderer from '~/components/homepage/HomePageRenderer.vue'

const { locale } = useI18n()
const { data: homePageContent } = await useFetch<HomePageContent>('/api/home-page')

usePageSeo({
  title: computed(() => locale.value === 'en' ? 'Organic vegetables, baskets and farm pickup' : 'Légumes bio, paniers et vente à la ferme'),
  description: computed(() => locale.value === 'en'
    ? 'Discover seasonal organic vegetables, farm pickup and local basket reservations at Ferme du Campeyrigoux.'
    : 'Découvrez les légumes bio de saison, la vente à la ferme et la réservation de paniers à la Ferme du Campeyrigoux.')
})
</script>
