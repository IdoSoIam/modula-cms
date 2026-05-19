<template>
  <div
    ref="headerRef"
    id="site-header"
    class="navbar border-b border-base-200 bg-base-100 px-4 sm:px-6 lg:px-8"
    :class="[
      headerSettings.sticky ? 'sticky top-0 shadow-sm' : '',
      previewForceMobile ? 'site-header--mobile-preview' : '',
      previewSiteConfig ? '' : 'z-50'
    ]"
    :style="headerStyle"
  >
    <div class="navbar-start min-w-0 flex-1">
      <div class="w-full" :class="mobileHeaderVisibilityClass">
        <div class="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <div class="flex min-w-0 items-center gap-3" :class="mobileLeftSlotClass">
            <label
              v-if="showNavigation && headerSettings.mobileBurgerPosition === 'left'"
              for="drawer-toggle"
              class="btn btn-ghost btn-circle shrink-0"
            >
              <Icon name="mdi:menu" size="24" />
            </label>

            <NuxtLink
              v-if="headerSettings.mobileHeaderLogoPosition === 'left'"
              :to="localePath('/')"
              class="flex shrink-0 items-center"
              :style="{
                '--site-header-logo-height': `${headerSettings.logoHeightPx}px`,
                '--site-header-logo-height-mobile': `${headerSettings.mobileLogoHeightPx}px`
              }"
            >
              <AppImage :src="logoSrc" :alt="logoAlt" class="site-header-logo w-auto shrink-0" sizes="160px" />
            </NuxtLink>
          </div>

          <NuxtLink
            v-if="showMobileHeaderBrand"
            :to="localePath('/')"
            class="min-w-0 text-center"
          >
            <div v-if="showMobileHeaderSiteName" class="truncate text-sm font-bold leading-tight">
              {{ siteName }}
            </div>
            <div v-if="showMobileHeaderSiteTagline" class="truncate text-xs opacity-70">
              {{ siteTagline }}
            </div>
          </NuxtLink>
          <div v-else />

          <div class="flex min-w-0 items-center justify-end gap-3" :class="mobileRightSlotClass">
            <label
              v-if="showNavigation && headerSettings.mobileBurgerPosition === 'right'"
              for="drawer-toggle"
              class="btn btn-ghost btn-circle shrink-0"
              :class="headerSettings.mobileHeaderLogoPosition === 'right' ? 'order-1' : ''"
            >
              <Icon name="mdi:menu" size="24" />
            </label>

            <NuxtLink
              v-if="headerSettings.mobileHeaderLogoPosition === 'right'"
              :to="localePath('/')"
              class="flex shrink-0 items-center"
              :class="showNavigation && headerSettings.mobileBurgerPosition === 'right' ? 'order-2' : ''"
              :style="{
                '--site-header-logo-height': `${headerSettings.logoHeightPx}px`,
                '--site-header-logo-height-mobile': `${headerSettings.mobileLogoHeightPx}px`
              }"
            >
              <AppImage :src="logoSrc" :alt="logoAlt" class="site-header-logo w-auto shrink-0" sizes="160px" />
            </NuxtLink>
          </div>
        </div>
      </div>

      <NuxtLink
        :to="localePath('/')"
        class="hidden min-w-0 items-center gap-3 md:flex"
        :class="desktopBrandVisibilityClass"
        :style="{
          '--site-header-logo-height': `${headerSettings.logoHeightPx}px`,
          '--site-header-logo-height-mobile': `${headerSettings.mobileLogoHeightPx}px`
        }"
      >
        <AppImage :src="logoSrc" :alt="logoAlt" class="site-header-logo w-auto shrink-0" sizes="220px" />

        <div class="min-w-0">
          <div v-if="showDesktopSiteName" class="whitespace-normal break-words font-bold leading-tight">
            <span class="text-sm sm:text-xl">{{ siteName }}</span>
          </div>
          <div v-if="showDesktopSiteTagline" class="opacity-70">
            <span class="text-xs sm:text-sm">{{ siteTagline }}</span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div class="navbar-center flex-1 justify-center" :class="desktopNavigationClass">
      <ul v-if="showNavigation" :class="desktopMenuClass">
        <li v-for="item in menuItems" :key="item.navigationItemKey">
          <div
            v-if="item.children.length"
            class="relative"
            @mouseenter="openDesktopGroupOnHover(item.navigationItemKey)"
            @mouseleave="closeDesktopGroupOnHover(item.navigationItemKey)"
          >
            <button
              type="button"
              :class="navLinkClass(item)"
              :style="navLinkStyle(item)"
              @click="toggleDesktopGroup(item.navigationItemKey)"
            >
              <span>{{ resolveLabel(item) }}</span>
              <Icon name="mdi:chevron-down" size="16" class="opacity-70" />
            </button>

            <Transition :name="desktopSubmenuTransitionName">
              <ul
                v-if="isDesktopGroupOpen(item.navigationItemKey)"
                :class="desktopSubmenuClass"
                :style="desktopSubmenuStyle"
              >
                <li v-for="child in item.children" :key="child.navigationItemKey">
                  <NuxtLink
                    :to="resolveHref(child)"
                    :target="child.newTab ? '_blank' : undefined"
                    :rel="child.newTab ? 'noopener noreferrer' : undefined"
                    :class="navChildLinkClass(child)"
                    :style="navChildLinkStyle(child)"
                    @click="closeAllDesktopGroups"
                  >
                    {{ resolveLabel(child) }}
                  </NuxtLink>
                </li>
              </ul>
            </Transition>
          </div>

          <NuxtLink
            v-else
            :to="resolveHref(item)"
            :target="item.newTab ? '_blank' : undefined"
            :rel="item.newTab ? 'noopener noreferrer' : undefined"
            :class="navLinkClass(item)"
            :style="navLinkStyle(item)"
          >
            {{ resolveLabel(item) }}
          </NuxtLink>
        </li>
      </ul>
    </div>

    <div class="navbar-end flex-1 justify-end" :class="desktopActionsClass">
      <ThemeSelector v-if="showUtilityControls" />
      <LanguageSelector v-if="showUtilityControls" />
      <LayoutUserMenu v-if="showUtilityControls" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CmsHeaderNavigationStyle, CmsLocale, PublicSiteShell, ResolvedCmsNavigationItem } from '~/shared/cms'
