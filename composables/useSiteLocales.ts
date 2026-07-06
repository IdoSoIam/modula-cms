export function useSiteLocales() {
  const siteConfig = useSiteConfigState()

  const locales = computed<string[]>(() => {
    const configured = Array.isArray(siteConfig.value?.siteLocales)
      ? siteConfig.value?.siteLocales ?? []
      : []

    return configured.length > 0 ? configured : ['fr', 'en']
  })

  const localeLabels = computed<Record<string, { short: string; long: string }>>(() => {
    return siteConfig.value?.localeLabels ?? {}
  })

  const loading = computed(() => !siteConfig.value)

  return { locales, localeLabels, loading }
}
