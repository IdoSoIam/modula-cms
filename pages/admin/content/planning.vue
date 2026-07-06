<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Planning</h1>
        <p class="mt-1 text-sm opacity-70">Pilotez les événements et permanences directement depuis le calendrier.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="button" class="btn btn-outline" @click="openCreateEventDialog">Nouvel événement</button>
        <button type="button" class="btn btn-primary" @click="openCreatePermanenceDialog()">Nouvelle permanence</button>
      </div>
    </div>

    <OrdersCalendar
      :days="calendar.days"
      :month-label="calendar.monthLabel"
      :month-input="calendarMonthInput"
      :show-month-picker="showMonthPicker"
      :day-names="calendar.dayNames"
      today-label="Mois en cours"
      month-picker-label="Choisir un mois"
      :item-class="calendarItemClass"
      :item-title="calendarItemTitle"
      :item-subtitle="calendarItemSubtitle"
      :item-meta="calendarItemMeta"
      @change-month="changeMonth"
      @toggle-month-picker="toggleMonthPicker"
      @apply-month-input="applyMonthInput"
      @go-current-month="goCurrentMonth"
      @select-day="openCreatePermanenceDialogFromDay"
      @select-item="openPlanningItem"
      @change-day-page="changeCalendarDayPage"
      @update:month-input="updateMonthInput"
    />

    <dialog ref="eventDialogRef" class="modal">
      <div class="modal-box max-w-3xl">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 class="text-2xl font-semibold">Créer un événement</h2>
            <p class="text-sm opacity-70">Une fois créé, vous serez redirigé vers la fiche publique en liveEdit.</p>
          </div>
          <form method="dialog"><button class="btn btn-sm btn-ghost">✕</button></form>
        </div>

        <div class="space-y-4">
          <div class="grid gap-4 lg:grid-cols-2">
            <AdminPageBuilderTranslationTabs :model-value="eventCreateForm.title" label="Titre visible" @update:model-value="eventCreateForm.title = $event" />
            <AdminPageBuilderTranslationTabs :model-value="eventCreateForm.subtitle" label="Sous-titre" multiline @update:model-value="eventCreateForm.subtitle = $event" />
          </div>
          <div class="grid gap-4 lg:grid-cols-3">
            <label class="form-control gap-2">
              <span class="label-text">Slug</span>
              <input v-model="eventCreateForm.slug" class="input input-bordered w-full" />
            </label>
            <label class="form-control gap-2">
              <span class="label-text">Visibilité</span>
            <select v-model="eventCreateForm.visibility" class="select select-bordered w-full">
              <option value="PUBLIC">Publique</option>
              <option v-if="associationRolesEnabled" value="PRIVATE">Privée par rôles</option>
            </select>
          </label>
            <label class="form-control gap-2">
              <span class="label-text">Statut</span>
              <select v-model="eventCreateForm.status" class="select select-bordered w-full">
                <option value="DRAFT">Brouillon</option>
                <option value="PUBLISHED">Publié</option>
              </select>
            </label>
          </div>
          <div class="grid gap-4 lg:grid-cols-2">
            <label class="form-control gap-2">
              <span class="label-text">Début</span>
              <input v-model="eventCreateForm.startsAt" type="datetime-local" class="input input-bordered w-full" />
            </label>
            <label class="form-control gap-2">
              <span class="label-text">Fin</span>
              <input v-model="eventCreateForm.endsAt" type="datetime-local" class="input input-bordered w-full" />
            </label>
          </div>
          <div class="grid gap-4 lg:grid-cols-2">
            <label class="form-control gap-2">
              <span class="label-text">Nom du lieu</span>
              <input v-model="eventCreateForm.placeName" class="input input-bordered w-full" />
            </label>
            <label class="form-control gap-2">
              <span class="label-text">Ville</span>
              <input v-model="eventCreateForm.placeCity" class="input input-bordered w-full" />
            </label>
          </div>
          <div class="grid gap-4 lg:grid-cols-2">
            <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
              <input v-model="eventCreateForm.publicReservationEnabled" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
              <span class="label-text">Activer la réservation publique</span>
            </label>
            <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
              <input v-model="eventCreateForm.internalParticipationEnabled" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
              <span class="label-text">Activer la participation interne</span>
            </label>
          </div>
        </div>

        <div class="modal-action">
          <form method="dialog"><button class="btn">Annuler</button></form>
          <button type="button" class="btn btn-primary" :disabled="creating" @click="createEventAndOpenLiveEdit">
            <span v-if="creating" class="loading loading-spinner loading-sm" />
            Créer et éditer
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <dialog ref="permanenceDialogRef" class="modal">
      <div class="modal-box max-w-4xl">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 class="text-2xl font-semibold">Créer une permanence</h2>
            <p class="text-sm opacity-70">Définissez les jours récurrents et les horaires. Les occurrences seront générées dans le calendrier.</p>
          </div>
          <form method="dialog"><button class="btn btn-sm btn-ghost">✕</button></form>
        </div>

        <div class="space-y-4">
          <div class="grid gap-4 lg:grid-cols-2">
            <AdminPageBuilderTranslationTabs :model-value="permanenceForm.title" label="Titre visible" @update:model-value="permanenceForm.title = $event" />
            <AdminPageBuilderTranslationTabs :model-value="permanenceForm.subtitle" label="Sous-titre" multiline @update:model-value="permanenceForm.subtitle = $event" />
          </div>
          <div class="grid gap-4 lg:grid-cols-3">
            <label class="form-control gap-2">
              <span class="label-text">Slug</span>
              <input v-model="permanenceForm.slug" class="input input-bordered w-full" />
            </label>
            <label class="form-control gap-2">
              <span class="label-text">Visibilité</span>
            <select v-model="permanenceForm.visibility" class="select select-bordered w-full">
                <option v-if="associationRolesEnabled" value="PRIVATE">Privée par rôles</option>
                <option value="PUBLIC">Publique</option>
              </select>
            </label>
            <label class="form-control gap-2">
              <span class="label-text">Statut</span>
              <select v-model="permanenceForm.status" class="select select-bordered w-full">
                <option value="DRAFT">Brouillon</option>
                <option value="PUBLISHED">Publié</option>
              </select>
            </label>
          </div>
          <div class="grid gap-4 lg:grid-cols-2">
            <label class="form-control gap-2">
              <span class="label-text">Début de série</span>
              <input v-model="permanenceForm.recurrenceStartDate" type="date" class="input input-bordered w-full" />
            </label>
            <label class="form-control gap-2">
              <span class="label-text">Fin de série (optionnel)</span>
              <input v-model="permanenceForm.recurrenceEndDate" type="date" class="input input-bordered w-full" />
            </label>
          </div>
          <div class="grid gap-4 lg:grid-cols-2">
            <label class="form-control gap-2">
              <span class="label-text">Heure début</span>
              <input v-model="permanenceForm.recurrenceStartTime" type="time" class="input input-bordered w-full" />
            </label>
            <label class="form-control gap-2">
              <span class="label-text">Heure fin</span>
              <input v-model="permanenceForm.recurrenceEndTime" type="time" class="input input-bordered w-full" />
            </label>
          </div>
          <div class="space-y-2">
            <div class="text-sm font-medium">Jours de permanence</div>
            <div class="grid gap-2 md:grid-cols-4">
              <label v-for="weekday in weekdays" :key="weekday.value" class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
                <input :checked="permanenceForm.recurrenceDays.includes(weekday.value)" type="checkbox" class="checkbox checkbox-primary checkbox-sm" @change="toggleRecurrenceDay(weekday.value, ($event.target as HTMLInputElement).checked)" />
                <span class="label-text">{{ weekday.label }}</span>
              </label>
            </div>
          </div>
          <div class="grid gap-4 lg:grid-cols-2">
            <label class="form-control gap-2">
              <span class="label-text">Nom du lieu</span>
              <input v-model="permanenceForm.placeName" class="input input-bordered w-full" />
            </label>
            <label class="form-control gap-2">
              <span class="label-text">Ville</span>
              <input v-model="permanenceForm.placeCity" class="input input-bordered w-full" />
            </label>
          </div>
          <AdminPageBuilderTranslationTabs :model-value="permanenceForm.internalParticipationInfo" label="Message participation interne" multiline @update:model-value="permanenceForm.internalParticipationInfo = $event" />
          <label v-if="associationRolesEnabled" class="form-control gap-2">
            <span class="label-text">Rôles autorisés pour l’interne</span>
            <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
              <div class="grid gap-2 md:grid-cols-2">
                <label v-for="role in roles" :key="role.id" class="label cursor-pointer justify-start gap-3">
                  <input :checked="permanenceForm.audienceMemberRoleIds.includes(role.id)" type="checkbox" class="checkbox checkbox-primary checkbox-sm" @change="togglePermanenceRole(role.id, ($event.target as HTMLInputElement).checked)" />
                  <span class="label-text">{{ role.name }}</span>
                </label>
              </div>
            </div>
          </label>
        </div>

        <div class="modal-action">
          <form method="dialog"><button class="btn">Annuler</button></form>
          <button type="button" class="btn btn-primary" :disabled="creating" @click="createPermanence">
            <span v-if="creating" class="loading loading-spinner loading-sm" />
            Créer la permanence
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <dialog ref="occurrenceDialogRef" class="modal">
      <div class="modal-box max-w-4xl">
        <div v-if="selectedOccurrence" class="space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-2xl font-semibold">Modifier cette occurrence</h2>
              <p class="text-sm opacity-70">Les changements appliqués ici n’affecteront pas les autres dates de la permanence.</p>
            </div>
            <form method="dialog"><button class="btn btn-sm btn-ghost">✕</button></form>
          </div>

          <div class="grid gap-4 lg:grid-cols-3">
            <label class="form-control gap-2">
              <span class="label-text">Statut</span>
              <select v-model="selectedOccurrence.status" class="select select-bordered w-full">
                <option value="SCHEDULED">Programmée</option>
                <option value="CANCELLED">Annulée</option>
              </select>
            </label>
            <label class="form-control gap-2">
              <span class="label-text">Début</span>
              <input v-model="selectedOccurrence.startsAt" type="datetime-local" class="input input-bordered w-full" />
            </label>
            <label class="form-control gap-2">
              <span class="label-text">Fin</span>
              <input v-model="selectedOccurrence.endsAt" type="datetime-local" class="input input-bordered w-full" />
            </label>
          </div>
          <div class="grid gap-4 lg:grid-cols-2">
            <label class="form-control gap-2">
              <span class="label-text">Titre override</span>
              <input v-model="selectedOccurrence.titleOverride" class="input input-bordered w-full" />
            </label>
            <label class="form-control gap-2">
              <span class="label-text">Sous-titre override</span>
              <input v-model="selectedOccurrence.subtitleOverride" class="input input-bordered w-full" />
            </label>
          </div>
          <label class="form-control gap-2">
            <span class="label-text">Extrait override</span>
            <textarea v-model="selectedOccurrence.excerptOverride" class="textarea textarea-bordered min-h-24 w-full" />
          </label>
          <div class="grid gap-4 lg:grid-cols-2">
            <label class="form-control gap-2">
              <span class="label-text">Lieu override</span>
              <input v-model="selectedOccurrence.placeNameOverride" class="input input-bordered w-full" />
            </label>
            <label class="form-control gap-2">
              <span class="label-text">Ville override</span>
              <input v-model="selectedOccurrence.placeCityOverride" class="input input-bordered w-full" />
            </label>
          </div>
          <AdminPageBuilderTranslationTabs :model-value="selectedOccurrence.internalParticipationInfoOverride || { fr: '', en: '' } as Record<string, string>" label="Message participation override" multiline @update:model-value="selectedOccurrence.internalParticipationInfoOverride = $event" />

          <div class="modal-action justify-between">
            <div class="flex gap-2">
              <button type="button" class="btn btn-outline" @click="openSeriesEditor">Modifier la permanence source</button>
              <button type="button" class="btn btn-outline" @click="openOccurrenceLiveEdit">LiveEdit CMS</button>
            </div>
            <div class="flex gap-2">
              <form method="dialog"><button class="btn">Fermer</button></form>
              <button type="button" class="btn btn-primary" :disabled="savingOccurrence" @click="saveOccurrence">
                <span v-if="savingOccurrence" class="loading loading-spinner loading-sm" />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import OrdersCalendar from '#modula/components/admin/OrdersCalendar.vue'
