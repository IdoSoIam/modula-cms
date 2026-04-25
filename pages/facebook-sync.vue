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

// Attendre que le SDK Facebook soit initialisé (FB.init a été appelé)
const waitForFB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Déjà initialisé ?
    if (window.FB?.getLoginStatus) {
      console.log('[FacebookSync] FB déjà initialisé')
      isFBLoaded.value = true
      resolve()
      return
    }

    console.log('[FacebookSync] Attente de FB...')

    // Écouter l'événement du plugin
    const handler = () => {
      console.log('[FacebookSync] Événement facebook:initialized reçu')
      isFBLoaded.value = true
      resolve()
    }
    window.addEventListener('facebook:initialized', handler, { once: true })

    // Fallback: vérifier toutes les 100ms si FB est prêt
    const checkInterval = setInterval(() => {
      if (window.FB?.getLoginStatus) {
        console.log('[FacebookSync] FB détecté via polling')
        clearInterval(checkInterval)
        window.removeEventListener('facebook:initialized', handler)
        isFBLoaded.value = true
        resolve()
      }
    }, 100)

    // Timeout de sécurité après 10 secondes
    setTimeout(() => {
      clearInterval(checkInterval)
      if (!isFBLoaded.value) {
        console.error('[FacebookSync] Timeout: FB non initialisé après 10s')
        reject(new Error('Facebook SDK non initialisé (timeout)'))
      }
    }, 10000)
  })
}

const handleLogin = async () => {
  try {
    isLoading.value = true
    error.value = ''

    // S'assurer que FB est initialisé
    await waitForFB()

    const FB = window.FB
    console.log('[FacebookSync] window.FB:', FB)
    console.log('[FacebookSync] window.FB?.getLoginStatus:', FB?.getLoginStatus)

    if (!FB) {
      throw new Error('Facebook SDK non chargé')
    }

    // Vérifier que FB est bien initialisé
    if (!FB.getLoginStatus) {
      throw new Error('Facebook SDK non initialisé - getLoginStatus indisponible')
    }

    // Demander la connexion avec les permissions nécessaires
    const loginResponse = await new Promise<FacebookLoginStatus>((resolve) => {
      console.log('[FacebookSync] Appel de FB.login...')
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

// Initialisation et vérification du statut au chargement
onMounted(async () => {
  try {
    // Attendre que le SDK soit prêt
    await waitForFB()

    const FB = window.FB
    if (!FB) return

    const status: FacebookLoginStatus = await new Promise((resolve) => {
      FB.getLoginStatus((response) => {
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
