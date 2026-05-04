<template>
  <div>
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Reservations</h1>
        <p class="text-sm opacity-70">
          Les reservations passees ne sont plus affichees ici, mais restent comptabilisees dans le tableau de bord.
        </p>
      </div>

      <div class="tabs tabs-boxed">
        <button class="tab" :class="{ 'tab-active': viewMode === 'list' }" @click="viewMode = 'list'">
          <Icon name="mdi:format-list-bulleted" size="18" />
          Liste
        </button>
        <button class="tab" :class="{ 'tab-active': viewMode === 'calendar' }" @click="viewMode = 'calendar'">
          <Icon name="mdi:calendar-month" size="18" />
          Calendrier
        </button>
      </div>
    </div>

    <div v-if="viewMode === 'list'" class="mb-4 flex flex-wrap gap-2">
      <button
        v-for="filter in statusFilters"
        :key="filter.value"
        class="btn btn-sm"
        :class="selectedStatuses.includes(filter.value) ? filter.activeClass : 'btn-ghost'"
        @click="toggleStatusFilter(filter.value)"
      >
        {{ filter.label }}
      </button>
    </div>

    <div v-if="pending" class="loading loading-spinner" />

    <template v-else>
      <ReservationsList
        v-if="viewMode === 'list'"
        :reservations="paginatedReservations"
        :page="reservationPage"
        :total-pages="reservationTotalPages"
        :subscriptions-enabled="subscriptionsEnabled"
        :status-label="statusLabel"
        :badge-class="badgeClass"
        :format-price="$formatPrice"
        :format-date="$formatDate"
        :format-date-only="formatDateOnlyLabel"
        @confirm="openAction($event, 'confirmed')"
        @reject="openAction($event, 'rejected')"
        @cancel="openAction($event, 'cancelled')"
        @archive="archiveReservation"
        @select="openDetails"
        @update:page="reservationPage = $event"
      />

      <ReservationsCalendar
        v-else
        :days="calendarDays"
        :month-label="monthLabel"
        :month-input="monthInput"
        :show-month-picker="showMonthPicker"
        :day-names="dayNames"
        :event-class="calendarEventClass"
        @change-month="changeMonth"
        @toggle-month-picker="toggleMonthPicker"
        @apply-month-input="applyMonthInput"
        @go-current-month="goToCurrentMonth"
        @select-day="selectDay"
        @select-item="openDetailsFromCalendar"
        @change-day-page="setCalendarDayPage"
        @update:month-input="updateMonthInput"
      />
    </template>

    <dialog ref="detailsDlg" class="modal">
      <div class="modal-box max-w-5xl">
        <div v-if="detailsReservation">
          <div class="mb-3 flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-lg font-bold">{{ detailsReservation.customerName }}</h3>
                <span class="badge" :class="badgeClass(detailsReservation.status)">
                  {{ statusLabel(detailsReservation.status) }}
                </span>
                <span v-if="detailsReservation.archivedAt" class="badge badge-neutral">Archivee</span>
              </div>
              <p class="text-sm opacity-70">
                {{ detailsReservation.basket.name }} - {{ $formatPrice(detailsReservation.basket.finalPrice) }}
              </p>
            </div>

            <div class="badge badge-outline">
              {{ detailsReservation.googleCalendarEventId ? 'Google synchronise' : 'Pas synchronise' }}
            </div>
          </div>

          <div class="space-y-3 text-sm">
            <div>
              <a :href="`mailto:${detailsReservation.email}`" class="link">{{ detailsReservation.email }}</a>
              <span v-if="detailsReservation.phone"> · <a :href="`tel:${detailsReservation.phone}`" class="link">{{ detailsReservation.phone }}</a></span>
            </div>
            <div v-if="detailsReservation.message" class="rounded-xl bg-base-200 p-3 italic opacity-80">
              "{{ detailsReservation.message }}"
            </div>
            <div class="rounded-xl bg-base-200 p-3">
              <div><strong>Date :</strong> {{ formatDateOnlyLabel(detailsReservation.fulfillmentDate) }}</div>
              <div v-if="detailsReservation.fulfillmentTime"><strong>Heure :</strong> {{ detailsReservation.fulfillmentTime }}</div>
              <div v-if="deliveryWindowLabel(detailsReservation)"><strong>Fenetre de tournee :</strong> {{ deliveryWindowLabel(detailsReservation) }}</div>
              <div v-if="detailsReservation.fulfillmentLocation"><strong>Lieu :</strong> {{ detailsReservation.fulfillmentLocation }}</div>
            </div>

            <div v-if="subscriptionsEnabled && detailsReservation.monthlySubscription" class="rounded-xl bg-base-200 p-3">
              <div class="mb-3 font-semibold">Occurrences a venir</div>
              <div v-if="detailsReservation.occurrences?.length" class="space-y-2">
                <div
                  v-for="occurrence in paginatedDetailsOccurrences"
                  :key="occurrence.id"
                  class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-base-100 p-3"
                >
                  <div>
                    <div><strong>{{ formatDateOnlyLabel(occurrence.occurrenceDate) }}</strong></div>
                    <div class="mt-1">
                      <span class="badge badge-xs" :class="occurrenceStatusBadgeClass(occurrence.status)">
                        {{ occurrenceStatusLabel(occurrence.status) }}
                      </span>
                    </div>
                    <div class="mt-1 opacity-75">
                      {{ occurrence.occurrenceTime || detailsReservation.fulfillmentTime || 'Heure a confirmer' }}
                    </div>
                    <div v-if="!occurrence.occurrenceTime && !detailsReservation.fulfillmentTime && deliveryWindowLabel(detailsReservation)" class="opacity-75">
                      Fenetre de tournee : {{ deliveryWindowLabel(detailsReservation) }}
                    </div>
                    <div class="opacity-75">
                      {{ occurrence.occurrenceLocation || detailsReservation.fulfillmentLocation || 'Lieu a confirmer' }}
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button class="btn btn-xs btn-outline" @click="openOccurrenceEditor(detailsReservation, occurrence)">
                      {{ occurrence.status === 'CANCELLED' ? 'Reprogrammer' : 'Modifier' }}
                    </button>
                    <button
                      v-if="occurrence.status === 'SCHEDULED'"
                      class="btn btn-xs btn-warning btn-outline"
                      @click="cancelOccurrence(detailsReservation, occurrence)"
                    >
                      Annuler cette semaine
                    </button>
                  </div>
                </div>
              </div>
              <div v-else class="rounded-xl bg-base-100 p-3 text-sm opacity-70">
                Aucune occurrence a venir.
              </div>
              <div v-if="detailsOccurrenceTotalPages > 1" class="join mt-3 flex justify-center">
                <button class="btn join-item btn-xs" :disabled="detailsOccurrencePage === 1" @click="detailsOccurrencePage--">
                  <Icon name="mdi:chevron-left" size="14" />
                </button>
                <button class="btn join-item btn-xs no-animation">
                  {{ detailsOccurrencePage }} / {{ detailsOccurrenceTotalPages }}
                </button>
                <button class="btn join-item btn-xs" :disabled="detailsOccurrencePage === detailsOccurrenceTotalPages" @click="detailsOccurrencePage++">
                  <Icon name="mdi:chevron-right" size="14" />
                </button>
              </div>
            </div>

            <div v-if="detailsReservation.notifications?.length" class="rounded-xl bg-base-200 p-3">
              <div class="mb-3 font-semibold">Historique des emails et changements</div>
              <div class="space-y-2">
                <div
                  v-for="notification in paginatedDetailsNotifications"
                  :key="notification.id"
                  class="rounded-xl bg-base-100 p-3"
                >
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="font-medium">{{ notification.subject }}</div>
                    <div class="text-xs opacity-60">{{ $formatDate(notification.createdAt) }}</div>
                  </div>
                  <div class="text-xs uppercase opacity-60">{{ notificationKindLabel(notification.kind) }}</div>
                  <div class="mt-1 text-sm opacity-80">{{ notification.summary }}</div>
                </div>
              </div>
              <div v-if="detailsNotificationTotalPages > 1" class="join mt-3 flex justify-center">
                <button class="btn join-item btn-xs" :disabled="detailsNotificationPage === 1" @click="detailsNotificationPage--">
                  <Icon name="mdi:chevron-left" size="14" />
                </button>
                <button class="btn join-item btn-xs no-animation">
                  {{ detailsNotificationPage }} / {{ detailsNotificationTotalPages }}
                </button>
                <button class="btn join-item btn-xs" :disabled="detailsNotificationPage === detailsNotificationTotalPages" @click="detailsNotificationPage++">
                  <Icon name="mdi:chevron-right" size="14" />
                </button>
              </div>
            </div>
          </div>

          <div class="modal-action justify-between">
            <div class="flex flex-wrap gap-2">
              <template v-if="detailsReservation.status === 'PENDING' || detailsReservation.status === 'REJECTED' || detailsReservation.status === 'CANCELLED'">
                <button class="btn btn-sm btn-success" @click="openActionFromDetails('confirmed')">Confirmer</button>
                <button
                  v-if="detailsReservation.status === 'PENDING' || detailsReservation.status === 'CANCELLED'"
                  class="btn btn-sm btn-error btn-outline"
                  @click="openActionFromDetails('rejected')"
                >
                  Refuser
                </button>
              </template>
              <button
                v-if="detailsReservation.status === 'CONFIRMED'"
                class="btn btn-sm btn-primary btn-outline"
                @click="openActionFromDetails('confirmed')"
              >
                Modifier et renvoyer
              </button>
              <button
                v-if="detailsReservation.status === 'CONFIRMED'"
                class="btn btn-sm btn-warning"
                @click="openActionFromDetails('cancelled')"
              >
                Annuler la reservation
              </button>
              <button
                v-if="detailsReservation.status === 'CONFIRMED'"
                class="btn btn-sm btn-info btn-outline"
                :disabled="syncingCalendar"
                @click="syncReservationCalendar"
              >
                <span v-if="syncingCalendar" class="loading loading-spinner loading-xs" />
                Synchroniser Google Calendar
              </button>
              <button
                v-if="detailsReservation.status === 'REJECTED' || detailsReservation.status === 'CANCELLED'"
                class="btn btn-sm btn-neutral btn-outline"
                @click="archiveReservation(detailsReservation)"
              >
                Archiver
              </button>
            </div>

            <button class="btn btn-sm" @click="closeDetails">Fermer</button>
          </div>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <dialog ref="actionDlg" class="modal">
      <div class="modal-box max-w-2xl">
        <h3 class="mb-2 text-lg font-bold">{{ actionTitle }}</h3>
        <p class="mb-4 text-sm opacity-70">
          Email envoye a <strong>{{ current?.email }}</strong> via Google.
        </p>

        <div v-if="decisionAction === 'confirmed'" class="mb-4 grid gap-3 md:grid-cols-3">
          <div v-if="current?.deliveryType === 'FARM'" class="form-control md:col-span-3">
            <label class="label"><span class="label-text">Action sur le creneau ferme</span></label>
            <select v-model="scheduleMode" class="select select-bordered w-full">
              <option value="CONFIRM">Confirmer ce creneau</option>
              <option value="PROPOSE">Envoyer une contre-proposition</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Date</span></label>
            <input v-model="fulfillmentForm.date" type="date" class="input input-bordered" />
          </div>
          <div class="form-control md:col-span-2">
            <label class="label"><span class="label-text">Heure precise</span></label>
            <input v-model="fulfillmentForm.time" type="time" step="300" class="input input-bordered" />
          </div>
          <div v-if="current?.deliveryType === 'TOUR' && current?.deliveryTour" class="form-control md:col-span-3">
            <label class="label"><span class="label-text">Fenetre de tournee</span></label>
            <div class="input input-bordered flex items-center bg-base-200/60">
              {{ current.deliveryTour.startTime }}-{{ current.deliveryTour.endTime }}
            </div>
          </div>
          <div class="form-control md:col-span-3">
            <label class="label"><span class="label-text">Lieu</span></label>
            <textarea v-model="fulfillmentForm.location" rows="2" class="textarea textarea-bordered w-full" />
          </div>
          <p class="md:col-span-3 text-xs opacity-70">
            {{ current?.deliveryType === 'FARM' && scheduleMode === 'PROPOSE'
              ? 'Le client recevra un email pour accepter ce creneau ou en proposer un autre.'
              : 'Si un calendrier Google est selectionne dans les parametres et qu une date est renseignee, la reservation confirmee sera ajoutee automatiquement.' }}
          </p>
        </div>

        <div v-if="decisionAction !== 'confirmed'" class="form-control mb-3">
          <label class="label">
            <span class="label-text">
              {{ decisionAction === 'cancelled' ? "Raison visible dans l'email d'annulation" : "Raison visible dans l'email" }}
            </span>
          </label>
          <input v-model="adminNote" class="input input-bordered w-full" placeholder="Ex : Demande du client" />
        </div>

        <div class="grid grid-cols-1 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Sujet</span>
              <button type="button" class="label-text-alt link" @click="reloadPreview">Recharger le modele</button>
            </label>
            <input v-model="emailDraft.subject" class="input input-bordered w-full" />
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">Message</span></label>
            <textarea v-model="emailDraft.body" rows="14" class="textarea textarea-bordered w-full font-mono text-sm" />
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="closeAction">Annuler</button>
          <button class="btn" :class="actionButtonClass" :disabled="sending" @click="submit">
            <span v-if="sending" class="loading loading-spinner loading-sm" />
            {{ actionButtonLabel }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>

    <dialog ref="occurrenceDlg" class="modal">
      <div class="modal-box max-w-2xl">
        <h3 class="mb-4 text-lg font-bold">Modifier cette occurrence</h3>

        <div v-if="currentOccurrence" class="mb-4 rounded-xl bg-base-200 p-3 text-sm">
          <div class="font-medium">Occurrence actuelle</div>
          <div class="mt-1"><strong>Date :</strong> {{ formatDateOnlyLabel(currentOccurrence.occurrenceDate) }}</div>
          <div><strong>Heure :</strong> {{ currentOccurrence.occurrenceTime || detailsReservation?.fulfillmentTime || 'Heure a confirmer' }}</div>
          <div><strong>Lieu :</strong> {{ currentOccurrence.occurrenceLocation || detailsReservation?.fulfillmentLocation || 'Lieu a confirmer' }}</div>
        </div>

        <div class="grid gap-3 md:grid-cols-4">
          <div class="form-control md:col-span-2">
            <label class="label"><span class="label-text">Date</span></label>
            <input v-model="occurrenceForm.date" type="date" class="input input-bordered" />
          </div>
          <div class="form-control md:col-span-2">
            <label class="label"><span class="label-text">Heure</span></label>
            <input v-model="occurrenceForm.time" type="time" step="300" class="input input-bordered" />
          </div>
          <div class="form-control md:col-span-4">
            <label class="label"><span class="label-text">Lieu</span></label>
            <input v-model="occurrenceForm.location" class="input input-bordered w-full" />
          </div>
        </div>

        <div class="mt-4 grid gap-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Sujet</span></label>
            <input v-model="occurrenceEmailDraft.subject" class="input input-bordered w-full" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Message</span></label>
            <textarea v-model="occurrenceEmailDraft.body" rows="10" class="textarea textarea-bordered w-full font-mono text-sm" />
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="closeOccurrenceEditor">Annuler</button>
          <button class="btn btn-primary" :disabled="savingOccurrence" @click="saveOccurrence">
            <span v-if="savingOccurrence" class="loading loading-spinner loading-sm" />
            Enregistrer et envoyer
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, h } from 'vue'
import type { PropType } from 'vue'
import ReservationsCalendar from '~/components/admin/ReservationsCalendar.vue'
import ReservationsList from '~/components/admin/ReservationsList.vue'

