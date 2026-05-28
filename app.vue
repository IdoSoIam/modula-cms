<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const siteConfig = await useSiteConfig()
const inDevelopment = computed(() => siteConfig.value?.inDevelopment === true)
const defaultLocale = computed(() => siteConfig.value?.project?.defaultLocale || 'fr')
const faviconHref = computed(() => siteConfig.value?.cms?.settings.favicon.src || '/brand/modula-mark.svg')
const themeConfig = computed(() => siteConfig.value?.themes)
const defaultThemeName = computed(() => themeConfig.value?.defaultTheme || 'recolte')
const validThemes = computed(() => themeConfig.value?.allThemeNames || ['ferme', 'ferme-dark', 'recolte'])
const generatedThemeCss = computed(() => themeConfig.value?.generatedCss || '')

useHead(() => ({
  htmlAttrs: {
    'data-theme': defaultThemeName.value
  },
  link: [
    {
      rel: 'icon',
      href: faviconHref.value,
      type: faviconHref.value.endsWith('.svg') ? 'image/svg+xml' : undefined
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
            const theme = localStorage.getItem('theme');
            const nextTheme = theme && VALID_THEMES.includes(theme) ? theme : DEFAULT_THEME;
            document.documentElement.setAttribute('data-theme', nextTheme);
          } catch (e) {}
          try {
            const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
            const cookieMatch = document.cookie.match(/(?:^|; )i18n_redirected=([^;]+)/);
            const cookieLocale = cookieMatch ? decodeURIComponent(cookieMatch[1]).toLowerCase().split('-')[0] : '';
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
