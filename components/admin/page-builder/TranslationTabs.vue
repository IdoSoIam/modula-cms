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
        <button
          v-for="locale in resolvedLocales"
          :key="locale"
          type="button"
          class="tab"
          :class="activeLang === locale ? 'tab-active' : ''"
          @click="activeLang = locale"
        >
          {{ locale.toUpperCase() }}
        </button>
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
import type { LocalizedText, TypographySize } from '#modula/shared/pageBuilder'
import { TYPOGRAPHY_SIZES, TYPOGRAPHY_SIZE_LABELS } from '#modula/shared/pageBuilder'

const props = defineProps<{
  modelValue: LocalizedText
  label: string
  size?: TypographySize
  multiline?: boolean
  locales?: string[]
}>()

const emit = defineEmits<{
  'update:size': [value: string]
  'update:modelValue': [value: LocalizedText]
}>()

const { locales: siteLocales } = useSiteLocales()
const resolvedLocales = computed(() => props.locales?.length ? props.locales : (siteLocales.value.length ? siteLocales.value : ['fr', 'en']))
const activeLang = ref<string>(resolvedLocales.value[0] || 'fr')

watch(resolvedLocales, (newLocales) => {
  if (!activeLang.value || !newLocales.includes(activeLang.value)) {
    activeLang.value = newLocales[0] || 'fr'
  }
})

const updateLocalizedValue = (lang: string, value: string) => {
  props.modelValue[lang] = value
  emit('update:modelValue', {
    ...props.modelValue,
    [lang]: value
  })
}
</script>
