<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">{{ $t('admin.deliveryPage.title') }}</h1>

    <div class="tabs tabs-border mb-6">
      <a class="tab" :class="{ 'tab-active': tab === 'pickup' }" @click="tab = 'pickup'">{{ $t('admin.deliveryPage.tabPickup') }}</a>
      <a class="tab" :class="{ 'tab-active': tab === 'tour' }" @click="tab = 'tour'">{{ $t('admin.deliveryPage.tabTour') }}</a>
    </div>

    <div  class="card bg-base-100 p-6">
      <div v-if="tab === 'pickup'">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">{{ $t('admin.deliveryPage.pickupTitle') }}</h2>
          <button class="btn btn-primary btn-sm" @click="openNewPickup">
            <Icon name="mdi:plus" size="16" />
            {{ $t('admin.deliveryPage.add') }}
          </button>
        </div>

        <div v-if="pickupPending" class="text-center py-8">
          <span class="loading loading-spinner" />
        </div>
        <div v-else-if="!pickupPoints?.length" class="text-center py-8 opacity-60">
          {{ $t('admin.deliveryPage.noPickup') }}
        </div>
        <div v-else class="grid gap-3">
          <div v-for="p in pickupPoints" :key="p.id" class="card bg-base-200">
            <div class="card-body p-4">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold">{{ p.name }}</span>
                    <span v-if="!p.active" class="badge badge-ghost badge-sm">{{ $t('admin.deliveryPage.inactive') }}</span>
                    <span v-if="p.deliveryDay !== null && p.deliveryDay !== undefined" class="badge badge-info badge-sm">
                      {{ $t('pages.baskets.deliveryOn', { day: $t(`pages.baskets.weekdays.${p.deliveryDay}`) }) }}
                    </span>
                    <span v-if="p.pickupStartTime" class="badge badge-info badge-sm">
                      {{ $t('pages.baskets.pickupFrom', { time: p.pickupStartTime }) }}
                    </span>
                  </div>
                  <div v-if="p.address" class="text-sm opacity-70">{{ p.address }}</div>
                  <div v-if="p.openingHours" class="text-xs opacity-60 mt-1">{{ p.openingHours }}</div>
                  <a v-if="p.websiteUrl" :href="p.websiteUrl" target="_blank" rel="noopener" class="link link-primary text-xs">
                    <Icon name="mdi:open-in-new" size="12" class="inline" /> {{ p.websiteUrl }}
                  </a>
                  <div v-if="p.details" class="text-xs opacity-60 mt-1">{{ p.details }}</div>
                </div>
                <div class="flex gap-1">
                  <button class="btn btn-xs btn-ghost" @click="openEditPickup(p)">
                    <Icon name="mdi:pencil" size="14" />
                  </button>
                  <button class="btn btn-xs btn-ghost text-error" @click="removePickup(p)">
                    <Icon name="mdi:delete" size="14" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="tab === 'tour'">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">{{ $t('admin.deliveryPage.tourTitle') }}</h2>
          <button class="btn btn-primary btn-sm" @click="openNewTour">
            <Icon name="mdi:plus" size="16" />
            {{ $t('admin.deliveryPage.add') }}
          </button>
        </div>

        <div v-if="tourPending" class="text-center py-8">
          <span class="loading loading-spinner" />
        </div>
        <div v-else-if="!tours?.length" class="text-center py-8 opacity-60">
          {{ $t('admin.deliveryPage.noTour') }}
        </div>
        <div v-else class="grid gap-3">
          <div v-for="tr in tours" :key="tr.id" class="card bg-base-200">
            <div class="card-body p-4">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-semibold">{{ tr.name }}</span>
                    <span v-if="!tr.active" class="badge badge-ghost badge-sm">{{ $t('admin.deliveryPage.inactive') }}</span>
                    <span class="badge badge-secondary badge-sm">{{ $t(`pages.baskets.weekdays.${tr.dayOfWeek}`) }}</span>
                    <span v-if="tr.monthlyPrice" class="badge badge-success badge-sm">{{ formatPrice(tr.monthlyPrice) }}/mois</span>
                  </div>
                  <div class="text-sm">
                    <Icon name="mdi:clock-outline" size="14" class="inline mr-1" />
                    {{ tr.startTime }} — {{ tr.endTime }}
                  </div>
                  <div v-if="tr.cities?.length" class="flex flex-wrap gap-1 mt-2">
                    <span v-for="c in tr.cities" :key="c.id" class="badge badge-outline badge-sm h-auto">
                      {{ c.city }}
                      <span v-if="c.postalCodes" class="opacity-70">({{ c.postalCodes }})</span>
                    </span>
                  </div>
                  <div v-if="tr.notes" class="text-xs opacity-60 mt-1">{{ tr.notes }}</div>
                </div>
                <div class="flex gap-1">
                  <button class="btn btn-xs btn-ghost" @click="openEditTour(tr)">
                    <Icon name="mdi:pencil" size="14" />
                  </button>
                  <button class="btn btn-xs btn-ghost text-error" @click="removeTour(tr)">
                    <Icon name="mdi:delete" size="14" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
    <!-- Pickup point dialog -->
    <dialog ref="pickupDlg" class="modal">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-4">
          {{ pForm.id ? $t('admin.deliveryPage.editPickup') : $t('admin.deliveryPage.newPickup') }}
        </h3>
        <div class="space-y-3">
          <div class="form-control gap-3 flex">
            <label class="label"><span class="label-text">{{ $t('admin.deliveryPage.fieldName') }} *</span></label>
            <input v-model="pForm.name" class="input input-bordered w-full" />
          </div>
          <div class="form-control gap-3 flex">
            <label class="label"><span class="label-text">{{ $t('admin.deliveryPage.fieldAddress') }}</span></label>
            <textarea v-model="pForm.address" class="textarea textarea-bordered w-full" rows="2" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div class="form-control gap-3 flex">
              <label class="label"><span class="label-text">{{ $t('admin.deliveryPage.fieldDeliveryDay') }}</span></label>
              <select v-model.number="pForm.deliveryDay" class="select select-bordered w-full">
                <option :value="null">—</option>
                <option v-for="i in 7" :key="i - 1" :value="i - 1">{{ $t(`pages.baskets.weekdays.${i - 1}`) }}</option>
              </select>
            </div>
            <div class="form-control gap-3 flex">
              <label class="label"><span class="label-text">{{ $t('admin.deliveryPage.fieldPickupStart') }}</span></label>
              <input v-model="pForm.pickupStartTime" type="time" class="input input-bordered w-full" />
            </div>
          </div>
          <div class="form-control gap-3 flex">
            <label class="label"><span class="label-text">{{ $t('admin.deliveryPage.fieldOpeningHours') }}</span></label>
            <textarea v-model="pForm.openingHours" class="textarea textarea-bordered w-full" rows="2" placeholder="Lun-Ven 8h-19h, Sam 8h-12h" />
          </div>
          <div class="form-control gap-3 flex">
            <label class="label"><span class="label-text">{{ $t('admin.deliveryPage.fieldWebsiteUrl') }}</span></label>
            <input v-model="pForm.websiteUrl" type="url" class="input input-bordered w-full" placeholder="https://..." />
          </div>
          <div class="form-control gap-3 flex">
            <label class="label"><span class="label-text">{{ $t('admin.deliveryPage.fieldDetails') }}</span></label>
            <textarea v-model="pForm.details" class="textarea textarea-bordered w-full" rows="2" />
          </div>
          <label class="label cursor-pointer justify-start gap-2">
            <input v-model="pForm.active" type="checkbox" class="toggle toggle-primary" />
            <span class="label-text">{{ $t('admin.deliveryPage.fieldActive') }}</span>
          </label>
        </div>
        <div class="modal-action">
          <button class="btn" @click="pickupDlg?.close()">{{ $t('admin.common.cancel') }}</button>
          <button class="btn btn-primary" @click="savePickup">{{ $t('admin.common.save') }}</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <!-- Tour dialog -->
    <dialog ref="tourDlg" class="modal">
      <div class="modal-box max-w-3xl">
        <h3 class="font-bold text-lg mb-4">
          {{ tForm.id ? $t('admin.deliveryPage.editTour') : $t('admin.deliveryPage.newTour') }}
        </h3>
        <div class="space-y-3">
          <div class="form-control gap-3 flex">
            <label class="label"><span class="label-text">{{ $t('admin.deliveryPage.fieldName') }} *</span></label>
            <input v-model="tForm.name" class="input input-bordered w-full" />
          </div>

          <div class="form-control gap-3 flex">
            <label class="label"><span class="label-text">{{ $t('admin.deliveryPage.fieldDayOfWeek') }} *</span></label>
            <select v-model.number="tForm.dayOfWeek" class="select select-bordered w-full">
              <option v-for="i in 7" :key="i - 1" :value="i - 1">{{ $t(`pages.baskets.weekdays.${i - 1}`) }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="form-control gap-3 flex">
              <label class="label"><span class="label-text">{{ $t('admin.deliveryPage.fieldFrom') }} *</span></label>
              <input v-model="tForm.startTime" type="time" class="input input-bordered w-full" />
            </div>
            <div class="form-control gap-3 flex">
              <label class="label"><span class="label-text">{{ $t('admin.deliveryPage.fieldTo') }} *</span></label>
              <input v-model="tForm.endTime" type="time" class="input input-bordered w-full" />
            </div>
          </div>

          <div class="form-control gap-3 flex">
            <label class="label"><span class="label-text">{{ $t('admin.deliveryPage.fieldMonthlyPrice') }}</span></label>
            <input v-model.number="tForm.monthlyPrice" type="number" min="0" step="0.01" class="input input-bordered w-full" placeholder="45.00" />
            <span class="label-text-alt opacity-60">{{ $t('admin.deliveryPage.monthlyPriceHelp') }}</span>
          </div>

          <div class="form-control gap-3 flex">
            <label class="label"><span class="label-text">{{ $t('admin.deliveryPage.fieldCities') }}</span></label>
            <div class="space-y-2">
              <div v-for="(c, idx) in tForm.cities" :key="idx" class="flex gap-2">
                <input v-model="c.city" class="input input-bordered flex-1" placeholder="Ville" />
                <input v-model="c.postalCodes" class="input input-bordered w-32" placeholder="CP (optionnel)" />
                <button class="btn btn-ghost btn-sm" @click="removeCity(idx)">
                  <Icon name="mdi:delete" size="16" />
                </button>
              </div>
              <button class="btn btn-sm btn-outline" @click="addCity">
                <Icon name="mdi:plus" size="16" />
                {{ $t('admin.deliveryPage.addCity') }}
              </button>
            </div>
          </div>

          <div class="form-control gap-3 flex">
            <label class="label"><span class="label-text">{{ $t('admin.deliveryPage.fieldNotes') }}</span></label>
            <textarea v-model="tForm.notes" class="textarea textarea-bordered w-full" rows="2" />
          </div>
          <label class="label cursor-pointer justify-start gap-2">
            <input v-model="tForm.active" type="checkbox" class="toggle toggle-primary" />
            <span class="label-text">{{ $t('admin.deliveryPage.fieldActive') }}</span>
          </label>
        </div>
        <div class="modal-action">
          <button class="btn" @click="tourDlg?.close()">{{ $t('admin.common.cancel') }}</button>
          <button class="btn btn-primary" @click="saveTour">{{ $t('admin.common.save') }}</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS } from '#modula/shared/adminRoutes'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.shopDelivery
  }
})

