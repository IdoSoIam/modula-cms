<template>
  <div class="flex items-center justify-center bg-base-200 min-h-[calc(100vh-300px)]">
    <div class="card w-full max-w-lg bg-base-100 shadow-xl">
      <div class="card-body">
        <h1 class="card-title mb-4">{{ $t('auth.register') }}</h1>

        <div v-if="!registerEnabled" class="alert alert-warning">
          <span>{{ $t('auth.registerDisabled') }}</span>
        </div>

        <form v-else class="space-y-4" @submit.prevent="submit">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ $t('auth.firstName') }}</span></label>
              <input v-model="form.firstName" type="text" class="input input-bordered" autocomplete="given-name" />
            </div>
            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ $t('auth.lastName') }}</span></label>
              <input v-model="form.lastName" type="text" class="input input-bordered" autocomplete="family-name" />
            </div>
          </div>

          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">Email</span></label>
            <input v-model="form.email" type="email" class="input input-bordered" autocomplete="email" required />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ $t('auth.password') }}</span></label>
              <input v-model="form.password" type="password" class="input input-bordered" autocomplete="new-password" required />
            </div>
            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ $t('auth.confirmPassword') }}</span></label>
              <input v-model="form.confirmPassword" type="password" class="input input-bordered" autocomplete="new-password" required />
            </div>
          </div>

          <div class="flex items-center justify-between gap-4 pt-2">
            <NuxtLink :to="localePath('/login')" class="link link-primary">{{ $t('auth.login') }}</NuxtLink>
            <button type="submit" class="btn btn-primary" :disabled="pending">
              <span v-if="pending" class="loading loading-spinner loading-sm" />
              {{ $t('auth.register') }}
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

const { t } = useI18n()
const { contentLocale } = useContentLocale()
const locale = computed(() => contentLocale.value)
const router = useRouter()
const localePath = usePublicLocalePath()
const authStore = useAuthStore()
const siteConfig = useSiteConfigState()
const { $toast } = useNuxtApp() as any

useNoIndexSeo('Inscription', 'Créez un compte utilisateur public si l’inscription est activée.')

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
    $toast.error(String(t('auth.registerDisabled')))
    return
  }

  if (!form.email.trim() || !form.password.trim()) {
    $toast.error(String(t('auth.fillRequiredFields')))
    return
  }

  if (form.password !== form.confirmPassword) {
    $toast.error(String(t('auth.passwordMismatch')))
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
    $toast.success(contentLocale.value === 'en' ? 'Account created successfully.' : 'Compte créé avec succès.')
    await router.push(localePath('/profile'))
  } catch (error: any) {
    $toast.error(error?.data?.statusMessage || error?.statusMessage || (contentLocale.value === 'en' ? 'Unable to create account.' : 'Impossible de créer le compte.'))
  } finally {
    pending.value = false
  }
}
</script>
