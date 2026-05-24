<template>
  <div v-if="showNavigation" :class="previewStatic ? 'block' : 'drawer-side z-50'">
    <label v-if="!previewStatic" for="drawer-toggle" class="drawer-overlay"></label>
    <aside class="min-h-full w-80 space-y-4 overflow-y-auto bg-base-100 p-4">
      <div class="rounded-2xl border border-base-300 bg-base-200/40 p-4">
        <div class="flex items-center gap-3" :class="mobileBrandClass">
          <AppImage
            :src="logoSrc"
            :alt="logoAlt"
            class="h-auto w-auto shrink-0"
            sizes="180px"
            :style="{ height: `${headerSettings.mobileLogoHeightPx + 8}px` }"
          />
          <div v-if="showMobileMenuBrandText" class="min-w-0">
            <div v-if="headerSettings.mobileMenuShowSiteName" class="whitespace-normal break-words text-base font-bold leading-tight">
              {{ siteName }}
            </div>
            <div v-if="headerSettings.mobileMenuShowSiteTagline" class="mt-1 text-xs opacity-70">
              {{ siteTagline }}
            </div>
          </div>
        </div>
      </div>

      <section class="space-y-2">
        <div class="px-1 text-xs font-semibold uppercase tracking-[0.14em] opacity-60">
          {{ t('layout.mobileMenu.navigationGroup') }}
        </div>
        <ul :class="mobileMenuClass">
          <template v-for="item in menuItems" :key="item.navigationItemKey">
            <li v-if="item.children.length" class="rounded-2xl">
              <button
                type="button"
                :class="navGroupButtonClass(item)"
                :style="navLinkStyle(item)"
                @click="toggleOpenGroup(item.navigationItemKey)"
              >
                <span class="flex-1">{{ resolveLabel(item) }}</span>
                <Icon :name="isOpenGroup(item.navigationItemKey) ? 'mdi:chevron-up' : 'mdi:chevron-down'" size="18" class="opacity-60" />
              </button>
              <Transition :name="submenuTransitionName">
                <ul v-if="isOpenGroup(item.navigationItemKey)" class="space-y-2 px-2 pb-2" :style="submenuListStyle">
                  <li v-for="child in item.children" :key="child.navigationItemKey">
                    <NuxtLink
                      :to="resolveHref(child)"
                      :target="child.newTab ? '_blank' : undefined"
                      :rel="child.newTab ? 'noopener noreferrer' : undefined"
                      :class="navLinkClass(child)"
                      :style="navChildLinkStyle(child)"
                      @click="closeDrawer"
                    >
                      {{ resolveLabel(child) }}
                    </NuxtLink>
                  </li>
                </ul>
              </Transition>
            </li>

            <li v-else>
              <NuxtLink
                :to="resolveHref(item)"
                :target="item.newTab ? '_blank' : undefined"
                :rel="item.newTab ? 'noopener noreferrer' : undefined"
                :class="navLinkClass(item)"
                :style="navLinkStyle(item)"
                @click="closeDrawer"
              >
                {{ resolveLabel(item) }}
              </NuxtLink>
            </li>
          </template>
        </ul>
      </section>

      <section v-if="themeControllerEnabled && availableThemes.length" class="space-y-2">
        <div class="px-1 text-xs font-semibold uppercase tracking-[0.14em] opacity-60">
          {{ t('layout.mobileMenu.themeGroup') }}
        </div>
        <div class="space-y-2">
          <button
            v-for="availableTheme in availableThemes"
            :key="availableTheme.name"
            type="button"
            class="flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-2 text-left text-sm transition"
            :class="themeButtonClass(availableTheme.name)"
            @click="setTheme(availableTheme.name)"
          >
            <span class="h-4 w-4 shrink-0 rounded-full border border-current/20" :style="{ background: availableTheme.preview }" />
            <span class="flex-1">{{ availableTheme.displayName }}</span>
            <Icon v-if="showThemeCheck(availableTheme.name)" name="mdi:check" size="16" />
          </button>
        </div>
      </section>

      <section class="space-y-2">
        <div class="px-1 text-xs font-semibold uppercase tracking-[0.14em] opacity-60">
          {{ t('layout.mobileMenu.languageGroup') }}
        </div>
        <div class="space-y-2">
          <button
            v-for="availableLocale in localeOptions"
            :key="availableLocale.code"
            type="button"
            class="flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-2 text-left text-sm transition"
            :class="localeButtonClass(availableLocale.code)"
            @click="changeLocale(availableLocale.code)"
          >
            <Icon name="mdi:translate" size="18" class="shrink-0" />
            <span class="flex-1">{{ availableLocale.name }}</span>
            <Icon v-if="showLocaleCheck(availableLocale.code)" name="mdi:check" size="16" />
          </button>
        </div>
      </section>

      <section v-if="authStore.isAuthenticated || registerEnabled" class="space-y-2">
        <div class="px-1 text-xs font-semibold uppercase tracking-[0.14em] opacity-60">
          {{ t('layout.mobileMenu.accountGroup') }}
        </div>
        <div class="space-y-2">
          <template v-if="!authStore.isAuthenticated">
            <button type="button" class="flex min-h-11 w-full items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-2 text-left text-sm transition hover:bg-base-200" @click="showAuthModal = true">
              <Icon name="mdi:login" size="18" class="shrink-0" />
              <span>{{ t('auth.login') }}</span>
            </button>
          </template>

          <template v-else>
            <div class="rounded-2xl border border-base-300 bg-base-200/40 px-4 py-3">
              <div class="text-sm font-semibold">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</div>
              <div class="text-xs opacity-70">{{ authStore.user?.email }}</div>
            </div>

            <NuxtLink :to="localePath('/profile')" class="flex min-h-11 items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-2 text-sm transition hover:bg-base-200" @click="closeDrawer">
              <Icon name="mdi:account-outline" size="18" class="shrink-0" />
              <span>{{ t('auth.profile') }}</span>
            </NuxtLink>

            <NuxtLink v-if="authStore.canAccessAdmin" :to="localePath('/admin')" class="flex min-h-11 items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-2 text-sm transition hover:bg-base-200" @click="closeDrawer">
              <Icon name="mdi:shield-crown-outline" size="18" class="shrink-0" />
              <span>{{ t('admin.title') }}</span>
            </NuxtLink>

            <button type="button" class="flex min-h-11 w-full items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-2 text-left text-sm transition hover:bg-base-200" @click="handleLogout">
              <Icon name="mdi:logout" size="18" class="shrink-0" />
              <span>{{ t('auth.logout') }}</span>
            </button>
          </template>
        </div>
      </section>
    </aside>

    <dialog id="mobile_auth_modal" class="modal" :class="{ 'modal-open': showAuthModal }">
      <div class="modal-box relative">
        <button class="btn btn-sm btn-circle absolute right-2 top-2" @click="showAuthModal = false">
          x
        </button>
        <AuthForm @success="onAuthSuccess" />
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showAuthModal = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import type { CmsHeaderNavigationStyle, CmsLocale, PublicSiteShell, ResolvedCmsNavigationItem } from '~/shared/cms'
import { useAuthStore } from '~/stores/auth'

