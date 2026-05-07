<template>
  <div class="min-h-screen flex flex-col">
    <LayoutNavigation />
    <div
      id="toast"
      popover="manual"
      class="fixed inset-auto right-4 m-0 w-[min(26rem,calc(100vw-2rem))] max-w-full border-0 bg-transparent p-0 text-inherit shadow-none outline-none backdrop:bg-transparent"
      style="top: 5rem"
    ></div>
    <div class="mx-auto flex-1 w-full max-w-8xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row gap-6">
        <aside class="shrink-0 transition-all duration-300" :class="sidebarCollapsed ? 'md:w-16' : 'md:w-64'">
          <div class="menu bg-base-200 rounded-box w-full relative">
            <button
              class="absolute -right-3 top-2 btn btn-circle btn-xs btn-ghost bg-base-200"
              @click="sidebarCollapsed = !sidebarCollapsed"
              :title="sidebarCollapsed ? 'Développer' : 'Réduire'"
            >
              <Icon :name="sidebarCollapsed ? 'mdi:chevron-right' : 'mdi:chevron-left'" size="16" />
            </button>
            <li class="menu-title" :class="sidebarCollapsed ? 'px-2' : ''">
              <span :class="sidebarCollapsed ? 'hidden' : ''">{{ $t('admin.title') }}</span>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin')" :class="getLinkClass('/admin')">
                <Icon name="mdi:view-dashboard-outline" size="18" />
                <span :class="sidebarCollapsed ? 'hidden' : ''">Dashboard</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/accueil')" :class="getLinkClass('/admin/accueil')" no-prefetch>
                <Icon name="mdi:home-edit-outline" size="16" />
                <span :class="sidebarCollapsed ? 'hidden' : ''">Accueil</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/legumes')" :class="getLinkClass('/admin/legumes')">
                <Icon name="mdi:carrot" size="18" />
                <span :class="sidebarCollapsed ? 'hidden' : ''">{{ $t('admin.vegetables') }}</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/paniers')" :class="getLinkClass('/admin/paniers')">
                <Icon name="mdi:basket-outline" size="18" />
                <span :class="sidebarCollapsed ? 'hidden' : ''">{{ $t('admin.baskets') }}</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/reservations')" :class="getLinkClass('/admin/reservations')">
                <Icon name="mdi:calendar-check" size="18" />
                <span :class="sidebarCollapsed ? 'hidden' : ''">{{ $t('admin.reservations') }}</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/articles')" :class="getLinkClass('/admin/articles')">
                <Icon name="mdi:newspaper-variant-outline" size="18" />
                <span :class="sidebarCollapsed ? 'hidden' : ''">{{ $t('admin.articles') }}</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/livraison')" :class="getLinkClass('/admin/livraison')">
                <Icon name="mdi:truck-outline" size="18" />
                <span :class="sidebarCollapsed ? 'hidden' : ''">{{ $t('admin.delivery') }}</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/images')" :class="getLinkClass('/admin/images')">
                <Icon name="mdi:image-multiple-outline" size="18" />
                <span :class="sidebarCollapsed ? 'hidden' : ''">{{ $t('admin.images') }}</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/parametres')" :class="getLinkClass('/admin/parametres')">
                <Icon name="mdi:cog-outline" size="18" />
                <span :class="sidebarCollapsed ? 'hidden' : ''">{{ $t('admin.settings') }}</span>
              </NuxtLink>
            </li>
          </div>
        </aside>
        <main class="flex-1 min-w-0">
          <slot />
        </main>
      </div>
    </div>
    <LayoutFooter />
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
const route = useRoute()

useNoIndexSeo('Administration')

const sidebarCollapsed = ref(false)

const getLinkClass = (path: string) => {
  const isActive = route.path === path || route.path.startsWith(`${path}/`)
  return {
    'justify-center': sidebarCollapsed.value,
    'text-primary': isActive
  }
}
</script>
