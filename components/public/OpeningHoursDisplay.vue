<template>
  <div class="space-y-3">
    <div class="font-medium">{{ currentMonthTitle }}</div>
    <div class="space-y-1.5">
      <div v-for="line in currentMonthLines" :key="line">{{ line }}</div>
    </div>
    <button type="button" class="link link-hover text-sm font-medium" @click.stop="openYearSchedule">
      {{ publicText('openingHours.viewYear', 'Voir les horaires de toute l’année') }}
    </button>

    <dialog ref="dialogRef" class="modal" @click.stop>
      <div class="modal-box max-h-[90vh] max-w-4xl bg-base-100 text-base-content">
        <div class="flex items-start justify-between gap-4">
          <h2 class="text-2xl font-semibold">{{ publicText('openingHours.yearTitle', 'Horaires de toute l’année') }}</h2>
          <button
            type="button"
            class="btn btn-circle btn-ghost btn-sm"
            :aria-label="publicText('openingHours.close', 'Fermer')"
            @click="dialogRef?.close()"
          >
            <Icon name="mdi:close" size="20" />
          </button>
        </div>
        <div class="mt-5 grid gap-3 md:grid-cols-2">
          <details
            v-for="month in months"
            :key="month.number"
            class="modula-card border border-base-300 bg-base-100 p-4 text-base-content"
            :open="month.number === currentMonth"
          >
            <summary class="cursor-pointer font-semibold">{{ month.label }}</summary>
            <div class="mt-3 space-y-1.5 text-sm opacity-80">
              <div v-for="line in month.lines" :key="line">{{ line }}</div>
            </div>
          </details>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>{{ publicText('openingHours.close', 'Fermer') }}</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import type { RentalCalendarConfig } from '#modula/shared/rentalCalendar'
import { formatMonthlyOpeningHours } from '#modula/shared/openingHours'

const props = defineProps<{
  calendar: RentalCalendarConfig
  locale: string
}>()

const { publicText } = usePublicDictionary()
const dialogRef = ref<HTMLDialogElement | null>(null)
const currentMonth = useState<number>('public-opening-hours-current-month', () => Number(new Intl.DateTimeFormat('en', {
  month: 'numeric',
  timeZone: props.calendar.timezone,
}).format(new Date())))
const formatLines = (month: number) => formatMonthlyOpeningHours(props.calendar, props.locale, month, publicText)
const monthLabel = (month: number) => {
  const value = new Intl.DateTimeFormat(props.locale, { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, month - 1, 1)))
  return value ? `${value.charAt(0).toLocaleUpperCase(props.locale)}${value.slice(1)}` : ''
}
const currentMonthLines = computed(() => formatLines(currentMonth.value))
const currentMonthTitle = computed(() => publicText('openingHours.currentMonth', 'Horaires de {month}', { month: monthLabel(currentMonth.value) }))
const months = computed(() => Array.from({ length: 12 }, (_, index) => ({
  number: index + 1,
  label: monthLabel(index + 1),
  lines: formatLines(index + 1),
})))

function openYearSchedule() {
  dialogRef.value?.showModal()
}
</script>
