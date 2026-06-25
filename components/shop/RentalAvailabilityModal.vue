<template>
  <dialog ref="dialogRef" class="modal" @close="emit('close')">
    <div class="modal-box max-w-6xl">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 class="text-xl font-bold">{{ titleLabel }}</h3>
          <p class="mt-1 text-sm opacity-70">{{ helpLabel }}</p>
        </div>
        <button type="button" class="btn btn-sm btn-circle" @click="close">x</button>
      </div>

      <div v-if="pending" class="py-10 text-center">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <template v-else-if="data">
        <div class="mb-4 flex flex-wrap gap-2">
          <span class="badge badge-outline">{{ data.source.saleType === 'RENTAL' ? rentalLabel : saleLabel }}</span>
          <span class="badge badge-soft">{{ stockLabel }}: {{ data.source.stock }}</span>
          <span class="badge badge-soft">{{ minDurationLabel }}: {{ data.source.rentalMinDays }}j</span>
          <span v-if="data.source.rentalMaxDays" class="badge badge-soft">{{ maxDurationLabel }}: {{ data.source.rentalMaxDays }}j</span>
        </div>

        <OrdersCalendar
          :days="data.days"
          :month-label="data.monthLabel"
          :month-input="monthInput"
          :show-month-picker="showMonthPicker"
          :day-names="data.dayNames"
          :today-label="todayLabel"
          :month-picker-label="monthPickerLabel"
          :day-class="dayClass"
          :item-class="itemClass"
          :item-title="itemTitle"
          :item-subtitle="itemSubtitle"
          :item-meta="itemMeta"
          @change-month="changeMonth"
          @toggle-month-picker="showMonthPicker = !showMonthPicker"
          @update:month-input="monthInput = $event"
          @apply-month-input="applyMonthInput"
          @go-current-month="goCurrentMonth"
          @select-day="selectDay"
        />

        <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ rentalStartLabel }}</span></label>
            <input v-model="selectedStartDate" type="date" class="input input-bordered" />
          </div>
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ rentalEndLabel }}</span></label>
            <input v-model="selectedEndDate" type="date" class="input input-bordered" />
          </div>
        </div>

        <div class="mt-4 rounded-2xl bg-base-200 p-4 text-sm">
          <div class="font-medium">{{ selectedSummaryLabel }}</div>
          <div class="mt-1 opacity-80">{{ selectedSummaryText }}</div>
        </div>
      </template>

      <div class="modal-action">
        <button type="button" class="btn" @click="close">{{ closeLabel }}</button>
        <button type="button" class="btn btn-primary" :disabled="!canConfirm" @click="confirmSelection">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>
</template>

<script setup lang="ts">
import OrdersCalendar from '#modula/components/admin/OrdersCalendar.vue'

const props = defineProps<{
  open: boolean
  sourceKind: 'product' | 'productLot'
  sourceId: number | null
  sourceName: string
}>()

const emit = defineEmits<{
  close: []
  confirm: [{ rentalStartDate: string, rentalEndDate: string }]
}>()

const { locale } = useI18n()
const { $toast } = useNuxtApp() as any
const dialogRef = ref<HTMLDialogElement | null>(null)
const currentMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const monthInput = ref(formatMonth(currentMonth.value))
const showMonthPicker = ref(false)
const selectedStartDate = ref('')
const selectedEndDate = ref('')
const errorMessage = ref('')

const query = computed(() => ({
  kind: props.sourceKind,
  id: props.sourceId || undefined,
  month: formatMonth(currentMonth.value),
  locale: locale.value,
}))

const { data, pending, refresh } = await useFetch('/api/shop/rental-availability', {
  query,
  immediate: false,
})

watch(() => props.open, async (open) => {
  if (open) {
    if (!dialogRef.value?.open) {
      dialogRef.value?.showModal()
    }
    errorMessage.value = ''
    selectedStartDate.value = ''
    selectedEndDate.value = ''
    currentMonth.value = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    monthInput.value = formatMonth(currentMonth.value)
    await refresh()
    return
  }
  if (dialogRef.value?.open) {
    dialogRef.value.close()
  }
}, { immediate: true })

watch(() => props.sourceId, async () => {
  if (props.open) {
    selectedStartDate.value = ''
    selectedEndDate.value = ''
    await refresh()
  }
})

const titleLabel = computed(() => locale.value === 'en'
  ? `Choose rental dates - ${props.sourceName}`
  : `Choisir la période de location - ${props.sourceName}`)
const helpLabel = computed(() => locale.value === 'en'
  ? 'Pick a start and end date from the availability calendar before adding this rental to the cart.'
  : 'Choisissez une date de début et de fin depuis le calendrier de disponibilité avant d’ajouter cette location au panier.')