import type { ThemeColorSelection } from '~/shared/pageBuilder'
import { useAuthStore } from '~/stores/auth'

interface PreviewSiteConfig {
  facebookFluxDeactivated?: boolean
  inDevelopment?: boolean
  registerEnabled?: boolean
  cms?: PublicSiteShell
}

const props = withDefaults(defineProps<{
  previewLocale?: CmsLocale | null
  previewSiteConfig?: PreviewSiteConfig | null
  previewShowUtilityControls?: boolean
  previewForceOpenFirstSubmenu?: boolean
  previewForceMobile?: boolean
}>(), {
  previewLocale: null,
  previewSiteConfig: null,
  previewShowUtilityControls: true,
  previewForceOpenFirstSubmenu: false,
  previewForceMobile: false
})

const localePath = useLocalePath()
const { locale } = useI18n()
const route = useRoute()
const authStore = useAuthStore()
const headerRef = ref<HTMLElement | null>(null)
const siteConfig = useSiteConfigState()
const effectiveLocale = computed<CmsLocale>(() => props.previewLocale || (locale.value === 'en' ? 'en' : 'fr'))
const effectiveSiteConfig = computed(() => props.previewSiteConfig ?? siteConfig.value)
const inDevelopment = computed(() => effectiveSiteConfig.value?.inDevelopment === true)
const cms = computed(() => effectiveSiteConfig.value?.cms)
const desktopOpenGroupKeys = ref<string[]>([])
const showUtilityControls = computed(() => props.previewShowUtilityControls)
const previewForceMobile = computed(() => props.previewForceMobile)
const headerSettings = computed(() => cms.value?.settings.header ?? {
  heightPx: 84,
  logoHeightPx: 48,
  mobileHeightPx: 72,
  mobileLogoHeightPx: 40,
  showSiteName: true,
  showSiteTagline: false,
  mobileHeaderShowSiteName: true,
  mobileHeaderShowSiteTagline: false,
  mobileHeaderLogoPosition: 'left' as const,
  mobileMenuShowSiteName: true,
  mobileMenuShowSiteTagline: true,
  mobileMenuLogoPosition: 'left' as const,
  mobileBurgerPosition: 'left' as const,
  showPrimaryNavigation: true,
  navigationStyle: 'ghost' as CmsHeaderNavigationStyle,
  submenuTrigger: 'hover' as const,
  submenuAnimation: 'fade' as const,
  submenuRadiusPx: 18,
  backgroundColor: { token: 'base-100' as const, opacity: 100 },
  textColor: { token: 'base-content' as const, opacity: 100 },
  navigationActiveBackgroundColor: { token: 'primary' as const, opacity: 100 },
  navigationActiveTextColor: { token: 'primary-content' as const, opacity: 100 },
  navigationHoverBackgroundColor: { token: 'base-200' as const, opacity: 100 },
  navigationHoverTextColor: { token: 'base-content' as const, opacity: 100 },
  submenuBackgroundColor: { token: 'base-100' as const, opacity: 100 },
  submenuTextColor: { token: 'base-content' as const, opacity: 100 },
  sticky: true
})
const showNavigation = computed(() => !(inDevelopment.value && !authStore.isAuthenticated) && headerSettings.value.showPrimaryNavigation)
const showDesktopSiteName = computed(() => headerSettings.value.showSiteName)
const showDesktopSiteTagline = computed(() => headerSettings.value.showSiteTagline)
const showMobileHeaderSiteName = computed(() => headerSettings.value.mobileHeaderShowSiteName)
const showMobileHeaderSiteTagline = computed(() => headerSettings.value.mobileHeaderShowSiteTagline && Boolean(siteTagline.value))
const showMobileHeaderBrand = computed(() => showMobileHeaderSiteName.value || showMobileHeaderSiteTagline.value)

