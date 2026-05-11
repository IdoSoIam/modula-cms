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
        <li class="menu"><button @click="showAuthModal = true">{{ $t('auth.login') }}</button></li>
      </template>
      <template v-else>
        <div class="px-3 py-2">
          <div class="text-sm font-semibold">{{ authStore.user?.firstName }} {{ authStore.user?.lastName }}</div>
          <NuxtLink :to="localePath('/profile')" class="mt-2 inline-flex text-sm text-primary">{{ $t('auth.profile') }}</NuxtLink>
        </div>
        <template v-if="authStore.user?.role === 'admin'">
          <div class="border-t border-base-200 px-1 py-2">
            <div class="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] opacity-60">
              {{ $t('admin.title') }}
            </div>
            <AdminNavigationMenu :sections="adminSections" variant="text" />
          </div>
        </template>
        <div class="menu border-t border-base-200 pt-2">
          <li>
            <button class="text-error" @click="handleLogout">{{ $t('auth.logout') }}</button>
          </li>
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
import AdminNavigationMenu from '~/components/admin/AdminNavigationMenu.vue'
import { getAdminNavigationSections } from '~/shared/adminNavigation'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const localePath = useLocalePath()
const showAuthModal = ref(false)

const siteConfig = useSiteConfigState()
const facebookFluxDeactivated = computed(() => siteConfig.value?.facebookFluxDeactivated === true)
const registerEnabled = computed(() => siteConfig.value?.registerEnabled === true)
const adminSections = computed(() => getAdminNavigationSections({
  facebookSyncEnabled: !facebookFluxDeactivated.value
}))

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