const rentalLabel = computed(() => locale.value === 'en' ? 'Rental' : 'Location')
const saleLabel = computed(() => locale.value === 'en' ? 'Sale' : 'Vente')
const stockLabel = computed(() => locale.value === 'en' ? 'Stock' : 'Stock')
const minDurationLabel = computed(() => locale.value === 'en' ? 'Minimum' : 'Minimum')
const maxDurationLabel = computed(() => locale.value === 'en' ? 'Maximum' : 'Maximum')
const todayLabel = computed(() => locale.value === 'en' ? 'Today' : 'Aujourd’hui')
const monthPickerLabel = computed(() => locale.value === 'en' ? 'Month' : 'Mois')
const rentalStartLabel = computed(() => locale.value === 'en' ? 'Rental start date' : 'Début de location')
const rentalEndLabel = computed(() => locale.value === 'en' ? 'Rental end date' : 'Fin de location')
const selectedSummaryLabel = computed(() => locale.value === 'en' ? 'Selected period' : 'Période sélectionnée')
const closeLabel = computed(() => locale.value === 'en' ? 'Close' : 'Fermer')
const confirmLabel = computed(() => locale.value === 'en' ? 'Add to cart' : 'Ajouter au panier')

const selectedSummaryText = computed(() => {
  if (!selectedStartDate.value || !selectedEndDate.value) {
    return locale.value === 'en'
      ? 'Select two dates in the calendar or using the fields below.'
      : 'Sélectionnez deux dates dans le calendrier ou via les champs ci-dessous.'
  }
  return `${selectedStartDate.value} → ${selectedEndDate.value}`
})

const canConfirm = computed(() => selectedStartDate.value.trim().length > 0 && selectedEndDate.value.trim().length > 0)

function formatMonth(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`
}

function changeMonth(offset: number) {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + offset, 1)
  monthInput.value = formatMonth(currentMonth.value)
}

function applyMonthInput() {
  const match = /^(\d{4})-(\d{2})$/.exec(monthInput.value)
  if (!match) return
  currentMonth.value = new Date(Number(match[1]), Number(match[2]) - 1, 1)
}

function goCurrentMonth() {
  currentMonth.value = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  monthInput.value = formatMonth(currentMonth.value)
}

function itemClass(item: any) {
  if (item.status === 'full') return 'bg-error/15 text-error'
  if (item.status === 'partial') return 'bg-warning/20 text-warning-content'
  if (item.status === 'outside') return 'bg-base-300 text-base-content/60'
  return 'bg-success/15 text-success'
}

function itemTitle(item: any) {
  return item.title
}

function itemSubtitle(item: any) {
  return item.subtitle
}

function itemMeta(item: any) {
  return item.meta
}

function dayClass(day: any) {
  if (day.availabilityStatus === 'outside') return 'opacity-50'
  if (day.availabilityStatus === 'full') return 'border-error/50 bg-error/5'
  if (day.availabilityStatus === 'partial') return 'border-warning/50 bg-warning/5'
  if (isSelectedDay(day.iso)) return 'ring-2 ring-primary border-primary'
  if (isInSelectedRange(day.iso)) return 'border-primary/40 bg-primary/5'
  return ''
}

function isSelectedDay(iso: string) {
  return selectedStartDate.value === iso || selectedEndDate.value === iso
}

function isInSelectedRange(iso: string) {
  if (!selectedStartDate.value || !selectedEndDate.value) return false
  return iso > selectedStartDate.value && iso < selectedEndDate.value
}

function selectDay(day: any) {
  if (!day?.selectable) return
  const iso = String(day.iso)
  if (!selectedStartDate.value || (selectedStartDate.value && selectedEndDate.value)) {
    selectedStartDate.value = iso
    selectedEndDate.value = ''
    return
  }

  if (iso < selectedStartDate.value) {
    selectedStartDate.value = iso
    return
  }

  const selectionValid = isRangeSelectable(selectedStartDate.value, iso)
  if (!selectionValid) {
    $toast.error(locale.value === 'en'
      ? 'This range contains unavailable days.'
      : 'Cette période contient des jours indisponibles.')
    return
  }

  selectedEndDate.value = iso
}

function isRangeSelectable(startIso: string, endIso: string) {
  const days = Array.isArray((data.value as any)?.days) ? (data.value as any).days : []
  return days
    .filter((day: any) => day.iso >= startIso && day.iso <= endIso)
    .every((day: any) => day.selectable)
}

function confirmSelection() {
  if (!canConfirm.value) return
  if (!isRangeSelectable(selectedStartDate.value, selectedEndDate.value)) {
    $toast.error(locale.value === 'en'
      ? 'This range contains unavailable days.'
      : 'Cette période contient des jours indisponibles.')
    return
  }
  emit('confirm', {
    rentalStartDate: selectedStartDate.value,
    rentalEndDate: selectedEndDate.value,
  })
  close()
}

function close() {
  if (dialogRef.value?.open) {
    dialogRef.value.close()
  }
}
</script>
