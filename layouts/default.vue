<template>
  <div class="min-h-screen bg-base-100">
    <input id="drawer-toggle" type="checkbox" class="drawer-toggle" />
    
    <div class="drawer-content flex flex-col">      <!-- Navigation -->
      <LayoutNavigation />

      <!-- Conteneur pour les toasts -->
      <div id="toast" class="toast toast-top toast-end z-50" style="display: none"></div>

      <!-- Contenu principal -->
      <main class="flex-grow">
        <slot />
      </main>

      <!-- Footer -->
      <LayoutFooter />
    </div>

    <!-- Menu mobile -->
    <LayoutMobileMenu />
  </div>
</template>

<script setup lang="ts">
const { locale } = useI18n();
const switchLocalePath = useSwitchLocalePath();

useHead({
  htmlAttrs: {
    lang: locale,
  },
  link: [
    {
      rel: "alternate",
      hreflang: "fr",
      href: switchLocalePath("fr"),
    },
    {
      rel: "alternate",
      hreflang: "en",
      href: switchLocalePath("en"),
    },
  ],
});</script>
