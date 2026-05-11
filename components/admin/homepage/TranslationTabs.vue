<template>
  <div class="form-control">
    <div class="mb-2 flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <label class="label py-0">
          <span class="label-text">{{ label }}</span>
        </label>
        <select
          v-if="size"
          :value="size"
          class="select select-xs select-bordered w-auto min-w-20"
          @change="$emit('update:size', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="entry in TYPOGRAPHY_SIZES" :key="entry" :value="entry">
            {{ TYPOGRAPHY_SIZE_LABELS[entry] }}
          </option>
        </select>
      </div>

      <div class="tabs tabs-box tabs-xs">
        <button class="tab" :class="activeLang === 'fr' ? 'tab-active' : ''" @click="activeLang = 'fr'">FR</button>
        <button class="tab" :class="activeLang === 'en' ? 'tab-active' : ''" @click="activeLang = 'en'">EN</button>
      </div>
    </div>

    <textarea
      v-if="multiline"
      v-model="modelValue[activeLang]"
      class="textarea textarea-bordered w-full"
      rows="3"
    />
    <input
      v-else
      v-model="modelValue[activeLang]"
      class="input input-bordered w-full"
    >
  </div>
</template>

<script setup lang="ts">
import type { LocalizedText, TypographySize } from '~/shared/homePage'
import { TYPOGRAPHY_SIZES, TYPOGRAPHY_SIZE_LABELS } from '~/shared/homePage'

defineProps<{
  modelValue: LocalizedText
  label: string
  size?: TypographySize
  multiline?: boolean
}>()

defineEmits<{
  'update:size': [value: string]
}>()

const activeLang = ref<'fr' | 'en'>('fr')
</script>