const siteName = computed(() => effectiveLocale.value === 'en'
  ? cms.value?.settings.siteName.en || 'Site name'
  : cms.value?.settings.siteName.fr || 'Nom du site')
const siteTagline = computed(() => effectiveLocale.value === 'en'
  ? cms.value?.settings.siteTagline.en || ''
  : cms.value?.settings.siteTagline.fr || '')

const normalizeLogoSrc = (value?: string | null) => {
  const src = value?.trim()
  if (!src) return '/images/logo-removebg-preview.png'
  if (src.startsWith('/') || /^[a-z]+:\/\//i.test(src) || src.startsWith('data:')) return src
  return `/images/${src.replace(/^\.?\//, '')}`
}

const logoSrc = computed(() => normalizeLogoSrc(cms.value?.settings.logo.src))
const logoAlt = computed(() => effectiveLocale.value === 'en'
  ? cms.value?.settings.logo.alt.en || 'Logo'
  : cms.value?.settings.logo.alt.fr || 'Logo')

const menuItems = computed(() => cms.value?.navigation.primary ?? [])

const mixColor = (color: string, opacity: number) => {
  if (opacity >= 1) return color
  const percent = Math.max(0, Math.min(100, Math.round(opacity * 100)))
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}

const colorToCss = (selection?: ThemeColorSelection | null, opacity = 1) => {
  if (!selection) return ''
  const selectionOpacity = typeof selection.opacity === 'number'
    ? Math.max(0, Math.min(100, selection.opacity)) / 100
    : 1
  const finalOpacity = opacity * selectionOpacity
  switch (selection.token) {
    case 'transparent': return 'transparent'
    case 'white': return mixColor('#ffffff', finalOpacity)
    case 'white-90': return `rgba(255,255,255,${0.9 * finalOpacity})`
    case 'white-70': return `rgba(255,255,255,${0.7 * finalOpacity})`
    case 'white-10': return `rgba(255,255,255,${0.1 * finalOpacity})`
    case 'custom': return selection.customHex ? mixColor(selection.customHex, finalOpacity) : ''
    default: return mixColor(`var(--color-${selection.token})`, finalOpacity)
  }
}

const selectionToCss = (selection: ThemeColorSelection | null, cssProperty: 'backgroundColor' | 'color') => {
  const value = colorToCss(selection)
  return value ? { [cssProperty]: value } : {}
}

const headerStyle = computed(() => ({
  '--site-header-height': `${headerSettings.value.heightPx}px`,
  '--site-header-height-mobile': `${headerSettings.value.mobileHeightPx}px`,
  ...selectionToCss(headerSettings.value.backgroundColor ?? null, 'backgroundColor'),
  ...selectionToCss(headerSettings.value.textColor ?? null, 'color')
}))

const desktopMenuClass = computed(() => {
  if (headerSettings.value.navigationStyle === 'menu') {
    return 'menu menu-horizontal rounded-box bg-transparent p-0'
  }
  return 'flex items-center gap-2 px-1'
})

const mobileHeaderVisibilityClass = computed(() => previewForceMobile.value ? '' : 'md:hidden')
const desktopBrandVisibilityClass = computed(() => previewForceMobile.value ? '!hidden' : '')
const mobileLeftSlotClass = computed(() =>
  headerSettings.value.mobileHeaderLogoPosition === 'left' || headerSettings.value.mobileBurgerPosition === 'left'
    ? ''
    : 'invisible'
)
const mobileRightSlotClass = computed(() =>
  headerSettings.value.mobileHeaderLogoPosition === 'right' || headerSettings.value.mobileBurgerPosition === 'right'
    ? ''
    : 'invisible'
)

const desktopNavigationClass = computed(() =>
  previewForceMobile.value ? 'hidden' : 'hidden md:flex'
)

const desktopActionsClass = computed(() =>
  previewForceMobile.value ? 'hidden' : 'hidden md:flex'
)

const desktopSubmenuTransitionName = computed(() => {
  switch (headerSettings.value.submenuAnimation) {
    case 'scale': return 'submenu-scale'
    case 'slide': return 'submenu-slide'
    case 'none': return 'submenu-none'
    default: return 'submenu-fade'
  }
})

const desktopSubmenuClass = computed(() =>
  headerSettings.value.navigationStyle === 'menu'
    ? 'menu absolute left-0 top-full z-50 mt-2 w-72 border border-base-300 p-2 shadow-xl'
    : 'absolute left-0 top-full z-50 mt-2 w-72 space-y-1 border border-base-300 p-2 shadow-xl'
)

const desktopSubmenuStyle = computed(() => ({
  borderRadius: `${headerSettings.value.submenuRadiusPx}px`,
  backgroundColor: colorToCss(headerSettings.value.submenuBackgroundColor ?? null) || 'var(--color-base-100)',
  color: colorToCss(headerSettings.value.submenuTextColor ?? null) || 'var(--color-base-content)'
}))

const resolveLabel = (item: ResolvedCmsNavigationItem) =>
  effectiveLocale.value === 'en' ? item.labels.en || item.label : item.labels.fr || item.label

const resolveHref = (item: ResolvedCmsNavigationItem) =>
  item.itemType === 'EXTERNAL_URL' ? item.href : localePath(item.href)

const isDesktopGroupOpen = (key: string) => desktopOpenGroupKeys.value.includes(key)

const closeAllDesktopGroups = () => {
  desktopOpenGroupKeys.value = []
}

const openDesktopGroupOnHover = (key: string) => {
  if (headerSettings.value.submenuTrigger !== 'hover') return
  desktopOpenGroupKeys.value = [key]
}

const closeDesktopGroupOnHover = (key: string) => {
  if (headerSettings.value.submenuTrigger !== 'hover') return
  desktopOpenGroupKeys.value = desktopOpenGroupKeys.value.filter(item => item !== key)
}

const toggleDesktopGroup = (key: string) => {
  if (headerSettings.value.submenuTrigger === 'hover') {
    desktopOpenGroupKeys.value = [key]
    return
  }

  desktopOpenGroupKeys.value = isDesktopGroupOpen(key) ? [] : [key]
}

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
  const base = 'inline-flex min-h-11 items-center gap-2 px-4 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer'
  switch (headerSettings.value.navigationStyle) {
    case 'menu':
      return `${base} rounded-xl ${active
        ? '[background-color:var(--nav-active-bg)] [color:var(--nav-active-text)] shadow-sm'
        : 'hover:[background-color:var(--nav-hover-bg)] hover:[color:var(--nav-hover-text)]'}`
    case 'underline':
      return `${base} rounded-none border-b-2 border-transparent px-2 ${active
        ? '[border-bottom-color:var(--nav-active-accent)] [color:var(--nav-active-text)]'
        : 'hover:[border-bottom-color:var(--nav-active-accent)] hover:[color:var(--nav-hover-text)]'}`
    case 'soft':
      return `${base} rounded-full ${active
        ? '[background-color:var(--nav-active-bg)] [color:var(--nav-active-text)] shadow-sm'
        : 'border border-base-300 bg-base-200/70 hover:[background-color:var(--nav-hover-bg)] hover:[color:var(--nav-hover-text)]'}`
    case 'outline':
      return `${base} rounded-full border ${active
        ? '[border-color:var(--nav-active-accent)] [background-color:var(--nav-active-bg)] [color:var(--nav-active-text)] shadow-sm'
        : 'border-current/20 hover:[background-color:var(--nav-hover-bg)] hover:[color:var(--nav-hover-text)]'}`
    case 'solid':
      return `${base} rounded-xl ${active
        ? '[background-color:var(--nav-active-bg)] [color:var(--nav-active-text)] shadow-sm'
        : 'bg-base-200/40 hover:[background-color:var(--nav-hover-bg)] hover:[color:var(--nav-hover-text)]'}`
    default:
      return `${base} rounded-xl ${active
        ? '[background-color:var(--nav-active-bg)] [color:var(--nav-active-text)] shadow-sm'
        : 'hover:[background-color:var(--nav-hover-bg)] hover:[color:var(--nav-hover-text)]'}`
  }
}

