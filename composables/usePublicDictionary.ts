function interpolatePublicText(template: string, params?: Record<string, string | number | null | undefined>) {
  if (!params) return template
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => String(params[key] ?? ''))
}

export function usePublicDictionary() {
  const siteConfig = useSiteConfigState()

  const dictionary = computed<Record<string, string>>(() => siteConfig.value?.publicDictionary ?? {})

  const publicText = (
    key: string,
    fallback: string,
    params?: Record<string, string | number | null | undefined>
  ) => {
    const source = dictionary.value[key] || fallback
    return interpolatePublicText(source, params)
  }

  return {
    dictionary,
    publicText,
  }
}
