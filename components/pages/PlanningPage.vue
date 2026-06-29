<template>
  <div class="mx-auto w-full py-10" :class="[containerClass, preview ? '' : 'px-4 sm:px-6 lg:px-8']">
    <header class="mb-8 text-center">
      <h1 class="text-4xl font-bold">{{ pageTitle }}</h1>
      <p v-if="pageSubtitle" class="mx-auto mt-3 max-w-3xl opacity-75">{{ pageSubtitle }}</p>
      <div v-if="!authStore.isAuthenticated" class="mt-5 flex flex-col items-center gap-3">
        <p class="max-w-2xl text-sm opacity-70">{{ guestInfoLabel }}</p>
        <NuxtLink :to="localePath('/contact')" class="btn btn-primary btn-sm">{{ becomeVolunteerLabel }}</NuxtLink>
      </div>
    </header>

    <div v-if="effectiveSettings.showViewToggle && effectiveSettings.enabledViews.length > 1" class="mb-6 flex justify-center">
      <div class="tabs tabs-box">
        <button
          v-for="mode in effectiveSettings.enabledViews"
          :key="mode"
          type="button"
          class="tab gap-2"
          :class="{ 'tab-active': viewMode === mode }"
          @click="viewMode = mode"
        >
          <Icon :name="mode === 'week' ? 'mdi:view-week-outline' : 'mdi:calendar-month-outline'" size="18" />
          <span>{{ modeLabel(mode) }}</span>
        </button>
      </div>
    </div>

    <div v-if="pending" class="py-12 text-center">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="isEmpty" class="rounded-3xl border border-dashed border-base-300 bg-base-200/40 px-6 py-12 text-center opacity-70">
      {{ publicText('planning.page.empty', 'Aucun élément de planning public pour le moment.') }}
    </div>

    <template v-else-if="viewMode === 'week'">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <button type="button" class="btn btn-sm btn-ghost" @click="changeWeek(-1)">
            <Icon name="mdi:chevron-left" size="18" />
          </button>
          <div class="text-sm font-semibold">{{ weekRangeLabel }}</div>
          <button type="button" class="btn btn-sm btn-ghost" @click="changeWeek(1)">
            <Icon name="mdi:chevron-right" size="18" />
          </button>
        </div>
        <button type="button" class="btn btn-sm btn-outline" @click="goCurrentWeek">{{ publicText('planning.page.currentWeek', 'Semaine en cours') }}</button>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <section
          v-for="column in weekColumns"
          :key="column.iso"
          class="min-w-0 rounded-[2rem] border border-base-300 p-4 shadow-sm"
          :style="cardStyle"
        >
          <header class="mb-4 border-b border-base-300/70 pb-3">
            <div class="text-xs font-semibold uppercase opacity-60">{{ column.shortLabel }}</div>
            <div class="mt-1 text-lg font-bold">{{ column.label }}</div>
          </header>

          <div v-if="column.items.length" class="space-y-3">
            <article
              v-for="item in column.items"
              :key="item.id"
              class="rounded-2xl border border-base-300 bg-base-100/80 p-3"
            >
              <div class="text-xs opacity-60">{{ formatTime(item.startsAt) }}</div>
              <h3 class="mt-1 text-sm font-semibold">{{ item.title }}</h3>
              <p v-if="effectiveSettings.showLocation && item.placeName" class="mt-1 text-xs opacity-75">{{ [item.placeName, item.placeCity].filter(Boolean).join(', ') }}</p>
              <p v-if="effectiveSettings.showExcerpt && item.excerpt" class="mt-2 text-xs opacity-80" :class="excerptClass">{{ item.excerpt }}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <NuxtLink :to="detailHref(item.slug, item.occurrenceId)" class="btn btn-primary btn-xs">{{ detailLabel }}</NuxtLink>
                <span v-if="authStore.isAuthenticated && item.internalParticipationEnabled" class="badge badge-outline">{{ internalParticipationLabel }}</span>
              </div>
            </article>

            <div v-if="column.totalPages > 1" class="join mt-2 w-full">
              <button type="button" class="btn join-item btn-xs flex-1" :disabled="column.page === 1" @click="setDayPage(column.iso, column.page - 1)">
                <Icon name="mdi:chevron-left" size="14" />
              </button>
              <button type="button" class="btn join-item btn-xs no-animation flex-1">
                {{ column.page }} / {{ column.totalPages }}
              </button>
              <button type="button" class="btn join-item btn-xs flex-1" :disabled="column.page === column.totalPages" @click="setDayPage(column.iso, column.page + 1)">
                <Icon name="mdi:chevron-right" size="14" />
              </button>
            </div>
          </div>

          <div v-else class="rounded-2xl border border-dashed border-base-300 bg-base-100/60 px-3 py-6 text-center text-xs opacity-65">
            {{ publicText('planning.page.nothingPlanned', 'Rien de prévu.') }}
          </div>
        </section>
      </div>
    </template>

    <template v-else>
      <OrdersCalendar
        :days="calendarDays"
        :month-label="calendarMonthLabel"
        :month-input="calendarMonthInput"
        :show-month-picker="showMonthPicker"
        :day-names="calendarDayNames"
        :today-label="publicText('planning.page.currentMonth', 'Mois en cours')"
        :month-picker-label="publicText('planning.page.monthPicker', 'Choisir un mois')"
        :item-class="calendarItemClass"
        :item-title="calendarItemTitle"
        :item-subtitle="calendarItemSubtitle"
        :item-meta="calendarItemMeta"
        @change-month="changeMonth"
        @toggle-month-picker="toggleMonthPicker"
        @apply-month-input="applyMonthInput"
        @go-current-month="goCurrentMonth"
        @select-day="() => {}"
        @select-item="openPlanningItem"
        @change-day-page="changeCalendarDayPage"
        @update:month-input="updateMonthInput"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import OrdersCalendar from '#modula/components/admin/OrdersCalendar.vue'
