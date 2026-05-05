<template>
  <div class="min-h-screen bg-base-100">
    <input id="drawer-toggle" type="checkbox" class="drawer-toggle" />
    
    <div class="drawer-content flex min-h-screen flex-col">      <!-- Navigation -->
      <LayoutNavigation />

      <!-- Conteneur pour les toasts -->
      <div
        id="toast"
        popover="manual"
        class="fixed inset-auto right-4 m-0 w-[min(26rem,calc(100vw-2rem))] max-w-full border-0 bg-transparent p-0 text-inherit shadow-none outline-none backdrop:bg-transparent"
        style="top: 5rem"
      ></div>

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