interface PickupPoint {
  id: number; name: string
  address: string | null; details: string | null
  delayDays: number
  deliveryDay: number | null
  pickupStartTime: string | null
  openingHours: string | null
  websiteUrl: string | null
  active: boolean; position: number
}

interface TourCity {
  id: number
  city: string
  postalCodes: string | null
}

interface DeliveryTour {
  id: number; name: string
  dayOfWeek: number
  startTime: string; endTime: string
  monthlyPrice: number | null
  notes: string | null
  cities: TourCity[]
  active: boolean
}

const { t } = useI18n()
const { $formatPrice } = useNuxtApp() as any
const tab = ref<'pickup' | 'tour'>('pickup')

const { data: pickupPoints, pending: pickupPending, refresh: refreshPickup } = await useFetch<PickupPoint[]>('/api/admin/pickup-points')
const { data: tours, pending: tourPending, refresh: refreshTours } = await useFetch<DeliveryTour[]>('/api/admin/delivery-tours')

const pickupDlg = ref<HTMLDialogElement>()
const tourDlg = ref<HTMLDialogElement>()

const pForm = reactive({
  id: null as number | null, name: '', address: '', details: '',
  delayDays: 0, deliveryDay: null as number | null, pickupStartTime: '',
  openingHours: '', websiteUrl: '', active: true
})

