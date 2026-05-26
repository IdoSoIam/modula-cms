<template>
  <div class="bg-base-200">
    <div class="mx-auto flex min-h-[calc(100vh-280px)] w-full max-w-3xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <div class="card w-full border border-base-300 bg-base-100 shadow-xl">
        <div class="card-body gap-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="badge badge-primary badge-outline mb-3">Invitation</div>
              <h1 class="text-3xl font-bold">Définir votre mot de passe</h1>
              <p class="mt-2 max-w-2xl text-sm opacity-70">
                Choisissez un mot de passe pour activer votre accès à l’espace de la ferme.
              </p>
              <p v-if="invitation?.email" class="mt-3 text-sm">
                Compte invité : <span class="font-semibold">{{ invitation.email }}</span>
              </p>
            </div>
            <div class="grid h-14 w-14 place-items-center rounded-box bg-primary/10 text-primary">
              <Icon name="mdi:lock-reset" size="28" />
            </div>
          </div>

          <div v-if="pending" class="py-8 text-center">
            <span class="loading loading-spinner loading-lg" />
          </div>

          <div v-else-if="tokenError" class="space-y-5">
            <div class="alert alert-error items-start">
              <Icon name="mdi:alert-circle-outline" size="22" />
              <div>
                <div class="font-semibold">Lien invalide ou expiré</div>
                <p class="text-sm">Demandez une nouvelle invitation à l’administrateur.</p>
              </div>
            </div>
            <NuxtLink :to="localePath('/login')" class="btn btn-ghost">Retour à la connexion</NuxtLink>
          </div>

          <div v-else-if="success" class="space-y-5">
            <div class="alert alert-success items-start">
              <Icon name="mdi:check-circle-outline" size="22" />
              <div>
                <div class="font-semibold">Mot de passe enregistré</div>
                <p class="text-sm">Votre compte est prêt. Vous pouvez maintenant vous connecter.</p>
              </div>
            </div>
            <NuxtLink :to="localePath('/login')" class="btn btn-primary">Aller à la connexion</NuxtLink>
          </div>

          <form v-else class="space-y-5" @submit.prevent="submitPassword">
            <div v-if="errorMessage" class="alert alert-error items-start">
              <Icon name="mdi:alert-circle-outline" size="22" />
              <span>{{ errorMessage }}</span>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="form-control gap-2">
                <span class="label-text">Nouveau mot de passe</span>
                <input
                  v-model="form.password"
                  type="password"
                  autocomplete="new-password"
                  class="input input-bordered w-full"
                  :class="showPasswordError ? 'input-error' : ''"
                  required
                />
              </label>
              <label class="form-control gap-2">
                <span class="label-text">Confirmation</span>
                <input
                  v-model="form.passwordConfirmation"
                  type="password"
                  autocomplete="new-password"
                  class="input input-bordered w-full"
                  :class="showConfirmationError ? 'input-error' : ''"
                  required
                />
              </label>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200 p-4 text-sm">
              <div class="font-medium">Sécurité du mot de passe</div>
              <ul class="mt-3 space-y-2">
                <li v-for="check in passwordChecks" :key="check.label" class="flex items-center gap-2">
                  <Icon :name="check.valid ? 'mdi:check-circle-outline' : 'mdi:circle-outline'" size="18" :class="check.valid ? 'text-success' : 'opacity-50'" />
                  <span>{{ check.label }}</span>
                </li>
              </ul>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-3">
              <NuxtLink :to="localePath('/login')" class="btn btn-ghost">Retour à la connexion</NuxtLink>
              <button type="submit" class="btn btn-primary" :disabled="submitting || !canSubmit">
                <span v-if="submitting" class="loading loading-spinner loading-sm" />
                Enregistrer le mot de passe
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface PasswordSetupValidation {
  valid: boolean
  email: string
  firstName?: string | null
  lastName?: string | null
  expiresAt: string
}

const route = useRoute()
const localePath = useLocalePath()

useNoIndexSeo('Définir votre mot de passe', 'Page sécurisée de définition de mot de passe pour les comptes invités.')

const token = computed(() => String(route.params.token || ''))
const { data: invitation, pending, error: validationError } = await useFetch<PasswordSetupValidation>(`/api/auth/password-setup/${encodeURIComponent(token.value)}`, {
  key: `password-setup-${token.value}`
})
const submitting = ref(false)
const submitted = ref(false)
const success = ref(false)
const errorMessage = ref('')
const form = reactive({
  password: '',
  passwordConfirmation: ''
})

const passwordChecks = computed(() => [
  { label: 'Au moins 8 caractères', valid: form.password.length >= 8 },
  { label: 'Au moins une lettre', valid: /[A-Za-z]/.test(form.password) },
  { label: 'Au moins un chiffre', valid: /\d/.test(form.password) }
])
const passwordValid = computed(() => passwordChecks.value.every(check => check.valid))
const confirmationValid = computed(() => form.password.length > 0 && form.password === form.passwordConfirmation)
const tokenError = computed(() => !token.value || Boolean(validationError.value) || invitation.value?.valid === false)
const canSubmit = computed(() => !tokenError.value && passwordValid.value && confirmationValid.value)
const showPasswordError = computed(() => submitted.value && !passwordValid.value)
const showConfirmationError = computed(() => submitted.value && !confirmationValid.value)

const submitPassword = async () => {
  submitted.value = true
  errorMessage.value = ''
  if (!canSubmit.value) {
    errorMessage.value = !token.value
      ? 'Lien d’invitation invalide.'
      : 'Vérifiez le mot de passe et sa confirmation.'
    return
  }

  submitting.value = true
  try {
    await $fetch(`/api/auth/password-setup/${encodeURIComponent(token.value)}`, {
      method: 'POST',
      body: {
        password: form.password,
        passwordConfirmation: form.passwordConfirmation
      }
    })
    success.value = true
    form.password = ''
    form.passwordConfirmation = ''
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || error?.data?.statusMessage || 'Impossible d’enregistrer ce mot de passe.'
  } finally {
    submitting.value = false
  }
}
</script>
