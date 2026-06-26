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
                    <span class="badge badge-ghost">TVA {{ formatVatRate(item.vatRate) }}</span>
                    <span v-if="!stripeTaxEnabled" class="badge badge-soft">{{ taxIncludedLabel }}</span>
                    <span v-else-if="resolveCartTaxCode(item)" class="badge badge-outline">
                      {{ taxCodeLabel }}: {{ resolveCartTaxCode(item) }}
                    </span>
                  </div>
                  <div
                    v-if="item.saleType === 'RENTAL'"
                    class="rounded-2xl bg-base-200 px-3 py-2 text-sm"
                  >
                    <span class="font-medium">{{ rentalPeriodLabel }}:</span>
                    {{ formatRentalRange(item.rentalStartDate, item.rentalEndDate) }}
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
              <label class="label"><span class="label-text">{{ requiredLabel(fullNameLabel) }}</span></label>
              <input v-model="checkoutForm.customerName" class="input input-bordered" />
            </div>
            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ requiredLabel('Email') }}</span></label>
              <input v-model="checkoutForm.email" type="email" class="input input-bordered" />
            </div>
            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ phoneLabel }}</span></label>
              <input v-model="checkoutForm.phone" class="input input-bordered" />
            </div>

            <div v-if="hasRentalItems" class="rounded-2xl bg-base-200 p-4 text-sm opacity-80">
              {{ rentalHelpLabel }}
            </div>

            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ deliveryLabel }}</span></label>
              <select v-model="checkoutForm.deliveryType" class="select select-bordered" :disabled="deliveryOptionsPending">
                <option v-if="!deliveryChoices.length" value="">{{ deliveryPlaceholderLabel }}</option>
                <option v-if="deliveryChoices.includes('ONSITE')" value="ONSITE">{{ onSiteDeliveryLabel }}</option>
                <option v-if="deliveryChoices.includes('PICKUP')" value="PICKUP">{{ pickupDeliveryLabel }}</option>
                <option v-if="deliveryChoices.includes('TOUR')" value="TOUR">{{ tourDeliveryLabel }}</option>
              </select>
            </div>

            <div v-if="checkoutForm.deliveryType === 'ONSITE'" class="rounded-2xl bg-base-200 p-4 text-sm">
              <div class="font-medium">{{ onSiteDeliveryLabel }}</div>
              <div class="mt-1 opacity-75">{{ onSitePickupSummary }}</div>
            </div>

            <div v-if="checkoutForm.deliveryType === 'PICKUP'" class="space-y-3">
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ pickupPointLabel }}</span></label>
                <select v-model.number="checkoutForm.pickupPointId" class="select select-bordered">
                  <option :value="0">{{ pickupPlaceholderLabel }}</option>
                  <option
                    v-for="point in pickupPoints"
                    :key="point.id"
                    :value="point.id"
                  >
                    {{ point.name }}
                  </option>
                </select>
              </div>
              <div v-if="selectedPickupPoint" class="rounded-2xl bg-base-200 p-4 text-sm">
                <div class="font-medium">{{ selectedPickupPoint.name }}</div>
                <div class="mt-1 opacity-75">{{ selectedPickupPoint.address || noAddressLabel }}</div>
              </div>
            </div>

            <div v-if="checkoutForm.deliveryType === 'TOUR'" class="space-y-3">
              <div class="rounded-2xl bg-base-200 p-4 text-sm">
                <div class="font-medium">{{ tourCityHelperTitle }}</div>
                <div class="mt-1 opacity-75">{{ tourCityHelperLabel }}</div>
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ requiredLabel(cityLabel) }}</span></label>
                <input
                  v-model="checkoutForm.deliveryCity"
                  class="input input-bordered"
                  :list="deliveryCitiesListId"
                  autocomplete="address-level2"
                />
                <datalist :id="deliveryCitiesListId">
                  <option v-for="city in availableDeliveryCities" :key="city" :value="city" />
                </datalist>
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ requiredLabel(addressLabel) }}</span></label>
                <input v-model="checkoutForm.deliveryAddress" class="input input-bordered" />
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ requiredLabel(postalCodeLabel) }}</span></label>
                <input
                  v-model="checkoutForm.deliveryPostalCode"
                  class="input input-bordered"
                  :list="deliveryPostalCodesListId"
                  autocomplete="postal-code"
                />
                <datalist :id="deliveryPostalCodesListId">
                  <option v-for="code in availableDeliveryPostalCodes" :key="code" :value="code" />
                </datalist>
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ requiredLabel(deliveryTourLabel) }}</span></label>
                <select
                  v-model.number="checkoutForm.deliveryTourId"
                  class="select select-bordered"
                  :disabled="!filteredTours.length"
                >
                  <option :value="0">{{ tourPlaceholderLabel }}</option>
                  <option
                    v-for="tour in filteredTours"
                    :key="tour.id"
                    :value="tour.id"
                  >
                    {{ tour.name }}
                  </option>
                </select>
              </div>
              <p
                v-if="checkoutForm.deliveryCity.trim() && !deliveryCityValid"
                class="text-sm text-warning"
              >
                {{ unavailableCityLabel }}
              </p>
              <p
                v-if="deliveryCityValid && checkoutForm.deliveryPostalCode.trim() && !deliveryPostalCodeValid"
                class="text-sm text-warning"
              >
                {{ locale === 'en' ? 'The postal code does not match the selected city.' : 'Le code postal ne correspond pas à la ville sélectionnée.' }}
              </p>
              <div v-if="selectedDeliveryTour" class="rounded-2xl bg-base-200 p-4 text-sm">
                <div class="font-medium">{{ selectedDeliveryTour.name }}</div>
                <div class="mt-1 opacity-75">{{ deliveryTourSummary(selectedDeliveryTour) }}</div>
              </div>
            </div>

            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ paymentLabel }}</span></label>
              <select v-if="paymentCapabilities.requiresChoice" v-model="checkoutForm.paymentMode" class="select select-bordered">
                <option v-if="paymentCapabilities.allowOffline" value="offline">{{ offlineLabel }}</option>
                <option v-if="paymentCapabilities.allowOnline" value="stripe">{{ onlineLabel }}</option>
              </select>
              <input v-else class="input input-bordered" :value="resolvedPaymentLabel" disabled />
              <p v-if="paymentConstraintNotice" class="text-sm opacity-70">{{ paymentConstraintNotice }}</p>
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
            <p v-else class="mt-3 text-sm opacity-70">
              {{ checkoutTaxNotice }}
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
import { useAuthStore } from '#modula/stores/auth'

