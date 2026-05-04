<template>
  <div class="min-h-screen container mx-auto px-4 py-8">
    <header class="mb-10 text-center">
      <h1 class="mb-2 text-4xl font-bold">{{ $t('pages.baskets.title') }}</h1>
      <p class="mx-auto max-w-2xl opacity-70">
        {{ $t('pages.baskets.subtitle') }}
      </p>
    </header>

    <div v-if="!ordersOpen" class="alert alert-warning mx-auto mb-8 max-w-3xl">
      <Icon name="mdi:clock-alert-outline" size="20" />
      <span>{{ ordersClosedBanner }}</span>
    </div>

    <div v-if="pending" class="py-12 text-center">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="!baskets?.length" class="py-12 text-center opacity-60">
      {{ $t('pages.baskets.noBaskets') }}
    </div>

    <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="basket in baskets"
        :key="basket.id"
        class="card bg-base-200 shadow-xl"
      >
        <figure v-if="basket.imageUrl" class="h-48 overflow-hidden">
          <img :src="basket.imageUrl" :alt="basket.name" class="h-full w-full object-cover" />
        </figure>

        <div class="card-body">
          <h2 class="card-title">
            {{ basket.name }}
            <span v-if="basket.remaining === 0" class="badge badge-error">{{ $t('pages.baskets.complete') }}</span>
            <span v-else-if="basket.remaining <= 3" class="badge badge-warning">
              {{ $t('pages.baskets.remaining', { count: basket.remaining }) }}
            </span>
          </h2>

          <p v-if="basket.description" class="opacity-80">{{ basket.description }}</p>

          <div class="mt-2">
            <details class="collapse collapse-arrow overflow-visible bg-base-300">
              <summary class="collapse-title text-sm font-medium">
                {{ $t('pages.baskets.composition', { count: basket.items.length }) }}
              </summary>
              <div class="collapse-content text-sm">
                <ul class="list-disc list-inside">
                  <li
                    v-for="(item, idx) in basket.items"
                    :key="`${basket.id}-${idx}`"
                    class="basket-composition-item relative flex items-center gap-2"
                    @mouseenter="setHoveredVegetable(`${basket.id}-${idx}`)"
                    @mouseleave="setHoveredVegetable(null)"
                  >
                    <button
                      v-if="item.vegetable.imageUrl"
                      type="button"
                      class="link link-hover inline-flex items-center gap-1 text-left"
                      @click="openVegetablePreview(item.vegetable.imageUrl, item.vegetable.name)"
                    >
                      <Icon name="mdi:image-search-outline" size="16" class="opacity-70" />
                      <span>{{ item.vegetable.name }}</span>
                    </button>
                    <span v-else>{{ item.vegetable.name }}</span>
                    <span> - {{ item.quantity }}{{ item.vegetable.unit === 'KG' ? ' kg' : ' x' }}</span>

                    <div
                      v-if="item.vegetable.imageUrl && hoveredVegetableKey === `${basket.id}-${idx}`"
                      class="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden rounded-box border border-base-300 bg-base-100 p-2 shadow-xl md:block"
                    >
                      <img :src="item.vegetable.imageUrl" :alt="item.vegetable.name" class="h-40 w-40 rounded object-cover" />
                    </div>

                    <span>{{ item.vegetable.name }} - {{ item.quantity }}{{ item.vegetable.unit === 'KG' ? ' kg' : ' x' }}</span>
                  </li>
                </ul>
              </div>
            </details>
          </div>

          <div class="mt-4 flex items-center justify-between">
            <div class="text-2xl font-bold text-primary">{{ $formatPrice(basket.finalPrice) }}</div>
            <button
              class="btn btn-primary"
              :disabled="basket.remaining === 0 || !ordersOpen"
              @click="openReservation(basket)"
            >
              {{ $t('pages.baskets.reserve') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <dialog ref="dlg" class="modal">
      <div class="modal-box max-w-2xl">
        <h3 class="mb-2 text-lg font-bold">
          {{ $t('pages.baskets.reserveTitle', { name: selected?.name ?? '' }) }}
        </h3>
        <p class="mb-4 text-sm opacity-70">
          {{ selected ? $t('pages.baskets.reserveSubtitle', { price: $formatPrice(selected.finalPrice) }) : '' }}
        </p>

        <div class="alert alert-info mb-4 text-sm">
          <Icon name="mdi:cash" size="18" />
          <span>Paiement en especes uniquement au retrait ou a la remise. Aucun paiement en ligne.</span>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="form-control">
            <label class="label"><span class="label-text">{{ $t('pages.baskets.fullName') }} *</span></label>
            <input v-model="form.customerName" class="input input-bordered" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">{{ $t('auth.email') }} *</span></label>
            <input v-model="form.email" type="email" class="input input-bordered" />
          </div>
          <div class="form-control md:col-span-2">
            <label class="label"><span class="label-text">{{ $t('pages.baskets.phone') }}</span></label>
            <input v-model="form.phone" type="tel" class="input input-bordered" />
          </div>
        </div>

        <div class="divider">{{ $t('pages.baskets.deliveryChoice') }}</div>

        <div class="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <label
            class="card cursor-pointer border-2 bg-base-200 p-3"
            :class="form.deliveryType === 'FARM' ? 'border-primary' : 'border-transparent'"
          >
            <div class="flex items-center gap-2">
              <input v-model="form.deliveryType" type="radio" value="FARM" class="radio radio-primary radio-sm" />
              <span class="font-medium">Retrait a la ferme</span>
            </div>
            <div class="mt-2 text-xs opacity-70">
              Pour les paniers reserves sur le site.
            </div>
          </label>

          <label
            class="card cursor-pointer border-2 bg-base-200 p-3"
            :class="form.deliveryType === 'PICKUP' ? 'border-primary' : 'border-transparent'"
          >
            <div class="flex items-center gap-2">
              <input v-model="form.deliveryType" type="radio" value="PICKUP" class="radio radio-primary radio-sm" />
              <span class="font-medium">{{ $t('pages.baskets.deliveryPickup') }}</span>
            </div>
            <div class="mt-2 text-xs opacity-70">
              Retrait dans un point partenaire selon disponibilites.
            </div>
          </label>

          <label
            class="card cursor-pointer border-2 bg-base-200 p-3"
            :class="form.deliveryType === 'TOUR' ? 'border-primary' : 'border-transparent'"
          >
            <div class="flex items-center gap-2">
              <input v-model="form.deliveryType" type="radio" value="TOUR" class="radio radio-primary radio-sm" />
              <span class="font-medium">{{ $t('pages.baskets.deliveryTour') }}</span>
            </div>
            <div class="mt-2 text-xs opacity-70">
              Livraison possible seulement dans certaines villes.
            </div>
          </label>
        </div>

        <div v-if="form.deliveryType === 'FARM'" class="alert alert-info mb-3 text-sm">
          <Icon name="mdi:information-outline" size="18" />
          <span>Nous confirmerons par email le creneau exact de retrait a la ferme pour votre panier. Paiement en especes au retrait.</span>
        </div>

        <div v-if="form.deliveryType === 'PICKUP'" class="alert alert-info mb-3 text-sm">
          <Icon name="mdi:information-outline" size="18" />
          <span>Choisissez le point relais le plus pratique. Paiement en especes lors du retrait.</span>
        </div>

        <div v-if="form.deliveryType === 'PICKUP'" class="form-control mb-3">
          <label class="label"><span class="label-text">{{ $t('pages.baskets.selectPickup') }} *</span></label>
          <select v-if="pickupPoints.length" v-model.number="form.pickupPointId" class="select select-bordered w-full">
            <option :value="null" disabled>--</option>
            <option v-for="point in pickupPoints" :key="point.id" :value="point.id">{{ point.name }}</option>
          </select>
          <p v-else class="text-sm opacity-60">{{ $t('pages.baskets.noPickupPoints') }}</p>

          <div v-if="selectedPickup" class="mt-3 space-y-1 rounded bg-base-300 p-3 text-sm">
            <div v-if="selectedPickup.deliveryDay !== null && selectedPickup.deliveryDay !== undefined">
              <Icon name="mdi:truck-delivery-outline" size="14" class="mr-1 inline" />
              {{ $t('pages.baskets.deliveryOn', { day: $t(`pages.baskets.weekdays.${selectedPickup.deliveryDay}`) }) }}
            </div>
            <div v-if="selectedPickup.pickupStartTime" class="font-medium text-primary">
              <Icon name="mdi:clock-check-outline" size="16" class="mr-1 inline" />
              {{ $t('pages.baskets.pickupFrom', { time: selectedPickup.pickupStartTime }) }}
            </div>
            <div v-if="selectedPickup.address" class="opacity-80">
              <Icon name="mdi:map-marker-outline" size="14" class="mr-1 inline" />
              {{ selectedPickup.address }}
            </div>
            <a v-if="selectedPickup.websiteUrl" :href="selectedPickup.websiteUrl" target="_blank" rel="noopener" class="link link-primary">
              <Icon name="mdi:open-in-new" size="14" class="mr-1 inline" />
              {{ $t('pages.baskets.siteLink') }}
            </a>
            <div v-if="selectedPickup.openingHours" class="mt-2 border-t border-base-200 pt-2 text-xs opacity-60">
              <Icon name="mdi:store-clock-outline" size="12" class="mr-1 inline" />
              {{ $t('pages.baskets.openingHours', { hours: selectedPickup.openingHours }) }}
            </div>
          </div>
        </div>

        <div v-if="form.deliveryType === 'TOUR'" class="mb-3 space-y-3">
          <div class="rounded-xl border border-base-300 bg-base-200 p-4 text-sm">
            <div class="font-medium">Livraison en tournee</div>
            <p class="mt-1 opacity-75">
              Indiquez d'abord votre ville pour verifier si la tournee passe chez vous, puis choisissez votre tournee. Paiement en especes a la remise.
            </p>
          </div>

          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div class="form-control relative">
              <label class="label"><span class="label-text">{{ $t('pages.baskets.city') }} *</span></label>
              <div class="dropdown w-full" :class="{ 'dropdown-open': showCityDropdown }">
                <input
                  v-model="citySearch"
                  class="input input-bordered w-full"
                  placeholder="Chercher une ville..."
                  autocomplete="off"
                  @focus="showCityDropdown = true"
                  @input="onCitySearch"
                  @blur="onCityBlur"
                  @keydown.esc="showCityDropdown = false"
                  @keydown.enter.prevent="selectFirstCity"
                />
                <ul class="dropdown-content menu z-[1] max-h-60 w-full overflow-y-auto rounded-box bg-base-100 p-2 shadow">
                  <li v-if="deliveryCitiesLoading" class="disabled"><a>Chargement...</a></li>
                  <li v-else-if="!filteredCities.length" class="disabled"><a>Aucune ville trouvee</a></li>
                  <li v-for="city in filteredCities" :key="city.city" @mousedown.prevent="selectCity(city)">
                    <a class="flex justify-between">
                      <span>{{ city.city }}</span>
                      <span v-if="city.postalCodes" class="text-xs opacity-60">{{ city.postalCodes }}</span>
                    </a>
                  </li>
                </ul>
              </div>
              <p v-if="deliveryCities?.length && !deliveryCitiesLoading" class="mt-1 text-xs opacity-50">
                {{ deliveryCities.length }} ville(s) desservie(s)
              </p>
            </div>

            <div class="form-control">
              <label class="label"><span class="label-text">{{ $t('pages.baskets.postalCode') }}</span></label>
              <input v-model="form.deliveryPostalCode" class="input input-bordered w-full" placeholder="31000" />
            </div>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">{{ $t('pages.baskets.address') }} *</span></label>
            <textarea v-model="form.deliveryAddress" class="textarea textarea-bordered w-full" rows="2" />
          </div>

          <p v-if="!form.deliveryCity" class="flex items-center gap-1 text-xs opacity-60">
            <Icon name="mdi:lightbulb-outline" size="14" />
            {{ $t('pages.baskets.selectCityForDelivery') }}
          </p>

          <div v-if="!canDeliverToCity && form.deliveryCity" class="alert alert-info text-sm">
            <Icon name="mdi:information-outline" size="18" />
            <span>{{ $t('pages.baskets.cityNotServed', { city: form.deliveryCity }) }}</span>
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">{{ $t('pages.baskets.selectTour') }} *</span></label>
            <select v-if="availableTours.length" v-model.number="form.deliveryTourId" class="select select-bordered w-full">
              <option :value="null" disabled>--</option>
              <option v-for="tour in availableTours" :key="tour.id" :value="tour.id">
                {{ formatTourLabel(tour) }} - {{ $t(`pages.baskets.weekdays.${tour.dayOfWeek}`) }}
              </option>
            </select>
            <p v-else class="text-sm opacity-60">{{ $t('pages.baskets.noToursForCity') }}</p>

            <div v-if="selectedTour" class="mt-3 space-y-2 rounded bg-base-300 p-3 text-sm">
              <div class="font-medium">
                <Icon name="mdi:calendar-check" size="14" class="mr-1 inline" />
                {{ formatNextDate(selectedTour.nextDate) }}
              </div>
              <div v-if="SUBSCRIPTIONS_ENABLED && selectedTour.monthlyPrice" class="text-success">
                <Icon name="mdi:cash-check" size="14" class="mr-1 inline" />
                {{ $t('pages.baskets.monthlySubscriptionPrice', { price: $formatPrice(selectedTour.monthlyPrice) }) }}
              </div>
              <div v-if="selectedTour.notes" class="opacity-70">{{ selectedTour.notes }}</div>
            </div>
          </div>
        </div>

        <div v-if="SUBSCRIPTIONS_ENABLED && form.deliveryType" class="mb-3 rounded-xl border border-base-300 bg-base-200 p-4 text-sm">
          <label class="label cursor-pointer justify-start gap-3 p-0">
            <input v-model="form.monthlySubscription" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            <span class="label-text font-medium">{{ $t('pages.baskets.subscribeMonthly') }}</span>
          </label>
          <p class="mt-2 opacity-70">
            Vous recevrez une reservation recurrente chaque semaine pour ce mode de retrait ou livraison. Vous pourrez ensuite arreter l'abonnement ou annuler seulement une semaine depuis l'email de confirmation.
          </p>
          <p v-if="form.deliveryType === 'TOUR' && selectedTour?.monthlyPrice" class="mt-2 text-success">
            Tarif abonnement indicatif : {{ $formatPrice(selectedTour.monthlyPrice) }}/mois
          </p>
        </div>

        <div class="form-control">
          <label class="label"><span class="label-text">{{ $t('pages.baskets.messageOptional') }}</span></label>
          <textarea v-model="form.message" class="textarea textarea-bordered w-full" rows="3" />
        </div>

        <div class="modal-action">
          <button class="btn" @click="close">{{ $t('common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="submitting" @click="submit">
            <span v-if="submitting" class="loading loading-spinner loading-sm" />
            {{ $t('pages.baskets.send') }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <dialog ref="vegetablePreviewDialog" class="modal">
      <div class="modal-box max-w-md">
        <h3 class="mb-3 text-lg font-bold">{{ vegetablePreview.name }}</h3>
        <img
          v-if="vegetablePreview.url"
          :src="vegetablePreview.url"
          :alt="vegetablePreview.name"
          class="max-h-[70vh] w-full rounded-box object-contain"
        />
        <div class="modal-action">
          <button class="btn" @click="closeVegetablePreview">Fermer</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { SUBSCRIPTIONS_ENABLED } from '~/shared/constants/reservationFeatures'

interface PublicBasket {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
  finalPrice: number
  remaining: number
  available: number
  items: { quantity: number; vegetable: { name: string; unit: 'KG' | 'PIECE'; imageUrl?: string | null } }[]
}

interface PickupPoint {
  id: number
  name: string
  address: string | null
  details: string | null
  deliveryDay: number | null
  pickupStartTime: string | null
  openingHours: string | null
  websiteUrl: string | null
}

interface DeliveryCity {
  city: string
  postalCodes: string | null
}

interface TourCity {
  id: number
  city: string
  postalCodes: string | null
}

interface DeliveryTour {
  id: number
  name: string
  dayOfWeek: number
  nextDate: string
  startTime: string
  endTime: string
  monthlyPrice: number | null
  notes: string | null
  cities: TourCity[]
}

interface OrdersWindow {
  from: string | null
  to: string | null
  message: string
  isOpen: boolean
}

interface SiteConfig {
  facebookFluxDeactivated: boolean
  ordersWindow: OrdersWindow
}

interface DeliveryOptions {
  farmPickup: { label: string; location: string }
  pickupPoints: PickupPoint[]
  tours: DeliveryTour[]
  servedCities: string[]
}

const { t, locale } = useI18n()
const { data: baskets, pending, refresh } = await useFetch<PublicBasket[]>('/api/baskets')
const { data: deliveryOptions } = await useFetch<DeliveryOptions>('/api/delivery-options')
const { data: siteConfig } = await useFetch<SiteConfig>('/api/site-config')
const { data: deliveryCities, pending: deliveryCitiesLoading } = await useFetch<DeliveryCity[]>('/api/delivery-cities')

const ordersOpen = computed(() => siteConfig.value?.ordersWindow.isOpen ?? true)
const ordersWindow = computed(() => siteConfig.value?.ordersWindow)

const formatLongDate = (value: string) =>
  new Date(value).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

const ordersClosedBanner = computed(() => {
  const window = ordersWindow.value
  if (!window || window.isOpen) return ''
  if (window.message) return window.message
  if (window.from && window.to) return t('pages.baskets.ordersOpenFromTo', { from: formatLongDate(window.from), to: formatLongDate(window.to) })
  if (window.from) return t('pages.baskets.ordersOpenFrom', { from: formatLongDate(window.from) })
  return t('pages.baskets.ordersClosed')
})

const pickupPoints = computed(() => deliveryOptions.value?.pickupPoints ?? [])
const tours = computed(() => deliveryOptions.value?.tours ?? [])
const servedCities = computed(() => deliveryOptions.value?.servedCities ?? [])

const authStore = useAuthStore()
const { $toast } = useNuxtApp() as any

const dlg = ref<HTMLDialogElement>()
const vegetablePreviewDialog = ref<HTMLDialogElement>()
const selected = ref<PublicBasket | null>(null)
const submitting = ref(false)
const citySearch = ref('')
const showCityDropdown = ref(false)
const hoveredVegetableKey = ref<string | null>(null)
const vegetablePreview = reactive({
  url: '',
  name: ''
})

const filteredCities = computed(() => {
  if (!deliveryCities.value) return []
  const search = citySearch.value.trim().toLowerCase()
  if (!search) return deliveryCities.value
  return deliveryCities.value.filter((city) => city.city.toLowerCase().includes(search))
})

const form = reactive({
  customerName: '',
  email: '',
  phone: '',
  message: '',
  deliveryAddress: '',
  deliveryCity: '',
  deliveryPostalCode: '',
  deliveryType: '' as '' | 'FARM' | 'PICKUP' | 'TOUR',
  pickupPointId: null as number | null,
  deliveryTourId: null as number | null,
  monthlySubscription: false
})

const canDeliverToCity = computed(() => {
  if (!form.deliveryCity) return false
  return servedCities.value.includes(form.deliveryCity.trim().toLowerCase())
})

const availableTours = computed(() => {
  if (!form.deliveryCity) return []
  const cityLower = form.deliveryCity.trim().toLowerCase()
  return tours.value.filter((tour) =>
    tour.cities.some((city) => city.city.toLowerCase() === cityLower)
  )
})

const selectedPickup = computed(() =>
  pickupPoints.value.find((point) => point.id === form.pickupPointId) ?? null
)

const selectedTour = computed(() =>
  tours.value.find((tour) => tour.id === form.deliveryTourId) ?? null
)

const resetTourFields = () => {
  form.deliveryAddress = ''
  form.deliveryCity = ''
  form.deliveryPostalCode = ''
  form.deliveryTourId = null
  citySearch.value = ''
  showCityDropdown.value = false
}

const resetPickupFields = () => {
  form.pickupPointId = null
}

watch(() => form.deliveryType, (value) => {
  if (value !== 'TOUR') {
    resetTourFields()
  }
  if (value !== 'PICKUP') {
    resetPickupFields()
  }
})

const onCitySearch = () => {
  showCityDropdown.value = true
  form.deliveryCity = citySearch.value
  form.deliveryTourId = null
}

const onCityBlur = () => {
  setTimeout(() => {
    showCityDropdown.value = false
  }, 200)
}

const selectCity = (city: DeliveryCity) => {
  form.deliveryCity = city.city
  citySearch.value = city.city
  showCityDropdown.value = false
  form.deliveryTourId = null
  if (city.postalCodes && !form.deliveryPostalCode) {
    form.deliveryPostalCode = city.postalCodes.split(',')?.[0]?.trim() || ''
  }
}

const selectFirstCity = () => {
  if (filteredCities.value.length > 0) {
    selectCity(filteredCities.value[0] as DeliveryCity)
  }
}

const openReservation = (basket: PublicBasket) => {
  selected.value = basket
  showCityDropdown.value = false

  if (authStore.user) {
    form.customerName = `${authStore.user.firstName ?? ''} ${authStore.user.lastName ?? ''}`.trim()
    form.email = authStore.user.email
  }

  dlg.value?.showModal()
}

const close = () => dlg.value?.close()

const setHoveredVegetable = (key: string | null) => {
  hoveredVegetableKey.value = key
}

const openVegetablePreview = (url: string | null | undefined, name: string) => {
  if (!url) return
  vegetablePreview.url = url
  vegetablePreview.name = name
  vegetablePreviewDialog.value?.showModal()
}

const closeVegetablePreview = () => vegetablePreviewDialog.value?.close()

const formatTourLabel = (tour: DeliveryTour) => `${tour.name} - ${tour.startTime}-${tour.endTime}`

const formatNextDate = (value: string) =>
  new Date(value).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  })

const submit = async () => {
  if (!selected.value) return

  if (!form.deliveryType) {
    $toast.error(t('pages.baskets.deliveryRequired'))
    return
  }

  if (form.deliveryType === 'PICKUP' && !form.pickupPointId) {
    $toast.error(t('pages.baskets.selectPickup'))
    return
  }

  if (form.deliveryType === 'TOUR') {
    if (!form.deliveryCity.trim()) {
      $toast.error(t('pages.baskets.cityRequired'))
      return
    }
    if (!form.deliveryAddress.trim()) {
      $toast.error(t('pages.baskets.addressRequired'))
      return
    }
    if (!canDeliverToCity.value) {
      $toast.error(t('pages.baskets.cityNotDeliverable'))
      return
    }
    if (!form.deliveryTourId) {
      $toast.error(t('pages.baskets.selectTour'))
      return
    }
  }

  submitting.value = true
  try {
    await $fetch('/api/reservations', {
      method: 'POST',
      body: {
        basketId: selected.value.id,
        customerName: form.customerName,
        email: form.email,
        phone: form.phone,
        message: form.message,
        deliveryType: form.deliveryType,
        pickupPointId: form.deliveryType === 'PICKUP' ? form.pickupPointId : null,
        deliveryTourId: form.deliveryType === 'TOUR' ? form.deliveryTourId : null,
        deliveryAddress: form.deliveryType === 'TOUR' ? form.deliveryAddress : '',
        deliveryCity: form.deliveryType === 'TOUR' ? form.deliveryCity : '',
        deliveryPostalCode: form.deliveryType === 'TOUR' ? form.deliveryPostalCode : '',
        monthlySubscription: SUBSCRIPTIONS_ENABLED ? form.monthlySubscription : false
      }
    })

    $toast.success(t('pages.baskets.reservationSent'))
    close()
    Object.assign(form, {
      customerName: '',
      email: '',
      phone: '',
      message: '',
      deliveryAddress: '',
      deliveryCity: '',
      deliveryPostalCode: '',
      deliveryType: '',
      pickupPointId: null,
      deliveryTourId: null,
      monthlySubscription: false
    })
    citySearch.value = ''
    showCityDropdown.value = false
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || t('common.error'))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.basket-composition-item > span:last-of-type {
  display: none;
}
</style>
