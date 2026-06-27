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
        <button
          v-if="showAutoTranslateButton"
          type="button"
          class="btn btn-xs btn-outline"
          :disabled="translating"
          @click="translateMissingLocales"
        >
          <span v-if="translating" class="loading loading-spinner loading-xs" />
          <span v-else>Trad auto</span>
        </button>
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
const { $toast } = useNuxtApp() as any
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

const translating = ref(false)

const translationSourceLocale = computed(() => {
  if (localValue.value[activeLang.value]?.trim()) return activeLang.value
  return resolvedLocales.value.find((locale) => localValue.value[locale]?.trim()) || activeLang.value
})

const emptyTargetLocales = computed(() =>
  resolvedLocales.value.filter((locale) =>
    locale !== translationSourceLocale.value
    && !localValue.value[locale]?.trim()
  )
)

const showAutoTranslateButton = computed(() =>
  Boolean(localValue.value[translationSourceLocale.value]?.trim())
  && emptyTargetLocales.value.length > 0
)

function updateLocalizedValue(lang: string, value: string) {
  localValue.value = { ...localValue.value, [lang]: value }
}

async function translateMissingLocales() {
  const sourceLocale = translationSourceLocale.value
  const text = localValue.value[sourceLocale]?.trim()
  if (!text || !emptyTargetLocales.value.length) return

  translating.value = true
  try {
    const result = await $fetch<{ translations?: Record<string, string> }>('/api/admin/translate', {
      method: 'POST',
      body: {
        text,
        sourceLocale,
        targetLocales: emptyTargetLocales.value,
        context: props.label
      }
    })

    const next = { ...localValue.value }
    let changed = false
    for (const locale of emptyTargetLocales.value) {
      const translated = result?.translations?.[locale]?.trim()
      if (translated && !next[locale]?.trim()) {
        next[locale] = translated
        changed = true
      }
    }

    if (changed) {
      localValue.value = next
    }
  } catch (error: any) {
    $toast?.error(error?.data?.statusMessage || error?.statusMessage || 'Traduction impossible.')
  } finally {
    translating.value = false
  }
}
</script>
