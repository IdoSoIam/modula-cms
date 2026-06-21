<template>
  <section class="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
    <div class="w-full rounded-[2rem] border border-base-300 bg-base-100 p-8 shadow-xl">
      <div class="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15 text-success">
        <Icon name="mdi:check-bold" size="28" />
      </div>
      <p class="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-success">Paiement confirmé</p>
      <h1 class="text-3xl font-bold">Merci, votre paiement a bien été pris en compte.</h1>
      <p class="mt-3 max-w-2xl opacity-70">
        Vous pouvez fermer cette page ou revenir à l'accueil. La commande est resynchronisée avec Stripe au chargement.
      </p>

      <div v-if="syncPending" class="mt-6 rounded-2xl border border-base-300 bg-base-200/70 p-4 text-sm">
        <div class="font-medium">Vérification du paiement</div>
        <div class="mt-1 opacity-80">Synchronisation en cours avec Stripe...</div>
      </div>

      <div v-else-if="syncError" class="mt-6 rounded-2xl border border-error/30 bg-error/10 p-4 text-sm text-error">
        <div class="font-medium">Synchronisation incomplète</div>
        <div class="mt-1 opacity-90">{{ syncError }}</div>
      </div>

      <div v-if="orderId" class="mt-4 rounded-2xl border border-base-300 bg-base-200/70 p-4 text-sm">
        <div class="font-medium">Commande</div>
        <div class="mt-1 opacity-80">#{{ orderId }}</div>
      </div>

      <div class="mt-8 flex flex-wrap gap-3">
        <NuxtLink to="/" class="btn btn-primary">Retour au site</NuxtLink>
        <NuxtLink :to="ordersLink" class="btn btn-outline">Voir ma commande</NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()
const localePath = useLocalePath()
const { clear } = useShopCart()
const orderId = computed(() => typeof route.query.order === 'string' ? route.query.order : '')
const sessionId = computed(() => typeof route.query.session_id === 'string' ? route.query.session_id : '')
const syncPending = ref(false)
const syncError = ref('')
const ordersLink = computed(() => localePath({
  path: '/profile',
  query: orderId.value ? { tab: 'orders', order: orderId.value } : { tab: 'orders' }
}))

onMounted(async () => {
  clear()
  if (!sessionId.value) return

  syncPending.value = true
  syncError.value = ''

  try {
    await $fetch(`/api/payments/sessions/${sessionId.value}`, {
      query: { sync: '1' }
    })
  } catch (error: any) {
    syncError.value = error?.statusMessage || error?.data?.message || 'Impossible de vérifier le paiement Stripe.'
  } finally {
    syncPending.value = false
  }
})

usePageSeo({
  title: 'Paiement confirmé',
  description: 'Votre paiement Stripe a été validé.'
})
</script>
