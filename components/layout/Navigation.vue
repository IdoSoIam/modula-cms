<template>
  <div
    id="site-header"
    class="navbar z-50 border-b border-base-200 bg-base-100 px-4 sm:px-6 lg:px-8"
    :class="headerSettings.sticky ? 'sticky top-0 shadow-sm' : ''"
    :style="headerStyle"
  >
    <div class="navbar-start gap-3">
      <!-- Hamburger pour mobile -->
      <div v-if="showNavigation" class="md:hidden">
        <label for="drawer-toggle" class="btn btn-ghost btn-circle">
          <Icon name="mdi:menu" size="24" />
        </label>
      </div>
      <!-- Logo et nom -->
      <NuxtLink
        :to="localePath('/')"
        class="flex min-w-0 items-center gap-3"
        :style="{
          '--site-header-logo-height': `${headerSettings.logoHeightPx}px`,
          '--site-header-logo-height-mobile': `${headerSettings.mobileLogoHeightPx}px`
        }"
      >
        <img :src="logoSrc" :alt="logoAlt" class="site-header-logo w-auto shrink-0" />
        <div v-if="headerSettings.showSiteName || headerSettings.showSiteTagline" class="min-w-0">
          <div v-if="headerSettings.showSiteName" class="truncate text-lg font-bold sm:text-xl">{{ siteName }}</div>
          <div v-if="headerSettings.showSiteTagline" class="truncate text-xs opacity-70 sm:text-sm">{{ siteTagline }}</div>
        </div>
      </NuxtLink>
    </div>

    <!-- Menu desktop -->
    <div class="navbar-center hidden md:flex">
      <ul v-if="showNavigation" class="menu menu-horizontal px-1 gap-2">
        <li v-for="item in menuItems" :key="`${item.href}-${item.position}`">
          <NuxtLink
            :to="resolveHref(item)"
            class="btn btn-ghost"
            :target="item.newTab ? '_blank' : undefined"
            :rel="item.newTab ? 'noopener noreferrer' : undefined"
            :class="{ 'btn-active': isActiveItem(item) }"
          >
            {{ resolveLabel(item) }}
          </NuxtLink>
        </li>
      </ul>
    </div>
    <div class="navbar-end">
      <ThemeSelector />
      <LanguageSelector />
      <LayoutUserMenu />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ResolvedCmsNavigationItem } from '~/shared/cms'
import type { ThemeColorSelection } from '~/shared/homePage'
import { useAuthStore } from '~/stores/auth'

const localePath = useLocalePath();
const { locale } = useI18n()
const route = useRoute()
const authStore = useAuthStore()
const siteConfig = useSiteConfigState()
const inDevelopment = computed(() => siteConfig.value?.inDevelopment === true)
const cms = computed(() => siteConfig.value?.cms)
const headerSettings = computed(() => cms.value?.settings.header ?? {
  heightPx: 84,
  logoHeightPx: 48,
  mobileLogoHeightPx: 40,
  showSiteName: true,
  showSiteTagline: false,
  showPrimaryNavigation: true,
  backgroundColor: { token: 'base-100' as const, opacity: 100 },
  textColor: { token: 'base-content' as const, opacity: 100 },
  sticky: true
})
const showNavigation = computed(() => !(inDevelopment.value && !authStore.isAuthenticated) && headerSettings.value.showPrimaryNavigation)

const siteName = computed(() => locale.value === 'en'
  ? cms.value?.settings.siteName.en || 'Ferme du Campeyrigoux'
  : cms.value?.settings.siteName.fr || 'Ferme du Campeyrigoux')
const siteTagline = computed(() => locale.value === 'en'
  ? cms.value?.settings.siteTagline.en || ''
  : cms.value?.settings.siteTagline.fr || '')

const logoSrc = computed(() => cms.value?.settings.logo.src || '/images/logo-removebg-preview.png')
const logoAlt = computed(() => locale.value === 'en'
  ? cms.value?.settings.logo.alt.en || 'Logo'
  : cms.value?.settings.logo.alt.fr || 'Logo')

const menuItems = computed(() => cms.value?.navigation.primary ?? [])

const tokenToCssVar = (token: string) => {
  if (token === 'white') return 'rgba(255,255,255,1)'
  if (token === 'white-90') return 'rgba(255,255,255,.9)'
  if (token === 'white-70') return 'rgba(255,255,255,.7)'
  if (token === 'white-10') return 'rgba(255,255,255,.1)'
  if (token === 'transparent') return 'transparent'
  return `var(--color-${token})`
}

const selectionToCss = (selection: ThemeColorSelection | null, cssProperty: 'backgroundColor' | 'color') => {
  if (!selection) return {}
  return {
    [cssProperty]: tokenToCssVar(selection.token)
  }
}

const headerStyle = computed(() => ({
  minHeight: `${headerSettings.value.heightPx}px`,
  ...selectionToCss(headerSettings.value.backgroundColor ?? null, 'backgroundColor'),
  ...selectionToCss(headerSettings.value.textColor ?? null, 'color')
}))

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

<style scoped>
.site-header-logo {
  height: var(--site-header-logo-height);
}

@media (max-width: 639px) {
  .site-header-logo {
    height: var(--site-header-logo-height-mobile);
  }
}
</style>
