<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
useHead({
  script: [
    {
      innerHTML: `
        (function() {
          const VALID_THEMES = ['ferme','ferme-dark','prairie','recolte','lavande'];
          try {
            const theme = localStorage.getItem('theme');
            if (theme && VALID_THEMES.includes(theme)) {
              document.documentElement.setAttribute('data-theme', theme);
            }
          } catch (e) {}
        })();
      `,
      tagPriority: 'critical'
    }
  ]
})
</script>