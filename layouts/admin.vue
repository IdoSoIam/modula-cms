<template>
  <div class="min-h-screen bg-base-200 text-base-content">
    <aside
      class="fixed inset-y-0 left-0 z-50 flex flex-col border-r border-base-300 bg-base-100 transition-all duration-300"
      :class="[
        sidebarCollapsed ? 'w-20' : 'w-72',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <div class="flex min-h-18 items-center gap-3 border-b border-base-300 px-4">
        <NuxtLink :to="localePath('/admin')" class="flex min-w-0 items-center gap-3">
          <div class="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon name="mdi:storefront-outline" size="22" />
          </div>
          <div v-if="!sidebarCollapsed" class="min-w-0">
            <div class="truncate text-sm font-semibold">{{ t('admin.title') }}</div>
            <div class="truncate text-xs opacity-60">{{ siteConfig?.siteName || t('admin.settingsGlobalPage.title') }}</div>
          </div>
        </NuxtLink>
      </div>

      <div class="flex-1 overflow-y-auto px-3 py-4">
        <AdminNavigationMenu :sections="adminSections" :collapsed="sidebarCollapsed" variant="sidebar" />
      </div>

      <div class="border-t border-base-300 p-3">
        <button class="btn btn-block btn-ghost justify-start" :class="sidebarCollapsed ? 'justify-center' : ''" @click="sidebarCollapsed = !sidebarCollapsed">
          <Icon :name="sidebarCollapsed ? 'mdi:chevron-right' : 'mdi:chevron-left'" size="18" />
          <span v-if="!sidebarCollapsed">{{ t('admin.layout.collapse') }}</span>
        </button>
      </div>
    </aside>

    <div
      v-if="mobileSidebarOpen"
      class="fixed inset-0 z-40 bg-neutral/45 lg:hidden"
      @click="mobileSidebarOpen = false"
    />

    <div class="transition-all duration-300" :class="sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'">
      <header class="sticky top-0 z-30 border-b border-base-300 bg-base-200/90 backdrop-blur">
        <div class="flex min-h-18 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div class="flex items-center gap-3">
            <button class="btn btn-ghost lg:hidden" @click="mobileSidebarOpen = !mobileSidebarOpen">
              <Icon name="mdi:menu" size="22" />
            </button>
            <NuxtLink :to="localePath('/')" class="text-sm font-medium text-primary">
              {{ t('admin.layout.backToSite') }}
            </NuxtLink>
          </div>

          <div class="flex items-center gap-0">
            <ThemeSelector />
            <LanguageSelector />
            <LayoutUserMenu />
          </div>
        </div>
      </header>

      <main class="lg:px-4 px-1 py-6 sm:px-6 lg:px-8">
        <div
          id="toast"
          popover="manual"
          class="fixed inset-auto right-4 m-0 w-[min(26rem,calc(100vw-2rem))] max-w-full border-0 bg-transparent p-0 text-inherit shadow-none outline-none backdrop:bg-transparent"
          style="top: 5rem"
        ></div>
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AdminNavigationMenu from '#modula/components/admin/AdminNavigationMenu.vue'
import { getAdminNavigationSections } from '#modula/shared/adminNavigation'
import { useAuthStore } from '#modula/stores/auth'

useNoIndexSeo('Administration')

const localePath = useLocalePath()
const { t } = useI18n()
const siteConfig = useSiteConfigState()
const authStore = useAuthStore()
const facebookFluxDeactivated = computed(() => siteConfig.value?.facebookFluxDeactivated === true)
const adminSections = computed(() => getAdminNavigationSections({
  facebookSyncEnabled: !facebookFluxDeactivated.value,
  featureFlags: siteConfig.value?.featureFlags
}).map(section => ({
  ...section,
  items: section.items.filter((item) => {
    if (authStore.isAdmin) return true
    if (item.requiredSpecialPermission && !authStore.hasSpecialPermission(item.requiredSpecialPermission)) return false
    if (item.requiredModule && item.requiredAction && !authStore.hasModulePermission(item.requiredModule, item.requiredAction)) return false
    return true
  })
})).filter(section => section.items.length > 0))

const sidebarCollapsed = useState('admin-sidebar-collapsed', () => false)
const mobileSidebarOpen = ref(false)
</script>
