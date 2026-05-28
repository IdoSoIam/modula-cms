<template>
  <div class="space-y-6">
    <div v-if="error" class="bg-red-50 text-red-600 p-4 rounded-lg">
      {{ error }}
    </div>

    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
    </div>

    <!-- Options de personnalisation -->
    <div class="flex flex-wrap gap-4 mb-6">
      <select v-model="options.layout" class="select select-bordered w-full max-w-xs">
        <option value="timeline">Timeline</option>
        <option value="grid">Grille</option>
      </select>

      <select v-model="options.columns" class="select select-bordered w-full max-w-xs" :disabled="options.layout !== 'grid'">
        <option :value="1">1 colonne</option>
        <option :value="2">2 colonnes</option>
        <option :value="3">3 colonnes</option>
      </select>

      <div class="form-control gap-3 flex">
        <label class="label cursor-pointer">
          <span class="label-text mr-2">Afficher l'en-tête</span>
          <input type="checkbox" v-model="options.showHeader" class="checkbox" />
        </label>
      </div>

      <div class="form-control gap-3 flex">
        <label class="label cursor-pointer">
          <span class="label-text mr-2">Afficher les likes</span>
          <input type="checkbox" v-model="options.showLikes" class="checkbox" />
        </label>
      </div>
    </div>

    <!-- Conteneur pour le plugin Facebook -->
    <div ref="feedContainer" class="facebook-feed-container w-full"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { FacebookService } from '#modula/server/services/facebook/facebookService'
import { useI18n } from 'vue-i18n'

const loading = ref(true)
const error = ref<string | null>(null)
const feedContainer = ref<HTMLElement | null>(null)
const { locale } = useI18n()

// Options de personnalisation
const options = reactive<{
  layout: 'timeline' | 'grid'
  showHeader: boolean
  showLikes: boolean
  showComments: boolean
  postsToShow: number
  columns: number
  width: number
  locale: string
}>({
  layout: 'timeline',
  showHeader: true,
  showLikes: true,
  showComments: true,
  postsToShow: 10,
  columns: 1,
  width: 800,
  locale: locale.value
})

// Créer le service avec l'ID de la page
const facebookService = new FacebookService()

// Rafraîchir le feed quand les options changent
const refreshFeed = async () => {
  if (!feedContainer.value) return
  
  feedContainer.value.innerHTML = facebookService.getPagePluginHtml({
    ...options,
    locale: locale.value.replace('-', '_')
  })
  facebookService.parseFacebookPlugins(feedContainer.value)
}

watch(options, refreshFeed)
watch(locale, () => {
  options.locale = locale.value
})

onMounted(async () => {
  try {
    // Wait for Facebook SDK to be initialized via the plugin (with timeout)
    await new Promise<void>((resolve, reject) => {
      // If SDK is already ready
      if (window.FB?.getLoginStatus) {
        resolve()
        return
      }

      // Listen for SDK initialization
      const timeout = setTimeout(() => {
        reject(new Error('Facebook SDK not loaded - likely deactivated'))
      }, 5000)

      window.addEventListener('facebook:initialized', () => {
        clearTimeout(timeout)
        resolve()
      }, { once: true })
    })
    await refreshFeed()
  } catch (err) {
    error.value = 'Le flux Facebook n\'est pas disponible.'
    console.log('Facebook feed not available:', err)
  } finally {
    loading.value = false
  }
})
</script>
