<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body p-2 sm:p-4">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4 sm:gap-3">
        <div class="flex min-w-0 items-center gap-1 sm:gap-2">
          <button type="button" class="btn btn-sm btn-ghost" :aria-label="previousMonthLabel" @click="emit('change-month', -1)">
            <Icon name="mdi:chevron-left" size="18" />
          </button>

          <div class="relative min-w-0">
            <button type="button" class="btn btn-sm btn-ghost max-w-48 truncate text-sm font-semibold normal-case sm:text-base" @click="emit('toggle-month-picker')">
              <span class="truncate">{{ monthLabel }}</span>
              <Icon name="mdi:chevron-down" size="16" class="shrink-0" />
            </button>

            <div v-if="showMonthPicker" class="absolute left-0 top-full z-30 mt-2 rounded-xl border border-base-300 bg-base-100 p-3 shadow-xl">
              <label class="mb-2 block text-xs font-semibold uppercase opacity-60">{{ monthPickerLabel }}</label>
              <input
                :value="monthInput"
                type="month"
                class="input input-bordered input-sm"
                @input="emit('update:month-input', ($event.target as HTMLInputElement).value)"
                @change="emit('apply-month-input')"
              />
            </div>
          </div>

          <button type="button" class="btn btn-sm btn-ghost" :aria-label="nextMonthLabel" @click="emit('change-month', 1)">
            <Icon name="mdi:chevron-right" size="18" />
          </button>
        </div>

        <button type="button" class="btn btn-sm btn-outline" @click="emit('go-current-month')">{{ todayLabel }}</button>
      </div>

      <div class="mb-1 grid grid-cols-7 gap-0.5 text-center text-[0.65rem] font-semibold uppercase opacity-60 sm:mb-2 sm:gap-2 sm:text-xs">
        <div v-for="dayName in dayNames" :key="dayName" class="min-w-0 truncate">
          <span class="sm:hidden">{{ shortDayName(dayName) }}</span>
          <span class="hidden sm:inline">{{ dayName }}</span>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-0.5 sm:gap-2">
        <div
          v-for="day in days"
          :key="day.iso"
          class="relative min-h-12 min-w-0 rounded-lg p-1 transition-colors sm:min-h-36 sm:rounded-xl sm:p-2"
          :class="[
            day.inCurrentMonth ? 'bg-base-100/70' : 'bg-transparent opacity-45',
            day.isToday ? 'ring-2 ring-inset ring-primary/50' : '',
            selectedMobileDay?.iso === day.iso ? 'bg-primary/10 ring-2 ring-inset ring-primary/70' : '',
            dayClass(day)
          ]"
        >
          <button
            v-if="desktopDaySelection"
            type="button"
            class="absolute inset-0 z-0 hidden cursor-pointer rounded-xl hover:bg-base-content/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed sm:block"
            :disabled="!isDaySelectable(day)"
            :aria-label="dayAriaLabel(day)"
            @click="emit('select-day', day)"
          />

          <button
            type="button"
            class="absolute inset-0 z-0 cursor-pointer rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed sm:hidden"
            :disabled="!isMobileDayInteractive(day)"
            :aria-label="dayAriaLabel(day)"
            :aria-expanded="mobileDetails && selectedMobileDay?.iso === day.iso ? true : undefined"
            @click="handleMobileDayClick(day)"
          />

          <div class="pointer-events-none relative z-[1] flex items-center justify-between">
            <span class="text-xs font-semibold sm:text-sm">{{ day.dayNumber }}</span>
            <span v-if="day.total" class="badge badge-sm hidden sm:inline-flex">{{ day.page }}/{{ day.totalPages }}</span>
          </div>

          <div class="pointer-events-none relative z-[1] mt-1 flex min-h-2 flex-wrap items-center justify-center gap-1 sm:hidden" aria-hidden="true">
            <span v-for="indicator in mobileIndicators(day)" :key="indicator.key" class="size-1.5 rounded-full" :class="indicator.className" />
          </div>

          <div class="relative z-10 mt-2 hidden space-y-1 sm:block">
            <button
              v-for="item in day.items"
              :key="item.id"
              type="button"
              class="block w-full rounded-lg px-2 py-1 text-left text-xs"
              :class="itemClass(item)"
              @click="emit('select-item', item)"
            >
              <slot name="item" :item="item">
                <span class="block truncate font-medium">{{ itemTitle(item) }}</span>
                <span v-if="itemSubtitle(item)" class="block truncate opacity-90">{{ itemSubtitle(item) }}</span>
                <span v-if="itemMeta(item)" class="block truncate opacity-75">{{ itemMeta(item) }}</span>
              </slot>
            </button>

            <div v-if="day.totalPages > 1" class="join mt-1 flex w-full">
              <button type="button" class="btn join-item btn-xs flex-1" :disabled="day.page === 1" @click="emit('change-day-page', day, day.page - 1)">
                <Icon name="mdi:chevron-left" size="14" />
              </button>
              <button type="button" class="btn join-item btn-xs flex-1" :disabled="day.page === day.totalPages" @click="emit('change-day-page', day, day.page + 1)">
                <Icon name="mdi:chevron-right" size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <section v-if="mobileDetails && selectedMobileDay" class="mt-3 rounded-xl bg-base-100 p-3 sm:hidden">
        <div class="mb-2 flex items-center justify-between gap-3">
          <time :datetime="selectedMobileDay.iso" class="text-sm font-semibold">{{ mobileDayLabel(selectedMobileDay) }}</time>
          <button
            v-if="mobileDayActionLabel && isDaySelectable(selectedMobileDay)"
            type="button"
            class="btn btn-primary btn-xs"
            @click="emit('select-day', selectedMobileDay)"
          >
            {{ mobileDayActionLabel }}
          </button>
        </div>

        <div class="space-y-2">
          <button
            v-for="item in selectedMobileDay.items"
            :key="item.id"
            type="button"
            class="block min-h-10 w-full rounded-lg px-3 py-2 text-left text-sm"
            :class="itemClass(item)"
            @click="emit('select-item', item)"
          >
            <slot name="item" :item="item">
              <span class="block font-medium">{{ itemTitle(item) }}</span>
              <span v-if="itemSubtitle(item)" class="block text-xs opacity-90">{{ itemSubtitle(item) }}</span>
              <span v-if="itemMeta(item)" class="block text-xs opacity-75">{{ itemMeta(item) }}</span>
            </slot>
          </button>
        </div>

        <div v-if="selectedMobileDay.totalPages > 1" class="join mt-3 flex w-full">
          <button type="button" class="btn join-item btn-sm flex-1" :disabled="selectedMobileDay.page === 1" @click="emit('change-day-page', selectedMobileDay, selectedMobileDay.page - 1)">
            <Icon name="mdi:chevron-left" size="16" />
          </button>
          <span class="btn join-item btn-sm no-animation flex-1">{{ selectedMobileDay.page }} / {{ selectedMobileDay.totalPages }}</span>
          <button type="button" class="btn join-item btn-sm flex-1" :disabled="selectedMobileDay.page === selectedMobileDay.totalPages" @click="emit('change-day-page', selectedMobileDay, selectedMobileDay.page + 1)">
            <Icon name="mdi:chevron-right" size="16" />
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
interface CalendarDay {
  iso: string
  dayNumber: number
  inCurrentMonth: boolean
  isToday?: boolean
  page: number
  total: number
  totalPages: number
  items: any[]
  [key: string]: any
}