type SupportedLocale = 'fr' | 'en'
type LocaleOption = { code: SupportedLocale, name: string }

interface PreviewSiteConfig {
  facebookFluxDeactivated?: boolean
  inDevelopment?: boolean
  registerEnabled?: boolean
  cms?: PublicSiteShell
}

const props = withDefaults(defineProps<{
  previewLocale?: CmsLocale | null
  previewSiteConfig?: PreviewSiteConfig | null
  previewStatic?: boolean
}>(), {
  previewLocale: null,
  previewSiteConfig: null,
  previewStatic: false
})

const localePath = useLocalePath()
const { locale, locales, setLocale, t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const siteConfig = useSiteConfigState()
const { theme, availableThemes, setTheme, themeControllerEnabled } = useTheme()
const effectiveLocale = computed<CmsLocale>(() => props.previewLocale || (locale.value === 'en' ? 'en' : 'fr'))
const effectiveSiteConfig = computed(() => props.previewSiteConfig ?? siteConfig.value)
const previewStatic = computed(() => props.previewStatic)
const inDevelopment = computed(() => effectiveSiteConfig.value?.inDevelopment === true)
const cms = computed(() => effectiveSiteConfig.value?.cms)
const registerEnabled = computed(() => effectiveSiteConfig.value?.registerEnabled === true)
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
  navigationActiveBackgroundColor: { token: 'primary' as const, opacity: 100 },
  navigationActiveTextColor: { token: 'primary-content' as const, opacity: 100 },
  navigationHoverBackgroundColor: { token: 'base-200' as const, opacity: 100 },
  navigationHoverTextColor: { token: 'base-content' as const, opacity: 100 },
  submenuBackgroundColor: { token: 'base-100' as const, opacity: 100 },
  submenuTextColor: { token: 'base-content' as const, opacity: 100 },
  sticky: true
})
const showNavigation = computed(() => !(inDevelopment.value && !authStore.isAuthenticated) && headerSettings.value.showPrimaryNavigation)
const openGroupKeys = ref<string[]>([])
const showAuthModal = ref(false)
const isHydrated = ref(false)

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
const showMobileMenuBrandText = computed(() =>
  headerSettings.value.mobileMenuShowSiteName || (headerSettings.value.mobileMenuShowSiteTagline && Boolean(siteTagline.value))
)
const mobileBrandClass = computed(() =>
  headerSettings.value.mobileMenuLogoPosition === 'right'
    ? 'flex-row-reverse justify-between text-right'
    : ''
)
const mobileMenuClass = computed(() =>
  headerSettings.value.navigationStyle === 'menu'
    ? 'menu w-full rounded-box bg-base-100 p-0'
    : 'space-y-2'
)
const submenuTransitionName = computed(() => {
  switch (headerSettings.value.submenuAnimation) {
    case 'scale': return 'submenu-scale'
    case 'slide': return 'submenu-slide'
    case 'none': return 'submenu-none'
    default: return 'submenu-fade'
  }
})
const submenuListStyle = computed(() => ({
  borderRadius: `${headerSettings.value.submenuRadiusPx}px`,
  backgroundColor: colorToCss(headerSettings.value.submenuBackgroundColor) || undefined
}))

