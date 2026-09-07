<template>
  <div class="min-w-0 rounded-box border border-base-300 bg-base-100 p-5" :aria-busy="loading">
    <h2 class="text-sm text-base-content/70">{{ label }}</h2>
    <div v-if="loading" class="skeleton mt-3 h-9 w-20" />
    <p v-else class="mt-3 text-3xl font-semibold tabular-nums">{{ value?.toLocaleString(locale) ?? '—' }}</p>
  </div>
</template>
<script setup lang="ts">
defineProps<{ label: string; value?: number; loading?: boolean }>()
const { locale } = useI18n()
</script>
