import type { Ref } from 'vue'

interface AutoTranslateOptions {
  /** Ref contenant toutes les locales (source + cibles). La composante écrit les traductions dedans. */
  value: Ref<Record<string, string>>
  /** Locale source (celle que l'utilisateur édite). */
  sourceLocale: Ref<string> | string
  /** Locales disponibles (toutes). Celle source sera exclue automatiquement. */
  availableLocales: Ref<string[]> | string[]
  debounceMs?: number
  context?: string
}

export function useAutoTranslate(options: AutoTranslateOptions) {
  console.log('[useAutoTranslate] init', {
    sourceLocale: typeof options.sourceLocale === 'string' ? options.sourceLocale : options.sourceLocale.value,
    available: Array.isArray(options.availableLocales) ? options.availableLocales : options.availableLocales.value,
    context: options.context,
  })

  const translating = ref(false)
  const { value, debounceMs = 1000, context } = options

  const sourceLocale = computed(() => {
    if (typeof options.sourceLocale === 'string') return options.sourceLocale
    return options.sourceLocale.value
  })

  const availableLocales = computed(() => {
    if (Array.isArray(options.availableLocales)) return options.availableLocales
    return options.availableLocales.value
  })

  const lastSource = ref('')
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => {
      const v = value.value[sourceLocale.value]
      console.log('[useAutoTranslate] watch eval', { source: sourceLocale.value, val: v })
      return v
    },
    (newVal, oldVal) => {
      console.log('[useAutoTranslate] watch fired', { newVal, oldVal, source: sourceLocale.value })

      if (debounceTimer) clearTimeout(debounceTimer)
      if (!newVal?.trim()) {
        console.log('[useAutoTranslate] empty source, skip')
        return
      }

      debounceTimer = setTimeout(async () => {
        const text = newVal.trim()
        if (text === lastSource.value) {
          console.log('[useAutoTranslate] same text, skip')
          return
        }
        lastSource.value = text

        const source = sourceLocale.value
        const allLocales = availableLocales.value
        const emptyTargets = allLocales.filter((l) => l !== source && !value.value[l]?.trim())

        console.log('[useAutoTranslate] targets to fill', { source, text, emptyTargets })

        if (!emptyTargets.length) {
          console.log('[useAutoTranslate] no empty targets')
          return
        }

        translating.value = true
        try {
          const result: { translations?: Record<string, string> } = await $fetch('/api/admin/translate', {
            method: 'POST',
            body: {
              text,
              sourceLocale: source,
              targetLocales: emptyTargets,
              context: context || undefined,
            },
          })

          console.log('[useAutoTranslate] API result', result)

          if (result?.translations) {
            const next = { ...value.value }
            let changed = false
            for (const [locale, translated] of Object.entries(result.translations)) {
              if (translated && !next[locale]?.trim()) {
                console.log('[useAutoTranslate] fill', { locale, translated })
                next[locale] = translated
                changed = true
              }
            }
            if (changed) {
              console.log('[useAutoTranslate] emit updated', next)
              value.value = next
            }
          }
        } catch (err) {
          console.error('[useAutoTranslate] API error', err)
        } finally {
          translating.value = false
        }
      }, debounceMs)
    },
    { deep: true },
  )

  return { translating }
}
