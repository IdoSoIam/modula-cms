<template>
  <div class="min-h-screen container mx-auto px-4 py-8">
    <header class="text-center mb-10">
      <h1 class="text-4xl font-bold mb-2">{{ $t('pages.baskets.title') }}</h1>
      <p class="opacity-70 max-w-2xl mx-auto">
        {{ $t('pages.baskets.subtitle') }}
      </p>
    </header>

    <div v-if="!ordersOpen" class="alert alert-warning max-w-3xl mx-auto mb-8">
      <Icon name="mdi:clock-alert-outline" size="20" />
      <span>{{ ordersClosedBanner }}</span>
    </div>

    <div v-if="pending" class="text-center py-12">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="!baskets?.length" class="text-center py-12 opacity-60">
      {{ $t('pages.baskets.noBaskets') }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="b in baskets"
        :key="b.id"
        class="card bg-base-200 shadow-xl"
      >
        <figure v-if="b.imageUrl" class="h-48 overflow-hidden">
          <img :src="b.imageUrl" :alt="b.name" class="object-cover w-full h-full" />
        </figure>
        <div class="card-body">
          <h2 class="card-title">
            {{ b.name }}
            <span v-if="b.remaining === 0" class="badge badge-error">{{ $t('pages.baskets.complete') }}</span>
            <span v-else-if="b.remaining <= 3" class="badge badge-warning">
              {{ $t('pages.baskets.remaining', { count: b.remaining }) }}
            </span>
          </h2>
          <p v-if="b.description" class="opacity-80">{{ b.description }}</p>

          <div class="mt-2">
            <details class="collapse collapse-arrow bg-base-300 overflow-visible">
              <summary class="collapse-title text-sm font-medium">
                {{ $t('pages.baskets.composition', { count: b.items.length }) }}
              </summary>
              <div class="collapse-content text-sm">
                <ul class="list-disc list-inside">
                  <li
                    v-for="(it, idx) in b.items"
                    :key="idx"
                    class="basket-composition-item relative flex items-center gap-2"
                    @mouseenter="setHoveredVegetable(`${b.id}-${idx}`)"
                    @mouseleave="setHoveredVegetable(null)"
                  >
                    <button
                      v-if="it.vegetable.imageUrl"
                      type="button"
                      class="link link-hover inline-flex items-center gap-1 text-left"
                      @click="openVegetablePreview(it.vegetable.imageUrl, it.vegetable.name)"
                    >
                      <Icon name="mdi:image-search-outline" size="16" class="opacity-70" />
                      <span>{{ it.vegetable.name }}</span>
                    </button>
                    <span v-else>{{ it.vegetable.name }}</span>
                    <span> - {{ it.quantity }}{{ it.vegetable.unit === 'KG' ? ' kg' : ' x' }}</span>
                    <div
                      v-if="it.vegetable.imageUrl && hoveredVegetableKey === `${b.id}-${idx}`"
                      class="pointer-events-none absolute left-0 top-full z-20 mt-2 hidden rounded-box border border-base-300 bg-base-100 p-2 shadow-xl md:block"
                    >
                      <img :src="it.vegetable.imageUrl" :alt="it.vegetable.name" class="h-40 w-40 rounded object-cover" />
                    </div>
                    <span>{{ it.vegetable.name }} — {{ it.quantity }}{{ it.vegetable.unit === 'KG' ? ' kg' : ' x' }}</span>
                  </li>
                </ul>
              </div>
            </details>
          </div>

          <div class="card-actions justify-between items-center mt-4">
            <div class="text-2xl font-bold text-primary">{{ $formatPrice(b.finalPrice) }}</div>
            <button
              class="btn btn-primary"
              :disabled="b.remaining === 0 || !ordersOpen"
              @click="openReservation(b)"
            >
              {{ $t('pages.baskets.reserve') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <dialog ref="dlg" class="modal">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-2">
          {{ $t('pages.baskets.reserveTitle', { name: selected?.name ?? '' }) }}
        </h3>
        <p class="text-sm opacity-70 mb-4">
          {{ selected ? $t('pages.baskets.reserveSubtitle', { price: $formatPrice(selected.finalPrice) }) : '' }}
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label"><span class="label-text">{{ $t('pages.baskets.fullName') }} *</span></label>
            <input v-model="form.customerName" class="input input-bordered" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">{{ $t('auth.email') }} *</span></label>
            <input v-model="form.email" type="email" class="input input-bordered" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">{{ $t('pages.baskets.phone') }}</span></label>
            <input v-model="form.phone" type="tel" class="input input-bordered" />
          </div>
        </div>

        <!-- Client Address -->
        <div class="divider">{{ $t('pages.baskets.yourAddress') }}</div>
        <div class="space-y-3">
          <div v-if="form.deliveryType === 'TOUR'" class="form-control">
            <label class="label"><span class="label-text">{{ $t('pages.baskets.address') }} *</span></label>
            <textarea v-model="form.deliveryAddress" class="textarea textarea-bordered w-full" rows="2" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div class="form-control relative">
              <label class="label"><span class="label-text">{{ $t('pages.baskets.city') }} <span v-if="form.deliveryType === 'TOUR'">*</span></span></label>
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
                <ul class="dropdown-content menu z-[1] p-2 shadow bg-base-100 rounded-box w-full max-h-60 overflow-y-auto">
                  <li v-if="deliveryCitiesLoading" class="disabled"><a>Chargement...</a></li>
                  <li v-else-if="!filteredCities.length" class="disabled"><a>Aucune ville trouvée</a></li>
                  <li v-for="c in filteredCities" :key="c.city" @mousedown.prevent="selectCity(c)">
                    <a class="flex justify-between">
                      <span>{{ c.city }}</span>
                      <span v-if="c.postalCodes" class="text-xs opacity-60">{{ c.postalCodes }}</span>
                    </a>
                  </li>
                </ul>
              </div>
              <p v-if="deliveryCities?.length && !deliveryCitiesLoading" class="text-xs opacity-50 mt-1">
                {{ deliveryCities.length }} ville(s) desservie(s)
              </p>
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">{{ $t('pages.baskets.postalCode') }}</span></label>
              <input v-model="form.deliveryPostalCode" class="input input-bordered w-full" placeholder="31000" />
            </div>
          </div>
          <p v-if="!canDeliverToCity && !form.deliveryCity" class="text-xs opacity-60 flex items-center gap-1">
            <Icon name="mdi:lightbulb-outline" size="14" />
            {{ $t('pages.baskets.selectCityForDelivery') }}
          </p>
        </div>

        <!-- Delivery choice -->
        <div class="divider">{{ $t('pages.baskets.deliveryChoice') }}</div>

        <div class="grid grid-cols-1 gap-2 mb-3 sm:grid-cols-3">
          <label
            class="card bg-base-200 p-3 cursor-pointer border-2"
            :class="form.deliveryType === 'FARM' ? 'border-primary' : 'border-transparent'"
          >
            <div class="flex items-center gap-2">
              <input v-model="form.deliveryType" type="radio" value="FARM" class="radio radio-primary radio-sm" />
              <span class="font-medium">Retrait a la ferme</span>
            </div>
            <div class="mt-2 text-xs opacity-70">
              {{ deliveryOptions?.farmPickup.location ?? 'Ferme du Campeyrigoux' }}
            </div>
          </label>
          <label
            class="card bg-base-200 p-3 cursor-pointer border-2"
            :class="form.deliveryType === 'PICKUP' ? 'border-primary' : 'border-transparent'"
          >
            <div class="flex items-center gap-2">
              <input v-model="form.deliveryType" type="radio" value="PICKUP" class="radio radio-primary radio-sm" />
              <span class="font-medium">{{ $t('pages.baskets.deliveryPickup') }}</span>
            </div>
          </label>
          <label
            v-if="canDeliverToCity"
            class="card bg-base-200 p-3 cursor-pointer border-2"
            :class="form.deliveryType === 'TOUR' ? 'border-primary' : 'border-transparent'"
          >
            <div class="flex items-center gap-2">
              <input v-model="form.deliveryType" type="radio" value="TOUR" class="radio radio-primary radio-sm" />
              <span class="font-medium">{{ $t('pages.baskets.deliveryTour') }}</span>
            </div>
          </label>
        </div>

        <div v-if="form.deliveryType === 'FARM'" class="alert alert-info text-sm mb-3">
          <Icon name="mdi:information-outline" size="18" />
          <span>Nous confirmerons par email le creneau exact de retrait a la ferme.</span>
        </div>

        <div v-if="!canDeliverToCity && form.deliveryCity" class="alert alert-info text-sm mb-3">
          <Icon name="mdi:information-outline" size="18" />
          <span>{{ $t('pages.baskets.cityNotServed', { city: form.deliveryCity }) }}</span>
        </div>

        <div v-if="form.deliveryType === 'PICKUP'" class="form-control mb-3">
          <label class="label"><span class="label-text">{{ $t('pages.baskets.selectPickup') }} *</span></label>
          <select v-if="pickupPoints?.length" v-model.number="form.pickupPointId" class="select select-bordered w-full">
            <option :value="null" disabled>—</option>
            <option v-for="p in pickupPoints" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <p v-else class="text-sm opacity-60">{{ $t('pages.baskets.noPickupPoints') }}</p>

          <div v-if="selectedPickup" class="mt-3 p-3 rounded bg-base-300 text-sm space-y-1">
            <div v-if="selectedPickup.deliveryDay !== null && selectedPickup.deliveryDay !== undefined">
              <Icon name="mdi:truck-delivery-outline" size="14" class="inline mr-1" />
              {{ $t('pages.baskets.deliveryOn', { day: $t(`pages.baskets.weekdays.${selectedPickup.deliveryDay}`) }) }}
            </div>
            <div v-if="selectedPickup.pickupStartTime" class="font-medium text-primary">
              <Icon name="mdi:clock-check-outline" size="16" class="inline mr-1" />
              {{ $t('pages.baskets.pickupFrom', { time: selectedPickup.pickupStartTime }) }}
            </div>
            <div v-if="selectedPickup.address" class="opacity-80">
              <Icon name="mdi:map-marker-outline" size="14" class="inline mr-1" />
              {{ selectedPickup.address }}
            </div>
            <a v-if="selectedPickup.websiteUrl" :href="selectedPickup.websiteUrl" target="_blank" rel="noopener" class="link link-primary">
              <Icon name="mdi:open-in-new" size="14" class="inline mr-1" />
              {{ $t('pages.baskets.siteLink') }}
            </a>
            <div v-if="selectedPickup.openingHours" class="opacity-60 text-xs mt-2 pt-2 border-t border-base-200">
              <Icon name="mdi:store-clock-outline" size="12" class="inline mr-1" />
              {{ $t('pages.baskets.openingHours', { hours: selectedPickup.openingHours }) }}
            </div>
          </div>
        </div>

        <div v-if="form.deliveryType === 'TOUR'" class="form-control mb-3">
          <label class="label"><span class="label-text">{{ $t('pages.baskets.selectTour') }} *</span></label>
          <select v-if="availableTours?.length" v-model.number="form.deliveryTourId" class="select select-bordered w-full">
            <option :value="null" disabled>—</option>
            <option v-for="tr in availableTours" :key="tr.id" :value="tr.id">
              {{ formatTourLabel(tr) }} — {{ $t(`pages.baskets.weekdays.${tr.dayOfWeek}`) }}
            </option>
          </select>
          <p v-else class="text-sm opacity-60">{{ $t('pages.baskets.noToursForCity') }}</p>

          <div v-if="selectedTour" class="mt-3 p-3 rounded bg-base-300 text-sm space-y-2">
            <div class="font-medium">
              <Icon name="mdi:calendar-check" size="14" class="inline mr-1" />
              {{ formatNextDate(selectedTour.nextDate) }}
            </div>
            <div v-if="SUBSCRIPTIONS_ENABLED && selectedTour.monthlyPrice" class="text-success">
              <Icon name="mdi:cash-check" size="14" class="inline mr-1" />
              {{ $t('pages.baskets.monthlySubscriptionPrice', { price: $formatPrice(selectedTour.monthlyPrice) }) }}
            </div>
            <div v-if="selectedTour.notes" class="opacity-70">{{ selectedTour.notes }}</div>
          </div>
        </div>

        <div v-if="SUBSCRIPTIONS_ENABLED && form.deliveryType" class="rounded-xl border border-base-300 bg-base-200 p-4 text-sm mb-3">
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

        <div class="w-full">
          <div class="form-control">
            <label class="label"><span class="label-text">{{ $t('pages.baskets.messageOptional') }}</span></label>
            <textarea v-model="form.message" class="textarea textarea-bordered w-full" rows="3" />
          </div>
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
  id: number; name: string; description: string | null; imageUrl: string | null
  finalPrice: number; remaining: number; available: number
  items: { quantity: number; vegetable: { name: string; unit: 'KG' | 'PIECE'; imageUrl?: string | null } }[]
}

interface PickupPoint {
  id: number; name: string; address: string | null; details: string | null
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
  id: number; name: string
  dayOfWeek: number
  nextDate: string
  startTime: string; endTime: string
  monthlyPrice: number | null
  notes: string | null
  cities: TourCity[]
}

interface OrdersWindow { from: string | null; to: string | null; message: string; isOpen: boolean }
interface SiteConfig { facebookFluxDeactivated: boolean; ordersWindow: OrdersWindow }
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
const formatLongDate = (s: string) => new Date(s).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
const ordersClosedBanner = computed(() => {
  const w = ordersWindow.value
  if (!w || w.isOpen) return ''
  if (w.message) return w.message
  if (w.from && w.to) return t('pages.baskets.ordersOpenFromTo', { from: formatLongDate(w.from), to: formatLongDate(w.to) })
  if (w.from) return t('pages.baskets.ordersOpenFrom', { from: formatLongDate(w.from) })
  return t('pages.baskets.ordersClosed')
})

const pickupPoints = computed(() => deliveryOptions.value?.pickupPoints ?? [])
const tours = computed(() => deliveryOptions.value?.tours ?? [])
const servedCities = computed(() => deliveryOptions.value?.servedCities ?? [])

const authStore = useAuthStore()
const { $toast, $formatPrice } = useNuxtApp() as any

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
  return deliveryCities.value.filter(c =>
    c.city.toLowerCase().includes(search)
  )
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
  const cityLower = form.deliveryCity.trim().toLowerCase()
  return servedCities.value.includes(cityLower)
})