const props = withDefaults(defineProps<{
  days: CalendarDay[]
  monthLabel: string
  monthInput: string
  showMonthPicker: boolean
  dayNames: string[]
  todayLabel?: string
  monthPickerLabel?: string
  previousMonthLabel?: string
  nextMonthLabel?: string
  mobileDetails?: boolean
  mobileDayActionLabel?: string
  desktopDaySelection?: boolean
  itemClass?: (item: any) => string
  itemIndicatorClass?: (item: any) => string
  dayClass?: (day: CalendarDay) => string
  daySelectable?: (day: CalendarDay) => boolean
  dayAriaLabel?: (day: CalendarDay) => string
  mobileDayLabel?: (day: CalendarDay) => string
  itemTitle?: (item: any) => string
  itemSubtitle?: (item: any) => string
  itemMeta?: (item: any) => string
}>(), {
  todayLabel: '',
  monthPickerLabel: '',
  previousMonthLabel: '',
  nextMonthLabel: '',
  mobileDetails: true,
  mobileDayActionLabel: '',
  desktopDaySelection: true,
  itemClass: () => 'bg-primary text-primary-content',
  itemIndicatorClass: () => 'bg-primary',
  dayClass: () => '',
  daySelectable: () => true,
  dayAriaLabel: (day: CalendarDay) => day.iso,
  mobileDayLabel: (day: CalendarDay) => day.iso,
  itemTitle: (item: any) => String(item?.title ?? ''),
  itemSubtitle: (item: any) => String(item?.subtitle ?? ''),
  itemMeta: (item: any) => String(item?.meta ?? '')
})

