<template>
  <section class="min-w-0 rounded-box border border-base-300 bg-base-100 p-5" :aria-busy="loading">
    <h2 class="mb-5 text-lg font-semibold">{{ title }}</h2>
    <div v-if="loading" class="skeleton h-36 w-full" />
    <AdminDashboardDashboardEmptyState v-else-if="!total" :label="emptyLabel" />
    <dl v-else class="space-y-4">
      <div v-for="item in items" :key="item.label">
        <div class="mb-1 flex justify-between gap-3">
          <dt>{{ item.label }}</dt>
          <dd class="tabular-nums">{{ item.value.toLocaleString(locale) }}</dd>
        </div>
        <div class="h-2 overflow-hidden rounded bg-base-200" aria-hidden="true">
          <div class="h-full bg-primary" :style="{ width: `${item.value / total * 100}%` }" />
        </div>
      </div>
    </dl>
  </section>
</template>
<script setup lang="ts">
import AdminDashboardDashboardEmptyState from './DashboardEmptyState.vue'
const props = defineProps<{ title: string; items: Array<{ label: string; value: number }>; emptyLabel: string; loading?: boolean }>()
const { locale } = useI18n()
const total = computed(() => props.items.reduce((sum, item) => sum + item.value, 0))
</script>