interface DeliveryOptionPickupPoint {
  id: number
  name: string
  address: string | null
}

interface DeliveryOptionTour {
  id: number
  name: string
  dayOfWeek: number
  nextDate: string
  startTime: string
  endTime: string
  cities: Array<{
    id: number
    city: string
    postalCodes: string | null
  }>
}

interface DeliveryOptionsPayload {
  onSitePickup?: {
    label: string
    address: string
    dayOfWeek: number
    startTime: string
    endTime: string
    nextDate: string
    slotLabel: string
  } | null
  pickupPoints: DeliveryOptionPickupPoint[]
  tours: DeliveryOptionTour[]
  servedCities: string[]
}

type DeliveryType = '' | 'ONSITE' | 'PICKUP' | 'TOUR'

const { locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const authStore = useAuthStore()
const { $toast, $formatPrice, $formatDate } = useNuxtApp() as any
const { items, count, total, updateQuantity, remove, clear } = useShopCart()

await authStore.ensureInitialized()

const { data: paymentConfig } = await useFetch<{
  enabled: boolean
  provider: 'none' | 'stripe_connect'
  publishableKey: string
  config?: {
    automaticTaxEnabled?: boolean
    defaultTaxBehavior?: 'inclusive' | 'exclusive'
    defaultTaxCode?: string
  } | null
}>('/api/payments/config')
const { data: deliveryOptions, pending: deliveryOptionsPending } = await useFetch<DeliveryOptionsPayload>('/api/delivery-options')

const stripeEnabled = computed(() => Boolean(paymentConfig.value?.enabled))
const stripeTaxEnabled = computed(() => Boolean(paymentConfig.value?.config?.automaticTaxEnabled))
const registryDefaultTaxCode = computed(() => paymentConfig.value?.config?.defaultTaxCode?.trim() || '')
const paymentCapabilities = computed(() => getShopCartPaymentCapabilities(items.value, stripeEnabled.value))
const hasRentalItems = computed(() => items.value.some((item) => item.saleType === 'RENTAL'))
const rentalLinesValid = computed(() => items.value.every((item) =>
  item.saleType !== 'RENTAL'
  || (item.rentalStartDate?.trim().length && item.rentalEndDate?.trim().length)
))
const pickupPoints = computed(() => deliveryOptions.value?.pickupPoints || [])
const deliveryTours = computed(() => deliveryOptions.value?.tours || [])
const deliveryChoices = computed<DeliveryType[]>(() => {
  const values: DeliveryType[] = []
  if (deliveryOptions.value?.onSitePickup) values.push('ONSITE')
  if (pickupPoints.value.length) values.push('PICKUP')
  if (deliveryTours.value.length) values.push('TOUR')
  return values
})

const checkoutForm = ref({
  customerName: '',
  email: '',
  phone: '',
  message: '',
  paymentMode: 'offline' as 'offline' | 'stripe',
  deliveryType: '' as DeliveryType,
  pickupPointId: 0,
  deliveryTourId: 0,
  deliveryAddress: '',
  deliveryCity: '',
  deliveryPostalCode: ''
})

const savingOrder = ref(false)

const eyebrowLabel = computed(() => locale.value === 'en' ? 'Checkout' : 'Commande')
const titleLabel = computed(() => locale.value === 'en' ? 'Shopping cart' : 'Panier d’achat')
const introLabel = computed(() => locale.value === 'en'
  ? 'Review the selected products and lots, then confirm the order with delivery and payment details.'
  : 'Vérifiez les produits et lots sélectionnés, puis confirmez la commande avec les informations de livraison et de règlement.')
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
  ? 'Delivery and payment options adapt to the selected offers.'
  : 'Les options de livraison et de règlement s’adaptent aux offres sélectionnées.')
