<template>
  <nav :aria-label="ariaLabelText" class="modula-card border border-base-300 bg-base-100 p-2 shadow-sm">
    <ol class="grid grid-cols-3 gap-1">
      <li v-for="step in steps" :key="step.id">
        <NuxtLink
          v-if="step.enabled"
          :to="step.to"
          class="flex min-h-12 items-center gap-2 rounded-field px-2 py-2 text-xs transition sm:px-4 sm:text-sm"
          :class="step.id === current ? 'bg-primary font-semibold text-primary-content' : 'hover:bg-base-200'"
          :aria-current="step.id === current ? 'step' : undefined"
        >
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border" :class="step.id === current ? 'border-primary-content/60' : 'border-base-content/25'">
            {{ step.number }}
          </span>
          <span class="hidden min-w-0 sm:block">{{ step.label }}</span>
        </NuxtLink>
        <div v-else class="flex min-h-12 items-center gap-2 rounded-field px-2 py-2 text-xs opacity-35 sm:px-4 sm:text-sm" aria-disabled="true">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-base-content/25">{{ step.number }}</span>
          <span class="hidden min-w-0 sm:block">{{ step.label }}</span>
        </div>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
defineProps<{
  current: 'cart' | 'information' | 'review'
  ariaLabelText: string
  steps: Array<{
    id: 'cart' | 'information' | 'review'
    number: number
    label: string
    to: string
    enabled: boolean
  }>
}>()
</script>
