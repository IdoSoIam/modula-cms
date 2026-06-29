<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <NuxtLink :to="localePath('/events')" class="mb-6 inline-flex items-center gap-1 text-sm opacity-70 hover:opacity-100">
      <Icon name="mdi:arrow-left" size="16" />
      <span>{{ publicText('events.detail.back', 'Retour aux événements') }}</span>
    </NuxtLink>

    <div v-if="!displayEvent" class="py-12 text-center">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <article v-else class="space-y-8">
      <header class="space-y-4">
        <div class="flex flex-wrap items-center gap-3 text-sm opacity-70">
          <span>{{ formattedDate }}</span>
          <span v-if="displayEvent.placeName">• {{ [displayEvent.placeName, displayEvent.placeCity].filter(Boolean).join(', ') }}</span>
        </div>
        <h1 class="text-4xl font-bold">{{ translation.title }}</h1>
        <p v-if="translation.subtitle" class="max-w-3xl text-lg opacity-75">{{ translation.subtitle }}</p>
      </header>

      <figure v-if="displayEvent.coverImageUrl" class="overflow-hidden rounded-[2rem] border border-base-300">
        <AppImage :src="displayEvent.coverImageUrl" :alt="translation.title" class="h-full w-full object-cover" sizes="(max-width: 1200px) 100vw, 1200px" loading="eager" fetchpriority="high" />
      </figure>

      <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div class="space-y-6">
          <div v-if="translation.excerpt" class="rounded-[2rem] border border-base-300 bg-base-200 p-6">
            <p class="leading-7">{{ translation.excerpt }}</p>
          </div>
          <PageRenderer :content="translation.content" :locale="locale" :editable="liveEditEnabled" @edit="openLiveEditor" />
        </div>

        <aside class="space-y-4">
          <section class="rounded-[2rem] border border-base-300 bg-base-200 p-6">
            <h2 class="text-xl font-semibold">{{ publicText('events.detail.infoTitle', 'Informations pratiques') }}</h2>
            <dl class="mt-4 space-y-3 text-sm">
              <div>
                <dt class="font-medium">{{ publicText('events.detail.date', 'Date') }}</dt>
                <dd class="opacity-75">{{ formattedDate }}</dd>
              </div>
              <div v-if="displayEvent.placeName || displayEvent.placeAddress || displayEvent.placeCity">
                <dt class="font-medium">{{ publicText('events.detail.location', 'Lieu') }}</dt>
                <dd class="opacity-75">{{ [displayEvent.placeName, displayEvent.placeAddress, displayEvent.placeCity].filter(Boolean).join(', ') }}</dd>
              </div>
              <div v-if="displayEvent.publicCapacity">
                <dt class="font-medium">{{ publicText('events.detail.publicCapacity', 'Capacité publique') }}</dt>
                <dd class="opacity-75">{{ displayEvent.publicCapacity }}</dd>
              </div>
              <div v-if="displayEvent.internalCapacity">
                <dt class="font-medium">{{ publicText('events.detail.internalCapacity', 'Capacité interne') }}</dt>
                <dd class="opacity-75">{{ displayEvent.internalCapacity }}</dd>
              </div>
            </dl>
          </section>

          <section v-if="displayEvent.publicReservationEnabled" class="rounded-[2rem] border border-base-300 bg-base-100 p-6">
            <h2 class="text-xl font-semibold">{{ publicReservationLabel }}</h2>
            <div class="mt-4 space-y-3">
              <input v-model="reservationForm.customerName" class="input input-bordered w-full" :placeholder="publicText('events.detail.fullNamePlaceholder', 'Nom complet')" />
              <input v-model="reservationForm.email" type="email" class="input input-bordered w-full" placeholder="Email" />
              <input v-model="reservationForm.phone" type="tel" class="input input-bordered w-full" :placeholder="publicText('events.detail.phonePlaceholder', 'Téléphone')" />
              <input v-model.number="reservationForm.seats" type="number" min="1" class="input input-bordered w-full" :placeholder="publicText('events.detail.seatsPlaceholder', 'Nombre de places')" />
              <textarea v-model="reservationForm.message" class="textarea textarea-bordered min-h-28 w-full" :placeholder="publicText('events.detail.messagePlaceholder', 'Message')" />
              <button type="button" class="btn btn-primary w-full" :disabled="reservationSaving" @click="submitReservation">
                <span v-if="reservationSaving" class="loading loading-spinner loading-sm" />
                {{ publicReservationLabel }}
              </button>
            </div>
          </section>

          <section v-if="showParticipationForm" class="rounded-[2rem] border border-base-300 bg-base-100 p-6">
            <h2 class="text-xl font-semibold">{{ internalParticipationLabel }}</h2>
            <PageEditable
              v-if="participationInfo"
              :editable="liveEditEnabled"
              label="Texte participation"
              button-position="top-left"
              @edit="openParticipationInfoEditor"
            >
              <p class="mt-2 text-sm opacity-75">{{ participationInfo }}</p>
            </PageEditable>
            <div class="mt-4 space-y-3">
              <textarea v-model="participationForm.message" class="textarea textarea-bordered min-h-28 w-full" :placeholder="publicText('events.detail.messagePlaceholder', 'Message')" />
              <button type="button" class="btn btn-primary w-full" :disabled="participationSaving" @click="submitParticipation">
                <span v-if="participationSaving" class="loading loading-spinner loading-sm" />
                {{ internalParticipationLabel }}
              </button>
            </div>
          </section>
        </aside>
      </section>
    </article>

    <div
      v-if="showEnterLiveEditButton"
      class="pointer-events-none fixed bottom-5 right-5 z-[120] flex justify-end"
    >
      <div class="pointer-events-auto rounded-2xl border border-base-300 bg-base-100/95 px-3 py-3 shadow-xl backdrop-blur">
        <button type="button" class="btn btn-sm btn-outline" @click="toggleLiveEdit(true)">
          {{ publicText('events.detail.enterLiveEdit', 'Éditer l’événement') }}
        </button>
      </div>
    </div>

    <ClientOnly>
      <PageEditModal :open="liveEditEnabled && modalOpen" :target="activeTarget" @close="modalOpen = false" />
    </ClientOnly>

    <div
      v-if="liveEditEnabled"
      class="pointer-events-none fixed bottom-5 right-5 z-[120] flex justify-end"
    >
      <div class="pointer-events-auto flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100/95 px-4 py-3 shadow-xl backdrop-blur">
        <div class="text-sm">
          <div class="font-semibold">{{ publicText('events.detail.liveEditTitle', 'LiveEdit événement') }}</div>
          <div class="opacity-65">{{ translation.title || displayEvent.slug }}</div>
        </div>

        <button type="button" class="btn btn-sm btn-outline" @click="reloadLiveEdit">
          {{ publicText('events.detail.reload', 'Recharger') }}
        </button>

        <button type="button" class="btn btn-sm btn-outline" @click="toggleLiveEdit(false)">
          {{ publicText('events.detail.quit', 'Quitter') }}
        </button>

        <button type="button" class="btn btn-sm btn-primary" :disabled="saving" @click="saveLiveEdit">
          <span v-if="saving" class="loading loading-spinner loading-xs" />
          {{ publicText('events.detail.save', 'Enregistrer') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue'
import PageEditable from '#modula/components/page-builder/PageEditable.vue'
import PageRenderer from '#modula/components/page-builder/PageRenderer.vue'
import type { EventPayload } from '#modula/shared/events'
import type { CmsLocale } from '#modula/shared/cms'
import type { PageBuilderEditTarget } from '#modula/shared/pageBuilderEditor'
import { resolveIntlLocale } from '#modula/shared/date'
import { useAuthStore } from '#modula/stores/auth'

definePageMeta({
  layout: 'default',
  i18n: false,
})

const PageEditModal = defineAsyncComponent(() => import('#modula/components/page-builder/PageEditModal.vue'))

const route = useRoute()
const router = useRouter()
const localePath = usePublicLocalePath()
const { contentLocale } = useContentLocale()
const { publicText } = usePublicDictionary()
const locale = computed(() => contentLocale.value)
const authStore = useAuthStore()
const { $toast } = useNuxtApp() as any
const slug = computed(() => String(route.params.slug || ''))
const currentLocale = computed<CmsLocale>(() => contentLocale.value)

const cloneEventData = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const { data: eventData } = await useFetch<EventPayload>(() => `/api/events/${slug.value}`, {
  query: computed(() => ({
    locale: contentLocale.value,
    previewDraft: route.query.previewDraft === '1' ? '1' : undefined,
    occurrenceId: typeof route.query.occurrenceId === 'string' ? route.query.occurrenceId : undefined
  })),
  onResponseError: () => {
    throw createError({ statusCode: 404, statusMessage: publicText('events.detail.notFound', 'Événement introuvable') })
  }
})

const editableEvent = ref<EventPayload | null>(null)
const activeTarget = ref<PageBuilderEditTarget | null>(null)
const modalOpen = ref(false)
const saving = ref(false)
const liveEditHydrated = ref(false)
const savedEventSnapshot = ref('')
const savedEventState = ref<EventPayload | null>(null)

const wantsLiveEdit = computed(() => route.query.liveEdit === '1')
const liveEditEnabled = computed(() => liveEditHydrated.value && wantsLiveEdit.value && authStore.isAdmin)
const showEnterLiveEditButton = computed(() => liveEditHydrated.value && !wantsLiveEdit.value && authStore.isAdmin)
const liveEditDirty = computed(() =>
  liveEditEnabled.value
  && Boolean(savedEventSnapshot.value)
  && serializeEventState() !== savedEventSnapshot.value
)

const displayEvent = computed(() => editableEvent.value || eventData.value || null)

watch(eventData, (value) => {
  editableEvent.value = value ? cloneEventData(value) : null
  syncSavedSnapshot()
}, { deep: true, immediate: true })

const translation = computed(() => {
  const item = displayEvent.value
  if (!item) {
    return { title: '', subtitle: '', excerpt: '', content: { version: 1, sections: [] } }
  }
  return item.translations[contentLocale.value]
    || item.translations.fr
    || item.translations.en
    || Object.values(item.translations)[0]
    || { title: '', subtitle: '', excerpt: '', content: { version: 1, sections: [] } }
})

const formattedDate = computed(() => displayEvent.value
  ? new Intl.DateTimeFormat(resolveIntlLocale(contentLocale.value), {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(displayEvent.value.startsAt))
  : '')

const publicReservationLabel = computed(() => publicText('events.detail.publicReservation', 'Réservation publique'))
const internalParticipationLabel = computed(() => publicText('events.detail.internalParticipation', 'Participation interne'))
const showParticipationForm = computed(() => {
  if (!authStore.isAuthenticated || !displayEvent.value?.internalParticipationEnabled) return false
  if (!displayEvent.value.audienceMemberRoleIds.length) return true
  return displayEvent.value.audienceMemberRoleIds.some(id => authStore.user?.memberRoleIds?.includes(id))
})
const participationInfo = computed(() =>
  displayEvent.value?.internalParticipationInfo[contentLocale.value]
  || displayEvent.value?.internalParticipationInfo.fr
  || displayEvent.value?.internalParticipationInfo.en
  || ''
)

const reservationForm = reactive({
  customerName: '',
  email: '',
  phone: '',
  seats: 1,
  message: ''
})
const participationForm = reactive({
  message: ''
})
const reservationSaving = ref(false)
const participationSaving = ref(false)

function serializeEventState() {
  return JSON.stringify({
    locale: currentLocale.value,
    event: editableEvent.value
  })
}

function syncSavedSnapshot() {
  savedEventSnapshot.value = serializeEventState()
  savedEventState.value = editableEvent.value ? cloneEventData(editableEvent.value) : null
}

function restoreEventState() {
  modalOpen.value = false
  activeTarget.value = null
  editableEvent.value = savedEventState.value ? cloneEventData(savedEventState.value) : (eventData.value ? cloneEventData(eventData.value) : null)
}

function confirmDiscardLiveEditChanges() {
  if (!liveEditDirty.value || !import.meta.client) return true
  return window.confirm(publicText('events.detail.unsavedConfirm', 'Des modifications non sauvegardées sont en cours. Êtes-vous sûr de vouloir quitter ?'))
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!liveEditDirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => {
  liveEditHydrated.value = true
  if (!import.meta.client) return
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

async function toggleLiveEdit(enabled: boolean) {
  if (!enabled && !confirmDiscardLiveEditChanges()) return
  if (!enabled) restoreEventState()
  const query = { ...route.query }
  if (enabled) query.liveEdit = '1'
  else delete query.liveEdit
  await router.replace({ query })
}

function openLiveEditor(target: PageBuilderEditTarget) {
  activeTarget.value = target
  modalOpen.value = true
}

function openParticipationInfoEditor() {
  if (!editableEvent.value) return
  activeTarget.value = {
    kind: 'text',
    label: 'Texte participation',
    text: editableEvent.value.internalParticipationInfo,
    multiline: true
  }
  modalOpen.value = true
}

function reloadLiveEdit() {
  if (!confirmDiscardLiveEditChanges()) return
  restoreEventState()
  syncSavedSnapshot()
}

async function saveLiveEdit() {
  if (!editableEvent.value?.id) return
  saving.value = true
  try {
    const payload = cloneEventData(toRaw(editableEvent.value))
    const occurrenceId = payload.occurrence?.id
    if (occurrenceId) {
      await $fetch(`/api/admin/event-occurrences/${occurrenceId}`, {
        method: 'PUT',
        body: {
          status: payload.occurrence?.status || 'SCHEDULED',
          startsAt: payload.startsAt,
          endsAt: payload.endsAt,
          titleOverride: translation.value.title,
          subtitleOverride: translation.value.subtitle,
          excerptOverride: translation.value.excerpt,
          contentOverride: translation.value.content,
          placeNameOverride: payload.placeName,
          placeAddressOverride: payload.placeAddress,
          placeCityOverride: payload.placeCity,
          mapUrlOverride: payload.mapUrl,
          coverImageOverrideUrl: payload.coverImageUrl,
          publicCapacityOverride: payload.publicCapacity,
          internalCapacityOverride: payload.internalCapacity,
          internalParticipationInfoOverride: payload.internalParticipationInfo
        }
      })
    } else {
      await $fetch<{ id: number }>(`/api/admin/events/${editableEvent.value.id}`, {
        method: 'PUT',
        body: payload
      })
    }
    const fresh = await $fetch<EventPayload>(`/api/events/${payload.slug}`, {
      query: {
        locale: contentLocale.value,
        previewDraft: route.query.previewDraft === '1' ? '1' : undefined,
        occurrenceId: typeof route.query.occurrenceId === 'string' ? route.query.occurrenceId : undefined
      }
    })
    editableEvent.value = cloneEventData(fresh)
    eventData.value = cloneEventData(fresh)
    syncSavedSnapshot()
    $toast?.success(publicText('events.detail.saved', 'Événement enregistré'))
  } catch (error: any) {
    $toast?.error(error?.data?.message || error?.message || error?.data?.statusMessage || publicText('events.detail.saveError', 'Impossible d’enregistrer l’événement'))
  } finally {
    saving.value = false
  }
}

const submitReservation = async () => {
  if (!displayEvent.value) return
  reservationSaving.value = true
  try {
    await $fetch(`/api/events/${displayEvent.value.slug}/reserve`, {
      method: 'POST',
      body: {
        ...reservationForm,
        locale: contentLocale.value
      }
    })
    $toast?.success(publicText('events.detail.reservationSent', 'Réservation envoyée'))
    reservationForm.customerName = ''
    reservationForm.email = ''
    reservationForm.phone = ''
    reservationForm.seats = 1
    reservationForm.message = ''
  } catch (error: any) {
    $toast?.error(error?.data?.message || error?.message || error?.data?.statusMessage || publicText('events.detail.reservationError', 'Impossible d’envoyer la réservation'))
  } finally {
    reservationSaving.value = false
  }
}

const submitParticipation = async () => {
  if (!displayEvent.value) return
  participationSaving.value = true
  try {
    await $fetch(`/api/events/${displayEvent.value.slug}/participate`, {
      method: 'POST',
      body: {
        ...participationForm,
        locale: contentLocale.value
      }
    })
    $toast?.success(publicText('events.detail.participationSent', 'Participation envoyée'))
    participationForm.message = ''
  } catch (error: any) {
    $toast?.error(error?.data?.message || error?.message || error?.data?.statusMessage || publicText('events.detail.participationError', 'Impossible d’envoyer la participation'))
  } finally {
    participationSaving.value = false
  }
}

onBeforeRouteLeave(() => {
  if (confirmDiscardLiveEditChanges()) {
    if (liveEditDirty.value) restoreEventState()
    return
  }
  return false
})

usePageSeo({
  title: computed(() => translation.value.title || publicText('events.detail.seoFallbackTitle', 'Événements')),
  description: computed(() => translation.value.excerpt || translation.value.subtitle || '')
})
</script>
