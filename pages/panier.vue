<template>
  <section class="py-12">
    <div class="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div class="text-sm uppercase tracking-[0.22em] opacity-60">{{ eyebrowLabel }}</div>
          <h1 class="mt-3 text-4xl font-semibold">{{ titleLabel }}</h1>
          <p class="mt-3 max-w-3xl text-base opacity-80">{{ introLabel }}</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <NuxtLink class="btn btn-ghost" :to="localePath('/boutique')">{{ productsLinkLabel }}</NuxtLink>
          <NuxtLink class="btn btn-ghost" :to="localePath('/lots-produits')">{{ lotsLinkLabel }}</NuxtLink>
        </div>
      </div>

      <div v-if="items.length" class="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.9fr)]">
        <div class="space-y-4">
          <article
            v-for="item in items"
            :key="item.key"
            class="rounded-[1.75rem] border border-base-300 bg-base-100 p-5 shadow-sm"
          >
            <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div class="flex gap-4">
                <AppImage
                  v-if="item.imageUrl"
                  :src="item.imageUrl"
                  :alt="item.title"
                  class="h-24 w-24 rounded-2xl object-cover"
                  sizes="96px"
                />
                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="text-xl font-semibold">{{ item.title }}</h2>
                    <span class="badge badge-outline">{{ item.kind === 'productLot' ? lotBadgeLabel : productBadgeLabel }}</span>
                  </div>
                  <p v-if="item.description" class="text-sm opacity-75">{{ item.description }}</p>
                  <div class="flex flex-wrap gap-2">
                    <span class="badge badge-soft">{{ stockLabel }}: {{ item.availableQuantity ?? '-' }}</span>
                    <span v-if="item.allowOfflinePayment" class="badge badge-soft">{{ offlineLabel }}</span>
                    <span v-if="item.allowOnlinePayment && stripeEnabled" class="badge badge-outline">{{ onlineLabel }}</span>
                  </div>
                </div>
              </div>

              <div class="flex flex-col items-end gap-3">
                <div class="text-right">
                  <div class="text-sm opacity-60">{{ unitPriceLabel }}</div>
                  <div class="font-medium">{{ $formatPrice(item.unitPrice) }}</div>
                </div>
                <div class="flex items-center gap-3">
                  <button class="btn btn-sm btn-ghost" @click="updateItemQuantity(item.key, item.quantity - 1)">
                    <Icon name="mdi:minus" size="16" />
                  </button>
                  <span class="w-8 text-center">{{ item.quantity }}</span>
                  <button class="btn btn-sm btn-ghost" @click="updateItemQuantity(item.key, item.quantity + 1)">
                    <Icon name="mdi:plus" size="16" />
                  </button>
                </div>
                <div class="text-right">
                  <div class="text-sm opacity-60">{{ totalLabel }}</div>
                  <div class="text-lg font-semibold text-primary">{{ $formatPrice(item.totalPrice) }}</div>
                </div>
                <button class="btn btn-sm btn-ghost text-error" @click="removeItem(item.key)">
                  <Icon name="mdi:delete-outline" size="18" />
                  {{ removeLabel }}
                </button>
              </div>
            </div>
          </article>
        </div>

        <aside class="rounded-[2rem] border border-base-300 bg-base-100 p-6 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-2xl font-semibold">{{ checkoutTitleLabel }}</h2>
              <p class="mt-2 text-sm opacity-75">{{ checkoutIntroLabel }}</p>
            </div>
            <span class="badge badge-primary text-nowrap">{{ countLabel }}</span>
          </div>

          <div class="mt-6 space-y-4">
            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ fullNameLabel }}</span></label>
              <input v-model="checkoutForm.customerName" class="input input-bordered" />
            </div>
            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">Email</span></label>
              <input v-model="checkoutForm.email" type="email" class="input input-bordered" />
            </div>
            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ phoneLabel }}</span></label>
              <input v-model="checkoutForm.phone" class="input input-bordered" />
            </div>
            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ paymentLabel }}</span></label>
              <select v-if="paymentCapabilities.requiresChoice" v-model="checkoutForm.paymentMode" class="select select-bordered">
                <option v-if="paymentCapabilities.allowOffline" value="offline">{{ offlineLabel }}</option>
                <option v-if="paymentCapabilities.allowOnline" value="stripe">{{ onlineLabel }}</option>
              </select>
              <input v-else class="input input-bordered" :value="resolvedPaymentLabel" disabled />
            </div>
            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ messageLabel }}</span></label>
              <textarea v-model="checkoutForm.message" class="textarea textarea-bordered min-h-28" />
            </div>
          </div>

          <div class="mt-6 rounded-2xl bg-base-200 p-4">
            <div class="flex items-center justify-between gap-4">
              <div>
                <div class="text-sm opacity-60">{{ totalLabel }}</div>
                <div class="text-3xl font-semibold">{{ $formatPrice(total) }}</div>
              </div>
              <button class="btn btn-primary" :disabled="savingOrder || !canSubmit" @click="submitOrder">
                <span v-if="savingOrder" class="loading loading-spinner loading-sm" />
                {{ submitLabel }}
              </button>
            </div>
            <p v-if="!paymentCapabilities.allowOffline && !paymentCapabilities.allowOnline" class="mt-3 text-sm text-error">
              {{ unavailablePaymentLabel }}
            </p>
          </div>
        </aside>
      </div>

      <div v-else class="rounded-[2rem] border border-dashed border-base-300 px-6 py-16 text-center">
        <div class="mx-auto max-w-xl">
          <h2 class="text-2xl font-semibold">{{ emptyLabel }}</h2>
          <p class="mt-3 opacity-75">{{ emptyHelpLabel }}</p>
          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <NuxtLink class="btn btn-primary" :to="localePath('/boutique')">{{ productsLinkLabel }}</NuxtLink>
            <NuxtLink class="btn btn-ghost" :to="localePath('/lots-produits')">{{ lotsLinkLabel }}</NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { getShopCartPaymentCapabilities, useShopCart } from '#modula/composables/useShopCart'

