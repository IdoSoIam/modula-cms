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
        <button type="button" class="tab" :class="activeLang === 'fr' ? 'tab-active' : ''" @click="activeLang = 'fr'">FR</button>
        <button type="button" class="tab" :class="activeLang === 'en' ? 'tab-active' : ''" @click="activeLang = 'en'">EN</button>
      </div>
    </div>

    <textarea
      v-if="multiline"
      :value="modelValue[activeLang]"
      class="textarea textarea-bordered w-full"
      rows="3"
      @input="updateLocalizedValue(activeLang, ($event.target as HTMLTextAreaElement).value)"
    />
    <input
      v-else
      :value="modelValue[activeLang]"
      class="input input-bordered w-full"
      @input="updateLocalizedValue(activeLang, ($event.target as HTMLInputElement).value)"
    >
  </div>
</template>

<script setup lang="ts">
import type { LocalizedText, TypographySize } from '~/shared/homePage'
import { TYPOGRAPHY_SIZES, TYPOGRAPHY_SIZE_LABELS } from '~/shared/homePage'

const props = defineProps<{
  modelValue: LocalizedText
  label: string
  size?: TypographySize
  multiline?: boolean
}>()

const emit = defineEmits<{
  'update:size': [value: string]
  'update:modelValue': [value: LocalizedText]
}>()

const activeLang = ref<'fr' | 'en'>('fr')

const updateLocalizedValue = (lang: 'fr' | 'en', value: string) => {
  props.modelValue[lang] = value
  emit('update:modelValue', {
    ...props.modelValue,
    [lang]: value
  })
}
</script>