import AdminPageBuilderTranslationTabs from '#modula/components/admin/page-builder/TranslationTabs.vue'
import cmsProjectConfig from '#modula/cms.project.config'
import { createDefaultEventPayload, type AdminPlanningCalendarResponse, type EventOccurrenceEditorPayload, type EventPayload, type EventWeekdayValue } from '#modula/shared/events'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'})

interface MemberRoleSummary {
  id: number
  name: string
  slug: string
}

const localePath = useLocalePath()
const { $toast } = useNuxtApp() as any
const siteConfig = await useSiteConfig()
const creating = ref(false)
const savingOccurrence = ref(false)
const eventDialogRef = ref<HTMLDialogElement | null>(null)
const permanenceDialogRef = ref<HTMLDialogElement | null>(null)
const occurrenceDialogRef = ref<HTMLDialogElement | null>(null)
const showMonthPicker = ref(false)
const calendarMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const dayPages = reactive<Record<string, number>>({})
const selectedOccurrence = ref<EventOccurrenceEditorPayload | null>(null)

const { data: metaData } = await useFetch<{ memberRoles: MemberRoleSummary[] }>('/api/admin/events/meta', {
  default: () => ({ memberRoles: [] })
})
const roles = computed(() => metaData.value?.memberRoles || [])
const associationRolesEnabled = computed(() => siteConfig.value?.featureFlags?.associationRolesEnabled !== false)

