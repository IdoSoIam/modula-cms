<template>
  <section class="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
    <div class="w-full rounded-[2rem] border border-base-300 bg-base-100 p-8 shadow-xl">
      <div class="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15 text-success">
        <Icon name="mdi:check-bold" size="28" />
      </div>
      <p class="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-success">Paiement confirmé</p>
      <h1 class="text-3xl font-bold">Merci, votre paiement a bien été pris en compte.</h1>
      <p class="mt-3 max-w-2xl opacity-70">
        Vous pouvez fermer cette page ou revenir à l'accueil. Si votre parcours métier nécessite une confirmation
        complémentaire, utilisez l'identifiant de session affiché ci-dessous.
      </p>

      <div v-if="sessionId" class="mt-6 rounded-2xl border border-base-300 bg-base-200/70 p-4 text-sm">
        <div class="font-medium">Session Stripe</div>
        <div class="mt-1 break-all opacity-80">{{ sessionId }}</div>
      </div>

      <div class="mt-8 flex flex-wrap gap-3">
        <NuxtLink to="/" class="btn btn-primary">Retour au site</NuxtLink>
        <NuxtLink to="/profile" class="btn btn-outline">Mon espace</NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const route = useRoute()
const sessionId = computed(() => typeof route.query.session_id === 'string' ? route.query.session_id : '')

usePageSeo({
  title: 'Paiement confirmé',
  description: 'Votre paiement Stripe a été validé.'
})
</script>
