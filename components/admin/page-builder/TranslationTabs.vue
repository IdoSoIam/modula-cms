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

      <div class="flex items-center gap-2">
        <span v-if="translating" class="loading loading-spinner loading-xs text-primary" />
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
    </div>

    <textarea
      v-if="multiline"
      :value="localValue[activeLang]"
      class="textarea textarea-bordered w-full"
      rows="3"
      @input="updateLocalizedValue(activeLang, ($event.target as HTMLTextAreaElement).value)"
    />
    <input
      v-else
      :value="localValue[activeLang]"
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

/* ---- Réf locale synchro + auto-traduction ---- */

// Ref locale éditable qui sert de source de vérité pour le contenu
const localValue = ref<LocalizedText>({ ...props.modelValue })

// Évite les boucles : on ne ré-écrit localValue depuis la prop que si les valeurs diffèrent
function deepEqual(a: Record<string, string>, b: Record<string, string>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) {
    if ((a[k] ?? '') !== (b[k] ?? '')) return false
  }
  return true
}

// Synchro prop → localValue (changements externes)
watch(() => props.modelValue, (val) => {
  if (!deepEqual(localValue.value, val)) {
    localValue.value = { ...val }
  }
}, { deep: true, immediate: true })

// Synchro localValue → parent (via emit)
watch(localValue, (val) => {
  if (!deepEqual(val, props.modelValue)) {
    emit('update:modelValue', { ...val })
  }
}, { deep: true })

// Auto-traduction LLM depuis la langue active vers les langues cibles vides
const { translating } = useAutoTranslate({
  value: localValue,
  sourceLocale: activeLang,
  availableLocales: resolvedLocales,
  debounceMs: 1000,
  context: props.label
})

function updateLocalizedValue(lang: string, value: string) {
  localValue.value = { ...localValue.value, [lang]: value }
}
</script>
