<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <NuxtLink :to="localePath('/events')" class="mb-6 inline-flex items-center gap-1 text-sm opacity-70 hover:opacity-100">
      <Icon name="mdi:arrow-left" size="16" />
      <span>{{ locale === 'en' ? 'Back to events' : 'Retour aux événements' }}</span>
    </NuxtLink>

    <div v-if="!eventData" class="py-12 text-center">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <article v-else class="space-y-8">
      <header class="space-y-4">
        <div class="flex flex-wrap items-center gap-3 text-sm opacity-70">
          <span>{{ formattedDate }}</span>
          <span v-if="eventData.placeName">• {{ [eventData.placeName, eventData.placeCity].filter(Boolean).join(', ') }}</span>
        </div>
        <h1 class="text-4xl font-bold">{{ translation.title }}</h1>
        <p v-if="translation.subtitle" class="max-w-3xl text-lg opacity-75">{{ translation.subtitle }}</p>
      </header>

      <figure v-if="eventData.coverImageUrl" class="overflow-hidden rounded-[2rem] border border-base-300">
        <AppImage :src="eventData.coverImageUrl" :alt="translation.title" class="h-full w-full object-cover" sizes="(max-width: 1200px) 100vw, 1200px" loading="eager" fetchpriority="high" />
      </figure>

      <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div class="space-y-6">
          <div v-if="translation.excerpt" class="rounded-[2rem] border border-base-300 bg-base-200 p-6">
            <p class="leading-7">{{ translation.excerpt }}</p>
          </div>
          <PageRenderer :content="translation.content" :locale="locale" />
        </div>

        <aside class="space-y-4">
          <section class="rounded-[2rem] border border-base-300 bg-base-200 p-6">
            <h2 class="text-xl font-semibold">{{ locale === 'en' ? 'Event details' : 'Informations pratiques' }}</h2>
            <dl class="mt-4 space-y-3 text-sm">
              <div>
                <dt class="font-medium">{{ locale === 'en' ? 'Date' : 'Date' }}</dt>
                <dd class="opacity-75">{{ formattedDate }}</dd>
              </div>
              <div v-if="eventData.placeName || eventData.placeAddress || eventData.placeCity">
                <dt class="font-medium">{{ locale === 'en' ? 'Location' : 'Lieu' }}</dt>
                <dd class="opacity-75">{{ [eventData.placeName, eventData.placeAddress, eventData.placeCity].filter(Boolean).join(', ') }}</dd>
              </div>
              <div v-if="eventData.publicCapacity">
                <dt class="font-medium">{{ locale === 'en' ? 'Public capacity' : 'Capacité publique' }}</dt>
                <dd class="opacity-75">{{ eventData.publicCapacity }}</dd>
              </div>
              <div v-if="eventData.internalCapacity">
                <dt class="font-medium">{{ locale === 'en' ? 'Internal capacity' : 'Capacité interne' }}</dt>
                <dd class="opacity-75">{{ eventData.internalCapacity }}</dd>
              </div>
            </dl>
          </section>

          <section v-if="eventData.publicReservationEnabled" class="rounded-[2rem] border border-base-300 bg-base-100 p-6">
            <h2 class="text-xl font-semibold">{{ publicReservationLabel }}</h2>
            <div class="mt-4 space-y-3">
              <input v-model="reservationForm.customerName" class="input input-bordered w-full" :placeholder="locale === 'en' ? 'Full name' : 'Nom complet'" />
              <input v-model="reservationForm.email" type="email" class="input input-bordered w-full" placeholder="Email" />
              <input v-model="reservationForm.phone" type="tel" class="input input-bordered w-full" :placeholder="locale === 'en' ? 'Phone' : 'Téléphone'" />
              <input v-model.number="reservationForm.seats" type="number" min="1" class="input input-bordered w-full" :placeholder="locale === 'en' ? 'Seats' : 'Nombre de places'" />
              <textarea v-model="reservationForm.message" class="textarea textarea-bordered min-h-28 w-full" :placeholder="locale === 'en' ? 'Message' : 'Message'" />
              <button type="button" class="btn btn-primary w-full" :disabled="reservationSaving" @click="submitReservation">
                <span v-if="reservationSaving" class="loading loading-spinner loading-sm" />
                {{ publicReservationLabel }}
              </button>
            </div>
          </section>

          <section v-if="showParticipationForm" class="rounded-[2rem] border border-base-300 bg-base-100 p-6">
            <h2 class="text-xl font-semibold">{{ internalParticipationLabel }}</h2>
            <p v-if="participationInfo" class="mt-2 text-sm opacity-75">{{ participationInfo }}</p>
            <div class="mt-4 space-y-3">
              <textarea v-model="participationForm.message" class="textarea textarea-bordered min-h-28 w-full" :placeholder="locale === 'en' ? 'Message' : 'Message'" />
              <button type="button" class="btn btn-primary w-full" :disabled="participationSaving" @click="submitParticipation">
                <span v-if="participationSaving" class="loading loading-spinner loading-sm" />
                {{ internalParticipationLabel }}
              </button>
            </div>
          </section>
        </aside>
      </section>
    </article>
  </div>
