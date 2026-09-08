<template>
  <dialog ref="dialogRef" class="modal" @close="emit('close')">
    <div class="modal-box relative max-w-6xl p-3 sm:p-6" :aria-busy="pending">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 class="text-xl font-bold">{{ titleLabel }}</h3>
          <p class="mt-1 text-sm opacity-70">{{ helpLabel }}</p>
        </div>
        <button type="button" class="btn btn-sm btn-circle" @click="close">x</button>
      </div>

      <div v-if="pending && !data" class="py-10 text-center">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <div v-else-if="errorMessage" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <template v-else-if="data">
        <span v-if="pending" class="loading loading-spinner loading-sm absolute right-14 top-5 sm:right-16 sm:top-7" />
        <div v-if="data.source.rentalBookingMode === 'BOTH'" class="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-base-200 p-2">
          <button type="button" class="btn" :class="selectedMode === 'SINGLE_DAY' ? 'btn-primary' : 'btn-ghost'" @click="selectMode('SINGLE_DAY')">
            {{ hourlyModeLabel }} · {{ formatPrice(data.source.rentalHourlyPrice) }}/{{ hourUnitLabel }}
          </button>
          <button type="button" class="btn" :class="selectedMode === 'MULTI_DAY' ? 'btn-primary' : 'btn-ghost'" @click="selectMode('MULTI_DAY')">
            {{ dailyModeLabel }} · {{ formatPrice(data.source.rentalDailyPrice) }}/{{ dayUnitLabel }}
          </button>
        </div>
        <div class="mb-4 flex flex-wrap gap-2">
          <span class="badge badge-outline">{{ data.source.saleType === 'RENTAL' ? rentalLabel : saleLabel }}</span>
          <span class="badge badge-soft">{{ stockLabel }}: {{ data.source.stock }}</span>
          <span v-if="effectiveMode === 'MULTI_DAY'" class="badge badge-soft">{{ minDurationLabel }}: {{ data.source.rentalMinDays }}j</span>
          <span v-if="effectiveMode === 'MULTI_DAY' && data.source.rentalMaxDays" class="badge badge-soft">{{ maxDurationLabel }}: {{ data.source.rentalMaxDays }}j</span>
        </div>

        <OrdersCalendar
          :days="data.days"
          :month-label="data.monthLabel"
          :month-input="monthInput"
          :show-month-picker="showMonthPicker"
          :day-names="data.dayNames"
          :today-label="todayLabel"
          :month-picker-label="monthPickerLabel"
          :previous-month-label="previousMonthLabel"
          :next-month-label="nextMonthLabel"
          :day-class="dayClass"
          :day-selectable="daySelectable"
          :day-aria-label="calendarDayLabel"
          :item-class="itemClass"
          :item-indicator-class="itemIndicatorClass"
          :mobile-details="false"
          :item-title="itemTitle"
          :item-subtitle="itemSubtitle"
          :item-meta="itemMeta"
          @change-month="changeMonth"
          @toggle-month-picker="showMonthPicker = !showMonthPicker"
          @update:month-input="monthInput = $event"
          @apply-month-input="applyMonthInput"
          @go-current-month="goCurrentMonth"
          @select-day="selectDay"
          @select-item="selectCalendarItem"
        />

        <div class="mt-4 border border-primary/25 bg-primary/5 p-4 text-sm modula-card" aria-live="polite">
          <div class="flex items-start gap-3">
            <Icon name="mdi:calendar-check-outline" size="20" class="mt-0.5 shrink-0 text-primary" />
            <div>
              <div class="font-medium">{{ selectedSummaryLabel }}</div>
              <div class="mt-1 opacity-80">{{ selectedCalendarMessage }}</div>
            </div>
          </div>
        </div>

        <div v-if="effectiveMode === 'SINGLE_DAY'" ref="selectionPanelRef" class="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
          <div class="space-y-3">
            <label class="form-control gap-2">
              <span class="label-text font-medium">{{ rentalDateLabel }}</span>
              <input v-model="selectedStartDate" type="date" class="input input-bordered w-full" />
            </label>
            <div>
              <div class="mb-2 text-sm font-medium">{{ durationLabel }}</div>
              <div class="flex flex-wrap gap-2">
                <button v-for="duration in data.source.rentalDurations" :key="duration" type="button" class="btn btn-sm" :class="selectedDuration === duration ? 'btn-primary' : 'btn-outline'" @click="selectedDuration = duration">
                  {{ formatDuration(duration) }}
                </button>
              </div>
            </div>
          </div>
          <div>
            <div class="mb-2 text-sm font-medium">{{ timeSlotLabel }}</div>
            <div v-if="!selectedStartDate" class="rounded-xl border border-dashed border-base-300 p-5 text-sm opacity-60">{{ selectDateFirstLabel }}</div>
            <div v-else-if="!data.slots.length" class="alert">{{ noSlotLabel }}</div>
            <div v-else class="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button v-for="slot in data.slots" :key="slot.start" type="button" class="btn btn-sm" :class="selectedSlot?.start === slot.start ? 'btn-primary' : 'btn-outline'" @click="selectedSlot = slot">
                {{ formatSlot(slot) }}
              </button>
            </div>
          </div>
        </div>

        <div v-else ref="selectionPanelRef" class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ rentalStartLabel }}</span></label>
            <input v-model="selectedStartDate" type="date" class="input input-bordered" />
            <select v-model="selectedStartTime" class="select select-bordered" :disabled="!startTimeOptions.length">
              <option value="">{{ selectTimeLabel }}</option>
              <option v-for="time in startTimeOptions" :key="time" :value="time">{{ time }}</option>
            </select>
          </div>
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ rentalEndLabel }}</span></label>
            <input
              v-model="selectedEndDate"
              type="date"
              class="input input-bordered"
              :min="minimumEndDate || undefined"
              :max="maximumEndDate || undefined"
            />
            <select v-model="selectedEndTime" class="select select-bordered" :disabled="!endTimeOptions.length">
              <option value="">{{ selectTimeLabel }}</option>
              <option v-for="time in endTimeOptions" :key="time" :value="time">{{ time }}</option>
            </select>
          </div>
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