const { locale, t } = useI18n()
const localePath = useLocalePath()
const { $toast, $formatPrice } = useNuxtApp() as any
const { items, count, total, updateQuantity, remove, clear } = useShopCart()
const { data: paymentConfig } = await useFetch<{ enabled: boolean }>('/api/payments/config')

const stripeEnabled = computed(() => Boolean(paymentConfig.value?.enabled))
const paymentCapabilities = computed(() => getShopCartPaymentCapabilities(items.value, stripeEnabled.value))
const checkoutForm = ref({
  customerName: '',
  email: '',
  phone: '',
  message: '',
  paymentMode: 'offline' as 'offline' | 'stripe'
})
const savingOrder = ref(false)

const eyebrowLabel = computed(() => locale.value === 'en' ? 'Checkout' : 'Commande')
const titleLabel = computed(() => locale.value === 'en' ? 'Shopping cart' : 'Panier d’achat')
const introLabel = computed(() => locale.value === 'en'
  ? 'Review the selected products and lots, then confirm the order with the available payment mode.'
  : 'Vérifiez les produits et lots sélectionnés, puis confirmez la commande avec le mode de règlement disponible.')
const productsLinkLabel = computed(() => locale.value === 'en' ? 'Browse products' : 'Voir les produits')
const lotsLinkLabel = computed(() => locale.value === 'en' ? 'Browse product lots' : 'Voir les lots de produits')
const productBadgeLabel = computed(() => locale.value === 'en' ? 'Product' : 'Produit')
const lotBadgeLabel = computed(() => locale.value === 'en' ? 'Product lot' : 'Lot produit')
const stockLabel = computed(() => locale.value === 'en' ? 'Available' : 'Disponible')
const offlineLabel = computed(() => locale.value === 'en' ? 'On-site payment' : 'Paiement sur place')
const onlineLabel = computed(() => locale.value === 'en' ? 'Online payment' : 'Paiement en ligne')
const unitPriceLabel = computed(() => locale.value === 'en' ? 'Unit price' : 'Prix unitaire')
const totalLabel = computed(() => locale.value === 'en' ? 'Total' : 'Total')
const removeLabel = computed(() => locale.value === 'en' ? 'Remove' : 'Supprimer')
const checkoutTitleLabel = computed(() => locale.value === 'en' ? 'Checkout details' : 'Validation de commande')
const checkoutIntroLabel = computed(() => locale.value === 'en'
  ? 'The available payment methods adapt to the selected offers.'
  : 'Les modes de règlement disponibles s’adaptent aux offres sélectionnées.')
