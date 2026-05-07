<template>
  <div v-if="authStore.isAuthenticated || registerEnabled" class="dropdown dropdown-end mx-2">
    <label tabindex="0" class="btn btn-ghost btn-circle">
      <ClientOnly>
        <Icon
          name="mdi:account-circle"
          size="24"
        />
        <template #fallback>
          <Icon name="mdi:account-circle" size="24" />
        </template>
      </ClientOnly>
    </label>
    <ClientOnly>
      <ul
        tabindex="0"
        class="dropdown-content z-[1] menu rounded-box bg-base-100 p-2 shadow w-52"
      >
        <template v-if="!authStore.isAuthenticated">
          <li><button @click="showAuthModal = true">{{ $t('auth.login') }}</button></li>
        </template>
        <template v-else>
          <li class="menu-title">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</li>
          <li><NuxtLink :to="localePath('/profile')">{{ $t('auth.profile') }}</NuxtLink></li>
          <template v-if="authStore.user?.role === 'admin'">
            <li class="menu-title mt-2">{{ $t('admin.title') }}</li>
            <li>
              <NuxtLink :to="localePath('/admin/paniers')" class="text-primary">
                <Icon name="mdi:basket-outline" size="16" class="mr-1" />
                {{ $t('admin.baskets') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/legumes')" class="text-primary">
                <Icon name="mdi:carrot" size="16" class="mr-1" />
                {{ $t('admin.vegetables') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/reservations')" class="text-primary">
                <Icon name="mdi:calendar-check" size="16" class="mr-1" />
                {{ $t('admin.reservations') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/articles')" class="text-primary">
                <Icon name="mdi:newspaper-variant-outline" size="18" />
                {{ $t('admin.articles') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/livraison')" class="text-primary">
                <Icon name="mdi:truck-outline" size="18" />
                {{ $t('admin.delivery') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/images')" class="text-primary">
                <Icon name="mdi:image-multiple-outline" size="18" />
                {{ $t('admin.images') }}
              </NuxtLink>
            </li>
            <li>
              <NuxtLink :to="localePath('/admin/parametres')" class="text-primary">
                <Icon name="mdi:cog-outline" size="16" class="mr-1" />
                {{ $t('admin.settings') }}
              </NuxtLink>
            </li>
            <li v-if="!facebookFluxDeactivated">
              <NuxtLink :to="localePath('/facebook-sync')" class="text-primary">
                <Icon name="mdi:facebook" size="16" class="mr-1" />
                {{ $t('admin.facebookSync') }}
              </NuxtLink>
            </li>
          </template>
          <li>
            <button class="text-error" @click="handleLogout">{{ $t('auth.logout') }}</button>
          </li>
        </template>
      </ul>
      <template #fallback>
        <ul tabindex="0" class="dropdown-content z-[1] menu rounded-box bg-base-100 p-2 shadow w-52">
          <li><button @click="showAuthModal = true">{{ $t('auth.login') }}</button></li>
        </ul>
      </template>
    </ClientOnly>
  </div>

  <dialog id="auth_modal" class="modal" :class="{ 'modal-open': showAuthModal }">
    <div class="modal-box relative">
      <button
        class="btn btn-sm btn-circle absolute right-2 top-2"
        @click="showAuthModal = false"
      >
        x
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
const router = useRouter()
const localePath = useLocalePath()
const showAuthModal = ref(false)

const siteConfig = await useSiteConfig()
const facebookFluxDeactivated = computed(() => siteConfig.value?.facebookFluxDeactivated ?? false)
const registerEnabled = computed(() => siteConfig.value?.registerEnabled ?? false)

const handleLogout = async () => {
  await authStore.logout()
  const { $toast } = useNuxtApp()
  $toast.success('Vous avez été déconnecté')
  await router.push(localePath('/'))
}

const onAuthSuccess = () => {
  showAuthModal.value = false
  const { $toast } = useNuxtApp()
  $toast.success('Connexion réussie')
}
</script>