definePageMeta({ layout: 'admin', middleware: 'auth' })
const route = useRoute()

interface Reservation {
  id: number
  customerName: string
  email: string
  phone: string | null
  message: string | null
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED'
  adminNote: string | null
  createdAt: string
  confirmedAt: string | null
  archivedAt?: string | null
  basket: { id: number; name: string; finalPrice: number }
  deliveryType: string | null
  deliveryAddress: string | null
  deliveryCity: string | null
  deliveryPostalCode: string | null
  fulfillmentDate: string | null
  fulfillmentTime: string | null
  fulfillmentLocation: string | null
  monthlySubscription: boolean
  subscriptionActive: boolean
  subscriptionCancelledAt: string | null
  googleCalendarEventId: string | null
  googleCalendarSyncedAt: string | null
  displayDate?: string | null
  displayTime?: string | null
  displayLocation?: string | null
  nextOccurrence?: {
    id: number
    occurrenceDate: string
    occurrenceTime: string | null
    occurrenceLocation: string | null
    status: 'SCHEDULED' | 'CANCELLED'
  } | null
  occurrences: Array<{
    id: number
    occurrenceDate: string
    originalOccurrenceDate?: string | null
    occurrenceTime: string | null
    occurrenceLocation: string | null
    status: 'SCHEDULED' | 'CANCELLED'
    customSchedule: boolean
    cancelledAt: string | null
    cancellationReason: string | null
  }>
  notifications: Array<{
    id: number
    kind: string
    recipientEmail: string
    subject: string
    summary: string | null
    createdAt: string
    occurrenceId: number | null
  }>
  pickupPoint: { id: number; name: string; address: string | null } | null
  deliveryTour: { id: number; name: string; dayOfWeek: number; startTime: string; endTime: string; monthlyPrice: number | null; cities: string[] } | null
}