const countLabel = computed(() => locale.value === 'en' ? `${count.value} item(s)` : `${count.value} article(s)`)
const fullNameLabel = computed(() => locale.value === 'en' ? 'Full name' : 'Nom complet')
const phoneLabel = computed(() => locale.value === 'en' ? 'Phone' : 'Téléphone')
const rentalHelpLabel = computed(() => locale.value === 'en'
  ? 'Rental dates are selected before adding each rental to the cart. Availability is checked again when the order is created.'
  : 'Les dates de location sont choisies avant l’ajout de chaque location au panier. La disponibilité est revérifiée lors de la création de la commande.')
const rentalPeriodLabel = computed(() => locale.value === 'en' ? 'Rental period' : 'Période de location')
const deliveryLabel = computed(() => locale.value === 'en' ? 'Delivery method' : 'Mode de livraison')
const deliveryPlaceholderLabel = computed(() => locale.value === 'en' ? 'Select a delivery method' : 'Choisir un mode de livraison')
const onSiteDeliveryLabel = computed(() => deliveryOptions.value?.onSitePickup?.label || (locale.value === 'en' ? 'On-site pickup' : 'Retrait sur place'))
const pickupDeliveryLabel = computed(() => locale.value === 'en' ? 'Pickup point' : 'Point relais')
const tourDeliveryLabel = computed(() => locale.value === 'en' ? 'Home delivery' : 'Livraison à domicile')
const pickupPointLabel = computed(() => locale.value === 'en' ? 'Pickup point' : 'Point relais')
const pickupPlaceholderLabel = computed(() => locale.value === 'en' ? 'Select a pickup point' : 'Choisir un point relais')
const deliveryTourLabel = computed(() => locale.value === 'en' ? 'Delivery slot' : 'Créneau de livraison')
const tourPlaceholderLabel = computed(() => locale.value === 'en' ? 'Select a delivery slot' : 'Choisir un créneau')
const addressLabel = computed(() => locale.value === 'en' ? 'Address' : 'Adresse')
const cityLabel = computed(() => locale.value === 'en' ? 'City' : 'Ville')
const postalCodeLabel = computed(() => locale.value === 'en' ? 'Postal code' : 'Code postal')
const tourCityHelperTitle = computed(() => locale.value === 'en' ? 'Delivery eligibility' : 'Eligibilite livraison')
const tourCityHelperLabel = computed(() => locale.value === 'en'
  ? 'To check whether home delivery is available, enter your city. Suggestions only include cities served by the configured delivery slots.'
  : 'Pour verifier l eligibilite de la livraison a domicile, rentrer votre ville. Les suggestions ne proposent que les villes desservies par les creneaux configures.')
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
const noAddressLabel = computed(() => locale.value === 'en' ? 'Address to be confirmed' : 'Adresse à confirmer')
const unavailableCityLabel = computed(() => locale.value === 'en'
  ? 'Home delivery is not currently available in this city.'
  : 'La livraison à domicile n’est pas actuellement disponible dans cette ville.')
const taxIncludedLabel = computed(() => locale.value === 'en' ? 'VAT included' : 'TVA incluse')
const taxCodeLabel = computed(() => locale.value === 'en' ? 'Tax code' : 'Code taxe')