interface RentalAvailabilityResponse {
  month: string
  monthLabel: string
  monthInput: string
  dayNames: string[]
  source: {
    saleType: 'SALE' | 'RENTAL'
    stock: number
    rentalMinDays: number
    rentalMaxDays: number | null
    rentalBookingMode: 'SINGLE_DAY' | 'MULTI_DAY' | 'BOTH'
    rentalHourlyPrice: number | null
    rentalDailyPrice: number | null
    rentalDurations: number[]
    rentalSlotStepMinutes: number
  }
  days: Array<any & { openingRanges: Array<{ start: string, end: string }> }>
  slots: Array<{ start: string, end: string, remaining: number }>
}

const props = defineProps<{
  open: boolean
  sourceKind: 'product'
  sourceId: number | null
  sourceName: string
  initialStartDate?: string | null
  initialEndDate?: string | null
  initialPricingMode?: 'HOURLY' | 'DAILY' | null
}>()

const emit = defineEmits<{
  close: []
  confirm: [{ rentalStartDate: string, rentalEndDate: string, pricingMode: 'HOURLY' | 'DAILY', availableQuantity: number }]
}>()

const { contentLocale } = useContentLocale()
const { publicText } = usePublicDictionary()
const locale = computed(() => contentLocale.value)
const { $toast } = useNuxtApp() as any
const dialogRef = ref<HTMLDialogElement | null>(null)
const selectionPanelRef = ref<HTMLElement | null>(null)
const currentMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const monthInput = ref(formatMonth(currentMonth.value))
const showMonthPicker = ref(false)
const selectedStartDate = ref('')
const selectedEndDate = ref('')
const selectedStartTime = ref('')
const selectedEndTime = ref('')
const selectedDuration = ref(60)
const selectedSlot = ref<{ start: string, end: string, remaining: number } | null>(null)
const selectedMode = ref<'SINGLE_DAY' | 'MULTI_DAY'>('SINGLE_DAY')
const errorMessage = ref('')

const query = computed(() => ({
  kind: props.sourceKind,
  id: props.sourceId || undefined,
  month: formatMonth(currentMonth.value),
  locale: locale.value,
  date: selectedStartDate.value || undefined,
  duration: selectedDuration.value,
  mode: selectedMode.value,
}))

const { data, pending, refresh } = await useFetch<RentalAvailabilityResponse>('/api/shop/rental-availability', {
  query,
  immediate: false,
})

