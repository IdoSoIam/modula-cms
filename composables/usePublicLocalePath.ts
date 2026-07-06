type PublicLocalePathTarget = {
  path?: string
  query?: Record<string, any>
  hash?: string
}

export function usePublicLocalePath() {
  const { buildPublicLocalePath } = useContentLocale()

  function localePath(target: string): string
  function localePath(target: PublicLocalePathTarget): PublicLocalePathTarget
  function localePath(target: string | PublicLocalePathTarget): string | PublicLocalePathTarget {
    if (typeof target === "string") {
      return buildPublicLocalePath(target)
    }

    return {
      ...target,
      path: buildPublicLocalePath(target.path || "/"),
    }
  }

  return localePath
}