const localeOptions = computed<LocaleOption[]>(() =>
  locales.value.map((item) => ({
    code: item.code as SupportedLocale,
    name: item.name || item.code
  }))
)

const resolveLabel = (item: ResolvedCmsNavigationItem) =>
  effectiveLocale.value === 'en' ? item.labels.en || item.label : item.labels.fr || item.label

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
  const base = 'flex min-h-11 w-full items-center gap-3 px-4 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer'
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

const navGroupButtonClass = (item: ResolvedCmsNavigationItem) => {
  const active = isActiveItem(item)
  const base = 'flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left text-sm font-semibold transition-colors duration-150 cursor-pointer'
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
      return `${base} rounded-2xl ${active
        ? '[background-color:var(--nav-active-bg)] [color:var(--nav-active-text)] shadow-sm'
        : 'border border-base-300 bg-base-200/40 hover:[background-color:var(--nav-hover-bg)] hover:[color:var(--nav-hover-text)]'}`
    case 'outline':
      return `${base} rounded-2xl border ${active
        ? '[border-color:var(--nav-active-accent)] [background-color:var(--nav-active-bg)] [color:var(--nav-active-text)] shadow-sm'
        : 'border-current/20 hover:[background-color:var(--nav-hover-bg)] hover:[color:var(--nav-hover-text)]'}`
    case 'solid':
      return `${base} rounded-2xl ${active
        ? '[background-color:var(--nav-active-bg)] [color:var(--nav-active-text)] shadow-sm'
        : 'bg-base-200/40 hover:[background-color:var(--nav-hover-bg)] hover:[color:var(--nav-hover-text)]'}`
    default:
      return `${base} rounded-2xl ${active
        ? '[background-color:var(--nav-active-bg)] [color:var(--nav-active-text)] shadow-sm'
        : 'hover:[background-color:var(--nav-hover-bg)] hover:[color:var(--nav-hover-text)]'}`
  }
}

