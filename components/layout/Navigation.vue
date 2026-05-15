<template>
  <div
    id="site-header"
    class="navbar z-50 border-b border-base-200 bg-base-100 px-4 sm:px-6 lg:px-8"
    :class="headerSettings.sticky ? 'sticky top-0 shadow-sm' : ''"
    :style="headerStyle"
  >
    <div class="navbar-start min-w-0 gap-3">
      <div v-if="showNavigation" class="md:hidden">
        <label for="drawer-toggle" class="btn btn-ghost btn-circle">
          <Icon name="mdi:menu" size="24" />
        </label>
      </div>

      <NuxtLink
        :to="localePath('/')"
        class="flex min-w-60 items-center gap-3"
        :style="{
          '--site-header-logo-height': `${headerSettings.logoHeightPx}px`,
          '--site-header-logo-height-mobile': `${headerSettings.mobileLogoHeightPx}px`
        }"
      >
        <img :src="logoSrc" :alt="logoAlt" class="site-header-logo w-auto shrink-0" />
        <div v-if="headerSettings.showSiteName || headerSettings.showSiteTagline" class="min-w-0">
          <div v-if="headerSettings.showSiteName" class="whitespace-normal break-words text-sm font-bold leading-tight sm:text-xl">
            {{ siteName }}
          </div>
          <div v-if="headerSettings.showSiteTagline" class="hidden text-xs opacity-70 sm:block sm:text-sm">
            {{ siteTagline }}
          </div>
        </div>
      </NuxtLink>
    </div>

    <div class="navbar-center hidden md:flex">
      <ul v-if="showNavigation" class="flex items-center gap-2 px-1">
        <li v-for="item in menuItems" :key="item.navigationItemKey">
          <details v-if="item.children.length" class="dropdown dropdown-hover dropdown-bottom">
            <summary class="list-none" :class="navLinkClass(item)">
              <span>{{ resolveLabel(item) }}</span>
              <Icon name="mdi:chevron-down" size="16" class="opacity-70" />
            </summary>
            <ul class="dropdown-content z-50 mt-2 w-72 rounded-2xl border border-base-300 bg-base-100 p-2 shadow-xl">
              <li v-for="child in item.children" :key="child.navigationItemKey">
                <NuxtLink
                  :to="resolveHref(child)"
                  :target="child.newTab ? '_blank' : undefined"
                  :rel="child.newTab ? 'noopener noreferrer' : undefined"
                  :class="navChildLinkClass(child)"
                >
                  {{ resolveLabel(child) }}
                </NuxtLink>
              </li>
            </ul>
          </details>

          <NuxtLink
            v-else
            :to="resolveHref(item)"
            :target="item.newTab ? '_blank' : undefined"
            :rel="item.newTab ? 'noopener noreferrer' : undefined"
            :class="navLinkClass(item)"
          >
            {{ resolveLabel(item) }}
          </NuxtLink>
        </li>
      </ul>
    </div>

    <div class="navbar-end hidden md:flex">
      <ThemeSelector />
      <LanguageSelector />
      <LayoutUserMenu />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CmsHeaderNavigationStyle, ResolvedCmsNavigationItem } from '~/shared/cms'
import type { ThemeColorSelection } from '~/shared/pageBuilder'
import { useAuthStore } from '~/stores/auth'

const localePath = useLocalePath()
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
  navigationStyle: 'ghost' as CmsHeaderNavigationStyle,
  backgroundColor: { token: 'base-100' as const, opacity: 100 },
  textColor: { token: 'base-content' as const, opacity: 100 },
  sticky: true
})
const showNavigation = computed(() => !(inDevelopment.value && !authStore.isAuthenticated) && headerSettings.value.showPrimaryNavigation)

const siteName = computed(() => locale.value === 'en'
  ? cms.value?.settings.siteName.en || 'Site name'
  : cms.value?.settings.siteName.fr || 'Nom du site')
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

const isActiveItem = (item: ResolvedCmsNavigationItem): boolean => {
  if (item.children.length) {
    return item.children.some(child => isActiveItem(child))
  }

  if (item.itemType === 'EXTERNAL_URL') return false
  const href = localePath(item.href)
  return route.path === href || (item.href !== '/' && route.path.startsWith(`${href}/`))
}

const navLinkClass = (item: ResolvedCmsNavigationItem) => {
  const active = isActiveItem(item)
  const base = 'inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition'
  switch (headerSettings.value.navigationStyle) {
    case 'soft':
      return `${base} ${active ? 'bg-primary text-primary-content shadow-sm' : 'border border-base-300 bg-base-200/70 hover:bg-base-300/70'}`
    case 'outline':
      return `${base} border ${active ? 'border-primary bg-primary text-primary-content shadow-sm' : 'border-current/20 hover:bg-base-200/70'}`
    case 'solid':
      return `${base} ${active ? 'bg-primary text-primary-content shadow-sm' : 'bg-primary/12 hover:bg-primary/18'}`
    default:
      return `${base} ${active ? 'bg-primary text-primary-content shadow-sm' : 'hover:bg-base-200/80'}`
  }
}

const navChildLinkClass = (item: ResolvedCmsNavigationItem) => {
  const active = isActiveItem(item)
  return [
    'block rounded-xl px-3 py-2 text-sm transition',
    active ? 'bg-primary text-primary-content shadow-sm' : 'hover:bg-base-200'
  ]
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
