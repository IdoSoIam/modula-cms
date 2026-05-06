<template>
  <div v-if="showNavigation" class="drawer-side z-50">
    <label for="drawer-toggle" class="drawer-overlay"></label>
    <ul class="menu p-4 w-80 min-h-full bg-base-100">
      <li class="mb-4">
        <img src="/images/logo-removebg-preview.png" alt="Logo" class="h-24 mx-auto" />
      </li>
      <li v-for="item in menuItems" :key="item.path">
        <NuxtLink
          :to="localePath(item.path)"
          :class="{ active: $route.path === localePath(item.path) }"
        >
          {{ $t(item.label) }}
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const localePath = useLocalePath();
const authStore = useAuthStore()
const config = useRuntimeConfig()
const inDevelopment = computed(() => config.public.inDevelopment === true || config.public.inDevelopment === 'true')
const showNavigation = computed(() => !(inDevelopment.value && !authStore.isAuthenticated))

const menuItems = [
  { path: '/', label: 'menu.home' },
  { path: '/news', label: 'menu.news' },
  { path: '/paniers', label: 'menu.baskets' },
  { path: '/contact', label: 'menu.contact' }
];</script>