</template>

<script setup lang="ts">
import PageRenderer from '~/components/page-builder/PageRenderer.vue'
import type { EventPayload } from '~/shared/events'
import type { CmsLocale } from '~/shared/cms'

definePageMeta({ layout: 'default' })

const route = useRoute()
const localePath = useLocalePath()
const { locale } = useI18n()
const authStore = useAuthStore()
const { $toast } = useNuxtApp() as any
const slug = computed(() => String(route.params.slug || ''))

const { data: eventData } = await useFetch<EventPayload>(() => `/api/events/${slug.value}`, {
  query: computed(() => ({ locale: locale.value })),
  onResponseError: () => {
    throw createError({ statusCode: 404, statusMessage: locale.value === 'en' ? 'Event not found' : 'Événement introuvable' })
  }
})

const translation = computed(() => {
  const item = eventData.value
  if (!item) {
    return { title: '', subtitle: '', excerpt: '', content: { version: 1, sections: [] } }
  }
  return (locale.value === 'en' ? item.translations.en : item.translations.fr) || item.translations.fr
})

const formattedDate = computed(() => eventData.value
  ? new Intl.DateTimeFormat(locale.value === 'en' ? 'en-GB' : 'fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(eventData.value.startsAt))
  : '')

const publicReservationLabel = computed(() => locale.value === 'en' ? 'Public reservation' : 'Réservation publique')
const internalParticipationLabel = computed(() => locale.value === 'en' ? 'Internal participation' : 'Participation interne')
const showParticipationForm = computed(() => {
  if (!authStore.isAuthenticated || !eventData.value?.internalParticipationEnabled) return false
  if (!eventData.value.audienceRoleIds.length) return true
  return authStore.user?.roleId != null && eventData.value.audienceRoleIds.includes(authStore.user.roleId)
})
const participationInfo = computed(() => locale.value === 'en'
  ? eventData.value?.internalParticipationInfo.en || ''
  : eventData.value?.internalParticipationInfo.fr || '')

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

const submitReservation = async () => {
  if (!eventData.value) return
  reservationSaving.value = true
  try {
    await $fetch(`/api/events/${eventData.value.slug}/reserve`, {
      method: 'POST',
      body: {
        ...reservationForm,
        locale: locale.value
      }
    })
    $toast?.success(locale.value === 'en' ? 'Reservation sent' : 'Réservation envoyée')
    reservationForm.customerName = ''
    reservationForm.email = ''
    reservationForm.phone = ''
    reservationForm.seats = 1
    reservationForm.message = ''
  } catch (error: any) {
    $toast?.error(error?.statusMessage || (locale.value === 'en' ? 'Unable to send reservation' : 'Impossible d’envoyer la réservation'))
  } finally {
    reservationSaving.value = false
  }
}

const submitParticipation = async () => {
  if (!eventData.value) return
  participationSaving.value = true
  try {
    await $fetch(`/api/events/${eventData.value.slug}/participate`, {
      method: 'POST',
      body: {
        ...participationForm,
        locale: locale.value
      }
    })
    $toast?.success(locale.value === 'en' ? 'Participation sent' : 'Participation envoyée')
    participationForm.message = ''
  } catch (error: any) {
    $toast?.error(error?.statusMessage || (locale.value === 'en' ? 'Unable to send participation' : 'Impossible d’envoyer la participation'))
  } finally {
    participationSaving.value = false
  }
}

usePageSeo({
  title: computed(() => translation.value.title || (locale.value === 'en' ? 'Events' : 'Événements')),
  description: computed(() => translation.value.excerpt || translation.value.subtitle || '')
})
</script>