watch(() => props.open, async (open) => {
  if (open) {
    if (!dialogRef.value?.open) {
      dialogRef.value?.showModal()
    }
    errorMessage.value = ''
    selectedStartDate.value = datePart(props.initialStartDate)
    selectedEndDate.value = datePart(props.initialEndDate)
    selectedStartTime.value = timePart(props.initialStartDate)
    selectedEndTime.value = timePart(props.initialEndDate)
    selectedDuration.value = initialDurationMinutes(props.initialStartDate, props.initialEndDate) || selectedDuration.value
    selectedSlot.value = null
    selectedMode.value = props.initialPricingMode === 'DAILY'
      ? 'MULTI_DAY'
      : props.initialPricingMode === 'HOURLY'
        ? 'SINGLE_DAY'
        : data.value?.source.rentalBookingMode === 'MULTI_DAY' ? 'MULTI_DAY' : 'SINGLE_DAY'
    const initialMonth = selectedStartDate.value ? new Date(`${selectedStartDate.value}T12:00:00`) : new Date()
    currentMonth.value = new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1)
    monthInput.value = formatMonth(currentMonth.value)
    await refresh()
    selectedStartTime.value = timePart(props.initialStartDate)
    selectedEndTime.value = timePart(props.initialEndDate)
    if (selectedMode.value === 'SINGLE_DAY' && props.initialStartDate && props.initialEndDate) {
      selectedSlot.value = data.value?.slots.find(slot => slot.start === props.initialStartDate && slot.end === props.initialEndDate) || null
    }
    return
  }
  if (dialogRef.value?.open) {
    dialogRef.value.close()
  }
}, { immediate: true })

watch(() => props.sourceId, () => {
  if (props.open) {
    selectedStartDate.value = ''
    selectedEndDate.value = ''
  }
})

watch(() => data.value?.source.rentalDurations, (durations) => {
  if (durations?.length && !durations.includes(selectedDuration.value)) selectedDuration.value = durations[0]!
}, { immediate: true })

watch(() => data.value?.source.rentalBookingMode, (mode) => {
  if (mode === 'SINGLE_DAY' || mode === 'MULTI_DAY') selectedMode.value = mode
}, { immediate: true })

watch([selectedStartDate, selectedDuration], () => {
  selectedSlot.value = null
})

const effectiveMode = computed<'SINGLE_DAY' | 'MULTI_DAY'>(() =>
  data.value?.source.rentalBookingMode === 'BOTH' ? selectedMode.value : data.value?.source.rentalBookingMode || 'MULTI_DAY')

const titleLabel = computed(() => publicText('shop.rentalModal.title', 'Choisir la période de location - {name}', { name: props.sourceName }))
const helpLabel = computed(() => publicText('shop.rentalModal.help', 'Choisissez une date de début et de fin depuis le calendrier de disponibilité avant d’ajouter cette location au panier.'))
const rentalLabel = computed(() => publicText('shop.rentalModal.rental', 'Location'))
const saleLabel = computed(() => publicText('shop.rentalModal.sale', 'Vente'))
const stockLabel = computed(() => publicText('shop.rentalModal.stock', 'Stock'))
const minDurationLabel = computed(() => publicText('shop.rentalModal.minimum', 'Minimum'))
const maxDurationLabel = computed(() => publicText('shop.rentalModal.maximum', 'Maximum'))
const todayLabel = computed(() => publicText('shop.rentalModal.today', 'Aujourd’hui'))
const monthPickerLabel = computed(() => publicText('shop.rentalModal.month', 'Mois'))
const previousMonthLabel = computed(() => publicText('shop.rentalModal.previousMonth', 'Mois précédent'))
const nextMonthLabel = computed(() => publicText('shop.rentalModal.nextMonth', 'Mois suivant'))
const rentalStartLabel = computed(() => publicText('shop.rentalModal.startDate', 'Début de location'))
const rentalEndLabel = computed(() => publicText('shop.rentalModal.endDate', 'Fin de location'))
const selectedSummaryLabel = computed(() => publicText('shop.rentalModal.selectedPeriod', 'Période sélectionnée'))
const closeLabel = computed(() => publicText('shop.rentalModal.close', 'Fermer'))
const confirmLabel = computed(() => publicText('shop.rentalModal.confirm', 'Ajouter au panier'))
const rentalDateLabel = computed(() => publicText('shop.rentalModal.date', 'Date de location'))
const durationLabel = computed(() => publicText('shop.rentalModal.duration', 'Durée'))
const timeSlotLabel = computed(() => publicText('shop.rentalModal.timeSlot', 'Créneau de départ'))
const selectDateFirstLabel = computed(() => publicText('shop.rentalModal.selectDateFirst', 'Sélectionnez d’abord une date disponible.'))
const noSlotLabel = computed(() => publicText('shop.rentalModal.noSlot', 'Aucun créneau disponible pour cette durée.'))
const selectTimeLabel = computed(() => publicText('shop.rentalModal.selectTime', 'Choisir une heure'))
const hourlyModeLabel = computed(() => publicText('shop.rentalModal.hourlyMode', 'À l’heure'))
const dailyModeLabel = computed(() => publicText('shop.rentalModal.dailyMode', 'À la journée'))
const hourUnitLabel = computed(() => publicText('shop.rentalModal.hourUnit', 'heure'))
const dayUnitLabel = computed(() => publicText('shop.rentalModal.dayUnit', 'jour'))
const startTimeOptions = computed<string[]>(() => getTimesForDate(selectedStartDate.value, 'start'))
const endTimeOptions = computed<string[]>(() => {
  const values = getTimesForDate(selectedEndDate.value, 'end')
  if (selectedStartDate.value !== selectedEndDate.value || !selectedStartTime.value) return values
  return values.filter(time => time > selectedStartTime.value)
})
const minimumEndDate = computed(() => {
  if (!selectedStartDate.value || effectiveMode.value !== 'MULTI_DAY') return ''
  return addIsoDays(selectedStartDate.value, Math.max(1, Number(data.value?.source.rentalMinDays || 1)) - 1)
})
const maximumEndDate = computed(() => {
  const maximumDays = Number(data.value?.source.rentalMaxDays || 0)
  if (!selectedStartDate.value || effectiveMode.value !== 'MULTI_DAY' || maximumDays <= 0) return ''
  return addIsoDays(selectedStartDate.value, maximumDays - 1)
})

