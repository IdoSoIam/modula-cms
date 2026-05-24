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
          <Icon :name="mode === 'list' ? 'mdi:format-list-bulleted' : mode === 'calendar' ? 'mdi:calendar-month-outline' : 'mdi:view-grid-outline'" size="18" />
          <span>{{ modeLabel(mode) }}</span>
        </button>
      </div>
    </div>

    <div v-if="pending" class="py-12 text-center">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="planningItems.length === 0" class="rounded-3xl border border-dashed border-base-300 bg-base-200/40 px-6 py-12 text-center opacity-70">
      {{ locale === 'en' ? 'No public schedule published yet.' : 'Aucun élément de planning public pour le moment.' }}
    </div>

    <template v-else>
      <div v-if="viewMode === 'list'" class="space-y-4">
        <article
          v-for="planningItem in planningItems"
          :key="planningItem.id"
          class="grid gap-0 overflow-hidden rounded-[2rem] border border-base-300 shadow-sm md:grid-cols-[320px_minmax(0,1fr)]"
          :style="cardStyle"
        >
          <div v-if="effectiveSettings.showCoverImage && planningItem.coverImageUrl" class="h-60 md:h-full">
            <AppImage :src="planningItem.coverImageUrl" :alt="planningItem.title" class="h-full w-full object-cover" sizes="(max-width: 768px) 100vw, 320px" loading="lazy" />
          </div>
          <div class="space-y-4 p-6">
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2 text-sm opacity-70">
                <span v-if="effectiveSettings.showDate">{{ formatDate(planningItem.startsAt) }}</span>
                <span v-if="effectiveSettings.showLocation && planningItem.placeName">• {{ [planningItem.placeName, planningItem.placeCity].filter(Boolean).join(', ') }}</span>
              </div>
              <h2 class="text-2xl font-bold">{{ planningItem.title }}</h2>
              <p v-if="planningItem.subtitle" class="text-sm opacity-75">{{ planningItem.subtitle }}</p>
            </div>
            <p v-if="effectiveSettings.showExcerpt && planningItem.excerpt" :class="excerptClass">{{ planningItem.excerpt }}</p>
            <div class="flex flex-wrap gap-3">
              <NuxtLink :to="detailHref(planningItem.slug)" class="btn btn-primary btn-sm">{{ detailLabel }}</NuxtLink>
              <span
                v-if="authStore.isAuthenticated && planningItem.internalParticipationEnabled"
                class="badge badge-outline"
              >{{ internalParticipationLabel }}</span>
            </div>
          </div>
        </article>
      </div>

      <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 gap-6 md:grid-cols-2" :class="gridColumnsClass">
        <article
          v-for="planningItem in planningItems"
          :key="planningItem.id"
          class="overflow-hidden rounded-[2rem] border border-base-300 shadow-sm"
          :style="cardStyle"
        >
          <div v-if="effectiveSettings.showCoverImage && planningItem.coverImageUrl" class="h-56">
            <AppImage :src="planningItem.coverImageUrl" :alt="planningItem.title" class="h-full w-full object-cover" sizes="(max-width: 768px) 100vw, 50vw" loading="lazy" />
          </div>
          <div class="space-y-4 p-6">
            <div class="space-y-2">
              <div class="text-sm opacity-70">
                <span v-if="effectiveSettings.showDate">{{ formatDate(planningItem.startsAt) }}</span>
                <span v-if="effectiveSettings.showLocation && planningItem.placeName">• {{ [planningItem.placeName, planningItem.placeCity].filter(Boolean).join(', ') }}</span>
              </div>
              <h2 class="text-2xl font-bold">{{ planningItem.title }}</h2>
              <p v-if="planningItem.subtitle" class="text-sm opacity-75">{{ planningItem.subtitle }}</p>
            </div>
            <p v-if="effectiveSettings.showExcerpt && planningItem.excerpt" :class="excerptClass">{{ planningItem.excerpt }}</p>
            <div class="flex flex-wrap gap-3">
              <NuxtLink :to="detailHref(planningItem.slug)" class="btn btn-primary btn-sm">{{ detailLabel }}</NuxtLink>
              <span
                v-if="authStore.isAuthenticated && planningItem.internalParticipationEnabled"
                class="badge badge-outline"
              >{{ internalParticipationLabel }}</span>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="space-y-6">
        <section v-for="group in calendarGroups" :key="group.key" class="space-y-3">
          <h2 class="text-2xl font-bold">{{ group.label }}</h2>
          <div class="space-y-3">
            <article
              v-for="planningItem in group.items"
              :key="planningItem.id"
              class="flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border border-base-300 px-5 py-4 shadow-sm"
              :style="cardStyle"
            >
              <div class="min-w-0">
                <div class="text-sm opacity-70">{{ formatDate(planningItem.startsAt) }}</div>
                <div class="text-lg font-semibold">{{ planningItem.title }}</div>
                <div v-if="planningItem.placeName" class="text-sm opacity-75">{{ [planningItem.placeName, planningItem.placeCity].filter(Boolean).join(', ') }}</div>
              </div>
              <NuxtLink :to="detailHref(planningItem.slug)" class="btn btn-outline btn-sm">{{ detailLabel }}</NuxtLink>
            </article>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CmsLocale } from '~/shared/cms'
import type { EventListItem, CmsPlanningPageSettings, EventPageViewMode } from '~/shared/events'
import { createDefaultCmsSiteSettings, pickCmsLocalizedText } from '~/shared/cms'

const props = withDefaults(defineProps<{
  settings?: CmsPlanningPageSettings | null
  preview?: boolean
}>(), {
  settings: null,
  preview: false
})

const { locale } = useI18n()
const localePath = useLocalePath()
const siteConfig = await useSiteConfig()
const authStore = useAuthStore()

const defaultSettings = createDefaultCmsSiteSettings().planningPage
const effectiveSettings = computed(() => props.settings || siteConfig.value?.cms?.settings?.planningPage || defaultSettings)
const { data, pending } = await useFetch<EventListItem[]>('/api/events', {
  query: computed(() => ({ locale: locale.value, scope: 'planning' })),
  default: () => []
})

const previewItems = computed<EventListItem[]>(() => [
  {
    id: -1,
    slug: 'planning-demo',
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    startsAt: new Date().toISOString(),
    endsAt: null,
    placeName: locale.value === 'en' ? 'Farm kitchen' : 'Cuisine de la ferme',
    placeCity: 'Saint-Sébastien-d\'Aigrefeuille',
    coverImageUrl: '',
    publicReservationEnabled: false,
    internalParticipationEnabled: true,
    title: locale.value === 'en' ? 'Volunteer kitchen shift' : 'Permanence cuisine bénévole',
    subtitle: locale.value === 'en' ? 'Preview of the public planning page.' : 'Aperçu de la page planning publique.',
    excerpt: locale.value === 'en' ? 'Visitors see general information, volunteers can sign in and participate when allowed.' : 'Les visiteurs voient l’information générale, les bénévoles peuvent ensuite se connecter et participer si autorisés.'
  }
])

const planningItems = computed(() => {
  if (data.value?.length) return data.value
  return props.preview ? previewItems.value : []
})

const viewMode = ref<EventPageViewMode>(effectiveSettings.value.defaultViewMode)
watch(effectiveSettings, (value) => {
  viewMode.value = value.defaultViewMode
}, { deep: true })

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
  for (const item of planningItems.value) {
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