const availableTours = computed(() => {
  if (!form.deliveryCity) return []
  const cityLower = form.deliveryCity.trim().toLowerCase()
  return tours.value.filter(tr =>
    tr.cities.some(c => c.city.toLowerCase() === cityLower)
  )
})

const selectedPickup = computed(() =>
  pickupPoints.value.find(p => p.id === form.pickupPointId) ?? null
)

const selectedTour = computed(() =>
  tours.value.find(tr => tr.id === form.deliveryTourId) ?? null
)

const onCitySearch = () => {
  showCityDropdown.value = true
  // Sync citySearch → form.deliveryCity
  form.deliveryCity = citySearch.value
  // Reset tour selection when searching
  form.deliveryTourId = null
  // If city no longer matches, reset TOUR delivery type
  if (form.deliveryType === 'TOUR' && !canDeliverToCity.value) {
    form.deliveryType = ''
  }
}

const onCityBlur = () => {
  // Delay to allow click on dropdown item before closing
  setTimeout(() => { showCityDropdown.value = false }, 200)
}

const selectCity = (city: DeliveryCity) => {
  form.deliveryCity = city.city
  citySearch.value = city.city
  showCityDropdown.value = false
  // Auto-fill postal code if available
  if (city.postalCodes && !form.deliveryPostalCode) {
    form.deliveryPostalCode = city.postalCodes.split(',')?.[0]?.trim() || ''
  }
}