watch(selectedStartDate, () => {
  if (!startTimeOptions.value.includes(selectedStartTime.value)) selectedStartTime.value = ''
  if (selectedEndDate.value && (
    (minimumEndDate.value && selectedEndDate.value < minimumEndDate.value)
    || (maximumEndDate.value && selectedEndDate.value > maximumEndDate.value)
  )) {
    selectedEndDate.value = ''
    selectedEndTime.value = ''
  }
})
watch(selectedEndDate, () => {
  if (!endTimeOptions.value.includes(selectedEndTime.value)) selectedEndTime.value = ''
})
watch(selectedStartTime, () => {
  if (!endTimeOptions.value.includes(selectedEndTime.value)) selectedEndTime.value = ''
})

const selectedCalendarMessage = computed(() => {
  if (!selectedStartDate.value) {
    return effectiveMode.value === 'SINGLE_DAY'
      ? publicText('shop.rentalModal.selectSingleDate', 'Sélectionnez une date disponible dans le calendrier.')
      : publicText('shop.rentalModal.selectDateRange', 'Sélectionnez une date de départ puis une date de retour dans le calendrier.')
  }
  if (effectiveMode.value === 'SINGLE_DAY') {
    return publicText(
      'shop.rentalModal.singleDateSelected',
      'Date sélectionnée : {date}. Choisissez maintenant votre créneau horaire.',
      { date: formatCalendarDate(selectedStartDate.value) },
    )
  }
  if (!selectedEndDate.value) {
    return publicText(
      'shop.rentalModal.rangeStartSelected',
      'Date de départ sélectionnée : {date}. Choisissez maintenant la date de retour.',
      { date: formatCalendarDate(selectedStartDate.value) },
    )
  }
  return publicText(
    'shop.rentalModal.dateRangeSelected',
    'Plage sélectionnée : du {start} au {end}. Choisissez les heures de retrait et de retour.',
    {
      start: formatCalendarDate(selectedStartDate.value),
      end: formatCalendarDate(selectedEndDate.value),
    },
  )
})

const canConfirm = computed(() => effectiveMode.value === 'SINGLE_DAY'
  ? Boolean(selectedSlot.value)
  : Boolean(
      selectedStartDate.value
      && selectedEndDate.value
      && selectedStartTime.value
      && selectedEndTime.value
      && isRentalDayDurationValid(selectedStartDate.value, selectedEndDate.value)
      && new Date(`${selectedEndDate.value}T${selectedEndTime.value}:00`).getTime()
        > new Date(`${selectedStartDate.value}T${selectedStartTime.value}:00`).getTime(),
    ))

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

