<template>
  <div class="navbar bg-base-100 sticky top-0 z-50">
    <div class="navbar-start">
      <!-- Hamburger pour mobile -->
      <div class="md:hidden">
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
      <ul class="menu menu-horizontal px-1">
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
    </div>    <div class="navbar-end">
      <ThemeController />
      <LanguageSelector />
      <LayoutUserMenu />
      <MiniCart />
    </div>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath();

const menuItems = [
  { path: '/', label: 'menu.home' },
  { path: '/news', label: 'menu.news' },
  { path: '/shop', label: 'menu.shop' },
  { path: '/contact', label: 'menu.contact' }
];</script>