const resolvedPaymentLabel = computed(() =>
  paymentCapabilities.value.allowOnline && !paymentCapabilities.value.allowOffline
    ? onlineLabel.value
    : offlineLabel.value
)

const selectedPickupPoint = computed(() =>
  pickupPoints.value.find((point) => point.id === Number(checkoutForm.value.pickupPointId)) || null
)

const deliveryCitiesListId = 'delivery-city-suggestions'
const deliveryPostalCodesListId = 'delivery-postalcode-suggestions'

const availableDeliveryCities = computed(() => {
  const seen = new Map<string, string>()
  for (const city of deliveryOptions.value?.servedCities || []) {
    const normalized = String(city || '').trim()
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, normalized)
    }
  }
  return Array.from(seen.values()).sort((left, right) => left.localeCompare(right, 'fr'))
})

const cityPostalCodesMap = computed(() => {
  const map = new Map<string, string[]>()
  for (const tour of deliveryTours.value) {
    for (const entry of tour.cities) {
      const cityKey = entry.city.trim().toLowerCase()
      if (!cityKey) continue
      if (!entry.postalCodes) {
        map.set(cityKey, [])
        continue
      }
      const codes = entry.postalCodes.split(',').map((c) => c.trim()).filter(Boolean)
      if (!codes.length) {
        map.set(cityKey, [])
        continue
      }
      const existing = map.get(cityKey)
      if (existing) {
        for (const code of codes) {
          if (!existing.includes(code)) existing.push(code)
        }
      } else {
        map.set(cityKey, [...codes])
      }
    }
  }
  return map
})

const availableDeliveryPostalCodes = computed(() => {
  const city = checkoutForm.value.deliveryCity.trim().toLowerCase()
  if (!city) return []
  const codes = cityPostalCodesMap.value.get(city)
  return codes || []
})

const deliveryCityValid = computed(() => {
  const city = checkoutForm.value.deliveryCity.trim()
  if (!city) return false
  return availableDeliveryCities.value.some(
    (c) => c.toLowerCase() === city.toLowerCase()
  )
})

const deliveryPostalCodeValid = computed(() => {
  const postalCode = checkoutForm.value.deliveryPostalCode.trim()
  if (!postalCode) return false
  const city = checkoutForm.value.deliveryCity.trim().toLowerCase()
  if (!city) return false
  const matchingEntries = deliveryTours.value.flatMap((tour) =>
    tour.cities.filter((entry) => entry.city.trim().toLowerCase() === city)
  )
  if (!matchingEntries.length) return false
  if (matchingEntries.some((entry) => !entry.postalCodes)) return true
  return matchingEntries.some((entry) => {
    const allowedCodes = entry.postalCodes!.split(',').map((c) => c.trim())
    return allowedCodes.includes(postalCode)
  })
})

const filteredTours = computed(() => {
  const city = checkoutForm.value.deliveryCity.trim().toLowerCase()
  if (!city || !deliveryCityValid.value || !deliveryPostalCodeValid.value) return []
  return deliveryTours.value.filter((tour) =>
    tour.cities.some((entry) => entry.city.trim().toLowerCase() === city)
  )
})

const selectedDeliveryTour = computed(() =>
  filteredTours.value.find((tour) => tour.id === Number(checkoutForm.value.deliveryTourId))
  || deliveryTours.value.find((tour) => tour.id === Number(checkoutForm.value.deliveryTourId))
  || null
)

const onSitePickupSummary = computed(() => {
  const onSitePickup = deliveryOptions.value?.onSitePickup
  if (!onSitePickup) return ''
  return [onSitePickup.address, `${$formatDate(onSitePickup.nextDate)} · ${onSitePickup.slotLabel}`].filter(Boolean).join(' — ')
})

const paymentConstraintNotice = computed(() => {
  if (paymentCapabilities.value.allowOnline && !paymentCapabilities.value.allowOffline) {
    return locale.value === 'en'
      ? 'At least one line in the cart is only available with online payment. The whole cart must be paid online.'
      : 'Au moins une ligne du panier est uniquement payable en ligne. Le panier entier doit donc être payé en ligne.'
  }
  if (paymentCapabilities.value.allowOffline && !paymentCapabilities.value.allowOnline) {
    return locale.value === 'en'
      ? 'At least one line in the cart does not support online payment. The whole cart must therefore be paid on site.'
      : 'Au moins une ligne du panier ne prend pas en charge le paiement en ligne. Le panier entier doit donc être réglé sur place.'
  }
  return ''
})

