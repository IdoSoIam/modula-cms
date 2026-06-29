<template>
  <div v-if="authStore.isAuthenticated || registerEnabled" class="dropdown dropdown-end mx-2">
    <label tabindex="0" class="btn btn-ghost btn-circle">
      <Icon
        name="mdi:account-circle"
        size="24"
      />
    </label>
    <ul
      tabindex="0"
      class="dropdown-content z-[1] w-72 rounded-box bg-base-100 p-2 shadow"
    >
      <template v-if="!authStore.isAuthenticated">
        <div v-if="shopEnabled" class="px-3 py-2 hover:bg-base-200">
          <NuxtLink :to="localePath('/panier')" class="inline-flex h-full w-full items-center justify-between text-sm text-primary">
            <span>{{ publicText('auth.userMenu.viewCart', 'Voir le panier') }}</span>
            <span v-if="cartCount > 0" class="badge badge-primary badge-sm">{{ cartCount }}</span>
          </NuxtLink>
        </div>
        <div class="px-3 py-2 hover:bg-base-200">
          <NuxtLink :to="localePath('/login')" class="inline-flex h-full w-full text-sm text-primary">{{ publicText('auth.userMenu.login', 'Connexion') }}</NuxtLink>
        </div>
        <div v-if="registerEnabled" class="px-3 py-2 hover:bg-base-200">
          <NuxtLink :to="localePath('/register')" class="inline-flex h-full w-full text-sm text-primary">{{ publicText('auth.userMenu.register', 'Inscription') }}</NuxtLink>
        </div>
      </template>
      <template v-else>
        <div class="px-3 py-2 hover:bg-base-200">
          <div class="text-sm font-semibold">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</div>
          <NuxtLink :to="localePath('/profile')" class="inline-flex h-full w-full text-sm text-primary">{{ publicText('auth.userMenu.profile', 'Profil') }}</NuxtLink>
        </div>
        <div v-if="shopEnabled && !authStore.isAdmin" class="px-3 py-2 hover:bg-base-200">
          <NuxtLink :to="ordersProfileLink" class="inline-flex h-full w-full text-sm text-primary">{{ publicText('auth.userMenu.orders', 'Commandes') }}</NuxtLink>
        </div>
        <div v-if="shopEnabled" class="px-3 py-2 hover:bg-base-200">
          <NuxtLink :to="localePath('/panier')" class="inline-flex h-full w-full items-center justify-between text-sm text-primary">
            <span>{{ publicText('auth.userMenu.viewCart', 'Voir le panier') }}</span>
            <span v-if="cartCount > 0" class="badge badge-primary badge-sm">{{ cartCount }}</span>
          </NuxtLink>
        </div>
        <template v-if="authStore.canAccessAdmin">
          <div class="px-3 py-2 hover:bg-base-200">
            <NuxtLink :to="adminLocalePath('/admin')" class="inline-flex h-full w-full text-sm text-primary">{{ $t('admin.title') }}</NuxtLink>
          </div>
        </template>
        <div class="px-3 py-2 hover:bg-base-200">
          <button type="button" class="inline-flex h-full w-full cursor-pointer text-sm text-primary" @click="handleLogout">{{ publicText('auth.userMenu.logout', 'Déconnexion') }}</button>
        </div>
      </template>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '#modula/stores/auth'
import { useShopCart } from '#modula/composables/useShopCart'

const authStore = useAuthStore()
const router = useRouter()
const localePath = usePublicLocalePath()
const adminLocalePath = useLocalePath()
const { count: cartCount } = useShopCart()
const { publicText } = usePublicDictionary()

const siteConfig = useSiteConfigState()
const registerEnabled = computed(() => siteConfig.value?.registerEnabled === true)
const shopEnabled = computed(() => siteConfig.value?.featureFlags?.shop?.enabled === true)
const ordersProfileLink = computed(() => localePath({ path: '/profile', query: { tab: 'orders' } }))

const handleLogout = async () => {
  await authStore.logout()
  const { $toast } = useNuxtApp() as any
  $toast.success(publicText('auth.userMenu.logoutSuccess', 'Vous avez été déconnecté.'))
  await router.push(localePath('/'))
}
</script>
