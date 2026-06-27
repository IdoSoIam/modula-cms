import type { Ref } from 'vue'

interface AutoTranslateOptions {
  sourceValue: Ref<Record<string, string>>
  targetValue: Ref<Record<string, string>>
  sourceLocale: string
  targetLocales: string[]
  debounceMs?: number
  context?: string
}

export function useAutoTranslate(options: AutoTranslateOptions) {
  const translating = ref(false)
  const { sourceValue, targetValue, sourceLocale, targetLocales, debounceMs = 800, context } = options

  const lastSource = ref('')

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  watch(
    () => sourceValue.value[sourceLocale],
    (newVal) => {
      if (debounceTimer) clearTimeout(debounceTimer)

      if (!newVal?.trim()) return

      debounceTimer = setTimeout(async () => {
        const text = newVal.trim()
        if (text === lastSource.value) return
        lastSource.value = text

        const emptyTargets = targetLocales.filter(l => {
          if (l === sourceLocale) return false
          return !targetValue.value[l]?.trim()
        })

        if (!emptyTargets.length) return

        translating.value = true
        try {
          const { data } = await useFetch('/api/admin/translate', {
            method: 'POST',
            body: {
              text,
              sourceLocale,
              targetLocales: emptyTargets,
              context: context || undefined
            },
            immediate: false,
            watch: false
          })

          if (data.value?.translations) {
            for (const [locale, translated] of Object.entries(data.value.translations)) {
              if (translated && !targetValue.value[locale]?.trim()) {
                targetValue.value[locale] = translated
              }
            }
          }
        } catch {
          // silence — translation is optional
        } finally {
          translating.value = false
        }
      }, debounceMs)
    },
    { deep: true }
  )

  return { translating }
}
