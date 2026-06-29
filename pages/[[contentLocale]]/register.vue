<template>
  <div class="flex items-center justify-center bg-base-200 min-h-[calc(100vh-300px)]">
    <div class="card w-full max-w-lg bg-base-100 shadow-xl">
      <div class="card-body">
        <h1 class="card-title mb-4">{{ publicText('auth.register.title', 'Inscription') }}</h1>

        <div v-if="!registerEnabled" class="alert alert-warning">
          <span>{{ publicText('auth.register.disabled', 'L’inscription publique est désactivée pour le moment.') }}</span>
        </div>

        <form v-else class="space-y-4" @submit.prevent="submit">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ publicText('auth.register.firstName', 'Prénom') }}</span></label>
              <input v-model="form.firstName" type="text" class="input input-bordered" autocomplete="given-name" />
            </div>
            <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ publicText('auth.register.lastName', 'Nom') }}</span></label>
              <input v-model="form.lastName" type="text" class="input input-bordered" autocomplete="family-name" />
            </div>
          </div>

          <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ publicText('auth.register.email', 'Email') }}</span></label>
            <input v-model="form.email" type="email" class="input input-bordered" autocomplete="email" required />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ publicText('auth.register.password', 'Mot de passe') }}</span></label>
              <input v-model="form.password" type="password" class="input input-bordered" autocomplete="new-password" required />
            </div>
            <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ publicText('auth.register.confirmPassword', 'Confirmation') }}</span></label>
              <input v-model="form.confirmPassword" type="password" class="input input-bordered" autocomplete="new-password" required />
            </div>
          </div>

          <div class="flex items-center justify-between gap-4 pt-2">
            <NuxtLink :to="localePath('/login')" class="link link-primary">{{ publicText('auth.register.loginLink', 'Connexion') }}</NuxtLink>
            <button type="submit" class="btn btn-primary" :disabled="pending">
              <span v-if="pending" class="loading loading-spinner loading-sm" />
              {{ publicText('auth.register.title', 'Inscription') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  i18n: false,
})

const { contentLocale } = useContentLocale()
const { publicText } = usePublicDictionary()
const locale = computed(() => contentLocale.value)
const router = useRouter()
const localePath = usePublicLocalePath()
const authStore = useAuthStore()
const siteConfig = useSiteConfigState()
const { $toast } = useNuxtApp() as any

useNoIndexSeo(
  computed(() => publicText('auth.register.seoTitle', 'Inscription')),
  computed(() => publicText('auth.register.seoDescription', 'Créez un compte utilisateur public si l’inscription est activée.'))
)

const registerEnabled = computed(() => siteConfig.value?.registerEnabled === true)
const pending = ref(false)
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

async function submit() {
  if (!registerEnabled.value) {
    $toast.error(publicText('auth.register.disabled', 'L’inscription publique est désactivée pour le moment.'))
    return
  }

  if (!form.email.trim() || !form.password.trim()) {
    $toast.error(publicText('auth.register.fillRequiredFields', 'Veuillez renseigner les champs obligatoires.'))
    return
  }

  if (form.password !== form.confirmPassword) {
    $toast.error(publicText('auth.register.passwordMismatch', 'Les mots de passe ne correspondent pas.'))
    return
  }

  pending.value = true
  try {
    await authStore.register({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      language: contentLocale.value
    })
    $toast.success(publicText('auth.register.success', 'Compte créé avec succès.'))
    await router.push(localePath('/profile'))
  } catch (error: any) {
    $toast.error(error?.data?.statusMessage || error?.statusMessage || publicText('auth.register.error', 'Impossible de créer le compte.'))
  } finally {
    pending.value = false
  }
}
</script>
