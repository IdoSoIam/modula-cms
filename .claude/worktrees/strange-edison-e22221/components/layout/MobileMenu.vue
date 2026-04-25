<template>
  <div class="drawer-side z-50">
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
const localePath = useLocalePath();

const menuItems = [
  { path: '/', label: 'menu.home' },
  { path: '/news', label: 'menu.news' },
  { path: '/shop', label: 'menu.shop' },
  { path: '/contact', label: 'menu.contact' }
];</script>
