<template>
  <details class="card group overflow-hidden bg-base-100 shadow-sm" :open="defaultOpen">
    <summary class="flex cursor-pointer list-none flex-col items-stretch justify-between gap-4 px-6 py-5 marker:content-none sm:flex-row sm:items-start">
      <div class="min-w-0">
        <h2 class="text-xl font-semibold">{{ title }}</h2>
        <p v-if="help" class="mt-1 text-sm opacity-70">{{ help }}</p>
      </div>
      <div class="flex shrink-0 items-center justify-end gap-3">
        <div v-if="$slots.actions" @click.stop>
          <slot name="actions" />
        </div>
        <Icon name="mdi:chevron-down" size="22" class="transition-transform group-open:rotate-180" />
      </div>
    </summary>
    <div class="border-t border-base-200 px-6 pb-6 pt-5">
      <slot />
    </div>
  </details>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    help?: string
    defaultOpen?: boolean
  }>(),
  {
    help: '',
    defaultOpen: false,
  },
)
</script>
