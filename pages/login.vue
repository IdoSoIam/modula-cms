<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200">
    <div class="card w-96 bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title mb-4">Connexion</h2>
        
        <AuthForm 
          :is-login="true"
          @submit="handleSubmit"
          :error="error"
        />
        
        <div class="text-sm mt-4">
          <p>Vous n'avez pas de compte ? Contactez l'administrateur.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const error = ref('')

async function handleSubmit({ email, password }: { email: string, password: string }) {
    error.value = ''

    const result = await authStore.login({email, password})
    
    if (result && result.user) {
        await router.push('/')
    } else if(result) {
        error.value = 'Une erreur est survenue'
    }
}
</script>