const tForm = reactive({
  id: null as number | null,
  name: '',
  dayOfWeek: 1,
  startTime: '08:00',
  endTime: '12:00',
  monthlyPrice: null as number | null,
  notes: '',
  cities: [] as { city: string; postalCodes: string }[],
  active: true
})

const formatPrice = (p: number) => $formatPrice ? $formatPrice(p) : `${p.toFixed(2)} €`

const openNewPickup = () => {
  Object.assign(pForm, {
    id: null, name: '', address: '', details: '', delayDays: 0,
    deliveryDay: null, pickupStartTime: '', openingHours: '', websiteUrl: '',
    active: true
  })
  pickupDlg.value?.showModal()
}

const openEditPickup = (p: PickupPoint) => {
  Object.assign(pForm, {
    id: p.id, name: p.name,
    address: p.address ?? '', details: p.details ?? '',
    delayDays: p.delayDays,
    deliveryDay: p.deliveryDay,
    pickupStartTime: p.pickupStartTime ?? '',
    openingHours: p.openingHours ?? '',
    websiteUrl: p.websiteUrl ?? '',
    active: p.active
  })
  pickupDlg.value?.showModal()
}

const savePickup = async () => {
  if (!pForm.name.trim()) return
  const body = {
    name: pForm.name, address: pForm.address, details: pForm.details,
    delayDays: pForm.delayDays,
    deliveryDay: pForm.deliveryDay,
    pickupStartTime: pForm.pickupStartTime,
    openingHours: pForm.openingHours,
    websiteUrl: pForm.websiteUrl,
    active: pForm.active
  }
  try {
    if (pForm.id) await $fetch(`/api/admin/pickup-points/${pForm.id}`, { method: 'PUT', body })
    else await $fetch('/api/admin/pickup-points', { method: 'POST', body })
    pickupDlg.value?.close()
    await refreshPickup()
  } catch (e: any) {
    const { $toast } = useNuxtApp() as any; $toast?.error(e.statusMessage || t('common.error'))
  }
}