const navChildLinkClass = (item: ResolvedCmsNavigationItem) => {
  const active = isActiveItem(item)
  return [
    'block rounded-xl px-3 py-2 text-sm font-medium transition-colors duration-150',
    active
      ? '[background-color:var(--nav-active-bg)] [color:var(--nav-active-text)] shadow-sm'
      : 'hover:[background-color:var(--nav-hover-bg)] hover:[color:var(--nav-hover-text)]'
  ]
}

const navLinkStyle = (_item: ResolvedCmsNavigationItem) => {
  const activeBg = colorToCss(headerSettings.value.navigationActiveBackgroundColor ?? null) || 'var(--color-primary)'
  const activeText = colorToCss(headerSettings.value.navigationActiveTextColor ?? null) || 'var(--color-primary-content)'
  const hoverBg = colorToCss(headerSettings.value.navigationHoverBackgroundColor ?? null) || 'var(--color-base-200)'
  const hoverText = colorToCss(headerSettings.value.navigationHoverTextColor ?? null) || 'var(--color-base-content)'
  return {
    '--nav-active-bg': activeBg,
    '--nav-active-text': activeText,
    '--nav-hover-bg': hoverBg,
    '--nav-hover-text': hoverText,
    '--nav-active-accent': activeBg
  }
}

