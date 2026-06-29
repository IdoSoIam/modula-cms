<template>
  <div class="mx-auto min-h-[calc(100vh-280px)] w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
    <div class="card border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body">
        <h1 class="text-3xl font-bold">{{ publicText('orders.manage.title', 'Gérer ma commande') }}</h1>

        <div v-if="pending" class="py-10 text-center">
          <span class="loading loading-spinner loading-lg" />
        </div>

        <template v-else-if="reservation">
          <p class="opacity-75">
            {{ introText }}
          </p>

          <div class="mt-6 rounded-2xl bg-base-200 p-5 text-sm">
            <div><strong>{{ publicText('orders.manage.summaryBasket', 'Panier') }}</strong> {{ reservation.basket.name }}</div>
            <div><strong>{{ publicText('orders.manage.summaryName', 'Nom') }}</strong> {{ reservation.customerName }}</div>
            <div><strong>{{ publicText('orders.manage.summaryStatus', 'Statut') }}</strong> {{ statusLabel(reservation.status) }}</div>
            <div v-if="reservation.fulfillmentDate"><strong>{{ publicText('orders.manage.summaryDate', 'Date') }}</strong> {{ formatDate(reservation.fulfillmentDate) }}</div>
            <div v-if="reservation.fulfillmentTime"><strong>{{ publicText('orders.manage.summaryTime', 'Heure') }}</strong> {{ reservation.fulfillmentTime }}</div>
            <div v-if="reservation.fulfillmentLocation"><strong>{{ publicText('orders.manage.summaryLocation', 'Lieu') }}</strong> {{ reservation.fulfillmentLocation }}</div>
          </div>

          <div v-if="reservation.status === 'CANCELLED'" class="alert alert-info mt-6">
            {{ subscriptionsEnabled && reservation.monthlySubscription
              ? publicText('orders.manage.subscriptionStopped', 'L’abonnement a été arrêté.')
              : publicText('orders.manage.reservationCancelled', 'La commande a été annulée.') }}
          </div>

          <div v-else-if="subscriptionsEnabled && reservation.monthlySubscription && !reservation.subscriptionActive" class="alert alert-info mt-6">
            {{ publicText('orders.manage.subscriptionInactive', 'L’abonnement est inactif.') }}
          </div>

          <div v-else-if="reservation.deliveryType === 'ONSITE' && reservation.scheduleProposalPendingBy === 'CUSTOMER'" class="mt-6 space-y-4">
            <div class="alert alert-info">
              {{ publicText('orders.manage.pendingProposal', 'Une proposition de créneau attend votre validation.') }}
            </div>
            <div class="flex flex-wrap gap-3">
              <button class="btn btn-success" :disabled="submitting" @click="acceptProposal">
                <span v-if="submitting" class="loading loading-spinner loading-sm" />
                {{ publicText('orders.manage.acceptSlot', 'Accepter le créneau') }}
              </button>
            </div>
            <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <h2 class="text-lg font-semibold">{{ publicText('orders.manage.counterProposalTitle', 'Proposer un autre créneau') }}</h2>
              <div class="mt-4 grid gap-3 md:grid-cols-2">
                <div class="form-control gap-3 flex">
                  <label class="label"><span class="label-text">{{ publicText('orders.manage.dateLabel', 'Date') }}</span></label>
                  <input v-model="proposalForm.date" type="date" class="input input-bordered" />
                </div>
                <div class="form-control gap-3 flex">
                  <label class="label"><span class="label-text">{{ publicText('orders.manage.timeLabel', 'Heure') }}</span></label>
                  <input v-model="proposalForm.time" type="time" class="input input-bordered" />
                </div>
              </div>
              <div class="mt-4">
                <button class="btn btn-outline" :disabled="submitting" @click="submitProposal">{{ publicText('orders.manage.sendCounterProposal', 'Envoyer la contre-proposition') }}</button>
              </div>
            </div>
          </div>

          <div v-else class="mt-6 flex flex-wrap gap-3">
            <button
              v-if="!subscriptionsEnabled || !reservation.monthlySubscription"
              class="btn btn-warning"
              :disabled="submitting"
              @click="cancelReservation"
            >
              <span v-if="submitting" class="loading loading-spinner loading-sm" />
              {{ publicText('orders.manage.cancelReservation', 'Annuler la commande') }}
            </button>
            <button
              v-if="subscriptionsEnabled && reservation.monthlySubscription"
              class="btn btn-error"
              :disabled="submitting"
              @click="stopSubscription"
            >
              <span v-if="submitting" class="loading loading-spinner loading-sm" />
              {{ publicText('orders.manage.stopSubscription', 'Arrêter l’abonnement') }}
            </button>
            <NuxtLink :to="localePath('/')" class="btn btn-ghost">{{ publicText('orders.manage.backHome', 'Retour au site') }}</NuxtLink>
          </div>

          <div v-if="reservation.deliveryType === 'ONSITE' && reservation.scheduleProposals?.length" class="mt-8">
            <h2 class="text-xl font-semibold">{{ publicText('orders.manage.proposalsHistory', 'Historique des propositions') }}</h2>
            <div class="mt-4 space-y-3">
              <div
                v-for="proposal in reservation.scheduleProposals"
                :key="proposal.id"
                class="rounded-2xl border border-base-300 bg-base-100 p-4 text-sm"
              >
                <div><strong>{{ proposal.proposedBy === 'ADMIN' ? publicText('orders.manage.adminLabel', 'Administration') : publicText('orders.manage.youLabel', 'Vous') }}</strong></div>
                <div class="mt-1">{{ formatDate(proposal.proposalDate) }} {{ publicText('orders.manage.atLabel', 'à') }} {{ proposal.proposalTime }}</div>
                <div v-if="proposal.proposalLocation" class="opacity-70">{{ proposal.proposalLocation }}</div>
                <div v-if="proposal.acceptedAt" class="mt-2 text-success">{{ publicText('orders.manage.slotAccepted', 'Créneau accepté') }}</div>
              </div>
            </div>
          </div>

          <div v-if="subscriptionsEnabled && reservation.monthlySubscription && reservation.occurrences?.length" class="mt-8">
            <h2 class="text-xl font-semibold">{{ publicText('orders.manage.upcomingWeeks', 'Semaines à venir') }}</h2>
            <div class="mt-4 space-y-3">
              <div
                v-for="occurrence in reservation.occurrences"
                :key="occurrence.id"
                class="rounded-2xl border border-base-300 bg-base-100 p-4"
              >
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="text-sm">
                    <div><strong>{{ publicText('orders.manage.summaryDate', 'Date') }}</strong> {{ formatDate(occurrence.occurrenceDate) }}</div>
                    <div v-if="occurrence.occurrenceTime"><strong>{{ publicText('orders.manage.summaryTime', 'Heure') }}</strong> {{ occurrence.occurrenceTime }}</div>
                    <div v-if="occurrence.occurrenceLocation"><strong>{{ publicText('orders.manage.summaryLocation', 'Lieu') }}</strong> {{ occurrence.occurrenceLocation }}</div>
                  </div>
                  <button class="btn btn-sm btn-warning btn-outline" :disabled="submitting" @click="cancelOccurrence(occurrence.id)">
                    {{ publicText('orders.manage.cancelThisWeek', 'Annuler cette semaine') }}
                  </button>
                </div>
              </div>
            </div>
            <div v-if="reservation.occurrencePagination.totalPages > 1" class="join mt-4 flex justify-center">
              <button class="btn join-item btn-sm" :disabled="occurrencePage === 1" @click="occurrencePage--">
                <Icon name="mdi:chevron-left" size="18" />
              </button>
              <button class="btn join-item btn-sm no-animation">
                {{ publicText('orders.manage.pagination', 'Page {page} sur {total}', { page: occurrencePage, total: reservation.occurrencePagination.totalPages }) }}
              </button>
              <button
                class="btn join-item btn-sm"
                :disabled="occurrencePage === reservation.occurrencePagination.totalPages"
                @click="occurrencePage++"
              >
                <Icon name="mdi:chevron-right" size="18" />
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  i18n: false,
})

