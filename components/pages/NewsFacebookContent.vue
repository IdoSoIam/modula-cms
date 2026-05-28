<template>
  <ClientOnly>
    <FacebookFeed />
    <template #fallback>
      <div class="py-12 text-center">
        <span class="loading loading-spinner loading-lg" />
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import FacebookFeed from '#modula/components/FacebookFeed.vue'
</script>