const countLabel = computed(() => locale.value === 'en' ? `${count.value} item(s)` : `${count.value} article(s)`)
const fullNameLabel = computed(() => locale.value === 'en' ? 'Full name' : 'Nom complet')
const phoneLabel = computed(() => locale.value === 'en' ? 'Phone' : 'Téléphone')
const paymentLabel = computed(() => locale.value === 'en' ? 'Payment method' : 'Mode de règlement')
const messageLabel = computed(() => locale.value === 'en' ? 'Message' : 'Message')
const submitLabel = computed(() => checkoutForm.value.paymentMode === 'stripe' && paymentCapabilities.value.allowOnline
  ? (locale.value === 'en' ? 'Continue to Stripe' : 'Continuer vers Stripe')
  : (locale.value === 'en' ? 'Confirm order' : 'Confirmer la commande'))
const unavailablePaymentLabel = computed(() => locale.value === 'en'
  ? 'No valid payment method is currently available for this cart.'
  : 'Aucun mode de règlement valide n’est actuellement disponible pour ce panier.')
const emptyLabel = computed(() => locale.value === 'en' ? 'Your cart is empty.' : 'Votre panier est vide.')
const emptyHelpLabel = computed(() => locale.value === 'en'
  ? 'Add a product or a product lot to continue.'
  : 'Ajoutez un produit ou un lot de produits pour continuer.')

const resolvedPaymentLabel = computed(() =>
  paymentCapabilities.value.allowOnline && !paymentCapabilities.value.allowOffline
    ? onlineLabel.value
    : offlineLabel.value
)

const canSubmit = computed(() =>
  items.value.length > 0
  && (paymentCapabilities.value.allowOffline || paymentCapabilities.value.allowOnline)
)

watch(paymentCapabilities, (value) => {
  checkoutForm.value.paymentMode = value.resolvedDefaultMode
}, { immediate: true, deep: true })

const updateItemQuantity = (key: string, quantity: number) => updateQuantity(key, quantity)
const removeItem = (key: string) => remove(key)

async function submitOrder() {
  if (!checkoutForm.value.customerName.trim() || !checkoutForm.value.email.trim()) {
    $toast.error(locale.value === 'en' ? 'Name and email are required.' : 'Le nom et l’email sont requis.')
    return
  }

  if (!canSubmit.value) {
    $toast.error(unavailablePaymentLabel.value)
    return
  }

  savingOrder.value = true
  try {
    const response = await $fetch<{ redirectUrl?: string | null }>('/api/shop/orders', {
      method: 'POST',
      body: {
        customerName: checkoutForm.value.customerName,
        email: checkoutForm.value.email,
        phone: checkoutForm.value.phone,
        message: checkoutForm.value.message,
        paymentMode: checkoutForm.value.paymentMode,
        lines: items.value.map((item) => ({
          kind: item.kind,
          productId: item.productId || undefined,
          productLotId: item.productLotId || undefined,
          quantity: item.quantity
        }))
      }
    })

    if (response.redirectUrl && import.meta.client) {
      window.location.href = response.redirectUrl
      return
    }

    clear()
    checkoutForm.value = { customerName: '', email: '', phone: '', message: '', paymentMode: 'offline' }
    $toast.success(locale.value === 'en' ? 'Order created successfully.' : 'Commande créée avec succès.')
    await navigateTo(localePath('/boutique'))
  } catch (error: any) {
    $toast.error(error?.statusMessage || t('common.error'))
  } finally {
    savingOrder.value = false
  }
}
</script>
