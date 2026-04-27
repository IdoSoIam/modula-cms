<template>
  <div class="min-h-screen flex flex-col">
    <LayoutNavigation />
    <div class="flex-1 container mx-auto px-4 py-6">
      <div class="flex flex-col md:flex-row gap-6">
        <aside class="md:w-64 shrink-0">
          <ul class="menu bg-base-200 rounded-box w-full">
            <li class="menu-title">{{ $t('admin.title') }}</li>
            <li>
              <NuxtLink to="/admin">
                <Icon name="mdi:view-dashboard-outline" size="18" />
                Dashboard
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/admin/legumes">
                <Icon name="mdi:carrot" size="18" />
                {{ $t('admin.vegetables') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/admin/paniers">
                <Icon name="mdi:basket-outline" size="18" />
                {{ $t('admin.baskets') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/admin/reservations">
                <Icon name="mdi:calendar-check" size="18" />
                {{ $t('admin.reservations') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/admin/articles">
                <Icon name="mdi:newspaper-variant-outline" size="18" />
                {{ $t('admin.articles') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/admin/livraison">
                <Icon name="mdi:truck-outline" size="18" />
                {{ $t('admin.delivery') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/admin/images">
                <Icon name="mdi:image-multiple-outline" size="18" />
                {{ $t('admin.images') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/admin/parametres">
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
