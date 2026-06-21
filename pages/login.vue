<template>
  <div class="flex items-center justify-center bg-base-200 min-h-[calc(100vh-300px)]">
    <div class="card w-96 bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title mb-4">Connexion</h2>

        <AuthForm :show-heading="false" @success="handleSuccess" />

        <div class="text-sm mt-4 space-y-2">
          <p v-if="registerEnabled">
            {{ $t('auth.noAccount') }}
            <NuxtLink :to="localePath('/register')" class="link link-primary">{{ $t('auth.register') }}</NuxtLink>
          </p>
          <p v-else>{{ $t('auth.contactAdminForAccount') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const localePath = useLocalePath()
const siteConfig = useSiteConfigState()
const registerEnabled = computed(() => siteConfig.value?.registerEnabled === true)

useNoIndexSeo('Connexion', 'Accès réservé aux comptes autorisés du site.')

const handleSuccess = async () => {
  await router.push(localePath('/profile'))
}
</script>
