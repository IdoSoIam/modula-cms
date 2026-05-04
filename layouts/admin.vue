<template>
  <div class="min-h-screen flex flex-col">
    <LayoutNavigation />
    <div
      id="toast"
      popover="manual"
      class="fixed inset-auto right-4 m-0 w-[min(26rem,calc(100vw-2rem))] max-w-full border-0 bg-transparent p-0 text-inherit shadow-none outline-none backdrop:bg-transparent"
      style="top: 5rem"
    ></div>
    <div class="mx-auto flex-1 w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row gap-6">
        <aside class="md:w-64 shrink-0">
          <ul class="menu bg-base-200 rounded-box w-full">
            <li class="menu-title">{{ $t('admin.title') }}</li>
            <li>
              <NuxtLink :to="localePath('/admin')">
                <Icon name="mdi:view-dashboard-outline" size="18" />
                Dashboard
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/legumes')">
                <Icon name="mdi:carrot" size="18" />
                {{ $t('admin.vegetables') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/paniers')">
                <Icon name="mdi:basket-outline" size="18" />
                {{ $t('admin.baskets') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/reservations')">
                <Icon name="mdi:calendar-check" size="18" />
                {{ $t('admin.reservations') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/articles')">
                <Icon name="mdi:newspaper-variant-outline" size="18" />
                {{ $t('admin.articles') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/livraison')">
                <Icon name="mdi:truck-outline" size="18" />
                {{ $t('admin.delivery') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/images')">
                <Icon name="mdi:image-multiple-outline" size="18" />
                {{ $t('admin.images') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/parametres')">
                <Icon name="mdi:cog-outline" size="18" />
                {{ $t('admin.settings') }}
              </NuxtLink>
            </li>
          </ul>
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

useNoIndexSeo('Administration')
</script>
