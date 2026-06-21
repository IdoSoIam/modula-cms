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
      class="dropdown-content z-[1] rounded-box bg-base-100 p-2 shadow w-72"
    >
      <template v-if="!authStore.isAuthenticated">
        <div v-if="shopEnabled" class="px-3 py-2 hover:bg-base-200">
          <NuxtLink :to="localePath('/panier')" class="inline-flex items-center justify-between text-sm text-primary w-full h-full">
            <span>{{ $t('cart.viewCart') }}</span>
            <span v-if="cartCount > 0" class="badge badge-primary badge-sm">{{ cartCount }}</span>
          </NuxtLink>
        </div>
        <div class="px-3 py-2 hover:bg-base-200">
          <NuxtLink :to="localePath('/login')" class="inline-flex text-sm text-primary w-full h-full">{{ $t('auth.login') }}</NuxtLink>
        </div>
        <div v-if="registerEnabled" class="px-3 py-2 hover:bg-base-200">
          <NuxtLink :to="localePath('/register')" class="inline-flex text-sm text-primary w-full h-full">{{ $t('auth.register') }}</NuxtLink>
        </div>
      </template>
      <template v-else>
        <div class="px-3 py-2 hover:bg-base-200">
          <div class="text-sm font-semibold">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</div>
          <NuxtLink :to="localePath('/profile')" class="inline-flex text-sm text-primary w-full h-full">{{ $t('auth.profile') }}</NuxtLink>
        </div>
        <div v-if="shopEnabled && !authStore.isAdmin" class="px-3 py-2 hover:bg-base-200">
          <NuxtLink :to="ordersProfileLink" class="inline-flex text-sm text-primary w-full h-full">{{ $t('auth.orders') }}</NuxtLink>
        </div>
        <div v-if="shopEnabled" class="px-3 py-2 hover:bg-base-200">
          <NuxtLink :to="localePath('/panier')" class="inline-flex items-center justify-between text-sm text-primary w-full h-full">
            <span>{{ $t('cart.viewCart') }}</span>
            <span v-if="cartCount > 0" class="badge badge-primary badge-sm">{{ cartCount }}</span>
          </NuxtLink>
        </div>
        <template v-if="authStore.canAccessAdmin">
          <div class="px-3 py-2 hover:bg-base-200">
            <NuxtLink :to="localePath('/admin')" class="inline-flex text-sm text-primary w-full h-full">{{ $t('admin.title') }}</NuxtLink>
          </div>
        </template>
        <div class="px-3 py-2 hover:bg-base-200">
          <button type="button" class="inline-flex text-sm text-primary cursor-pointer w-full h-full" @click="handleLogout">{{ $t('auth.logout') }}</button>
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
const localePath = useLocalePath()
const { count: cartCount } = useShopCart()

const siteConfig = useSiteConfigState()
const registerEnabled = computed(() => siteConfig.value?.registerEnabled === true)
const shopEnabled = computed(() => siteConfig.value?.featureFlags?.shop?.enabled === true)
const ordersProfileLink = computed(() => localePath({ path: '/profile', query: { tab: 'orders' } }))

const handleLogout = async () => {
  await authStore.logout()
  const { $toast } = useNuxtApp() as any
  $toast.success('Vous avez été déconnecté')
  await router.push(localePath('/'))
}
</script>
