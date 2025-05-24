<template>
  <div class="space-y-4">
    <!-- État non connecté -->
    <div v-if="!isConnected" class="text-center">
      <button 
        @click="login" 
        class="btn btn-primary space-x-2"
        :disabled="loading"
      >
        <i class="fab fa-facebook text-xl"></i>
        <span>{{ loading ? 'Connexion en cours...' : 'Connecter votre compte Facebook' }}</span>
      </button>
    </div>

    <!-- État connecté -->
    <div v-else class="space-y-4">
      <!-- Sélection de la page -->
      <div v-if="pages.length > 0" class="form-control w-full max-w-md mx-auto">
        <label class="label">
          <span class="label-text">Sélectionnez votre page Facebook</span>
        </label>
        <select 
          v-model="selectedPageId"
          class="select select-bordered w-full"
          @change="pageSelected"
        >
          <option value="" disabled>Choisir une page</option>
          <option 
            v-for="page in pages" 
            :key="page.id" 
            :value="page.id"
          >
            {{ page.name }}
          </option>
        </select>
      </div>

      <!-- Bouton de déconnexion -->
      <div class="text-center">
        <button 
          @click="logout" 
          class="btn btn-outline btn-sm"
        >
          Se déconnecter
        </button>
      </div>
    </div>

    <!-- Message d'erreur -->
    <div v-if="error" class="alert alert-error shadow-lg">
      <div>
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { FacebookAuthService } from '~/server/services/facebook/facebookAuthService'

interface FacebookPage {
  id: string
  name: string
  access_token: string
  tasks: string[]
}

const emit = defineEmits<{
  (e: 'tokenReceived', token: string): void
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const isConnected = ref(false)
const pages = ref<FacebookPage[]>([])
const selectedPageId = ref('')

const authService = FacebookAuthService.getInstance()

const login = async () => {
  loading.value = true
  error.value = null
  
  try {
    // 1. Connexion Facebook
    const userToken = await authService.login()
    
    // 2. Récupération des pages
    const userPages = await authService.getPages(userToken)
    pages.value = userPages
    isConnected.value = true

    // Si une seule page, la sélectionner automatiquement
    if (userPages.length === 1) {
      selectedPageId.value = userPages[0].id
      await pageSelected()
    }
  } catch (err) {
    error.value = "Erreur lors de la connexion à Facebook"
    console.error('Facebook login error:', err)
  } finally {
    loading.value = false
  }
}

const pageSelected = async () => {
  if (!selectedPageId.value) return

  try {
    const pageToken = await authService.getPageAccessToken(
      selectedPageId.value,
      pages.value as FacebookPage[]
    )

    if (pageToken) {
      emit('tokenReceived', pageToken)
    } else {
      error.value = "Impossible de récupérer le token de la page"
    }
  } catch (err) {
    error.value = "Erreur lors de la récupération du token de la page"
    console.error('Page token error:', err)
  }
}

const logout = async () => {
  try {
    await authService.logout()
    isConnected.value = false
    pages.value = []
    selectedPageId.value = ''
    emit('tokenReceived', '')
  } catch (err) {
    error.value = "Erreur lors de la déconnexion"
    console.error('Logout error:', err)
  }
}

// Vérifier l'état de connexion au chargement
onMounted(async () => {
  try {
    const status = await authService.checkLoginStatus()
    if (status?.authResponse) {
      isConnected.value = true
      const userPages = await authService.getPages(status.authResponse.accessToken)
      pages.value = userPages
    }
  } catch (err) {
    console.error('Login status check error:', err)
  }
})
</script>