import { formatLocalizedDate } from '#modula/shared/date'
const localePath = usePublicLocalePath()
const { contentLocale } = useContentLocale()
const { publicText } = usePublicDictionary()
const locale = computed(() => contentLocale.value)

useNoIndexSeo(
  computed(() => publicText('orders.manage.title', 'Gérer ma commande')),
  computed(() => publicText('orders.manage.seoDescription', 'Espace public de gestion de commande et de créneaux associés.'))
)

interface ManagedReservation {
  id: number
  customerName: string
  email: string
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED'
  deliveryType: 'ONSITE' | 'PICKUP' | 'TOUR' | null
  monthlySubscription: boolean
  subscriptionActive: boolean
  fulfillmentDate: string | null
  fulfillmentTime: string | null
  fulfillmentLocation: string | null
  scheduleProposalPendingBy: 'ADMIN' | 'CUSTOMER' | null
  scheduleProposalAcceptedAt: string | null
  scheduleProposals: Array<{
    id: number
    proposedBy: 'ADMIN' | 'CUSTOMER'
    proposalDate: string
    proposalTime: string
    proposalLocation: string | null
    acceptedAt: string | null
    createdAt: string
  }>
  occurrences: Array<{
    id: number
    occurrenceDate: string
    occurrenceTime: string | null
    occurrenceLocation: string | null
  }>
  occurrencePagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
  basket: {
    id: number
    name: string
    finalPrice: number
  }
  subscriptionsEnabled: boolean
}