function itemIndicatorClass(item: any) {
  if (item.status === 'full') return 'bg-error'
  if (item.status === 'partial') return 'bg-warning'
  if (item.status === 'outside') return 'bg-base-content/30'
  return 'bg-success'
}

function daySelectable(day: any) {
  if (!day?.selectable) return false
  if (effectiveMode.value !== 'MULTI_DAY' || !selectedStartDate.value || selectedEndDate.value) return true
  const iso = String(day.iso)
  if (iso < selectedStartDate.value) return true
  return (!minimumEndDate.value || iso >= minimumEndDate.value)
    && (!maximumEndDate.value || iso <= maximumEndDate.value)
}

function calendarDayLabel(day: any) {
  return new Intl.DateTimeFormat(locale.value, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(`${day.iso}T12:00:00`))
}

function itemTitle(item: any) {
  if (item.status === 'full') return publicText('shop.rentalModal.full', 'Complet')
  if (item.status === 'outside') return publicText('shop.rentalModal.unavailable', 'Indisponible')
  return publicText('shop.rentalModal.remaining', '{count} disponible(s)', { count: item.remaining })
}

function itemSubtitle(item: any) {
  return ''
}

function itemMeta(item: any) {
  return item.status === 'partial' ? publicText('shop.rentalModal.partial', 'Disponibilité partielle') : ''
}

function dayClass(day: any) {
  if (isSelectedDay(day.iso)) return 'bg-primary/20 ring-4 ring-inset ring-primary'
  if (isInSelectedRange(day.iso)) return 'bg-primary/10 ring-1 ring-inset ring-primary/30'
  if (day.availabilityStatus === 'outside') return 'opacity-50'
  if (day.availabilityStatus === 'full') return 'bg-error/5'
  if (day.availabilityStatus === 'partial') return 'bg-warning/5'
  if (!daySelectable(day)) return 'opacity-35'
  return ''
}

function isSelectedDay(iso: string) {
  return selectedStartDate.value === iso || selectedEndDate.value === iso
}

function isInSelectedRange(iso: string) {
  if (!selectedStartDate.value || !selectedEndDate.value) return false
  return iso > selectedStartDate.value && iso < selectedEndDate.value
}

async function selectDay(day: any) {
  if (!day?.selectable) return
  const iso = String(day.iso)
  if (!selectedStartDate.value || (selectedStartDate.value && selectedEndDate.value)) {
    selectedStartDate.value = iso
    selectedEndDate.value = ''
    if (effectiveMode.value === 'SINGLE_DAY') selectedEndDate.value = iso
    await scrollToSelectionPanel()
    return
  }

  if (iso < selectedStartDate.value) {
    selectedStartDate.value = iso
    await scrollToSelectionPanel()
    return
  }

  const selectionValid = isRangeSelectable(selectedStartDate.value, iso)
  if (!selectionValid) {
    $toast.error(locale.value === 'en'
      ? publicText('shop.rentalModal.unavailableRange', 'Cette période contient des jours indisponibles.')
      : publicText('shop.rentalModal.unavailableRange', 'Cette période contient des jours indisponibles.'))
    return
  }

  selectedEndDate.value = iso
  await scrollToSelectionPanel()
}

function selectCalendarItem(item: any) {
  const day = data.value?.days.find(entry => entry.iso === String(item?.id || ''))
  if (day) void selectDay(day)
}

function isRangeSelectable(startIso: string, endIso: string) {
  if (!isRentalDayDurationValid(startIso, endIso)) return false
  const days = Array.isArray((data.value as any)?.days) ? (data.value as any).days : []
  if (effectiveMode.value === 'MULTI_DAY') {
    return [startIso, endIso].every(iso => days.some((day: any) => day.iso === iso && day.selectable))
  }
  return days
    .filter((day: any) => day.iso >= startIso && day.iso <= endIso)
    .every((day: any) => day.selectable)
}