import type { CmsLocale } from '#modula/shared/cms'
import type {
  CmsPlanningPageSettings,
  EventListItem,
  PlanningCalendarResponse,
  PlanningPageViewMode,
  PlanningWeekResponse
} from '#modula/shared/events'
import { createDefaultCmsSiteSettings, pickCmsLocalizedText } from '#modula/shared/cms'
import { resolveIntlLocale } from '#modula/shared/date'
import { useAuthStore } from '#modula/stores/auth'

const props = withDefaults(defineProps<{
  settings?: CmsPlanningPageSettings | null
  preview?: boolean
}>(), {
  settings: null,
  preview: false
})

const { contentLocale } = useContentLocale()
const locale = contentLocale
const localePath = usePublicLocalePath()
const { publicText } = usePublicDictionary()
const siteConfig = await useSiteConfig()
const authStore = useAuthStore()
const defaultSettings = createDefaultCmsSiteSettings().planningPage
const effectiveSettings = computed(() => props.settings || siteConfig.value?.cms?.settings?.planningPage || defaultSettings)
const viewMode = ref<PlanningPageViewMode>(effectiveSettings.value.defaultViewMode)
const weekStart = ref(startOfWeek(new Date()))
const calendarMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const showMonthPicker = ref(false)
const dayPages = reactive<Record<string, number>>({})

watch(effectiveSettings, (value) => {
  viewMode.value = value.defaultViewMode
}, { deep: true })

watch(viewMode, () => {
  showMonthPicker.value = false
  clearDayPages()
})

const query = computed(() => ({
  locale: locale.value,
  scope: 'planning',
  view: viewMode.value,
  weekStart: formatIsoDate(weekStart.value),
  month: formatMonth(calendarMonth.value),
  perDayLimit: viewMode.value === 'week' ? 4 : 3,
  dayPages: JSON.stringify(dayPages)
}))

const { data, pending } = await useFetch<PlanningWeekResponse | PlanningCalendarResponse>('/api/events', {
  query,
  immediate: !props.preview,
  default: () => null
})

const previewItems = computed<EventListItem[]>(() => [
  {
    id: -1,
    kind: 'PERMANENCE',
    occurrenceId: null,
    slug: 'permanence-cuisine',
    status: 'PUBLISHED',
    visibility: 'PRIVATE',
    startsAt: new Date().toISOString(),
    endsAt: null,
    placeName: locale.value === 'en' ? 'OnSite kitchen' : 'Cuisine de la ferme',
    placeCity: 'Saint-Sébastien-d’Aigrefeuille',
    coverImageUrl: '',
    publicReservationEnabled: false,
    internalParticipationEnabled: true,
    title: locale.value === 'en' ? 'Kitchen volunteer shift' : 'Permanence cuisine bénévole',
    subtitle: '',
    excerpt: locale.value === 'en' ? 'Volunteers can join specific time slots.' : 'Les bénévoles peuvent rejoindre des créneaux précis.'
  },
  {
    id: -2,
    kind: 'EVENT',
    occurrenceId: null,
    slug: 'atelier-jardin',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    endsAt: null,
    placeName: locale.value === 'en' ? 'Vegetable garden' : 'Potager',
    placeCity: 'Saint-Sébastien-d’Aigrefeuille',
    coverImageUrl: '',
    publicReservationEnabled: true,
    internalParticipationEnabled: false,
    title: locale.value === 'en' ? 'Garden workshop' : 'Atelier jardin',
    subtitle: '',
    excerpt: locale.value === 'en' ? 'Public planning also highlights open events.' : 'Le planning public met aussi en avant les événements ouverts.'
  }
])

