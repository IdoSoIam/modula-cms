<template>
  <div id="site-header" class="navbar bg-base-100 sticky shadow-sm top-0 z-50">
    <div class="navbar-start">
      <!-- Hamburger pour mobile -->
      <div v-if="showNavigation" class="md:hidden">
        <label for="drawer-toggle" class="btn btn-ghost btn-circle">
          <Icon name="mdi:menu" size="24" />
        </label>
      </div>
      <!-- Logo et nom -->
      <NuxtLink :to="localePath('/')" class="flex items-center gap-2">
        <img :src="logoSrc" :alt="logoAlt" class="h-12 w-auto" />
        <span class="text-xl font-bold hidden sm:inline">{{ siteName }}</span>
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
import { useAuthStore } from '~/stores/auth'

const localePath = useLocalePath();
const { locale } = useI18n()
const route = useRoute()
const authStore = useAuthStore()
const siteConfig = useSiteConfigState()
const inDevelopment = computed(() => siteConfig.value?.inDevelopment === true)
const showNavigation = computed(() => !(inDevelopment.value && !authStore.isAuthenticated))
const cms = computed(() => siteConfig.value?.cms)

const siteName = computed(() => locale.value === 'en'
  ? cms.value?.settings.siteName.en || 'Ferme du Campeyrigoux'
  : cms.value?.settings.siteName.fr || 'Ferme du Campeyrigoux')

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