const removePickup = async (p: PickupPoint) => {
  if (!confirm(t('admin.deliveryPage.deleteConfirm', { name: p.name }))) return
  await $fetch(`/api/admin/pickup-points/${p.id}`, { method: 'DELETE' })
  await refreshPickup()
}

const openNewTour = () => {
  Object.assign(tForm, {
    id: null, name: '', dayOfWeek: 1,
    startTime: '08:00', endTime: '12:00',
    monthlyPrice: null, notes: '',
    cities: [], active: true
  })
  tourDlg.value?.showModal()
}

const openEditTour = (tr: DeliveryTour) => {
  Object.assign(tForm, {
    id: tr.id, name: tr.name,
    dayOfWeek: tr.dayOfWeek,
    startTime: tr.startTime, endTime: tr.endTime,
    monthlyPrice: tr.monthlyPrice,
    notes: tr.notes ?? '',
    cities: tr.cities.map(c => ({ city: c.city, postalCodes: c.postalCodes ?? '' })),
    active: tr.active
  })
  tourDlg.value?.showModal()
}

const addCity = () => {
  tForm.cities.push({ city: '', postalCodes: '' })
}

const removeCity = (idx: number) => {
  tForm.cities.splice(idx, 1)
}

const saveTour = async () => {
  if (!tForm.name.trim()) return
  if (tForm.dayOfWeek === null) return
  const body = {
    name: tForm.name,
    dayOfWeek: tForm.dayOfWeek,
    startTime: tForm.startTime,
    endTime: tForm.endTime,
    monthlyPrice: tForm.monthlyPrice,
    notes: tForm.notes,
    cities: tForm.cities.filter(c => c.city.trim()),
    active: tForm.active
  }
  try {
    if (tForm.id) await $fetch(`/api/admin/delivery-tours/${tForm.id}`, { method: 'PUT', body })
    else await $fetch('/api/admin/delivery-tours', { method: 'POST', body })
    tourDlg.value?.close()
    await refreshTours()
  } catch (e: any) {
    const { $toast } = useNuxtApp() as any; $toast?.error(e.statusMessage || t('common.error'))
  }
}

const removeTour = async (tr: DeliveryTour) => {
  if (!confirm(t('admin.deliveryPage.deleteConfirm', { name: tr.name }))) return
  await $fetch(`/api/admin/delivery-tours/${tr.id}`, { method: 'DELETE' })
  await refreshTours()
}
</script>