const emit = defineEmits<{
  'change-month': [offset: number]
  'toggle-month-picker': []
  'apply-month-input': []
  'go-current-month': []
  'select-day': [day: CalendarDay]
  'select-item': [item: any]
  'change-day-page': [day: CalendarDay, page: number]
  'update:month-input': [value: string]
}>()

const { t } = useI18n()
const selectedMobileDayIso = ref('')
const todayLabel = computed(() => props.todayLabel || t('admin.ordersPage.today'))
const monthPickerLabel = computed(() => props.monthPickerLabel || t('admin.ordersPage.monthPicker'))
const previousMonthLabel = computed(() => props.previousMonthLabel || `${monthPickerLabel.value}: précédent`)
const nextMonthLabel = computed(() => props.nextMonthLabel || `${monthPickerLabel.value}: suivant`)
const selectedMobileDay = computed(() => props.days.find(day => day.iso === selectedMobileDayIso.value) || null)

watch(() => props.monthInput, () => {
  selectedMobileDayIso.value = ''
})

function handleMobileDayClick(day: CalendarDay) {
  if (!props.mobileDetails) {
    emit('select-day', day)
    return
  }
  selectedMobileDayIso.value = selectedMobileDayIso.value === day.iso ? '' : day.iso
}

function isDaySelectable(day: CalendarDay) {
  return props.daySelectable(day)
}

function isMobileDayInteractive(day: CalendarDay) {
  if (!props.mobileDetails) return isDaySelectable(day)
  return day.items.length > 0 || Boolean(props.mobileDayActionLabel && isDaySelectable(day))
}

function mobileIndicators(day: CalendarDay) {
  const count = Math.min(4, Math.max(day.total || 0, day.items.length))
  return Array.from({ length: count }, (_, index) => ({
    key: `${day.iso}-${index}`,
    className: day.items[index] ? props.itemIndicatorClass(day.items[index]) : 'bg-base-content/35'
  }))
}

function shortDayName(value: string) {
  return Array.from(value.trim())[0] || ''
}

const itemClass = (item: any) => props.itemClass(item)
const dayClass = (day: CalendarDay) => props.dayClass(day)
const dayAriaLabel = (day: CalendarDay) => props.dayAriaLabel(day)
const mobileDayLabel = (day: CalendarDay) => props.mobileDayLabel(day)
const itemTitle = (item: any) => props.itemTitle(item)
const itemSubtitle = (item: any) => props.itemSubtitle(item)
const itemMeta = (item: any) => props.itemMeta(item)
</script>
