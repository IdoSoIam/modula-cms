<script setup lang="ts">
import FacebookFeed from '~/components/FacebookFeed.vue'

definePageMeta({
  layout: 'default',
  title: 'Actualités',
  description: 'Suivez nos dernières actualités et mises à jour'
})
</script>

<template>
  <div class="min-h-screen bg-base-100">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold text-center mb-8">{{ $t('pages.news.title') }}</h1>
      
      <div class="max-w-3xl mx-auto">
        <FacebookFeed />
      </div>
    </div>
  </div>
</template>