const selectFirstCity = () => {
  if (filteredCities.value.length > 0) {
    selectCity(filteredCities.value[0] as DeliveryCity)
  }
}

const openReservation = (b: PublicBasket) => {
  selected.value = b
  citySearch.value = form.deliveryCity || ''
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

const formatTourLabel = (tr: DeliveryTour) => {
  return `${tr.name} — ${tr.startTime}–${tr.endTime}`
}

const formatNextDate = (s: string) => {
  return new Date(s).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'fr-FR', {
    weekday: 'long', day: '2-digit', month: 'long'
  })
}

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
    if (!form.deliveryTourId) {
      $toast.error(t('pages.baskets.selectTour'))
      return
    }
    if (!canDeliverToCity.value) {
      $toast.error(t('pages.baskets.cityNotDeliverable'))
      return
    }
  }
  if (form.deliveryType === 'TOUR' && !form.deliveryAddress.trim()) {
    $toast.error(t('pages.baskets.addressRequired'))
    return
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
        deliveryAddress: form.deliveryAddress,
        deliveryCity: form.deliveryCity,
        deliveryPostalCode: form.deliveryPostalCode,
        monthlySubscription: SUBSCRIPTIONS_ENABLED ? form.monthlySubscription : false
      }
    })
    $toast.success(t('pages.baskets.reservationSent'))
    close()
    Object.assign(form, {
      customerName: '', email: '', phone: '', message: '',
      deliveryAddress: '', deliveryCity: '', deliveryPostalCode: '',
      deliveryType: '', pickupPointId: null, deliveryTourId: null, monthlySubscription: false
    })
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