const route = useRoute()
const token = String(route.params.token ?? '')
const { $toast } = useNuxtApp() as any
const occurrencePage = ref(1)
const occurrenceLimit = 5
const proposalForm = reactive({
  date: '',
  time: ''
})

const { data: reservation, pending, refresh } = await useFetch<ManagedReservation>(`/api/orders/manage/${token}`, {
  query: computed(() => ({
    occurrencePage: occurrencePage.value,
    occurrenceLimit
  })),
  watch: [occurrencePage]
})

const submitting = ref(false)
const subscriptionsEnabled = computed(() => reservation.value?.subscriptionsEnabled ?? false)

const introText = computed(() => {
  if (!reservation.value) return ''
  if (subscriptionsEnabled.value && reservation.value.monthlySubscription) {
    return publicText('orders.manage.introSubscription', 'Cet écran vous permet de suivre votre abonnement et les créneaux planifiés.')
  }
  if (reservation.value.deliveryType === 'ONSITE') {
    return publicText('orders.manage.introOnSite', 'Cet écran vous permet de confirmer ou proposer un créneau de retrait.')
  }
  return publicText('orders.manage.introDefault', 'Cet écran vous permet de suivre et gérer votre commande.')
})

const formatDate = (value: string) =>
  formatLocalizedDate(value, contentLocale.value, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

const statusLabel = (value: ManagedReservation['status']) => {
  const key = value.toLowerCase() as 'pending' | 'confirmed' | 'rejected' | 'cancelled'
  return publicText(`orders.manage.status.${key}`, key)
}

const cancelReservation = async () => {
  submitting.value = true
  try {
    await $fetch(`/api/orders/manage/${token}/cancel`, { method: 'POST' })
    $toast.success(publicText('orders.manage.toastCancelSuccess', 'Commande annulée.'))
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || publicText('orders.manage.toastCancelError', 'Impossible d’annuler la commande.'))
  } finally {
    submitting.value = false
  }
}

const stopSubscription = async () => {
  submitting.value = true
  try {
    await $fetch(`/api/orders/manage/${token}/stop`, { method: 'POST' })
    $toast.success(publicText('orders.manage.toastStopSuccess', 'Abonnement arrêté.'))
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || publicText('orders.manage.toastStopError', 'Impossible d’arrêter l’abonnement.'))
  } finally {
    submitting.value = false
  }
}

const cancelOccurrence = async (occurrenceId: number) => {
  submitting.value = true
  try {
    await $fetch(`/api/orders/manage/${token}/occurrences/${occurrenceId}/cancel`, { method: 'POST' })
    $toast.success(publicText('orders.manage.toastOccurrenceSuccess', 'La semaine a été annulée.'))
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || publicText('orders.manage.toastOccurrenceError', 'Impossible d’annuler cette semaine.'))
  } finally {
    submitting.value = false
  }
}

const acceptProposal = async () => {
  submitting.value = true
  try {
    await $fetch(`/api/orders/manage/${token}/accept-proposal`, { method: 'POST' })
    $toast.success(publicText('orders.manage.toastAcceptSuccess', 'Créneau accepté.'))
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || publicText('orders.manage.toastAcceptError', 'Impossible d’accepter ce créneau.'))
  } finally {
    submitting.value = false
  }
}

const submitProposal = async () => {
  submitting.value = true
  try {
    await $fetch(`/api/orders/manage/${token}/propose-slot`, {
      method: 'POST',
      body: {
        proposalDate: proposalForm.date,
        proposalTime: proposalForm.time
      }
    })
    $toast.success(publicText('orders.manage.toastCounterProposalSuccess', 'Contre-proposition envoyée.'))
    proposalForm.date = ''
    proposalForm.time = ''
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || publicText('orders.manage.toastCounterProposalError', 'Impossible d’envoyer la contre-proposition.'))
  } finally {
    submitting.value = false
  }
}
</script>
