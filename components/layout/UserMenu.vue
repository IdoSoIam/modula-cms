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
        <div class="px-3 py-2 hover:bg-base-200">
          <button type="button" class="inline-flex text-sm text-primary cursor-pointer w-full h-full" @click="showAuthModal = true">{{ $t('auth.login') }}</button>
        </div>
      </template>
      <template v-else>
        <div class="px-3 py-2 hover:bg-base-200">
          <div class="text-sm font-semibold">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</div>
          <NuxtLink :to="localePath('/profile')" class="inline-flex text-sm text-primary w-full h-full">{{ $t('auth.profile') }}</NuxtLink>
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

const siteConfig = useSiteConfigState()
const registerEnabled = computed(() => siteConfig.value?.registerEnabled === true)

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
