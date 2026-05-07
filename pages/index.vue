<template>
  <div v-if="pageContent">
    <div v-if="canEdit" class="fixed bottom-4 right-4 z-[120] flex flex-wrap gap-2 rounded-2xl border border-base-300 bg-base-100/95 p-3 shadow-xl backdrop-blur">
      <button class="btn btn-outline btn-sm" :disabled="saving" @click="reloadPageContent">Recharger</button>
      <button class="btn btn-primary btn-sm" :disabled="saving" @click="savePageContent">
        <span v-if="saving" class="loading loading-spinner loading-xs" />
        Enregistrer
      </button>
    </div>

    <HomePageRenderer
      :content="pageContent"
      :locale="locale"
      :editable="canEdit"
      @edit="activeTarget = $event"
    />

    <HomePageEditModal
      :open="Boolean(activeTarget)"
      :target="activeTarget"
      @close="activeTarget = null"
    />
  </div>
</template>

<script setup lang="ts">
import type { HomePageContent } from '~/shared/homePage'
import type { HomePageEditTarget } from '~/shared/homePageEditor'
import HomePageRenderer from '~/components/homepage/HomePageRenderer.vue'
import HomePageEditModal from '~/components/homepage/HomePageEditModal.vue'
import { cloneHomePageContent } from '~/shared/homePage'

const { locale } = useI18n()
const route = useRoute()
const authStore = useAuthStore()
const { data: homePageContent } = await useFetch<HomePageContent>('/api/home-page')
const saving = ref(false)
const activeTarget = ref<HomePageEditTarget | null>(null)
const pageContent = ref<HomePageContent | null>(homePageContent.value ? cloneHomePageContent(homePageContent.value) : null)

watch(homePageContent, (value) => {
  if (value) {
    pageContent.value = cloneHomePageContent(value)
  }
}, { immediate: true })

onMounted(async () => {
  if (route.query.editPage === '1') {
    await authStore.ensureInitialized()
  }
})

const canEdit = computed(() => route.query.editPage === '1' && authStore.isAdmin)

const reloadPageContent = async () => {
  const response = await $fetch<HomePageContent>('/api/admin/home-page')
  pageContent.value = cloneHomePageContent(response)
  activeTarget.value = null
}

const savePageContent = async () => {
  if (!pageContent.value) return
  saving.value = true
  try {
    await $fetch('/api/admin/home-page', {
      method: 'PUT',
      body: pageContent.value
    })
    const { $toast } = useNuxtApp() as any
    $toast?.success('Accueil enregistré')
  } catch (error: any) {
    const { $toast } = useNuxtApp() as any
    $toast?.error(error.statusMessage || 'Erreur lors de l’enregistrement')
  } finally {
    saving.value = false
  }
}

usePageSeo({
  title: computed(() => locale.value === 'en' ? 'Organic vegetables, baskets and farm pickup' : 'Légumes bio, paniers et vente à la ferme'),
  description: computed(() => locale.value === 'en'
    ? 'Discover seasonal organic vegetables, farm pickup and local basket reservations at Ferme du Campeyrigoux.'
    : 'Découvrez les légumes bio de saison, la vente à la ferme et la réservation de paniers à la Ferme du Campeyrigoux.')
})
</script>