const previewWeekResponse = computed<PlanningWeekResponse>(() => {
  const columns = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(startOfWeek(new Date()), index)
    const iso = formatIsoDate(day)
    const items = previewItems.value.filter(item => formatIsoDate(new Date(item.startsAt)) === iso)
    return {
      iso,
      label: new Intl.DateTimeFormat(resolveIntlLocale(locale.value), { weekday: 'long', day: '2-digit', month: 'long' }).format(day),
      shortLabel: new Intl.DateTimeFormat(resolveIntlLocale(locale.value), { weekday: 'short' }).format(day),
      dayNumber: day.getDate(),
      page: 1,
      total: items.length,
      totalPages: 1,
      items
    }
  })
  return {
    view: 'week',
    weekStart: formatIsoDate(startOfWeek(new Date())),
    columns
  }
})

const previewCalendarResponse = computed<PlanningCalendarResponse>(() => {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const firstGridDay = startOfWeek(monthStart)
  const lastDay = endOfWeek(new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0))
  const days = []
  for (let cursor = new Date(firstGridDay); cursor <= lastDay; cursor = addDays(cursor, 1)) {
    const iso = formatIsoDate(cursor)
    days.push({
      iso,
      dayNumber: cursor.getDate(),
      inCurrentMonth: cursor.getMonth() === monthStart.getMonth(),
      isToday: iso === formatIsoDate(new Date()),
      page: 1,
      total: previewItems.value.filter(item => formatIsoDate(new Date(item.startsAt)) === iso).length,
      totalPages: 1,
      items: previewItems.value.filter(item => formatIsoDate(new Date(item.startsAt)) === iso)
    })
  }
  return {
    view: 'calendar',
    month: formatMonth(monthStart),
    monthLabel: new Intl.DateTimeFormat(resolveIntlLocale(locale.value), { month: 'long', year: 'numeric' }).format(monthStart),
    monthInput: formatMonth(monthStart),
    dayNames: Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(resolveIntlLocale(locale.value), { weekday: 'short' }).format(addDays(firstGridDay, index))),
    days
  }
})

const currentWeekResponse = computed<PlanningWeekResponse | null>(() => {
  if (viewMode.value !== 'week') return null
  if (data.value?.view === 'week') return data.value
  return props.preview ? previewWeekResponse.value : null
})

const currentCalendarResponse = computed<PlanningCalendarResponse | null>(() => {
  if (viewMode.value !== 'calendar') return null
  if (data.value?.view === 'calendar') return data.value
  return props.preview ? previewCalendarResponse.value : null
})

const weekColumns = computed(() => currentWeekResponse.value?.columns || [])
const calendarDays = computed(() => currentCalendarResponse.value?.days || [])
const calendarDayNames = computed(() => currentCalendarResponse.value?.dayNames || [])
const calendarMonthLabel = computed(() => currentCalendarResponse.value?.monthLabel || new Intl.DateTimeFormat(resolveIntlLocale(locale.value), { month: 'long', year: 'numeric' }).format(calendarMonth.value))
const calendarMonthInput = computed(() => currentCalendarResponse.value?.monthInput || formatMonth(calendarMonth.value))
const isEmpty = computed(() => viewMode.value === 'week'
  ? weekColumns.value.every(column => column.total === 0)
  : calendarDays.value.every(day => day.total === 0))

const pageTitle = computed(() => pickCmsLocalizedText(locale.value as CmsLocale, effectiveSettings.value.title))
const pageSubtitle = computed(() => pickCmsLocalizedText(locale.value as CmsLocale, effectiveSettings.value.subtitle))
const detailLabel = computed(() => pickCmsLocalizedText(locale.value as CmsLocale, effectiveSettings.value.detailLabel))
const becomeVolunteerLabel = computed(() => pickCmsLocalizedText(locale.value as CmsLocale, effectiveSettings.value.becomeVolunteerLabel))
const internalParticipationLabel = computed(() => pickCmsLocalizedText(locale.value as CmsLocale, effectiveSettings.value.internalParticipationLabel))
const guestInfoLabel = computed(() => pickCmsLocalizedText(locale.value as CmsLocale, effectiveSettings.value.guestInfoLabel))

