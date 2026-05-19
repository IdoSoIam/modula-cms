<template>
  <div class="min-h-screen bg-base-100">
    <input id="drawer-toggle" type="checkbox" class="drawer-toggle" aria-hidden="true" tabindex="-1" />
    
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
    <LayoutCookieBanner />
  </div>
</template>

<script setup lang="ts">
import LayoutCookieBanner from '~/components/layout/CookieBanner.vue'
import LayoutMobileMenu from '~/components/layout/MobileMenu.vue'

const { locale } = useI18n();
const switchLocalePath = useSwitchLocalePath();
const requestUrl = useRequestURL()

const toAbsoluteUrl = (path?: string | null) => {
  if (!path) return undefined
  return new URL(path, requestUrl).toString()
}

useHead({
  htmlAttrs: {
    lang: locale,
  },
  link: [
    {
      rel: "alternate",
      hreflang: "fr",
      href: toAbsoluteUrl(switchLocalePath("fr")),
    },
    {
      rel: "alternate",
      hreflang: "en",
      href: toAbsoluteUrl(switchLocalePath("en")),
    },
  ],
});</script>
