<template>
  <div class="mx-auto w-full py-10" :class="[containerClass, preview ? '' : 'px-4 sm:px-6 lg:px-8']">
    <header class="mb-8 text-center">
      <h1 class="text-4xl font-bold">{{ pageTitle }}</h1>
      <p v-if="pageSubtitle" class="mx-auto mt-3 max-w-3xl opacity-75">{{ pageSubtitle }}</p>
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
          <Icon :name="mode === 'list' ? 'mdi:format-list-bulleted' : mode === 'calendar' ? 'mdi:calendar-month-outline' : 'mdi:view-grid-outline'" size="18" />
          <span>{{ modeLabel(mode) }}</span>
        </button>
      </div>
    </div>

    <div v-if="pending" class="py-12 text-center">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="eventItems.length === 0" class="rounded-3xl border border-dashed border-base-300 bg-base-200/40 px-6 py-12 text-center opacity-70">
      {{ locale === 'en' ? 'No events published yet.' : 'Aucun événement publié pour le moment.' }}
    </div>

    <template v-else>
      <div v-if="viewMode === 'list'" class="space-y-4">
        <article
          v-for="eventItem in eventItems"
          :key="eventItem.id"
          class="grid gap-0 overflow-hidden rounded-[2rem] border border-base-300 shadow-sm md:grid-cols-[320px_minmax(0,1fr)]"
          :style="cardStyle"
        >
          <div v-if="effectiveSettings.showCoverImage && eventItem.coverImageUrl" class="h-60 md:h-full">
            <AppImage :src="eventItem.coverImageUrl" :alt="eventItem.title" class="h-full w-full object-cover" sizes="(max-width: 768px) 100vw, 320px" loading="lazy" />
          </div>
          <div class="space-y-4 p-6">
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2 text-sm opacity-70">
                <span v-if="effectiveSettings.showDate">{{ formatDate(eventItem.startsAt) }}</span>
                <span v-if="effectiveSettings.showLocation && eventItem.placeName">• {{ [eventItem.placeName, eventItem.placeCity].filter(Boolean).join(', ') }}</span>
              </div>
              <h2 class="text-2xl font-bold">{{ eventItem.title }}</h2>
              <p v-if="eventItem.subtitle" class="text-sm opacity-75">{{ eventItem.subtitle }}</p>
            </div>
            <p v-if="effectiveSettings.showExcerpt && eventItem.excerpt" :class="excerptClass">{{ eventItem.excerpt }}</p>
            <div class="flex flex-wrap gap-3">
              <NuxtLink :to="detailHref(eventItem.slug)" class="btn btn-primary btn-sm">{{ detailLabel }}</NuxtLink>
              <span v-if="eventItem.publicReservationEnabled" class="badge badge-outline">{{ publicReservationLabel }}</span>
              <span v-if="eventItem.internalParticipationEnabled" class="badge badge-outline">{{ internalParticipationLabel }}</span>
            </div>
          </div>
        </article>
      </div>

      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 gap-6 md:grid-cols-2" :class="gridColumnsClass">
        <article
          v-for="eventItem in eventItems"
          :key="eventItem.id"
          class="overflow-hidden rounded-[2rem] border border-base-300 shadow-sm"
          :style="cardStyle"
        >
          <div v-if="effectiveSettings.showCoverImage && eventItem.coverImageUrl" class="h-56">
            <AppImage :src="eventItem.coverImageUrl" :alt="eventItem.title" class="h-full w-full object-cover" sizes="(max-width: 768px) 100vw, 50vw" loading="lazy" />
          </div>
          <div class="space-y-4 p-6">
            <div class="space-y-2">
              <div class="text-sm opacity-70">
                <span v-if="effectiveSettings.showDate">{{ formatDate(eventItem.startsAt) }}</span>
                <span v-if="effectiveSettings.showLocation && eventItem.placeName">• {{ [eventItem.placeName, eventItem.placeCity].filter(Boolean).join(', ') }}</span>
              </div>
              <h2 class="text-2xl font-bold">{{ eventItem.title }}</h2>
              <p v-if="eventItem.subtitle" class="text-sm opacity-75">{{ eventItem.subtitle }}</p>
            </div>
            <p v-if="effectiveSettings.showExcerpt && eventItem.excerpt" :class="excerptClass">{{ eventItem.excerpt }}</p>
            <div class="flex flex-wrap gap-3">
              <NuxtLink :to="detailHref(eventItem.slug)" class="btn btn-primary btn-sm">{{ detailLabel }}</NuxtLink>
              <span v-if="eventItem.publicReservationEnabled" class="badge badge-outline">{{ publicReservationLabel }}</span>
              <span v-if="eventItem.internalParticipationEnabled" class="badge badge-outline">{{ internalParticipationLabel }}</span>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="space-y-6">
        <section v-for="group in calendarGroups" :key="group.key" class="space-y-3">
          <h2 class="text-2xl font-bold">{{ group.label }}</h2>
          <div class="space-y-3">
            <article
              v-for="eventItem in group.items"
              :key="eventItem.id"
              class="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-base-300 px-5 py-4 shadow-sm"
              :style="cardStyle"
            >
              <div class="min-w-0">
                <div class="text-sm opacity-70">{{ formatDate(eventItem.startsAt) }}</div>
                <div class="text-lg font-semibold">{{ eventItem.title }}</div>
                <div v-if="eventItem.placeName" class="text-sm opacity-75">{{ [eventItem.placeName, eventItem.placeCity].filter(Boolean).join(', ') }}</div>
              </div>
              <NuxtLink :to="detailHref(eventItem.slug)" class="btn btn-outline btn-sm">{{ detailLabel }}</NuxtLink>
            </article>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CmsLocale } from '~/shared/cms'
