function normalizeLocaleCode(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

function normalizePublicPath(value: string | null | undefined) {
  const source = String(value || "/").trim();
  if (!source || source === "/") return "/";
  return `/${source.replace(/^\/+|\/+$/g, "")}`;
}

function isLocaleLikeSegment(value: string | null | undefined) {
  return /^[a-z]{2}(?:-[a-z]{2})?$/i.test(String(value || "").trim());
}

function stripLocalePrefix(path: string, availableLocales: string[]) {
  const normalizedPath = normalizePublicPath(path);
  const segments = normalizedPath.split("/").filter(Boolean);
  if (segments.length === 0) return "/";
  const firstSegment = normalizeLocaleCode(segments[0]);
  if (!firstSegment || !isLocaleLikeSegment(firstSegment)) return normalizedPath;
  if (!availableLocales.includes(firstSegment)) return normalizedPath;
  const [, ...rest] = segments;
  return rest.length > 0 ? `/${rest.join("/")}` : "/";
}

/**
 * Locale de contenu publique, indépendante de l'i18n Nuxt.
 * L'admin utilise aussi la couche i18n interne du CMS.
 * Le public utilise des URL sans préfixe pour la langue par défaut,
 * et /en/... /de/... pour les autres langues.
 */
export function useContentLocale() {
  const route = useRoute();
  const cookie = useCookie<string>("cms_content_locale", {
    default: () => "fr",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  const siteConfig = useSiteConfigState();
  const { locales: adminLocales } = useSiteLocales();

  const availableLocales = computed<string[]>(() => {
    if (siteConfig.value?.siteLocales?.length) {
      return siteConfig.value.siteLocales.map((locale) => normalizeLocaleCode(locale)).filter(Boolean);
    }
    if (adminLocales.value.length > 0) {
      return adminLocales.value.map((locale) => normalizeLocaleCode(locale)).filter(Boolean);
    }
    return ["fr", "en"];
  });

  const localeLabels = computed<Record<string, { short: string; long: string }>>(
    () => siteConfig.value?.localeLabels ?? {},
  );

  const defaultLocale = computed(() => {
    const configured = normalizeLocaleCode(siteConfig.value?.siteDefaultLocale || siteConfig.value?.project?.defaultLocale || siteConfig.value?.siteLocales?.[0]);
    if (configured && availableLocales.value.includes(configured)) return configured;
    return availableLocales.value[0] ?? "fr";
  });

  const routeLocale = computed(() => {
    const firstSegment = route.path.split("?")[0]?.split("/").filter(Boolean)[0] ?? "";
    const normalized = normalizeLocaleCode(firstSegment);
    if (!normalized || !isLocaleLikeSegment(normalized)) return null;
    if (availableLocales.value.includes(normalized)) return normalized;
    return null;
  });

  const pathWithoutLocale = computed(() => stripLocalePrefix(route.path || "/", availableLocales.value));

  const contentLocale = computed({
    get: () => {
      if (routeLocale.value && availableLocales.value.includes(routeLocale.value)) {
        return routeLocale.value;
      }
      return defaultLocale.value;
    },
    set: (value: string) => {
      const normalized = normalizeLocaleCode(value);
      if (!normalized) return;
      cookie.value = normalized;
    },
  });

  watch(
    () => contentLocale.value,
    (value) => {
      const normalized = normalizeLocaleCode(value);
      if (normalized && cookie.value !== normalized) {
        cookie.value = normalized;
      }
    },
    { immediate: true },
  );

  function buildPublicLocalePath(path = pathWithoutLocale.value, locale = contentLocale.value) {
    const normalizedLocale = normalizeLocaleCode(locale) || defaultLocale.value;
    const normalizedPath = stripLocalePrefix(path, availableLocales.value);

    if (normalizedLocale === defaultLocale.value) {
      return normalizedPath;
    }

    if (normalizedPath === "/") {
      return `/${normalizedLocale}`;
    }

    return `/${normalizedLocale}${normalizedPath}`;
  }

  async function setContentLocale(locale: string) {
    const normalized = normalizeLocaleCode(locale);
    if (!normalized || !availableLocales.value.includes(normalized)) return;
    contentLocale.value = normalized;
    await navigateTo({
      path: buildPublicLocalePath(pathWithoutLocale.value, normalized),
      query: route.query,
      hash: route.hash,
    });
  }

  return {
    contentLocale,
    setContentLocale,
    availableLocales,
    localeLabels,
    defaultLocale,
    routeLocale,
    pathWithoutLocale,
    buildPublicLocalePath,
  };
}
