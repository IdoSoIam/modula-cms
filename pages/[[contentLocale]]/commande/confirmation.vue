<template>
  <section class="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-16 sm:px-6 lg:px-8">
    <div class="modula-card w-full border border-base-300 bg-base-100 p-6 shadow-xl sm:p-8">
      <div class="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/15 text-success">
        <Icon name="mdi:check-bold" size="28" />
      </div>
      <p class="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-success">{{ badgeLabel }}</p>
      <h1 class="text-3xl font-bold">{{ titleLabel }}</h1>
      <p class="mt-3 max-w-2xl opacity-70">{{ descriptionLabel }}</p>

      <div v-if="orderNumber || orderId" class="mt-6 rounded-box border border-base-300 bg-base-200/70 p-4">
        <div class="text-sm font-medium">{{ orderLabel }}</div>
        <div class="mt-1 text-xl font-semibold">{{ orderNumber || `#${orderId}` }}</div>
      </div>

      <div class="mt-8 flex flex-wrap gap-3">
        <NuxtLink :to="ordersLink" class="btn btn-primary">{{ viewOrderLabel }}</NuxtLink>
        <NuxtLink :to="localePath('/')" class="btn btn-outline">{{ backHomeLabel }}</NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({ i18n: false })

const route = useRoute()
const localePath = usePublicLocalePath()
const { publicText } = usePublicDictionary()
const orderId = computed(() => typeof route.query.order === 'string' ? route.query.order : '')
const orderNumber = computed(() => typeof route.query.number === 'string' ? route.query.number : '')
const badgeLabel = computed(() => publicText('checkout.confirmation.badge', 'Commande enregistrée'))
const titleLabel = computed(() => publicText('checkout.confirmation.title', 'Votre commande a bien été prise en compte.'))
const descriptionLabel = computed(() => publicText('checkout.confirmation.description', 'Vous recevrez un email récapitulatif avec les prochaines étapes et les informations de règlement.'))
const orderLabel = computed(() => publicText('checkout.confirmation.orderLabel', 'Numéro de commande'))
const viewOrderLabel = computed(() => publicText('checkout.confirmation.viewOrder', 'Voir ma commande'))
const backHomeLabel = computed(() => publicText('checkout.confirmation.backHome', 'Retour au site'))
const ordersLink = computed(() => localePath({
  path: '/profile',
  query: orderId.value ? { tab: 'orders', order: orderId.value } : { tab: 'orders' },
}))

usePageSeo({ title: titleLabel, description: descriptionLabel })
</script>