const mixColor = (color: string, opacity: number) => {
  if (opacity >= 1) return color
  const percent = Math.max(0, Math.min(100, Math.round(opacity * 100)))
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}

const colorToCss = (selection: any, opacity = 1) => {
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

const navLinkStyle = (_item: ResolvedCmsNavigationItem) => {
  const activeBg = colorToCss(headerSettings.value.navigationActiveBackgroundColor) || 'var(--color-primary)'
  const activeText = colorToCss(headerSettings.value.navigationActiveTextColor) || 'var(--color-primary-content)'
  const hoverBg = colorToCss(headerSettings.value.navigationHoverBackgroundColor) || 'var(--color-base-200)'
  const hoverText = colorToCss(headerSettings.value.navigationHoverTextColor) || 'var(--color-base-content)'
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
  color: colorToCss(headerSettings.value.submenuTextColor) || undefined
})

const inactiveSelectorButtonClass = 'border border-base-300 bg-base-100 hover:bg-base-200'
const activeSelectorButtonClass = 'bg-primary text-primary-content shadow-sm'

const themeButtonClass = (themeName: string) =>
  isHydrated.value && theme.value === themeName ? activeSelectorButtonClass : inactiveSelectorButtonClass

const localeButtonClass = (localeCode: SupportedLocale) =>
  isHydrated.value && locale.value === localeCode ? activeSelectorButtonClass : inactiveSelectorButtonClass

const showThemeCheck = (themeName: string) =>
  isHydrated.value && theme.value === themeName

const showLocaleCheck = (localeCode: SupportedLocale) =>
  isHydrated.value && locale.value === localeCode

const closeDrawer = () => {
  if (previewStatic.value) return
  if (!import.meta.client) return
  const toggle = document.getElementById('drawer-toggle') as HTMLInputElement | null
  if (toggle) {
    toggle.checked = false
  }
}

const isOpenGroup = (key: string) => openGroupKeys.value.includes(key)

const toggleOpenGroup = (key: string) => {
  if (isOpenGroup(key)) {
    openGroupKeys.value = openGroupKeys.value.filter(item => item !== key)
    return
  }

  openGroupKeys.value = [...openGroupKeys.value, key]
}

watch(
  menuItems,
  (items) => {
    const activeParents = items.filter(item => item.children.length && isActiveItem(item)).map(item => item.navigationItemKey)
    openGroupKeys.value = Array.from(new Set([...openGroupKeys.value, ...activeParents]))
  },
  { immediate: true, deep: true }
)

const changeLocale = async (nextLocale: SupportedLocale) => {
  if (nextLocale === locale.value) return
  await setLocale(nextLocale)
  closeDrawer()
}

const handleLogout = async () => {
  await authStore.logout()
  const { $toast } = useNuxtApp() as any
  $toast?.success(t('layout.logoutSuccess'))
  closeDrawer()
  await router.push(localePath('/'))
}

const onAuthSuccess = () => {
  showAuthModal.value = false
  const { $toast } = useNuxtApp() as any
  $toast?.success(t('auth.loginSuccess'))
  closeDrawer()
}

onMounted(() => {
  isHydrated.value = true
})
</script>

<style scoped>
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
  transform-origin: top center;
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
