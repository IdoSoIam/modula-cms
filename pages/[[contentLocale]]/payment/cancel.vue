<template>
  <section class="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
    <div class="w-full rounded-[2rem] border border-base-300 bg-base-100 p-8 shadow-xl">
      <div class="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/15 text-warning">
        <Icon name="mdi:arrow-u-left-top-bold" size="28" />
      </div>
      <p class="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-warning">{{ badgeLabel }}</p>
      <h1 class="text-3xl font-bold">{{ titleLabel }}</h1>
      <p class="mt-3 max-w-2xl opacity-70">
        {{ descriptionLabel }}
      </p>

      <div v-if="syncPending" class="mt-6 rounded-2xl border border-base-300 bg-base-200/70 p-4 text-sm">
        <div class="font-medium">{{ pendingTitle }}</div>
        <div class="mt-1 opacity-80">{{ pendingText }}</div>
      </div>

      <div v-else-if="syncError" class="mt-6 rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error">
        <div class="font-medium">{{ errorTitle }}</div>
        <div class="mt-1 opacity-90">{{ syncError }}</div>
      </div>

      <div v-if="orderId" class="mt-4 rounded-2xl border border-base-300 bg-base-200/70 p-4 text-sm">
        <div class="font-medium">{{ orderLabel }}</div>
        <div class="mt-1 opacity-80">#{{ orderId }}</div>
      </div>

      <div class="mt-8 flex flex-wrap gap-3">
        <NuxtLink to="/" class="btn btn-primary">{{ backHomeLabel }}</NuxtLink>
        <button type="button" class="btn btn-outline" @click="goBack">{{ backLabel }}</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { publicText } = usePublicDictionary()
const orderId = computed(() => typeof route.query.order === 'string' ? route.query.order : '')
const sessionId = computed(() => typeof route.query.session_id === 'string' ? route.query.session_id : '')
const syncPending = ref(false)
const syncError = ref('')

const badgeLabel = computed(() => publicText('pages.payment.cancel.badge', 'Paiement interrompu'))
const titleLabel = computed(() => publicText('pages.payment.cancel.title', 'Le paiement n\'a pas été finalisé.'))
const descriptionLabel = computed(() => publicText('pages.payment.cancel.description', 'Aucune transaction n\'a été validée. Vous pouvez reprendre votre parcours ou revenir à l\'accueil.'))
const pendingTitle = computed(() => publicText('pages.payment.cancel.pendingTitle', 'Mise à jour de la commande'))
const pendingText = computed(() => publicText('pages.payment.cancel.pendingText', 'Synchronisation en cours avec le service de paiement...'))
const errorTitle = computed(() => publicText('pages.payment.cancel.errorTitle', 'Synchronisation incomplète'))
const orderLabel = computed(() => publicText('pages.payment.cancel.orderLabel', 'Commande'))
const backHomeLabel = computed(() => publicText('pages.payment.cancel.backHome', 'Retour au site'))
const backLabel = computed(() => publicText('pages.payment.cancel.back', 'Revenir en arrière'))

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push('/')
}

onMounted(async () => {
  if (!orderId.value) return

  syncPending.value = true
  syncError.value = ''

  try {
    await $fetch(`/api/shop/orders/${orderId.value}/cancel`, { method: 'POST' })
  } catch (error: any) {
    syncError.value = error?.statusMessage || error?.data?.message || publicText('pages.payment.cancel.verifyError', 'Impossible d\'annuler la commande.')
  } finally {
    syncPending.value = false
  }
})

usePageSeo({
  title: computed(() => publicText('pages.payment.cancel.seoTitle', 'Paiement annulé')),
  description: computed(() => publicText('pages.payment.cancel.seoDescription', 'Le paiement Stripe a été annulé.'))
})
</script>
