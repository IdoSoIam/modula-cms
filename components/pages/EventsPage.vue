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
          <Icon :name="mode === 'list' ? 'mdi:format-list-bulleted' : 'mdi:view-grid-outline'" size="18" />
          <span>{{ modeLabel(mode) }}</span>
        </button>
      </div>
    </div>

    <div v-if="pending" class="py-12 text-center">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="error && !preview" role="alert" class="alert alert-error">
      {{ publicText('events.list.error', 'Impossible de charger les événements.') }}
      <button type="button" class="btn btn-sm" @click="refresh()">{{ publicText('events.list.retry', 'Réessayer') }}</button>
    </div>
    <div v-else-if="eventItems.length === 0" class="rounded-3xl border border-dashed border-base-300 bg-base-200/40 px-6 py-12 text-center opacity-70">
      {{ publicText('events.list.empty', 'Aucun événement publié pour le moment.') }}
    </div>

    <template v-else>
      <div :class="viewMode === 'list' ? 'space-y-4' : ['grid grid-cols-1 gap-6 md:grid-cols-2', gridColumnsClass]">
        <EventsEventCard
          v-for="eventItem in eventItems" :key="eventItem.occurrenceId || eventItem.id"
          :item="eventItem" :settings="effectiveSettings" :mode="viewMode"
          :locale="locale" :href="detailHref(eventItem.slug)"
          :detail-label="detailLabel" :reservation-label="publicReservationLabel"
        />
      </div>

      <div v-if="totalPages > 1" class="join mt-8 flex justify-center">
        <button type="button" class="btn join-item" :disabled="page === 1" @click="page--">
          <Icon name="mdi:chevron-left" size="18" />
        </button>
        <button type="button" class="btn join-item no-animation">
          {{ page }} / {{ totalPages }}
        </button>
        <button type="button" class="btn join-item" :disabled="page === totalPages" @click="page++">
          <Icon name="mdi:chevron-right" size="18" />
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CmsLocale } from '#modula/shared/cms'
import type { CmsEventsPageSettings, EventListItem, EventsPageViewMode, PublicEventsListResponse } from '#modula/shared/events'
import { createDefaultCmsSiteSettings, pickCmsLocalizedText } from '#modula/shared/cms'

const props = withDefaults(defineProps<{
  settings?: CmsEventsPageSettings | null
  pageTitleOverride?: string | null
  pageSubtitleOverride?: string | null
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
const defaultSettings = createDefaultCmsSiteSettings().eventsPage
const effectiveSettings = computed(() => props.settings || siteConfig.value?.cms?.settings?.eventsPage || defaultSettings)
const viewMode = ref<EventsPageViewMode>(effectiveSettings.value.defaultViewMode)
const page = ref(1)

watch(effectiveSettings, (value) => {
  viewMode.value = value.defaultViewMode
}, { deep: true })
watch(viewMode, () => {
  page.value = 1
})

const { data, pending, error, refresh } = await useFetch<PublicEventsListResponse>('/api/events', {
  query: computed(() => ({
    locale: locale.value,
    scope: 'events',
    view: viewMode.value,
    page: page.value,
    pageSize: viewMode.value === 'list' ? 6 : 9
  })),
  immediate: !props.preview,
  default: () => ({
    items: [],
    page: 1,
    pageSize: 9,
    total: 0,
    totalPages: 1
  })
})

const previewItems = computed<EventListItem[]>(() => [
  {
    id: -1,
    kind: 'EVENT',
    occurrenceId: null,
    slug: 'atelier-pain',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    startsAt: new Date().toISOString(),
    endsAt: null,
    placeName: locale.value === 'en' ? 'OnSite courtyard' : 'Cour de la ferme',
    placeCity: 'Saint-Sébastien-d’Aigrefeuille',
    coverImageUrl: '',
    publicReservationEnabled: true,
    internalParticipationEnabled: false,
    title: locale.value === 'en' ? 'Bread workshop' : 'Atelier pain',
    subtitle: locale.value === 'en' ? 'Public event preview' : 'Aperçu d’événement public',
    excerpt: locale.value === 'en' ? 'A simple preview card for the public events page.' : 'Une carte d’aperçu simple pour la page événements publique.'
  },
  {
    id: -2,
    kind: 'EVENT',
    occurrenceId: null,
    slug: 'marche-fermier',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    startsAt: new Date(Date.now() + 86400000).toISOString(),
    endsAt: null,
    placeName: locale.value === 'en' ? 'Village square' : 'Place du village',
    placeCity: 'Anduze',
    coverImageUrl: '',
    publicReservationEnabled: false,
    internalParticipationEnabled: false,
    title: locale.value === 'en' ? 'Farmers market' : 'Marché fermier',
    subtitle: '',
    excerpt: locale.value === 'en' ? 'Another example item for grid and list previews.' : 'Un autre exemple pour les aperçus grille et liste.'
  }
])

const eventItems = computed(() => data.value?.items?.length ? data.value.items : (props.preview ? previewItems.value : []))
const totalPages = computed(() => props.preview ? 1 : (data.value?.totalPages || 1))

const pageTitle = computed(() =>
  String(props.pageTitleOverride || '').trim()
  || pickCmsLocalizedText(locale.value as CmsLocale, effectiveSettings.value.title)
)
const pageSubtitle = computed(() =>
  String(props.pageSubtitleOverride || '').trim()
  || pickCmsLocalizedText(locale.value as CmsLocale, effectiveSettings.value.subtitle)
)
const detailLabel = computed(() => pickCmsLocalizedText(locale.value as CmsLocale, effectiveSettings.value.detailLabel))
const publicReservationLabel = computed(() => pickCmsLocalizedText(locale.value as CmsLocale, effectiveSettings.value.publicReservationLabel))

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

const detailHref = (slug: string) => localePath(`/events/${slug}`)
const modeLabel = (mode: EventsPageViewMode) => mode === 'list'
  ? publicText('events.list.listMode', 'Liste')
  : publicText('events.list.gridMode', 'Grille')
</script>