import type { EventListItem, CmsEventsPageSettings, EventPageViewMode } from '~/shared/events'
import { createDefaultCmsSiteSettings, pickCmsLocalizedText } from '~/shared/cms'

const props = withDefaults(defineProps<{
  settings?: CmsEventsPageSettings | null
  preview?: boolean
}>(), {
  settings: null,
  preview: false
})

const { locale } = useI18n()
const localePath = useLocalePath()
const siteConfig = await useSiteConfig()

const defaultSettings = createDefaultCmsSiteSettings().eventsPage
const effectiveSettings = computed(() => props.settings || siteConfig.value?.cms?.settings?.eventsPage || defaultSettings)
const { data, pending } = await useFetch<EventListItem[]>('/api/events', {
  query: computed(() => ({ locale: locale.value, scope: 'events' })),
  default: () => []
})

const previewEvents = computed<EventListItem[]>(() => [
  {
    id: -1,
    slug: 'atelier-ferme',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    startsAt: new Date().toISOString(),
    endsAt: null,
    placeName: locale.value === 'en' ? 'Farm courtyard' : 'Cour de la ferme',
    placeCity: locale.value === 'en' ? 'Saint-Sébastien-d’Aigrefeuille' : 'Saint-Sébastien-d’Aigrefeuille',
    coverImageUrl: '',
    publicReservationEnabled: true,
    internalParticipationEnabled: true,
    title: locale.value === 'en' ? 'Discovery workshop at the farm' : 'Atelier découverte à la ferme',
    subtitle: locale.value === 'en' ? 'Open to families, associations and volunteers.' : 'Ouvert aux familles, associations et bénévoles.',
    excerpt: locale.value === 'en' ? 'A sample event preview to help you tune the CMS layout.' : 'Un aperçu d’événement de démonstration pour ajuster la mise en page CMS.'
  }
])

const eventItems = computed(() => {
  if (data.value?.length) return data.value
  return props.preview ? previewEvents.value : []
})

const viewMode = ref<EventPageViewMode>(effectiveSettings.value.defaultViewMode)
watch(effectiveSettings, (value) => {
  viewMode.value = value.defaultViewMode
}, { deep: true })

const pageTitle = computed(() => pickCmsLocalizedText(locale.value as CmsLocale, effectiveSettings.value.title))
const pageSubtitle = computed(() => pickCmsLocalizedText(locale.value as CmsLocale, effectiveSettings.value.subtitle))
const publicReservationLabel = computed(() => pickCmsLocalizedText(locale.value as CmsLocale, effectiveSettings.value.publicReservationLabel))
const internalParticipationLabel = computed(() => pickCmsLocalizedText(locale.value as CmsLocale, effectiveSettings.value.internalParticipationLabel))
const detailLabel = computed(() => pickCmsLocalizedText(locale.value as CmsLocale, effectiveSettings.value.detailLabel))

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

const gridColumnsClass = computed(() => {
  switch (effectiveSettings.value.gridColumns) {
    case 1: return 'lg:grid-cols-1'
    case 3: return 'lg:grid-cols-3'
    default: return 'lg:grid-cols-2'
  }
})

const excerptClass = computed(() => effectiveSettings.value.excerptLines === 2 ? 'line-clamp-2' : effectiveSettings.value.excerptLines === 4 ? 'line-clamp-4' : 'line-clamp-3')
const cardStyle = computed(() => ({
  backgroundColor: effectiveSettings.value.cardBackgroundColor?.token ? `var(--color-${effectiveSettings.value.cardBackgroundColor.token})` : 'var(--color-base-200)'
}))

const calendarGroups = computed(() => {
  const formatter = new Intl.DateTimeFormat(locale.value === 'en' ? 'en-GB' : 'fr-FR', { month: 'long', year: 'numeric' })
  const groups = new Map<string, { key: string; label: string; items: EventListItem[] }>()
  for (const item of eventItems.value) {
    const date = new Date(item.startsAt)
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`
    const label = formatter.format(date)
    const group = groups.get(key) || { key, label, items: [] }
    group.items.push(item)
    groups.set(key, group)
  }
  return [...groups.values()]
})

const detailHref = (slug: string) => localePath(`/events/${slug}`)
const modeLabel = (mode: EventPageViewMode) => mode === 'list' ? (locale.value === 'en' ? 'List' : 'Liste') : mode === 'calendar' ? (locale.value === 'en' ? 'Calendar' : 'Calendrier') : (locale.value === 'en' ? 'Grid' : 'Grille')
const formatDate = (value: string) => new Intl.DateTimeFormat(locale.value === 'en' ? 'en-GB' : 'fr-FR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value))
</script>