const { data: calendarData, refresh } = await useFetch<AdminPlanningCalendarResponse>('/api/admin/planning/calendar', {
  query: computed(() => ({
    locale: 'fr',
    month: formatMonth(calendarMonth.value),
    perDayLimit: 3,
    dayPages: JSON.stringify(dayPages)
  })),
  default: () => ({
    month: formatMonth(calendarMonth.value),
    monthLabel: '',
    monthInput: formatMonth(calendarMonth.value),
    dayNames: [],
    days: []
  })
})

const calendar = computed(() => calendarData.value || {
  month: formatMonth(calendarMonth.value),
  monthLabel: '',
  monthInput: formatMonth(calendarMonth.value),
  dayNames: [],
  days: []
})

const eventCreateForm = reactive({
  title: { fr: '', en: '' } as Record<string, string>,
  subtitle: { fr: '', en: '' } as Record<string, string>,
  slug: '',
  visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE',
  status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  startsAt: '',
  endsAt: '',
  placeName: '',
  placeCity: '',
  publicReservationEnabled: false,
  internalParticipationEnabled: false
})

const permanenceForm = reactive({
  title: { fr: '', en: '' } as Record<string, string>,
  subtitle: { fr: '', en: '' } as Record<string, string>,
  slug: '',
  visibility: 'PRIVATE' as 'PUBLIC' | 'PRIVATE',
  status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  recurrenceStartDate: '',
  recurrenceEndDate: '',
  recurrenceStartTime: '10:00',
  recurrenceEndTime: '13:00',
  recurrenceDays: [1] as EventWeekdayValue[],
  placeName: cmsProjectConfig.site.defaultVolunteerPlaceName,
  placeCity: cmsProjectConfig.site.defaultPlaceCity,
  internalParticipationInfo: {
    fr: 'Précisez vos disponibilités et votre expérience éventuelle pour cette permanence.',
    en: 'Share your availability and any useful experience for this volunteer shift.'
  } as Record<string, string>,
  audienceMemberRoleIds: [] as number[]
})