function confirmSelection() {
  if (!canConfirm.value) return
  if (effectiveMode.value === 'SINGLE_DAY' && selectedSlot.value) {
    emit('confirm', {
      rentalStartDate: selectedSlot.value.start,
      rentalEndDate: selectedSlot.value.end,
      pricingMode: 'HOURLY',
      availableQuantity: Math.max(0, Number(selectedSlot.value.remaining || 0)),
    })
    close()
    return
  }
  if (!isRangeSelectable(selectedStartDate.value, selectedEndDate.value)) {
    $toast.error(locale.value === 'en'
      ? publicText('shop.rentalModal.unavailableRange', 'Cette période contient des jours indisponibles.')
      : publicText('shop.rentalModal.unavailableRange', 'Cette période contient des jours indisponibles.'))
    return
  }
  emit('confirm', {
    rentalStartDate: `${selectedStartDate.value}T${selectedStartTime.value}:00`,
    rentalEndDate: `${selectedEndDate.value}T${selectedEndTime.value}:00`,
    pricingMode: 'DAILY',
    availableQuantity: selectedRangeAvailableQuantity(),
  })
  close()
}

function isRentalDayDurationValid(startIso: string, endIso: string) {
  if (effectiveMode.value !== 'MULTI_DAY' || !startIso || !endIso || endIso < startIso) return false
  const durationDays = differenceInCalendarDays(startIso, endIso) + 1
  const minimumDays = Math.max(1, Number(data.value?.source.rentalMinDays || 1))
  const maximumDays = Number(data.value?.source.rentalMaxDays || 0)
  return durationDays >= minimumDays && (maximumDays <= 0 || durationDays <= maximumDays)
}

function differenceInCalendarDays(startIso: string, endIso: string) {
  return Math.round((Date.parse(`${endIso}T00:00:00Z`) - Date.parse(`${startIso}T00:00:00Z`)) / 86400000)
}

function addIsoDays(iso: string, days: number) {
  const value = new Date(`${iso}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

function selectedRangeAvailableQuantity() {
  const days = Array.isArray(data.value?.days) ? data.value.days : []
  const remaining = days
    .filter(day => day.iso >= selectedStartDate.value && day.iso <= selectedEndDate.value)
    .map(day => Math.max(0, Number(day.remaining || 0)))
  return remaining.length ? Math.min(...remaining) : 0
}

function selectMode(mode: 'SINGLE_DAY' | 'MULTI_DAY') {
  selectedMode.value = mode
  selectedStartDate.value = ''
  selectedEndDate.value = ''
  selectedStartTime.value = ''
  selectedEndTime.value = ''
  selectedSlot.value = null
}

function formatPrice(value: number | null) {
  return new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'EUR' }).format(Number(value || 0))
}

function getTimesForDate(iso: string, edge: 'start' | 'end') {
  const day = data.value?.days.find((entry: any) => entry.iso === iso)
  if (!day) return []
  const step = Math.max(1, Number(data.value?.source.rentalSlotStepMinutes || 30))
  const values = new Set<string>()
  for (const range of day.openingRanges) {
    const start = timeToMinutes(range.start)
    const end = timeToMinutes(range.end)
    const first = edge === 'start' ? start : start + step
    const last = edge === 'start' ? end - 1 : end
    for (let cursor = first; cursor <= last; cursor += step) values.add(minutesToTime(cursor))
    if (edge === 'end') values.add(minutesToTime(end))
  }
  return Array.from(values).sort()
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return Number(hours || 0) * 60 + Number(minutes || 0)
}

function minutesToTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}

function datePart(value?: string | null) {
  return /^\d{4}-\d{2}-\d{2}/.exec(String(value || ''))?.[0] || ''
}

function timePart(value?: string | null) {
  return /T(\d{2}:\d{2})/.exec(String(value || ''))?.[1] || ''
}

function initialDurationMinutes(start?: string | null, end?: string | null) {
  const duration = new Date(String(end || '')).getTime() - new Date(String(start || '')).getTime()
  return Number.isFinite(duration) && duration > 0 ? Math.round(duration / 60000) : 0
}

function formatCalendarDate(value: string) {
  return new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'long', year: 'numeric' })
    .format(new Date(`${value}T12:00:00`))
}

async function scrollToSelectionPanel() {
  await nextTick()
  selectionPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours} h ${rest}` : `${hours} h`
}

function formatSlot(slot: { start: string, end: string }) {
  const format = (value: string) => new Intl.DateTimeFormat(locale.value, { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
  return `${format(slot.start)} - ${format(slot.end)}`
}

function close() {
  if (dialogRef.value?.open) {
    dialogRef.value.close()
  }
}
</script>