type DecisionAction = 'confirmed' | 'rejected' | 'cancelled'

interface Pagination {
  page: number
  perPage: number
  total: number
  totalPages: number
}

interface CalendarDay {
  iso: string
  dayNumber: number
  inCurrentMonth: boolean
  isToday: boolean
  page: number
  perPage: number
  total: number
  totalPages: number
  items: Array<{
    id: string
    reservationId: number
    occurrenceId: number | null
    customerName: string
    status: string
    basket: { id: number; name: string; finalPrice: number }
    date: string
    time: string | null
    location: string | null
  }>
}

type ReservationDetails = Reservation & {
  occurrencePagination: Pagination
  notificationPagination: Pagination
}

const { $toast, $formatPrice, $formatDate } = useNuxtApp() as any
const { data: siteConfig } = await useFetch<{ subscriptionsEnabled?: boolean }>('/api/site-config')
const subscriptionsEnabled = computed(() => siteConfig.value?.subscriptionsEnabled ?? false)

const detailsDlg = ref<HTMLDialogElement>()
const actionDlg = ref<HTMLDialogElement>()
const current = ref<Reservation | null>(null)
const detailsReservation = ref<ReservationDetails | null>(null)
const occurrenceDlg = ref<HTMLDialogElement>()
const currentOccurrence = ref<Reservation['occurrences'][number] | null>(null)
const decisionAction = ref<DecisionAction>('confirmed')
const adminNote = ref('')
const emailDraft = reactive({ subject: '', body: '' })
const fulfillmentForm = reactive({ date: '', time: '', location: '' })
const sending = ref(false)
const scheduleMode = ref<'CONFIRM' | 'PROPOSE'>('CONFIRM')
const syncingCalendar = ref(false)
const savingOccurrence = ref(false)
const viewMode = ref<'list' | 'calendar'>('list')
const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const showMonthPicker = ref(false)
const occurrenceEmailDraft = reactive({ subject: '', body: '' })
const occurrenceForm = reactive({ date: '', time: '', location: '' })
const reservationPage = ref(1)
const reservationsPerPage = 10
const detailsOccurrencePage = ref(1)
const detailsOccurrencesPerPage = 10
const detailsNotificationPage = ref(1)
const detailsNotificationsPerPage = 5
const calendarDayPages = reactive<Record<string, number>>({})
const calendarItemsPerPage = 3
const calendarPageVersion = ref(0)
const calendarMonth = ref(startOfMonth(new Date()))
const selectedStatuses = ref(['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED'])
const statusFilters = [
  { value: 'PENDING', label: 'En attente', activeClass: 'btn-warning' },
  { value: 'CONFIRMED', label: 'Confirmees', activeClass: 'btn-success' },
  { value: 'CANCELLED', label: 'Annulees', activeClass: 'btn-warning' },
  { value: 'REJECTED', label: 'Refusees', activeClass: 'btn-error' },
  { value: 'ARCHIVED', label: 'Archivees', activeClass: 'btn-neutral' }
]