const weekdays = [
  { value: 1 as EventWeekdayValue, label: 'Lundi' },
  { value: 2 as EventWeekdayValue, label: 'Mardi' },
  { value: 3 as EventWeekdayValue, label: 'Mercredi' },
  { value: 4 as EventWeekdayValue, label: 'Jeudi' },
  { value: 5 as EventWeekdayValue, label: 'Vendredi' },
  { value: 6 as EventWeekdayValue, label: 'Samedi' },
  { value: 0 as EventWeekdayValue, label: 'Dimanche' }
]

const toDateTimeLocal = (value: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function formatMonth(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function openCreateEventDialog() {
  const now = new Date()
  const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  eventCreateForm.title.fr = ''
  eventCreateForm.title.en = ''
  eventCreateForm.subtitle.fr = ''
  eventCreateForm.subtitle.en = ''
  eventCreateForm.slug = `evenement-${Date.now()}`
  eventCreateForm.visibility = 'PUBLIC'
  eventCreateForm.status = 'DRAFT'
  eventCreateForm.startsAt = toDateTimeLocal(now.toISOString())
  eventCreateForm.endsAt = toDateTimeLocal(inTwoHours.toISOString())
  eventCreateForm.placeName = cmsProjectConfig.site.defaultPlaceName
  eventCreateForm.placeCity = cmsProjectConfig.site.defaultPlaceCity
  eventCreateForm.publicReservationEnabled = false
  eventCreateForm.internalParticipationEnabled = false
  eventDialogRef.value?.showModal()
}

function openCreatePermanenceDialog(dayIso?: string) {
  const baseDate = dayIso ? new Date(dayIso) : new Date()
  permanenceForm.title.fr = 'Permanence repas des anciens'
  permanenceForm.title.en = 'Senior lunch volunteer shift'
  permanenceForm.subtitle.fr = 'Exemple : cuisine et service le lundi'
  permanenceForm.subtitle.en = 'Example: cooking and serving every Monday'
  permanenceForm.slug = `permanence-${Date.now()}`
  permanenceForm.visibility = associationRolesEnabled.value ? 'PRIVATE' : 'PUBLIC'
  permanenceForm.status = 'DRAFT'
  permanenceForm.recurrenceStartDate = dayIso || baseDate.toISOString().slice(0, 10)
  permanenceForm.recurrenceEndDate = ''
  permanenceForm.recurrenceStartTime = '10:00'
  permanenceForm.recurrenceEndTime = '13:00'
  permanenceForm.recurrenceDays = [((baseDate.getDay() as EventWeekdayValue))]
  permanenceForm.placeName = cmsProjectConfig.site.defaultVolunteerPlaceName
  permanenceForm.placeCity = cmsProjectConfig.site.defaultPlaceCity
  permanenceForm.internalParticipationInfo = {
    fr: 'Précisez vos disponibilités et votre expérience éventuelle pour cette permanence.',
    en: 'Share your availability and any useful experience for this volunteer shift.'
  }
  permanenceForm.audienceMemberRoleIds = []
  permanenceDialogRef.value?.showModal()
}

const openCreatePermanenceDialogFromDay = (day: { iso: string }) => openCreatePermanenceDialog(day.iso)

function toggleRecurrenceDay(day: EventWeekdayValue, checked: boolean) {
  permanenceForm.recurrenceDays = checked
    ? Array.from(new Set([...permanenceForm.recurrenceDays, day]))
    : permanenceForm.recurrenceDays.filter((entry) => entry !== day)
}

function togglePermanenceRole(roleId: number, checked: boolean) {
  if (!associationRolesEnabled.value) return
  permanenceForm.audienceMemberRoleIds = checked
    ? Array.from(new Set([...permanenceForm.audienceMemberRoleIds, roleId]))
    : permanenceForm.audienceMemberRoleIds.filter((id) => id !== roleId)
}

async function createEventAndOpenLiveEdit() {
  creating.value = true
  try {
    const payload = createDefaultEventPayload()
    payload.kind = 'EVENT'
    payload.slug = eventCreateForm.slug.trim()
    payload.status = eventCreateForm.status
    payload.visibility = associationRolesEnabled.value ? eventCreateForm.visibility : 'PUBLIC'
    payload.startsAt = new Date(eventCreateForm.startsAt).toISOString()
    payload.endsAt = eventCreateForm.endsAt ? new Date(eventCreateForm.endsAt).toISOString() : null
    payload.placeName = eventCreateForm.placeName.trim()
    payload.placeCity = eventCreateForm.placeCity.trim()
    payload.publicReservationEnabled = eventCreateForm.publicReservationEnabled
    payload.internalParticipationEnabled = eventCreateForm.internalParticipationEnabled
    payload.translations.fr.title = (eventCreateForm.title['fr'] ?? '').trim() || 'Événement à compléter'
    payload.translations.en.title = (eventCreateForm.title['en'] ?? '').trim() || 'Event to complete'
    payload.translations.fr.subtitle = (eventCreateForm.subtitle['fr'] ?? '').trim()
    payload.translations.en.subtitle = (eventCreateForm.subtitle['en'] ?? '').trim()
    payload.translations.fr.excerpt = 'Exemple d’événement public avec contenu CMS prêt à éditer.'
    payload.translations.en.excerpt = 'Sample public event with editable CMS content.'
    const created = await $fetch<{ id: number; slug: string }>('/api/admin/events', {
      method: 'POST',
      body: payload
    })
    eventDialogRef.value?.close()
    await navigateTo(localePath({
      path: `/events/${created.slug}`,
      query: {
        liveEdit: '1',
        previewDraft: '1'
      }
    }))
  } catch (error: any) {
    $toast?.error(error?.data?.message || error?.message || error?.data?.statusMessage || 'Impossible de créer l’événement')
  } finally {
    creating.value = false
  }
}

async function createPermanence() {
  creating.value = true
  try {
    const payload = createDefaultEventPayload()
    payload.kind = 'PERMANENCE'
    payload.slug = permanenceForm.slug.trim()
    payload.status = permanenceForm.status
    payload.visibility = associationRolesEnabled.value ? permanenceForm.visibility : 'PUBLIC'
    payload.startsAt = new Date(`${permanenceForm.recurrenceStartDate}T${permanenceForm.recurrenceStartTime}:00`).toISOString()
    payload.endsAt = new Date(`${permanenceForm.recurrenceStartDate}T${permanenceForm.recurrenceEndTime}:00`).toISOString()
    payload.recurrenceType = 'WEEKLY'
    payload.recurrenceDays = [...permanenceForm.recurrenceDays]
    payload.recurrenceStartDate = new Date(`${permanenceForm.recurrenceStartDate}T00:00:00`).toISOString()
    payload.recurrenceEndDate = permanenceForm.recurrenceEndDate ? new Date(`${permanenceForm.recurrenceEndDate}T00:00:00`).toISOString() : null
    payload.recurrenceStartTime = permanenceForm.recurrenceStartTime
    payload.recurrenceEndTime = permanenceForm.recurrenceEndTime
    payload.placeName = permanenceForm.placeName.trim()
    payload.placeCity = permanenceForm.placeCity.trim()
    payload.internalParticipationEnabled = true
    payload.internalParticipationApprovalMode = 'MANUAL'
    payload.internalParticipationInfo = { ...permanenceForm.internalParticipationInfo }
    payload.audienceMemberRoleIds = associationRolesEnabled.value ? [...permanenceForm.audienceMemberRoleIds] : []
    payload.translations.fr.title = (permanenceForm.title['fr'] ?? '').trim() || 'Permanence à compléter'
    payload.translations.en.title = (permanenceForm.title['en'] ?? '').trim() || 'Shift to complete'
    payload.translations.fr.subtitle = (permanenceForm.subtitle['fr'] ?? '').trim()
    payload.translations.en.subtitle = (permanenceForm.subtitle['en'] ?? '').trim()
    payload.translations.fr.excerpt = 'Exemple de permanence récurrente hebdomadaire.'
    payload.translations.en.excerpt = 'Example of a weekly recurring volunteer shift.'
    await $fetch('/api/admin/events', {
      method: 'POST',
      body: payload
    })
    permanenceDialogRef.value?.close()
    await refresh()
    $toast?.success('Permanence créée')
  } catch (error: any) {
    $toast?.error(error?.data?.message || error?.message || error?.data?.statusMessage || 'Impossible de créer la permanence')
  } finally {
    creating.value = false
  }
}

async function openPlanningItem(item: { id: number; occurrenceId?: number | null; kind: string }) {
  if (item.kind === 'PERMANENCE' && item.occurrenceId) {
    const payload = await $fetch<EventOccurrenceEditorPayload>(`/api/admin/event-occurrences/${item.occurrenceId}`)
    payload.startsAt = toDateTimeLocal(payload.startsAt)
    payload.endsAt = toDateTimeLocal(payload.endsAt)
    selectedOccurrence.value = payload
    occurrenceDialogRef.value?.showModal()
    return
  }

  await navigateTo(localePath({
    path: '/admin/content/events',
    query: {
      open: String(item.id)
    }
  }))
}

async function saveOccurrence() {
  if (!selectedOccurrence.value) return
  savingOccurrence.value = true
  try {
    await $fetch(`/api/admin/event-occurrences/${selectedOccurrence.value.id}`, {
      method: 'PUT',
      body: {
        ...selectedOccurrence.value,
        startsAt: new Date(selectedOccurrence.value.startsAt).toISOString(),
        endsAt: selectedOccurrence.value.endsAt ? new Date(selectedOccurrence.value.endsAt).toISOString() : null
      }
    })
    occurrenceDialogRef.value?.close()
    await refresh()
    $toast?.success('Occurrence enregistrée')
  } catch (error: any) {
    $toast?.error(error?.data?.message || error?.message || error?.data?.statusMessage || 'Impossible d’enregistrer cette occurrence')
  } finally {
    savingOccurrence.value = false
  }
}

function openSeriesEditor() {
  if (!selectedOccurrence.value) return
  occurrenceDialogRef.value?.close()
  navigateTo(localePath({
    path: '/admin/content/events',
    query: {
      open: String(selectedOccurrence.value.eventId)
    }
  }))
}

function openOccurrenceLiveEdit() {
  if (!selectedOccurrence.value) return
  const slug = selectedOccurrence.value.event.slug
  occurrenceDialogRef.value?.close()
  navigateTo(localePath({
    path: `/events/${slug}`,
    query: {
      liveEdit: '1',
      previewDraft: '1',
      occurrenceId: String(selectedOccurrence.value.id)
    }
  }))
}

function changeMonth(offset: number) {
  calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() + offset, 1)
}

function toggleMonthPicker() {
  showMonthPicker.value = !showMonthPicker.value
}

function applyMonthInput() {
  showMonthPicker.value = false
}

function goCurrentMonth() {
  calendarMonth.value = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
}

const calendarMonthInput = computed(() => calendar.value.monthInput || formatMonth(calendarMonth.value))

function updateMonthInput(value: string) {
  if (!value) return
  const [year, month] = value.split('-').map(Number)
  if (!year || !month) return
  calendarMonth.value = new Date(year, month - 1, 1)
}

function changeCalendarDayPage(day: { iso: string }, page: number) {
  dayPages[day.iso] = Math.max(1, page)
}

const calendarItemClass = (item: any) => item.kind === 'PERMANENCE'
  ? (item.status === 'CANCELLED' ? 'bg-warning text-warning-content shadow-sm' : 'bg-secondary text-secondary-content shadow-sm')
  : (item.status === 'DRAFT' ? 'bg-neutral text-neutral-content shadow-sm' : 'bg-primary text-primary-content shadow-sm')
const calendarItemTitle = (item: any) => item.title
const calendarItemSubtitle = (item: any) => [item.kind === 'PERMANENCE' ? 'Permanence' : 'Événement', item.placeName, item.placeCity].filter(Boolean).join(' • ')
const calendarItemMeta = (item: any) => new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.startsAt))
</script>