const navChildLinkStyle = (_item: ResolvedCmsNavigationItem) => ({
  ...navLinkStyle(_item),
  color: colorToCss(headerSettings.value.submenuTextColor ?? null) || undefined
})

watch(() => route.fullPath, () => {
  closeAllDesktopGroups()
})

watch(menuItems, (items) => {
  if (!props.previewForceOpenFirstSubmenu) return
  const firstWithChildren = items.find(item => item.children.length)
  desktopOpenGroupKeys.value = firstWithChildren ? [firstWithChildren.navigationItemKey] : []
}, { immediate: true, deep: true })

onMounted(() => {
  window.addEventListener('click', handleWindowClick)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleWindowClick)
})

function handleWindowClick(event: MouseEvent) {
  if (headerSettings.value.submenuTrigger !== 'click') return
  const target = event.target as Node | null
  if (!headerRef.value || !target) return
  if (!headerRef.value.contains(target)) {
    closeAllDesktopGroups()
  }
}
</script>

<style scoped>
#site-header {
  min-height: var(--site-header-height);
}

.site-header-logo {
  height: var(--site-header-logo-height);
}

@media (max-width: 639px) {
  #site-header {
    min-height: var(--site-header-height-mobile);
  }

  .site-header-logo {
    height: var(--site-header-logo-height-mobile);
  }
}

#site-header.site-header--mobile-preview {
  min-height: var(--site-header-height-mobile);
}

#site-header.site-header--mobile-preview .site-header-logo {
  height: var(--site-header-logo-height-mobile);
}

.submenu-fade-enter-active,
.submenu-fade-leave-active,
.submenu-scale-enter-active,
.submenu-scale-leave-active,
.submenu-slide-enter-active,
.submenu-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.submenu-fade-enter-from,
.submenu-fade-leave-to,
.submenu-scale-enter-from,
.submenu-scale-leave-to,
.submenu-slide-enter-from,
.submenu-slide-leave-to {
  opacity: 0;
}

.submenu-scale-enter-from,
.submenu-scale-leave-to {
  transform: translateY(-6px) scale(0.96);
  transform-origin: top left;
}

.submenu-slide-enter-from,
.submenu-slide-leave-to {
  transform: translateY(-10px);
}

.submenu-none-enter-active,
.submenu-none-leave-active {
  transition: none;
}
</style>
