<template>
  <div class="card bg-base-100 shadow-xl max-w-md mx-auto p-6">
    <!-- Tabs de navigation -->
    <div class="tabs tabs-boxed mb-6">
      <button 
        class="tab" 
        :class="{ 'tab-active': activeTab === 'login' }"
        @click="activeTab = 'login'"
      >
        Se connecter
      </button>
      <button 
        class="tab" 
        :class="{ 'tab-active': activeTab === 'register' }"
        @click="activeTab = 'register'"
      >
        S'inscrire
      </button>
    </div>

    <!-- Formulaire de connexion -->
    <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="space-y-4">
      <div class="form-control">
        <label class="label">
          <span class="label-text">Email</span>
        </label>
        <input
          v-model="loginForm.email"
          type="email"
          required
          class="input input-bordered w-full"
          placeholder="votre@email.com"
        />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Mot de passe</span>
        </label>
        <input
          v-model="loginForm.password"
          type="password"
          required
          class="input input-bordered w-full"
          placeholder="••••••••"
        />
      </div>

      <button type="submit" class="btn btn-primary w-full">Se connecter</button>
    </form>

    <!-- Formulaire d'inscription -->
    <form v-else @submit.prevent="handleRegister" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Prénom</span>
          </label>
          <input
            v-model="registerForm.firstName"
            type="text"
            required
            class="input input-bordered w-full"
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Nom</span>
          </label>
          <input
            v-model="registerForm.lastName"
            type="text"
            required
            class="input input-bordered w-full"
          />
        </div>
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Date de naissance</span>
        </label>
        <input
          v-model="registerForm.birthDate"
          type="date"
          required
          class="input input-bordered w-full"
        />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Email</span>
        </label>
        <input
          v-model="registerForm.email"
          type="email"
          required
          class="input input-bordered w-full"
          placeholder="votre@email.com"
        />
      </div>

      <div class="form-control">
        <label class="label">
          <span class="label-text">Mot de passe</span>
        </label>
        <input
          v-model="registerForm.password"
          type="password"
          required
          class="input input-bordered w-full"
          placeholder="••••••••"
          minlength="8"
        />
      </div>

      <button type="submit" class="btn btn-primary w-full">S'inscrire</button>
    </form>    <!-- Message d'erreur -->
    <div v-if="error" class="alert alert-error mt-4">
      {{ error }}
    </div>

    <!-- Message de succès -->
    <div v-if="success" class="alert alert-success mt-4">
      {{ success }}
    </div>

    <!-- Loading indicator -->
    <div v-if="isLoading" class="flex justify-center mt-4">
      <span class="loading loading-spinner loading-md"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

// Emit events to parent component
const emit = defineEmits<{
  success: []
}>()

const activeTab = ref("login")
const error = ref("")
const success = ref("")
const isLoading = ref(false)

const loginForm = reactive({
  email: "",
  password: "",
})

const registerForm = reactive({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  birthDate: "",
})

const resetMessages = () => {
  error.value = ""
  success.value = ""
}

const handleLogin = async () => {
  resetMessages()
  isLoading.value = true
  
  try {
    await authStore.login({
      email: loginForm.email,
      password: loginForm.password
    })
    
    success.value = "Connexion réussie !"
    
    // Reset form
    loginForm.email = ""
    loginForm.password = ""
    
    // Emit success event to parent
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
      error.value = "Une erreur est survenue lors de la connexion"
    }
  } finally {
    isLoading.value = false
  }
}

const handleRegister = async () => {
  resetMessages()
  isLoading.value = true
  
  try {
    await authStore.register({
      ...registerForm
    })
    
    success.value = "Inscription réussie ! Vous êtes maintenant connecté(e)."
    
    // Reset form
    Object.assign(registerForm, {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      birthDate: "",
    })
    
    // Emit success event to parent
    setTimeout(() => {
      emit('success')
    }, 1000)
    
  } catch (e: any) {
    console.error('Register error:', e)
    if (e?.data?.message) {
      error.value = e.data.message
    } else if (e?.message) {
      error.value = e.message
    } else {
      error.value = "Une erreur est survenue lors de l'inscription"
    }
  } finally {
    isLoading.value = false
  }
}
</script>
