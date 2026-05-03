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
          try {
            const theme = localStorage.getItem('theme');
            const nextTheme = theme && VALID_THEMES.includes(theme) ? theme : DEFAULT_THEME;
            document.documentElement.setAttribute('data-theme', nextTheme);
          } catch (e) {}
        })();
      `,
      tagPriority: 'critical'
    }
  ]
})
</script>