const containerClass = computed(() => {
  switch (effectiveSettings.value.containerWidth) {
    case 'narrow': return 'max-w-3xl'
    case 'medium': return 'max-w-4xl'
    case 'default': return 'max-w-5xl'
    case 'wide': return 'max-w-6xl'
    case 'xwide': return 'max-w-7xl'
    case 'edge': return 'max-w-[90rem]'
    case 'full': return 'max-w-none'
    default: return 'max-w-6xl'
  }
})

const excerptClass = computed(() => effectiveSettings.value.excerptLines === 2 ? 'line-clamp-2' : effectiveSettings.value.excerptLines === 4 ? 'line-clamp-4' : 'line-clamp-3')
const cardStyle = computed(() => ({
  backgroundColor: effectiveSettings.value.cardBackgroundColor?.token ? `var(--color-${effectiveSettings.value.cardBackgroundColor.token})` : 'var(--color-base-200)'
}))

const weekRangeLabel = computed(() => {
  const start = weekStart.value
  const end = addDays(start, 6)
  const localeCode = resolveIntlLocale(locale.value)
  return `${new Intl.DateTimeFormat(localeCode, { day: '2-digit', month: 'long' }).format(start)} - ${new Intl.DateTimeFormat(localeCode, { day: '2-digit', month: 'long' }).format(end)}`
})

function startOfWeek(value: Date) {
  const date = new Date(value)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function addDays(value: Date, amount: number) {
  const next = new Date(value)
  next.setDate(next.getDate() + amount)
  return next
}

function formatIsoDate(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatMonth(value: Date) {
  return formatIsoDate(value).slice(0, 7)
}

function clearDayPages() {
  for (const key of Object.keys(dayPages)) {
    delete dayPages[key]
  }
}

function changeWeek(offset: number) {
  weekStart.value = addDays(weekStart.value, offset * 7)
  clearDayPages()
}

function goCurrentWeek() {
  weekStart.value = startOfWeek(new Date())
  clearDayPages()
}

function changeMonth(offset: number) {
  calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() + offset, 1)
  clearDayPages()
}

function goCurrentMonth() {
  calendarMonth.value = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  clearDayPages()
}

function updateMonthInput(value: string) {
  if (!value) return
  const [year, month] = value.split('-').map(Number)
  if (!year || !month) return
  calendarMonth.value = new Date(year, month - 1, 1)
}

function applyMonthInput() {
  clearDayPages()
  showMonthPicker.value = false
}

function toggleMonthPicker() {
  showMonthPicker.value = !showMonthPicker.value
}

function setDayPage(iso: string, page: number) {
  dayPages[iso] = Math.max(1, page)
}

function changeCalendarDayPage(day: { iso: string }, page: number) {
  setDayPage(day.iso, page)
}

const planningCalendarItemClass = (item: EventListItem) => {
  if (item.internalParticipationEnabled) return 'bg-secondary text-secondary-content shadow-sm'
  if (item.publicReservationEnabled) return 'bg-primary text-primary-content shadow-sm'
  return 'bg-neutral text-neutral-content shadow-sm'
}
const calendarItemClass = (item: EventListItem) => planningCalendarItemClass(item)
const calendarItemTitle = (item: EventListItem) => item.title
const calendarItemSubtitle = (item: EventListItem) => [item.placeName, item.placeCity].filter(Boolean).join(', ')
const calendarItemMeta = (item: EventListItem) => formatTime(item.startsAt)

function openPlanningItem(item: EventListItem) {
  navigateTo(detailHref(item.slug, item.occurrenceId))
}

const detailHref = (slug: string, occurrenceId?: number | null) => localePath({
  path: `/events/${slug}`,
  query: occurrenceId ? { occurrenceId: String(occurrenceId) } : {}
})
const modeLabel = (mode: PlanningPageViewMode) => mode === 'week'
  ? publicText('planning.page.weekMode', 'Semaine')
  : publicText('planning.page.calendarMode', 'Calendrier')
const formatTime = (value: string) => new Intl.DateTimeFormat(resolveIntlLocale(locale.value), {
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value))
</script>
