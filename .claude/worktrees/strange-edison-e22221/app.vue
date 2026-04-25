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
        try {
          const theme = localStorage.getItem('theme');
          if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
          }
        } catch (e) {}
      `,
      tagPriority: 'critical'
    }
  ]
})
</script>