const checkoutTaxNotice = computed(() => {
  if (!stripeEnabled.value || checkoutForm.value.paymentMode !== 'stripe') {
    return taxIncludedLabel.value
  }
  if (!stripeTaxEnabled.value) {
    return locale.value === 'en'
      ? 'VAT is included in the displayed prices. Stripe will not add extra tax during checkout.'
      : 'La TVA est incluse dans les prix affichés. Stripe n’ajoutera pas de taxe supplémentaire au checkout.'
  }
  return locale.value === 'en'
    ? 'Stripe Tax is enabled. Taxes and tax codes configured for this order will be applied during checkout.'
    : 'Stripe Tax est activé. Les règles fiscales et codes taxe configurés pour cette commande seront appliqués au checkout.'
})

const deliveryValid = computed(() => {
  if (checkoutForm.value.deliveryType === 'ONSITE') return true
  if (checkoutForm.value.deliveryType === 'PICKUP') {
    return Number(checkoutForm.value.pickupPointId) > 0
  }
  if (checkoutForm.value.deliveryType === 'TOUR') {
    return Number(checkoutForm.value.deliveryTourId) > 0
      && checkoutForm.value.deliveryAddress.trim().length > 0
      && checkoutForm.value.deliveryCity.trim().length > 0
      && deliveryCityValid.value
      && deliveryPostalCodeValid.value
  }
  return false
})

const canSubmit = computed(() =>
  items.value.length > 0
  && deliveryValid.value
  && rentalLinesValid.value
  && (paymentCapabilities.value.allowOffline || paymentCapabilities.value.allowOnline)
)

watch(paymentCapabilities, (value) => {
  checkoutForm.value.paymentMode = value.resolvedDefaultMode
}, { immediate: true, deep: true })

watch(deliveryChoices, (choices) => {
  if (!choices.length) {
    checkoutForm.value.deliveryType = ''
    return
  }
  if (!choices.includes(checkoutForm.value.deliveryType)) {
    checkoutForm.value.deliveryType = choices[0] as DeliveryType
  }
}, { immediate: true })

watch(() => checkoutForm.value.deliveryType, (value) => {
  if (value !== 'PICKUP') {
    checkoutForm.value.pickupPointId = 0
  }
  if (value !== 'TOUR') {
    checkoutForm.value.deliveryTourId = 0
  }
})

watch(filteredTours, (tours) => {
  if (!tours.some((tour) => tour.id === Number(checkoutForm.value.deliveryTourId))) {
    checkoutForm.value.deliveryTourId = 0
  }
})

watch(() => checkoutForm.value.deliveryCity, (newCity, oldCity) => {
  if (newCity.trim().toLowerCase() === oldCity?.trim().toLowerCase()) return
  const codes = availableDeliveryPostalCodes.value
  if (codes.length === 1 && codes[0]) {
    checkoutForm.value.deliveryPostalCode = codes[0]
  } else if (codes.length > 0 && !codes.includes(checkoutForm.value.deliveryPostalCode.trim())) {
    checkoutForm.value.deliveryPostalCode = ''
  } else if (codes.length === 0 && newCity.trim()) {
    checkoutForm.value.deliveryPostalCode = ''
  }
})

watch(() => authStore.user, (user) => {
  if (!user) return
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  if (!checkoutForm.value.customerName.trim() && fullName) {
    checkoutForm.value.customerName = fullName
  }
  if (!checkoutForm.value.email.trim() && user.email) {
    checkoutForm.value.email = user.email
  }
  if (user.shippingAddress) {
    if (!checkoutForm.value.deliveryAddress.trim()) {
      checkoutForm.value.deliveryAddress = user.shippingAddress.street || ''
    }
    if (!checkoutForm.value.deliveryCity.trim()) {
      checkoutForm.value.deliveryCity = user.shippingAddress.city || ''
    }
    if (!checkoutForm.value.deliveryPostalCode.trim()) {
      checkoutForm.value.deliveryPostalCode = user.shippingAddress.postalCode || ''
    }
  }
}, { immediate: true })

onMounted(() => {
  if (route.query.checkout === 'cancel') {
    $toast.warning(locale.value === 'en'
      ? 'Stripe payment was cancelled. You can review your cart and try again.'
      : 'Le paiement Stripe a été annulé. Vous pouvez revoir votre panier et réessayer.')
  }
})

const updateItemQuantity = (key: string, quantity: number) => updateQuantity(key, quantity)
const removeItem = (key: string) => remove(key)

