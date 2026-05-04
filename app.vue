<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  htmlAttrs: {
    'data-theme': 'ferme'
  },
  script: [
    {
      innerHTML: `
        (function() {
          const DEFAULT_THEME = 'ferme';
          const VALID_THEMES = ['ferme','ferme-dark','prairie','recolte','lavande'];
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
              : (VALID_LOCALES.includes(cookieLocale) ? cookieLocale : (VALID_LOCALES.includes(browserLocale) ? browserLocale : 'fr'));
            document.cookie = 'i18n_redirected=' + nextLocale + '; path=/; max-age=31536000; samesite=lax';
            document.documentElement.setAttribute('lang', nextLocale);
          } catch (e) {}
        })();
      `,
      tagPriority: 'critical'
    }
  ]
})
</script>
