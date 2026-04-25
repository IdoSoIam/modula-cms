<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Test Facebook OAuth</h1>
    
    <div class="space-y-4">
      <div v-if="!pageAccessToken" class="bg-white p-4 rounded shadow">
        <h2 class="text-lg font-semibold mb-2">Étape 1: Authentification Facebook</h2>
        <button 
          @click="handleLogin" 
          class="bg-blue-600 text-white px-4 py-2 rounded"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Chargement...' : 'Se connecter avec Facebook' }}
        </button>
      </div>

      <div v-else class="bg-white p-4 rounded shadow">
        <h2 class="text-lg font-semibold mb-2">Page Access Token obtenu !</h2>
        <p class="text-sm text-gray-600 break-all">{{ pageAccessToken.substring(0, 50) }}...</p>
        <button 
          @click="reset" 
          class="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
        >
          Réinitialiser
        </button>
      </div>

      <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { FacebookLoginStatus, FacebookAuthResponse } from '~/types/facebook'

const isLoading = ref(false)
const error = ref('')
const pageAccessToken = ref('')
const isFBLoaded = ref(false)

// Attendre que le SDK Facebook soit chargé
onMounted(() => {
  const checkFBLoaded = setInterval(() => {
    if (window.FB) {
      isFBLoaded.value = true
      clearInterval(checkFBLoaded)
    }
  }, 100)
})

const handleLogin = async () => {
  try {
    isLoading.value = true
    error.value = ''

    const FB = window.FB
    if (!FB || !isFBLoaded.value) {
      throw new Error('Facebook SDK non chargé')
    }    
    
    // Demander la connexion avec les permissions nécessaires
    const loginResponse = await new Promise<FacebookLoginStatus>((resolve) => {
      FB.login((response: FacebookLoginStatus) => {
        resolve(response)
      }, {
        scope: 'pages_show_list,pages_read_engagement,pages_manage_posts'
      })
    })

    if (!loginResponse.authResponse) {
      throw new Error('Autorisation Facebook échouée')
    }

    // Échanger le token utilisateur contre un token de page
    const { data } = await useFetch('/api/facebook/auth', {
      method: 'POST',
      body: {
        userAccessToken: loginResponse.authResponse.accessToken
      }
    })

    if (!data.value?.pageAccessToken) {
      throw new Error('Impossible d\'obtenir le token de la page')
    }

    pageAccessToken.value = data.value.pageAccessToken
  } catch (err: any) {
    error.value = err.message || 'Une erreur est survenue'
    console.error('Facebook auth error:', err)
  } finally {
    isLoading.value = false
  }
}

const reset = () => {
  pageAccessToken.value = ''
  error.value = ''
}

// Vérifier le statut de connexion au chargement
onMounted(async () => {
  try {
    if (!window.FB) return

    const status: FacebookLoginStatus = await new Promise((resolve) => {
      window.FB?.getLoginStatus((response) => {
        resolve(response)
      })
    })

    if (status.authResponse) {
      // Récupérer le token de page si déjà connecté
      const { data } = await useFetch('/api/facebook/auth', {
        method: 'POST',
        body: {
          userAccessToken: status.authResponse.accessToken
        }
      })

      if (data.value?.pageAccessToken) {
        pageAccessToken.value = data.value.pageAccessToken
      }
    }
  } catch (err) {
    console.error('Error checking Facebook status:', err)
  }
})
</script>
