<template>
  <FloatingDropdown trigger-class="btn btn-ghost btn-sm gap-2" :width="208" close-on-select>
    <template #trigger>
      <Icon name="mdi:translate" size="20" />
      {{ currentLabel }}
      <Icon name="mdi:chevron-down" size="20" />
    </template>
    <ul class="menu w-full">
      <li v-for="item in availableLocales" :key="item.code">
        <button type="button" class="text-left text-base-content" @click="handleChange(item.code)">
          {{ item.label }}
        </button>
      </li>
    </ul>
  </FloatingDropdown>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** 'admin' → utilise i18n (fr/en). 'public' → utilise le système de locale de contenu (dynamique). */
  context?: 'admin' | 'public'
}>(), {
  context: 'public'
})

/* ---------- i18n (admin) ---------- */
const { locale: i18nLocale } = useI18n()

/* ---------- Contenu (public) ---------- */
const { contentLocale, setContentLocale, availableLocales: cmsLocales, localeLabels } = useContentLocale()

function getLocaleLabel(code: string): string {
  if (localeLabels.value[code]?.long) return localeLabels.value[code].long
  return code.toUpperCase()
}

function getLocaleShortLabel(code: string): string {
  if (localeLabels.value[code]?.short) return localeLabels.value[code].short
  return getLocaleLabel(code)
}

/* ---------- Locales disponibles ---------- */
const availableLocales = computed(() => {
  if (props.context === 'admin') {
    // Admin : seulement fr/en via i18n
    return ['fr', 'en']
      .filter((code) => code !== i18nLocale.value)
      .map((code) => ({ code, label: getLocaleLabel(code) }))
  }
  // Public : toutes les langues configurées
  return cmsLocales.value
    .filter((code: string) => code !== contentLocale.value)
    .map((code: string) => ({ code, label: getLocaleLabel(code) }))
})

const currentLabel = computed(() => {
  const code = props.context === 'admin' ? i18nLocale.value : contentLocale.value
  return getLocaleShortLabel(code)
})

/* ---------- Changement de langue ---------- */
function handleChange(code: string) {
  if (props.context === 'admin') {
    i18nLocale.value = code as 'fr' | 'en'
  } else {
    void setContentLocale(code)
  }
}
</script>
