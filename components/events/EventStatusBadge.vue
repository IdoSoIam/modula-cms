<template>
  <span class="badge badge-outline" :class="colors[status]">{{ t('admin.eventsEditor.' + status) }}</span>
</template>
<script setup lang="ts">
import type { EventStatus } from '#modula/shared/events'
defineProps<{ status: EventStatus }>()
const { t } = useI18n()
const colors: Record<EventStatus, string> = { DRAFT: 'badge-ghost', PUBLISHED: 'badge-success', ARCHIVED: 'badge-neutral', CANCELLED: 'badge-error' }
</script>
