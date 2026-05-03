<template>
  <div class="dropdown dropdown-end mx-2">
    <label tabindex="0" class="btn btn-ghost btn-circle">
      <ClientOnly>
        <Icon
          :name="authStore.isAuthenticated ? 'mdi:account-circle' : 'mdi:account-outline'"
          size="24"
        />
        <template #fallback>
          <Icon name="mdi:account-outline" size="24" />
        </template>
      </ClientOnly>
    </label>
    <ClientOnly>
      <ul
        tabindex="0"
        class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
      >
        <template v-if="!authStore.isAuthenticated">
          <li><button @click="showAuthModal = true">{{ $t('auth.login') }}</button></li>
        </template>
        <template v-else>
          <li class="menu-title">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</li>
          <li><NuxtLink to="/profile">{{ $t('auth.profile') }}</NuxtLink></li>
          <template v-if="authStore.user?.role === 'admin'">
            <li class="menu-title mt-2">{{ $t('admin.title') }}</li>
            <li>
              <NuxtLink to="/admin/paniers" class="text-primary">
                <Icon name="mdi:basket-outline" size="16" class="mr-1" />
                {{ $t('admin.baskets') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/admin/legumes" class="text-primary">
                <Icon name="mdi:carrot" size="16" class="mr-1" />
                {{ $t('admin.vegetables') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/admin/reservations" class="text-primary">
                <Icon name="mdi:calendar-check" size="16" class="mr-1" />
                {{ $t('admin.reservations') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/admin/articles" class="text-primary">
                <Icon name="mdi:newspaper-variant-outline" size="18" />
                {{ $t('admin.articles') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/admin/livraison" class="text-primary">
                <Icon name="mdi:truck-outline" size="18" />
                {{ $t('admin.delivery') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/admin/images" class="text-primary">
                <Icon name="mdi:image-multiple-outline" size="18" />
                {{ $t('admin.images') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/admin/parametres" class="text-primary">
                <Icon name="mdi:cog-outline" size="16" class="mr-1" />
                {{ $t('admin.settings') }}
              </NuxtLink>
            </li>
            <li v-if="!facebookFluxDeactivated">
              <NuxtLink to="/facebook-sync" class="text-primary">
                <Icon name="mdi:facebook" size="16" class="mr-1" />
                {{ $t('admin.facebookSync') }}
              </NuxtLink>
            </li>
          </template>
          <li>
            <button @click="handleLogout" class="text-error">{{ $t('auth.logout') }}</button>
          </li>
        </template>
      </ul>
      <template #fallback>
        <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
          <li><button @click="showAuthModal = true">{{ $t('auth.login') }}</button></li>
        </ul>
      </template>
    </ClientOnly>
  </div>

  <!-- Modal d'authentification -->
  <dialog id="auth_modal" class="modal" :class="{ 'modal-open': showAuthModal }">
    <div class="modal-box relative">
      <button
        class="btn btn-sm btn-circle absolute right-2 top-2"
        @click="showAuthModal = false"
      >
        ✕
      </button>
      <AuthForm @success="onAuthSuccess" />
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="showAuthModal = false">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const showAuthModal = ref(false)

const { data: siteConfig } = await useFetch<{ facebookFluxDeactivated: boolean }>('/api/site-config')
const facebookFluxDeactivated = computed(() => siteConfig.value?.facebookFluxDeactivated ?? false)

const handleLogout = async () => {
  await authStore.logout()
  const { $toast } = useNuxtApp()
  $toast.success("Vous avez été déconnecté")
}

const onAuthSuccess = () => {
  showAuthModal.value = false
  const { $toast } = useNuxtApp()
  $toast.success("Connexion réussie")
}
</script>