const calendarMonthParam = computed(() => {
  const year = calendarMonth.value.getFullYear()
  const month = String(calendarMonth.value.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
})

const reservationsQuery = computed(() => {
  if (viewMode.value === 'calendar') {
    calendarPageVersion.value
    return {
      mode: 'calendar',
      month: calendarMonthParam.value,
      perDayLimit: calendarItemsPerPage,
      dayPages: JSON.stringify(calendarDayPages)
    }
  }

  return {
    mode: 'list',
    page: reservationPage.value,
    limit: reservationsPerPage,
    statuses: selectedStatuses.value.join(',')
  }
})

const { data: reservationsResponse, pending, refresh } = await useFetch<{
  mode: 'list' | 'calendar'
  items?: Reservation[]
  pagination?: Pagination
  days?: CalendarDay[]
}>('/api/admin/reservations', {
  query: reservationsQuery,
  watch: [reservationsQuery]
})

const reservations = computed(() => reservationsResponse.value?.items ?? [])
const calendarDays = computed(() => reservationsResponse.value?.days ?? [])
const reservationTotalPages = computed(() => reservationsResponse.value?.pagination?.totalPages ?? 1)
const paginatedReservations = computed(() => reservations.value)

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const statusLabel = (s: string) => ({
  PENDING: 'En attente',
  CONFIRMED: 'Confirmee',
  REJECTED: 'Refusee',
  CANCELLED: 'Annulee',
  ARCHIVED: 'Archivee'
} as Record<string, string>)[s] ?? s

const occurrenceStatusLabel = (s: string) => ({
  SCHEDULED: 'Planifiee',
  CANCELLED: 'Annulee'
} as Record<string, string>)[s] ?? s

const notificationKindLabel = (kind: string) => ({
  CONFIRMED: 'Reservation confirmee',
  UPDATED: 'Reservation mise a jour',
  REJECTED: 'Reservation refusee',
  CANCELLED: 'Reservation annulee',
  OCCURRENCE_UPDATED: 'Occurrence mise a jour',
  OCCURRENCE_CANCELLED: 'Occurrence annulee',
  CUSTOMER_CANCELLED: 'Annulation client',
  CUSTOMER_STOPPED_SUBSCRIPTION: 'Abonnement arrete par le client',
  CUSTOMER_CANCELLED_OCCURRENCE: 'Occurrence annulee par le client',
  ADMIN_NOTIFIED_CUSTOMER_CANCEL: 'Admin notifie',
  ADMIN_NOTIFIED_CUSTOMER_STOP: 'Admin notifie'
} as Record<string, string>)[kind] ?? kind.replace(/_/g, ' ').toLowerCase()

const badgeClass = (s: string) => ({
  PENDING: 'badge-warning',
  CONFIRMED: 'badge-success',
  REJECTED: 'badge-error',
  CANCELLED: 'badge-ghost',
  ARCHIVED: 'badge-neutral'
} as Record<string, string>)[s] ?? 'badge-ghost'

const occurrenceStatusBadgeClass = (s: string) => ({
  SCHEDULED: 'badge-success',
  CANCELLED: 'badge-warning'
} as Record<string, string>)[s] ?? 'badge-ghost'

const calendarEventClass = (s: string) => ({
  PENDING: 'bg-warning text-warning-content',
  CONFIRMED: 'bg-success text-success-content',
  REJECTED: 'bg-error text-error-content',
  CANCELLED: 'bg-neutral text-neutral-content'
} as Record<string, string>)[s] ?? 'bg-neutral text-neutral-content'

const formatDateInput = (value: string | null) => value ? value.slice(0, 10) : ''

const normalizeTimeInput = (value: string | null) => {
  if (!value) return ''
  const normalized = value.trim().replace('h', ':')
  return /^\d{2}:\d{2}$/.test(normalized) ? normalized : value
}

const formatDateLabel = (value: string | null) => value ? $formatDate(value) : ''

const formatDateOnlyLabel = (value: string | null) => {
  if (!value) return ''
  return new Date(value).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const detailsOccurrenceTotalPages = computed(() =>
  (detailsReservation.value as ReservationDetails | null)?.occurrencePagination.totalPages ?? 1
)

const paginatedDetailsOccurrences = computed(() =>
  detailsReservation.value?.occurrences ?? []
)

const detailsNotificationTotalPages = computed(() =>
  (detailsReservation.value as ReservationDetails | null)?.notificationPagination.totalPages ?? 1
)

const paginatedDetailsNotifications = computed(() =>
  detailsReservation.value?.notifications ?? []
)

const setCalendarDayPage = (day: { iso: string; totalPages?: number }, page: number) => {
  const total = day.totalPages ?? 1
  calendarDayPages[day.iso] = Math.min(Math.max(page, 1), total)
  calendarPageVersion.value++
}

const reservationCalendarDate = (reservation: Reservation) => {
  const source = reservation.fulfillmentDate ?? reservation.createdAt
  return new Date(source)
}

const reservationDateLabel = (reservation: Reservation) => {
  const source = reservation.fulfillmentDate ?? reservation.createdAt
  return formatDateOnlyLabel(source)
}

const deliveryWindowLabel = (reservation: Pick<Reservation, 'deliveryType' | 'deliveryTour' | 'pickupPoint'>) => {
  if (reservation.deliveryType === 'TOUR' && reservation.deliveryTour) {
    return `${reservation.deliveryTour.startTime}-${reservation.deliveryTour.endTime}`
  }

  if (reservation.deliveryType === 'PICKUP' && reservation.pickupPoint) {
    return ''
  }

  return ''
}

const monthLabel = computed(() =>
  calendarMonth.value.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
)

const monthInput = computed({
  get: () => {
    const year = calendarMonth.value.getFullYear()
    const month = String(calendarMonth.value.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  },
  set: (value: string) => {
    if (!value) return
    const [year, month] = value.split('-').map(Number)
    if (!year || !month) return
    calendarMonth.value = new Date(year, month - 1, 1)
  }
})

const buildOccurrenceEmailBody = (
  reservation: Reservation,
  occurrence: Reservation['occurrences'][number],
  date: string,
  time: string,
  location: string
) => {
  const previousDate = formatDateOnlyLabel(occurrence.occurrenceDate)
  const previousTime = occurrence.occurrenceTime || reservation.fulfillmentTime || 'heure a confirmer'
  const previousLocation = occurrence.occurrenceLocation || reservation.fulfillmentLocation || 'lieu a confirmer'
  const nextDate = formatDateOnlyLabel(date || null)
  const nextTime = time || reservation.fulfillmentTime || 'heure a confirmer'
  const nextLocation = location || reservation.fulfillmentLocation || 'lieu a confirmer'

  return `Bonjour ${reservation.customerName},

Votre reservation du panier "${reservation.basket.name}" prevue le ${previousDate} a ${previousTime} a ete modifiee.

Nouveaux details :
- Date : ${nextDate}
- Heure : ${nextTime}
- Lieu : ${nextLocation}

Anciens details :
- Date : ${previousDate}
- Heure : ${previousTime}
- Lieu : ${previousLocation}`
}

const actionTitle = computed(() => ({
  confirmed: current.value?.deliveryType === 'FARM' && scheduleMode.value === 'PROPOSE'
    ? 'Envoyer une contre-proposition'
    : current.value?.status === 'CONFIRMED' ? 'Mettre a jour la reservation' : 'Confirmer la reservation',
  rejected: 'Refuser la reservation',
  cancelled: 'Annuler la reservation'
} as Record<DecisionAction, string>)[decisionAction.value])

const actionButtonLabel = computed(() => ({
  confirmed: current.value?.deliveryType === 'FARM' && scheduleMode.value === 'PROPOSE'
    ? 'Envoyer la proposition'
    : current.value?.status === 'CONFIRMED' ? 'Mettre a jour et envoyer' : 'Confirmer et envoyer',
  rejected: 'Refuser et envoyer',
  cancelled: 'Annuler et envoyer'
} as Record<DecisionAction, string>)[decisionAction.value])

const actionButtonClass = computed(() => ({
  confirmed: 'btn-success',
  rejected: 'btn-error',
  cancelled: 'btn-warning'
} as Record<DecisionAction, string>)[decisionAction.value])

const loadPreview = async () => {
  if (!current.value) return
  const previewAction = decisionAction.value === 'confirmed' && current.value.deliveryType === 'FARM' && scheduleMode.value === 'PROPOSE'
    ? 'proposed'
    : decisionAction.value
  const params = new URLSearchParams({ action: previewAction })
  if (decisionAction.value === 'confirmed') {
    if (fulfillmentForm.date) params.set('fulfillmentDate', fulfillmentForm.date)
    if (fulfillmentForm.time) params.set('fulfillmentTime', fulfillmentForm.time)
    if (fulfillmentForm.location) params.set('fulfillmentLocation', fulfillmentForm.location)
  } else if (adminNote.value) {
    params.set('adminNote', adminNote.value)
  }
  const preview = await $fetch<{ subject: string; body: string }>(
    `/api/admin/reservations/${current.value.id}/preview?${params.toString()}`
  )
  emailDraft.subject = preview.subject
  emailDraft.body = preview.body
}

const openAction = async (reservation: Reservation, action: DecisionAction) => {
  current.value = reservation
  decisionAction.value = action
  scheduleMode.value = 'CONFIRM'
  adminNote.value = reservation.adminNote ?? ''
  fulfillmentForm.date = formatDateInput(reservation.fulfillmentDate)
  fulfillmentForm.time = normalizeTimeInput(reservation.fulfillmentTime)
  fulfillmentForm.location = reservation.fulfillmentLocation ?? ''
  await loadPreview()
  actionDlg.value?.showModal()
}

const loadDetails = async (reservationId = detailsReservation.value?.id) => {
  if (!reservationId) return
  detailsReservation.value = await $fetch<ReservationDetails>(`/api/admin/reservations/${reservationId}`, {
    query: {
      occurrencePage: detailsOccurrencePage.value,
      occurrenceLimit: detailsOccurrencesPerPage,
      notificationPage: detailsNotificationPage.value,
      notificationLimit: detailsNotificationsPerPage
    }
  })
}

const openDetails = async (reservation: Reservation) => {
  detailsOccurrencePage.value = 1
  detailsNotificationPage.value = 1
  await loadDetails(reservation.id)
  detailsDlg.value?.showModal()
}

const openDetailsById = async (reservationId: number) => {
  detailsOccurrencePage.value = 1
  detailsNotificationPage.value = 1
  await loadDetails(reservationId)
  detailsDlg.value?.showModal()
}

const openOccurrenceEditor = (reservation: Reservation, occurrence: Reservation['occurrences'][number]) => {
  currentOccurrence.value = occurrence
  occurrenceForm.date = formatDateInput(occurrence.occurrenceDate)
  occurrenceForm.time = normalizeTimeInput(occurrence.occurrenceTime)
  occurrenceForm.location = occurrence.occurrenceLocation ?? ''
  occurrenceEmailDraft.subject = `Mise a jour de votre reservation - ${reservation.basket.name}`
  occurrenceEmailDraft.body = buildOccurrenceEmailBody(
    reservation,
    occurrence,
    occurrenceForm.date,
    occurrenceForm.time,
    occurrenceForm.location
  )
  occurrenceDlg.value?.showModal()
}

const closeOccurrenceEditor = () => occurrenceDlg.value?.close()

const closeDetails = () => detailsDlg.value?.close()
const closeAction = () => actionDlg.value?.close()
const reloadPreview = () => loadPreview()

const openActionFromDetails = async (action: DecisionAction) => {
  if (!detailsReservation.value) return
  closeDetails()
  await openAction(detailsReservation.value, action)
}

const changeMonth = (offset: number) => {
  showMonthPicker.value = false
  calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() + offset, 1)
}

const goToCurrentMonth = () => {
  showMonthPicker.value = false
  calendarMonth.value = startOfMonth(new Date())
}

const toggleMonthPicker = () => {
  showMonthPicker.value = !showMonthPicker.value
}

const applyMonthInput = () => {
  showMonthPicker.value = false
}

const updateMonthInput = (value: string) => {
  monthInput.value = value
}

const selectDay = (day: CalendarDay) => {
  showMonthPicker.value = false
  if (day.items[0]) {
    openDetailsById(day.items[0].reservationId)
  }
}

const openDetailsFromCalendar = (item: CalendarDay['items'][number]) => {
  openDetailsById(item.reservationId)
}

const toggleStatusFilter = (status: string) => {
  const next = selectedStatuses.value.includes(status)
    ? selectedStatuses.value.filter((value) => value !== status)
    : [...selectedStatuses.value, status]

  selectedStatuses.value = next.length ? next : ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED']
  reservationPage.value = 1
}

watch(
  () => [fulfillmentForm.date, fulfillmentForm.time, fulfillmentForm.location, decisionAction.value, scheduleMode.value] as const,
  () => {
    if (decisionAction.value === 'confirmed' && current.value) {
      loadPreview()
    }
  }
)

watch(adminNote, () => {
  if (decisionAction.value !== 'confirmed' && current.value) {
    loadPreview()
  }
})

watch(
  () => [occurrenceForm.date, occurrenceForm.time, occurrenceForm.location] as const,
  () => {
    if (!detailsReservation.value || !currentOccurrence.value) return
    occurrenceEmailDraft.body = buildOccurrenceEmailBody(
      detailsReservation.value,
      currentOccurrence.value,
      occurrenceForm.date,
      occurrenceForm.time,
      occurrenceForm.location
    )
  }
)

watch([detailsOccurrencePage, detailsNotificationPage], () => {
  if (detailsReservation.value) {
    loadDetails()
  }
})

watch(
  () => route.query.open,
  async (value) => {
    const reservationId = Number(value)
    if (!reservationId || Number.isNaN(reservationId) || pending.value) return
    await openDetailsById(reservationId)
  },
  { immediate: true }
)

const syncReservationCalendar = async () => {
  if (!detailsReservation.value) return
  syncingCalendar.value = true
  try {
    await $fetch(`/api/admin/reservations/${detailsReservation.value.id}/sync-calendar`, { method: 'POST' })
    $toast.success('Reservation synchronisee dans Google Calendar')
    await refresh()
    await loadDetails()
  } catch (e: any) {
    $toast.error(e.statusMessage || 'Synchronisation Google Calendar impossible')
  } finally {
    syncingCalendar.value = false
  }
}

const saveOccurrence = async () => {
  if (!detailsReservation.value || !currentOccurrence.value) return
  savingOccurrence.value = true
  try {
    await $fetch(`/api/admin/reservation-occurrences/${currentOccurrence.value.id}/update`, {
      method: 'POST',
      body: {
        occurrenceDate: occurrenceForm.date,
        occurrenceTime: occurrenceForm.time || null,
        occurrenceLocation: occurrenceForm.location || null,
        email: { subject: occurrenceEmailDraft.subject, body: occurrenceEmailDraft.body }
      }
    })
    $toast.success('Occurrence mise a jour et email envoye')
    closeOccurrenceEditor()
    await refresh()
    await loadDetails()
  } catch (e: any) {
    $toast.error(e.statusMessage || 'Impossible de mettre a jour cette occurrence')
  } finally {
    savingOccurrence.value = false
  }
}

const cancelOccurrence = async (reservation: Reservation, occurrence: Reservation['occurrences'][number]) => {
  const confirmed = confirm('Annuler uniquement cette occurrence ?')
  if (!confirmed) return
  try {
    await $fetch(`/api/admin/reservation-occurrences/${occurrence.id}/cancel`, {
      method: 'POST',
      body: {
        email: {
          subject: `Annulation de cette semaine - ${reservation.basket.name}`,
          body: `Bonjour ${reservation.customerName},

Cette occurrence de votre reservation a ete annulee pour cette semaine uniquement.`
        }
      }
    })
    $toast.success('Occurrence annulee et email envoye')
    await refresh()
    await loadDetails(reservation.id)
  } catch (e: any) {
    $toast.error(e.statusMessage || 'Impossible d annuler cette occurrence')
  }
}

const archiveReservation = async (reservation: Reservation) => {
  const confirmed = confirm('Archiver cette reservation pour la retirer de la liste ?')
  if (!confirmed) return

  try {
    await $fetch(`/api/admin/reservations/${reservation.id}/archive`, { method: 'POST' })
    $toast.success('Reservation archivee')

    if (detailsReservation.value?.id === reservation.id) {
      closeDetails()
    }

    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || 'Impossible d archiver cette reservation')
  }
}

const submit = async () => {
  if (!current.value) return
  sending.value = true
  try {
    const response = await $fetch<{ calendarSynced?: boolean; calendarRemoved?: boolean; calendarReason?: string | null; proposalPending?: boolean }>(
      `/api/admin/reservations/${current.value.id}/decide`,
      {
        method: 'POST',
        body: {
          decision: decisionAction.value.toUpperCase(),
          scheduleMode: decisionAction.value === 'confirmed' ? scheduleMode.value : undefined,
          adminNote: adminNote.value || null,
          fulfillmentDate: decisionAction.value === 'confirmed' ? fulfillmentForm.date || null : null,
          fulfillmentTime: decisionAction.value === 'confirmed' ? fulfillmentForm.time || null : null,
          fulfillmentLocation: decisionAction.value === 'confirmed' ? fulfillmentForm.location || null : null,
          email: { subject: emailDraft.subject, body: emailDraft.body }
        }
      }
    )

    if (decisionAction.value === 'confirmed' && response.proposalPending) {
      $toast.success('Contre-proposition envoyee au client')
    } else if (decisionAction.value === 'confirmed') {
      $toast.success(response.calendarSynced
        ? 'Reservation confirmee, email envoye et agenda synchronise'
        : 'Reservation confirmee et email envoye')
      if (!response.calendarSynced && response.calendarReason) {
        $toast.info(response.calendarReason)
      }
    } else if (decisionAction.value === 'cancelled') {
      $toast.success(response.calendarRemoved
        ? 'Reservation annulee, email envoye et evenement retire du calendrier'
        : 'Reservation annulee et email envoye')
    } else {
      $toast.success(response.calendarRemoved
        ? 'Reservation refusee, email envoye et evenement retire du calendrier'
        : 'Reservation refusee et email envoye')
    }

    closeAction()
    await refresh()
    if (detailsReservation.value) {
      await loadDetails(current.value.id)
    }
  } catch (e: any) {
    $toast.error(e.statusMessage || 'Erreur pendant l action')
  } finally {
    sending.value = false
  }
}

const ReservationSummary = defineComponent({
  props: {
    reservation: { type: Object as PropType<Reservation>, required: true },
    badgeClass: { type: Function as PropType<(status: string) => string>, required: true },
    statusLabel: { type: Function as PropType<(status: string) => string>, required: true },
    formatDateInput: { type: Function as PropType<(value: string | null) => string>, required: true },
    formatPrice: { type: Function as PropType<(value: number) => string>, required: true },
    formatDate: { type: Function as PropType<(value: string | null) => string>, required: true }
  },
  emits: ['confirm', 'reject', 'cancel', 'archive', 'select'],
  setup(props, { emit }) {
    return () => h('div', { class: 'flex flex-wrap items-start justify-between gap-2' }, [
      h('div', { class: 'cursor-pointer', onClick: () => emit('select') }, [
        h('div', { class: 'flex items-center gap-2' }, [
          h('h2', { class: 'font-bold' }, props.reservation.customerName),
          h('span', { class: `badge ${props.badgeClass(props.reservation.status)}` }, props.statusLabel(props.reservation.status)),
          props.reservation.googleCalendarEventId
            ? h('span', { class: 'badge badge-info badge-outline' }, 'Google')
            : null
        ]),
        h('p', { class: 'text-sm opacity-70' }, `${props.reservation.basket.name} - ${props.formatPrice(props.reservation.basket.finalPrice)} - ${props.formatDate(props.reservation.createdAt)}`),
        h('p', { class: 'text-sm' }, [
          h('a', { href: `mailto:${props.reservation.email}`, class: 'link' }, props.reservation.email),
          props.reservation.phone ? ` · ${props.reservation.phone}` : ''
        ]),
        props.reservation.message ? h('p', { class: 'mt-2 text-sm italic opacity-80' }, `"${props.reservation.message}"`) : null,
        props.reservation.deliveryType ? h('div', { class: 'mt-2 space-y-1 rounded bg-base-300 p-2 text-sm' }, [
          h('div', { class: 'font-medium' },
            props.reservation.deliveryType === 'TOUR'
              ? 'Livraison (tournee)'
              : props.reservation.deliveryType === 'FARM'
                ? 'Retrait a la ferme'
                : 'Retrait en point relais'
          ),
          props.reservation.deliveryType === 'PICKUP' && props.reservation.pickupPoint
            ? h('div', { class: 'opacity-80' }, `${props.reservation.pickupPoint.name}${props.reservation.pickupPoint.address ? ` - ${props.reservation.pickupPoint.address}` : ''}`)
            : null,
          props.reservation.deliveryType === 'TOUR' && props.reservation.deliveryTour
            ? h('div', { class: 'opacity-80' }, `${props.reservation.deliveryTour.name} - ${props.reservation.deliveryTour.startTime}-${props.reservation.deliveryTour.endTime}`)
            : null,
          props.reservation.deliveryAddress ? h('div', { class: 'opacity-80' }, props.reservation.deliveryAddress) : null,
          props.reservation.deliveryCity
            ? h('div', { class: 'opacity-80' }, `${props.reservation.deliveryCity}${props.reservation.deliveryPostalCode ? ` ${props.reservation.deliveryPostalCode}` : ''}`)
            : null,
          props.reservation.monthlySubscription
            ? h('div', { class: 'text-success' }, `Abonnement mensuel${props.reservation.deliveryTour?.monthlyPrice ? ` - ${props.formatPrice(props.reservation.deliveryTour.monthlyPrice)}/mois` : ''}`)
            : null,
          props.reservation.fulfillmentDate || props.reservation.fulfillmentTime || props.reservation.fulfillmentLocation
            ? h('div', { class: 'mt-2 rounded-box bg-base-100 p-2' }, [
                props.reservation.fulfillmentDate ? h('div', [h('strong', 'Date : '), props.formatDateInput(props.reservation.fulfillmentDate)]) : null,
                props.reservation.fulfillmentTime ? h('div', [h('strong', 'Heure : '), props.reservation.fulfillmentTime]) : null,
                props.reservation.deliveryType === 'TOUR' && props.reservation.deliveryTour
                  ? h('div', [h('strong', 'Fenetre de tournee : '), `${props.reservation.deliveryTour.startTime}-${props.reservation.deliveryTour.endTime}`])
                  : null,
                props.reservation.fulfillmentLocation ? h('div', [h('strong', 'Lieu : '), props.reservation.fulfillmentLocation]) : null
              ])
            : null
        ]) : null
      ]),
      h('div', { class: 'flex gap-2' }, [
        ['PENDING', 'REJECTED', 'CANCELLED'].includes(props.reservation.status)
          ? h('button', { class: 'btn btn-sm btn-success', onClick: () => emit('confirm') }, 'Confirmer')
          : null,
        ['PENDING', 'CANCELLED'].includes(props.reservation.status)
          ? h('button', { class: 'btn btn-sm btn-error btn-outline', onClick: () => emit('reject') }, 'Refuser')
          : null,
        props.reservation.status === 'CONFIRMED'
          ? h('button', { class: 'btn btn-sm btn-primary btn-outline', onClick: () => emit('confirm') }, 'Modifier')
          : null,
        props.reservation.status === 'CONFIRMED'
          ? h('button', { class: 'btn btn-sm btn-warning btn-outline', onClick: () => emit('cancel') }, 'Annuler')
          : null,
        ['REJECTED', 'CANCELLED'].includes(props.reservation.status)
          ? h('button', { class: 'btn btn-sm btn-neutral btn-outline', onClick: () => emit('archive') }, 'Archiver')
          : null
      ])
    ])
  }
})
</script>