function deliveryTourSummary(tour: DeliveryOptionTour) {
  return `${$formatDate(tour.nextDate)} · ${tour.startTime} - ${tour.endTime}`
}

function formatVatRate(value: number) {
  return `${Number(value || 0).toFixed(2)}%`
}

function formatRentalRange(startDate: string | null | undefined, endDate: string | null | undefined) {
  if (!startDate || !endDate) {
    return locale.value === 'en' ? 'To be selected' : 'À sélectionner'
  }
  return `${$formatDate(startDate)} → ${$formatDate(endDate)}`
}

function requiredLabel(label: string) {
  return `${label} *`
}

function resolveCartTaxCode(item: { paymentTaxCode?: string | null }) {
  return item.paymentTaxCode?.trim() || registryDefaultTaxCode.value || ''
}

function resetCheckoutForm() {
  checkoutForm.value.message = ''
  checkoutForm.value.paymentMode = paymentCapabilities.value.resolvedDefaultMode
  checkoutForm.value.pickupPointId = 0
  checkoutForm.value.deliveryTourId = 0
  const firstChoice = deliveryChoices.value[0] || ''
  checkoutForm.value.deliveryType = firstChoice
}

async function submitOrder() {
  if (!checkoutForm.value.customerName.trim() || !checkoutForm.value.email.trim()) {
    $toast.error(locale.value === 'en' ? 'Name and email are required.' : 'Le nom et l’email sont requis.')
    return
  }

  if (!deliveryValid.value) {
    $toast.error(locale.value === 'en' ? 'Please complete the delivery information.' : 'Veuillez compléter les informations de livraison.')
    return
  }

  if (!rentalLinesValid.value) {
    $toast.error(locale.value === 'en' ? 'Please select rental dates for each rental line.' : 'Veuillez renseigner les dates pour chaque ligne de location.')
    return
  }

  if (!canSubmit.value) {
    $toast.error(unavailablePaymentLabel.value)
    return
  }

  savingOrder.value = true
  try {
    const response = await $fetch<{
      redirectUrl?: string | null
      accountProvisioning?: {
        invitationSent?: boolean
      }
    }>('/api/shop/orders', {
      method: 'POST',
      body: {
        customerName: checkoutForm.value.customerName,
        email: checkoutForm.value.email,
        language: locale.value,
        phone: checkoutForm.value.phone,
        message: checkoutForm.value.message,
        paymentMode: checkoutForm.value.paymentMode,
        deliveryType: checkoutForm.value.deliveryType,
        pickupPointId: checkoutForm.value.deliveryType === 'PICKUP' ? checkoutForm.value.pickupPointId : undefined,
        deliveryTourId: checkoutForm.value.deliveryType === 'TOUR' ? checkoutForm.value.deliveryTourId : undefined,
        deliveryAddress: checkoutForm.value.deliveryType === 'TOUR' ? checkoutForm.value.deliveryAddress : undefined,
        deliveryCity: checkoutForm.value.deliveryType === 'TOUR' ? checkoutForm.value.deliveryCity : undefined,
        deliveryPostalCode: checkoutForm.value.deliveryType === 'TOUR' ? checkoutForm.value.deliveryPostalCode : undefined,
        lines: items.value.map((item) => ({
          kind: item.kind,
          productId: item.productId || undefined,
          productLotId: item.productLotId || undefined,
          quantity: item.quantity,
          saleType: item.saleType,
          rentalStartDate: item.saleType === 'RENTAL' ? item.rentalStartDate : undefined,
          rentalEndDate: item.saleType === 'RENTAL' ? item.rentalEndDate : undefined
        }))
      }
    })

    if (response.redirectUrl && import.meta.client) {
      window.location.href = response.redirectUrl
      return
    }

    clear()
    resetCheckoutForm()
    if (response.accountProvisioning?.invitationSent) {
      $toast.info(locale.value === 'en'
        ? 'An email was sent so you can activate your account and track this order later.'
        : 'Un email vous a Ã©tÃ© envoyÃ© pour activer votre compte et retrouver cette commande plus tard.')
    }
    $toast.success(locale.value === 'en' ? 'Order sent successfully.' : 'Commande envoyée avec succès.')
  } catch (error: any) {
    $toast.error(error?.statusMessage || error?.data?.statusMessage || (locale.value === 'en' ? 'Unable to create order.' : 'Impossible de créer la commande.'))
  } finally {
    savingOrder.value = false
  }
}
</script>
