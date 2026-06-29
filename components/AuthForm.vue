<template>
    <div v-if="showHeading" class="mb-6">
      <h3 class="text-lg font-semibold">{{ titleLabel }}</h3>
      <p class="mt-1 text-sm opacity-70">
        {{ disabledRegistrationLabel }}
      </p>
    </div>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <div class="form-control gap-3 flex flex-col">
        <label class="label">
          <span class="label-text">{{ emailLabel }}</span>
        </label>
        <input
          v-model="loginForm.email"
          type="email"
          required
          class="input input-bordered w-full"
          placeholder="votre@email.com"
        />
      </div>

      <div class="form-control gap-3 flex flex-col">
        <label class="label">
          <span class="label-text">{{ passwordLabel }}</span>
        </label>
        <input
          v-model="loginForm.password"
          type="password"
          required
          class="input input-bordered w-full"
          placeholder="********"
        />
      </div>

      <button type="submit" class="btn btn-primary w-full">{{ loginButtonLabel }}</button>
    </form>

    <div v-if="error" class="alert alert-error mt-4">
      {{ error }}
    </div>

    <div v-if="success" class="alert alert-success mt-4">
      {{ success }}
    </div>

    <div v-if="isLoading" class="flex justify-center mt-4">
      <span class="loading loading-spinner loading-md"></span>
    </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuthStore } from '#modula/stores/auth'

const authStore = useAuthStore()
const { publicText } = usePublicDictionary()
withDefaults(defineProps<{
  showHeading?: boolean
}>(), {
  showHeading: true
})

const emit = defineEmits<{
  success: []
}>()

const error = ref('')
const success = ref('')
const isLoading = ref(false)

const titleLabel = computed(() => publicText('auth.login.title', 'Connexion'))
const disabledRegistrationLabel = computed(() => publicText('auth.form.disabledRegistration', 'L\'inscription publique est désactivée pour le moment. Contactez l\'administrateur si vous avez besoin d\'un accès.'))
const emailLabel = computed(() => publicText('auth.form.emailLabel', 'Email'))
const passwordLabel = computed(() => publicText('auth.form.passwordLabel', 'Mot de passe'))
const loginButtonLabel = computed(() => publicText('auth.form.loginButton', 'Se connecter'))

const loginForm = reactive({
  email: '',
  password: ''
})

const resetMessages = () => {
  error.value = ''
  success.value = ''
}

const handleLogin = async () => {
  resetMessages()
  isLoading.value = true

  try {
    await authStore.login({
      email: loginForm.email.trim().toLowerCase(),
      password: loginForm.password
    })

    success.value = publicText('auth.form.loginSuccess', 'Connexion réussie !')
    loginForm.email = ''
    loginForm.password = ''

    setTimeout(() => {
      emit('success')
    }, 1000)
  } catch (e: any) {
    console.error('Login error:', e)
    if (e?.data?.message) {
      error.value = e.data.message
    } else if (e?.message) {
      error.value = e.message
    } else {
      error.value = publicText('auth.form.loginError', 'Une erreur est survenue lors de la connexion')
    }
  } finally {
    isLoading.value = false
  }
}
</script>
