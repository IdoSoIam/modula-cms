<template>
  <div v-if="showNavigation" class="drawer-side z-50">
    <label for="drawer-toggle" class="drawer-overlay"></label>
    <ul class="menu p-4 w-80 min-h-full bg-base-100">
      <li class="mb-4">
        <img :src="logoSrc" :alt="logoAlt" class="mx-auto h-auto w-auto max-h-24" :style="{ height: `${headerSettings.mobileLogoHeightPx + 24}px` }" />
      </li>
      <li v-for="item in menuItems" :key="`${item.href}-${item.position}`">
        <NuxtLink
          :to="resolveHref(item)"
          :target="item.newTab ? '_blank' : undefined"
          :rel="item.newTab ? 'noopener noreferrer' : undefined"
          :class="{ active: isActiveItem(item) }"
        >
          {{ resolveLabel(item) }}
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { ResolvedCmsNavigationItem } from '~/shared/cms'
import { useAuthStore } from '~/stores/auth'

const localePath = useLocalePath();
const { locale } = useI18n()
const route = useRoute()
const authStore = useAuthStore()
const siteConfig = useSiteConfigState()
const inDevelopment = computed(() => siteConfig.value?.inDevelopment === true)
const showNavigation = computed(() => !(inDevelopment.value && !authStore.isAuthenticated))
const cms = computed(() => siteConfig.value?.cms)
const headerSettings = computed(() => cms.value?.settings.header ?? {
  heightPx: 84,
  logoHeightPx: 48,
  mobileLogoHeightPx: 40,
  showSiteName: true,
  showSiteTagline: false,
  sticky: true
})

const logoSrc = computed(() => cms.value?.settings.logo.src || '/images/logo-removebg-preview.png')
const logoAlt = computed(() => locale.value === 'en'
  ? cms.value?.settings.logo.alt.en || 'Logo'
  : cms.value?.settings.logo.alt.fr || 'Logo')

const menuItems = computed(() => cms.value?.navigation.primary ?? [])

const resolveLabel = (item: ResolvedCmsNavigationItem) =>
  locale.value === 'en' ? item.labels.en || item.label : item.labels.fr || item.label

const resolveHref = (item: ResolvedCmsNavigationItem) =>
  item.itemType === 'EXTERNAL_URL' ? item.href : localePath(item.href)

const isActiveItem = (item: ResolvedCmsNavigationItem) => {
  if (item.itemType === 'EXTERNAL_URL') return false
  const href = localePath(item.href)
  return route.path === href || (item.href !== '/' && route.path.startsWith(`${href}/`))
}
</script>
