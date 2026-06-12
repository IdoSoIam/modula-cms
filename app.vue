<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { buildPublicDaisyUiThemeConfig, createDefaultDaisyUiThemeConfig } from '#modula/shared/themes'

const siteConfig = await useSiteConfig()
const inDevelopment = computed(() => siteConfig.value?.inDevelopment === true)
const defaultLocale = computed(() => siteConfig.value?.project?.defaultLocale || 'fr')
const faviconHref = computed(() => siteConfig.value?.cms?.settings.favicon.src || '/brand/modula-mark.svg')
const resolvedFaviconHref = computed(() => {
  const href = faviconHref.value
  const separator = href.includes('?') ? '&' : '?'
  return `${href}${separator}v=${encodeURIComponent(href)}`
})
const faviconType = computed(() => {
  if (faviconHref.value.endsWith('.svg')) return 'image/svg+xml'
  if (faviconHref.value.endsWith('.png')) return 'image/png'
  if (faviconHref.value.endsWith('.ico')) return 'image/x-icon'
  return undefined
})
const fallbackThemeConfig = buildPublicDaisyUiThemeConfig(createDefaultDaisyUiThemeConfig())
const themeConfig = computed(() => siteConfig.value?.themes ?? fallbackThemeConfig)
const defaultThemeName = computed(() => themeConfig.value.defaultTheme || 'modula-studio')
const validThemes = computed(() => themeConfig.value.allThemeNames?.length ? themeConfig.value.allThemeNames : ['modula-studio', 'modula-ocean', 'modula-noir', 'modula-sunset'])
const generatedThemeCss = computed(() => themeConfig.value.generatedCss || fallbackThemeConfig.generatedCss)
const preferredThemeCookie = useCookie<string | null>('theme', {
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 365
})
const initialThemeName = computed(() => {
  const cookieTheme = preferredThemeCookie.value
  if (cookieTheme && validThemes.value.includes(cookieTheme)) {
    return cookieTheme
  }
  return defaultThemeName.value
})

useHead(() => ({
  htmlAttrs: {
    'data-theme': initialThemeName.value
  },
  link: [
    {
      key: 'cms-favicon',
      rel: 'icon',
      href: resolvedFaviconHref.value,
      type: faviconType.value
    },
    {
      key: 'cms-shortcut-icon',
      rel: 'shortcut icon',
      href: resolvedFaviconHref.value,
      type: faviconType.value
    },
    {
      key: 'cms-apple-touch-icon',
      rel: 'apple-touch-icon',
      href: resolvedFaviconHref.value
    }
  ],
  style: generatedThemeCss.value ? [
    {
      key: 'dynamic-daisyui-themes',
      innerHTML: generatedThemeCss.value
    }
  ] : [],
  meta: inDevelopment.value ? [
    {
      name: 'robots',
      content: 'noindex, nofollow, noarchive, nosnippet, noimageindex'
    },
    {
      name: 'googlebot',
      content: 'noindex, nofollow, noarchive, nosnippet, noimageindex'
    }
  ] : [],
  script: [
    {
      key: 'theme-bootstrap',
      innerHTML: `
        (function() {
          const DEFAULT_THEME = ${JSON.stringify(defaultThemeName.value)};
          const VALID_THEMES = ${JSON.stringify(validThemes.value)};
          const DEFAULT_LOCALE = ${JSON.stringify(defaultLocale.value)};
          const VALID_LOCALES = ['fr', 'en'];
          const LOCALE_STORAGE_KEY = 'preferred-locale';
          try {
            const cookieMatch = document.cookie.match(/(?:^|; )theme=([^;]+)/);
            const cookieTheme = cookieMatch ? decodeURIComponent(cookieMatch[1]) : '';
            const storedTheme = localStorage.getItem('theme');
            const candidateTheme = cookieTheme && VALID_THEMES.includes(cookieTheme) ? cookieTheme : storedTheme;
            const nextTheme = candidateTheme && VALID_THEMES.includes(candidateTheme) ? candidateTheme : DEFAULT_THEME;
            document.documentElement.setAttribute('data-theme', nextTheme);
          } catch (e) {}
          try {
            const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
            const localeCookieMatch = document.cookie.match(/(?:^|; )i18n_redirected=([^;]+)/);
            const cookieLocale = localeCookieMatch ? decodeURIComponent(localeCookieMatch[1]).toLowerCase().split('-')[0] : '';
            const browserLocale = (navigator.language || '').toLowerCase().split('-')[0];
            const nextLocale = VALID_LOCALES.includes(storedLocale)
              ? storedLocale
              : (VALID_LOCALES.includes(cookieLocale) ? cookieLocale : (VALID_LOCALES.includes(browserLocale) ? browserLocale : DEFAULT_LOCALE));
            document.cookie = 'i18n_redirected=' + nextLocale + '; path=/; max-age=31536000; samesite=lax';
            document.documentElement.setAttribute('lang', nextLocale);
          } catch (e) {}
        })();
      `,
      tagPriority: 'critical'
    }
  ]
}))
</script>
