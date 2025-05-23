<template>
  <div class="dropdown dropdown-end mx-2">
    <label tabindex="0" class="btn btn-ghost btn-circle">
      <Icon
        :name="isAuthenticated ? 'mdi:account-circle' : 'mdi:account-outline'"
        size="24"
      />
    </label>
    <ul
      tabindex="0"
      class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
    >
      <template v-if="!isAuthenticated">
        <li><button @click="showAuthModal = true">{{ $t('auth.login') }}</button></li>
      </template>
      <template v-else>
        <li class="menu-title">{{ user?.firstName }} {{ user?.lastName }}</li>
        <li><NuxtLink to="/profile">{{ $t('auth.profile') }}</NuxtLink></li>
        <li><NuxtLink to="/commandes">{{ $t('auth.orders') }}</NuxtLink></li>
        <li>
          <button @click="handleLogout" class="text-error">{{ $t('auth.logout') }}</button>
        </li>
      </template>
    </ul>
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
const { isAuthenticated, user, logout } = useAuth();
const showAuthModal = ref(false);

const handleLogout = async () => {
  await logout();
  const { $toast } = useNuxtApp();
  $toast.success("Vous avez été déconnecté");
};

const onAuthSuccess = () => {
  showAuthModal.value = false;
  const { $toast } = useNuxtApp();
  $toast.success("Connexion réussie");
};</script>
