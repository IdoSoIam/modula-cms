<template>
  <div v-if="showNavigation" class="drawer-side z-50">
    <label for="drawer-toggle" class="drawer-overlay"></label>
    <aside class="min-h-full w-80 space-y-4 overflow-y-auto bg-base-100 p-4">
      <div class="rounded-2xl border border-base-300 bg-base-200/40 p-4">
        <div class="flex items-center gap-3">
          <img :src="logoSrc" :alt="logoAlt" class="h-auto w-auto shrink-0" :style="{ height: `${headerSettings.mobileLogoHeightPx + 8}px` }" />
          <div class="min-w-0">
            <div v-if="headerSettings.showSiteName" class="whitespace-normal break-words text-base font-bold leading-tight">
              {{ siteName }}
            </div>
            <div v-if="headerSettings.showSiteTagline" class="mt-1 text-xs opacity-70">
              {{ siteTagline }}
            </div>
          </div>
        </div>
      </div>

      <section class="space-y-2">
        <div class="px-1 text-xs font-semibold uppercase tracking-[0.14em] opacity-60">
          {{ t('layout.mobileMenu.navigationGroup') }}
        </div>
        <div class="space-y-2">
          <template v-for="item in menuItems" :key="item.navigationItemKey">
            <div v-if="item.children.length" class="rounded-2xl border border-base-300 bg-base-200/40">
              <button
                type="button"
                class="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm font-semibold transition hover:bg-base-100/60"
                @click="toggleOpenGroup(item.navigationItemKey)"
              >
                <span class="flex-1">{{ resolveLabel(item) }}</span>
                <Icon :name="isOpenGroup(item.navigationItemKey) ? 'mdi:chevron-up' : 'mdi:chevron-down'" size="18" class="opacity-60" />
              </button>
              <div v-if="isOpenGroup(item.navigationItemKey)" class="space-y-2 px-2 pb-2">
                <NuxtLink
                  v-for="child in item.children"
                  :key="child.navigationItemKey"
                  :to="resolveHref(child)"
                  :target="child.newTab ? '_blank' : undefined"
                  :rel="child.newTab ? 'noopener noreferrer' : undefined"
                  :class="navLinkClass(child)"
                  @click="closeDrawer"
                >
                  {{ resolveLabel(child) }}
                </NuxtLink>
              </div>
            </div>

            <NuxtLink
              v-else
              :to="resolveHref(item)"
              :target="item.newTab ? '_blank' : undefined"
              :rel="item.newTab ? 'noopener noreferrer' : undefined"
              :class="navLinkClass(item)"
              @click="closeDrawer"
            >
              {{ resolveLabel(item) }}
            </NuxtLink>
          </template>
        </div>
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
            :class="theme === availableTheme.name ? 'bg-primary text-primary-content shadow-sm' : 'border border-base-300 bg-base-100 hover:bg-base-200'"
            @click="setTheme(availableTheme.name)"
          >
            <span class="h-4 w-4 shrink-0 rounded-full border border-current/20" :style="{ background: availableTheme.preview }" />
            <span class="flex-1">{{ availableTheme.displayName }}</span>
            <Icon v-if="theme === availableTheme.name" name="mdi:check" size="16" />
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
            :class="locale === availableLocale.code ? 'bg-primary text-primary-content shadow-sm' : 'border border-base-300 bg-base-100 hover:bg-base-200'"
            @click="changeLocale(availableLocale.code)"
          >
            <Icon name="mdi:translate" size="18" class="shrink-0" />
            <span class="flex-1">{{ availableLocale.name }}</span>
            <Icon v-if="locale === availableLocale.code" name="mdi:check" size="16" />
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

            <NuxtLink v-if="authStore.user?.role === 'admin'" :to="localePath('/admin')" class="flex min-h-11 items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-2 text-sm transition hover:bg-base-200" @click="closeDrawer">
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
import type { CmsHeaderNavigationStyle, ResolvedCmsNavigationItem } from '~/shared/cms'
import { useAuthStore } from '~/stores/auth'

type SupportedLocale = 'fr' | 'en'
type LocaleOption = { code: SupportedLocale, name: string }

const localePath = useLocalePath()
const { locale, locales, setLocale, t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const siteConfig = useSiteConfigState()
const { theme, availableThemes, setTheme, themeControllerEnabled } = useTheme()
const inDevelopment = computed(() => siteConfig.value?.inDevelopment === true)
const cms = computed(() => siteConfig.value?.cms)
const registerEnabled = computed(() => siteConfig.value?.registerEnabled === true)
const headerSettings = computed(() => cms.value?.settings.header ?? {
  heightPx: 84,
  logoHeightPx: 48,
  mobileLogoHeightPx: 40,
  showSiteName: true,
  showSiteTagline: false,
  showPrimaryNavigation: true,
  navigationStyle: 'ghost' as CmsHeaderNavigationStyle,
  sticky: true
})
const showNavigation = computed(() => !(inDevelopment.value && !authStore.isAuthenticated) && headerSettings.value.showPrimaryNavigation)
const openGroupKeys = ref<string[]>([])
const showAuthModal = ref(false)

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

const localeOptions = computed<LocaleOption[]>(() =>
  locales.value.map((item) => ({
    code: item.code as SupportedLocale,
    name: item.name || item.code
  }))
)

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
  const base = 'flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-2 text-sm font-medium transition'
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

const closeDrawer = () => {
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
</script>
