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
        <img src="/images/logo-removebg-preview.png" alt="Logo" class="h-12" />
        <span class="text-xl font-bold hidden sm:inline">Ferme du Campeyrigoux</span>
      </NuxtLink>
    </div>

    <!-- Menu desktop -->
    <div class="navbar-center hidden md:flex">
      <ul v-if="showNavigation" class="menu menu-horizontal px-1 gap-2">
        <li v-for="item in menuItems" :key="item.path">
          <NuxtLink
            :to="localePath(item.path)"
            class="btn btn-ghost"
            :class="{ 'btn-active': $route.path === localePath(item.path) }"
          >
            {{ $t(item.label) }}
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
import { useAuthStore } from '~/stores/auth'

const localePath = useLocalePath();
const authStore = useAuthStore()
const siteConfig = useSiteConfigState()
const inDevelopment = computed(() => siteConfig.value?.inDevelopment === true)
const showNavigation = computed(() => !(inDevelopment.value && !authStore.isAuthenticated))

const menuItems = [
  { path: '/', label: 'menu.home' },
  { path: '/news', label: 'menu.news' },
  { path: '/paniers', label: 'menu.baskets' },
  { path: '/contact', label: 'menu.contact' }
];</script>
