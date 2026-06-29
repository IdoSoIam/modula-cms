<template>
  <div class="flex items-center justify-center bg-base-200 min-h-[calc(100vh-300px)]">
    <div class="card w-96 bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title mb-4">{{ loginTitle }}</h2>

        <AuthForm :show-heading="false" @success="handleSuccess" />

        <div class="text-sm mt-4 space-y-2">
          <p v-if="registerEnabled">
            {{ publicText('auth.login.noAccount', 'Vous n’avez pas encore de compte ?') }}
            <NuxtLink :to="localePath('/register')" class="link link-primary">{{ publicText('auth.login.registerLink', 'Créer un compte') }}</NuxtLink>
          </p>
          <p v-else>{{ publicText('auth.login.contactAdminForAccount', 'Contactez l’administrateur pour obtenir un accès.') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  i18n: false,
})

const router = useRouter()
const localePath = usePublicLocalePath()
const { publicText } = usePublicDictionary()
const siteConfig = useSiteConfigState()
const registerEnabled = computed(() => siteConfig.value?.registerEnabled === true)
const loginTitle = computed(() => publicText('auth.login.title', 'Connexion'))

useNoIndexSeo(
  computed(() => publicText('auth.login.seoTitle', 'Connexion')),
  computed(() => publicText('auth.login.seoDescription', 'Accès réservé aux comptes autorisés du site.'))
)

const handleSuccess = async () => {
  await router.push(localePath('/profile'))
}
</script>
