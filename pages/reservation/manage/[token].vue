<template>
  <div class="container mx-auto max-w-2xl px-4 py-12 min-h-[calc(100vh-280px)]">
    <div class="card border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body">
        <h1 class="text-3xl font-bold">Gestion de reservation</h1>

        <div v-if="pending" class="py-10 text-center">
          <span class="loading loading-spinner loading-lg" />
        </div>

        <template v-else-if="reservation">
          <p class="opacity-75">
            {{ subscriptionsEnabled && reservation.monthlySubscription ? 'Vous pouvez annuler seulement une semaine ou arreter completement votre abonnement.' : reservation.deliveryType === 'FARM' ? 'Vous pouvez accepter un creneau propose, en demander un autre ou annuler votre reservation.' : 'Vous pouvez annuler votre reservation.' }}
          </p>

          <div class="mt-6 rounded-2xl bg-base-200 p-5 text-sm">
            <div><strong>Panier :</strong> {{ reservation.basket.name }}</div>
            <div><strong>Nom :</strong> {{ reservation.customerName }}</div>
            <div><strong>Statut :</strong> {{ statusLabel(reservation.status) }}</div>
            <div v-if="reservation.fulfillmentDate"><strong>Date :</strong> {{ formatDate(reservation.fulfillmentDate) }}</div>
            <div v-if="reservation.fulfillmentTime"><strong>Heure :</strong> {{ reservation.fulfillmentTime }}</div>
            <div v-if="reservation.fulfillmentLocation"><strong>Lieu :</strong> {{ reservation.fulfillmentLocation }}</div>
          </div>

          <div v-if="reservation.status === 'CANCELLED'" class="alert alert-info mt-6">
            {{ subscriptionsEnabled && reservation.monthlySubscription ? 'Cet abonnement est deja arrete.' : 'Cette reservation est deja annulee.' }}
          </div>

          <div v-else-if="subscriptionsEnabled && reservation.monthlySubscription && !reservation.subscriptionActive" class="alert alert-info mt-6">
            Cet abonnement n'est plus actif.
          </div>

          <div v-else-if="reservation.deliveryType === 'FARM' && reservation.scheduleProposalPendingBy === 'CUSTOMER'" class="mt-6 space-y-4">
            <div class="alert alert-info">
              La ferme vous a propose un creneau. Merci de l'accepter ou de proposer une autre date et heure.
            </div>
            <div class="flex flex-wrap gap-3">
              <button class="btn btn-success" :disabled="submitting" @click="acceptProposal">
                <span v-if="submitting" class="loading loading-spinner loading-sm" />
                Accepter ce creneau
              </button>
            </div>
            <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <h2 class="text-lg font-semibold">Proposer un autre creneau</h2>
              <div class="mt-4 grid gap-3 md:grid-cols-2">
                <div class="form-control">
                  <label class="label"><span class="label-text">Date</span></label>
                  <input v-model="proposalForm.date" type="date" class="input input-bordered" />
                </div>
                <div class="form-control">
                  <label class="label"><span class="label-text">Heure</span></label>
                  <input v-model="proposalForm.time" type="time" class="input input-bordered" />
                </div>
              </div>
              <div class="mt-4">
                <button class="btn btn-outline" :disabled="submitting" @click="submitProposal">Envoyer ma contre-proposition</button>
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
              Annuler ma reservation
            </button>
            <button
              v-if="subscriptionsEnabled && reservation.monthlySubscription"
              class="btn btn-error"
              :disabled="submitting"
              @click="stopSubscription"
            >
              <span v-if="submitting" class="loading loading-spinner loading-sm" />
              Arreter mon abonnement
            </button>
            <NuxtLink to="/" class="btn btn-ghost">Retour a l'accueil</NuxtLink>
          </div>

          <div v-if="reservation.deliveryType === 'FARM' && reservation.scheduleProposals?.length" class="mt-8">
            <h2 class="text-xl font-semibold">Historique des propositions</h2>
            <div class="mt-4 space-y-3">
              <div
                v-for="proposal in reservation.scheduleProposals"
                :key="proposal.id"
                class="rounded-2xl border border-base-300 bg-base-100 p-4 text-sm"
              >
                <div><strong>{{ proposal.proposedBy === 'ADMIN' ? 'Ferme' : 'Vous' }}</strong></div>
                <div class="mt-1">{{ formatDate(proposal.proposalDate) }} a {{ proposal.proposalTime }}</div>
                <div v-if="proposal.proposalLocation" class="opacity-70">{{ proposal.proposalLocation }}</div>
                <div v-if="proposal.acceptedAt" class="mt-2 text-success">Creneau accepte</div>
              </div>
            </div>
          </div>

          <div v-if="subscriptionsEnabled && reservation.monthlySubscription && reservation.occurrences?.length" class="mt-8">
            <h2 class="text-xl font-semibold">Semaines a venir</h2>
            <div class="mt-4 space-y-3">
              <div
                v-for="occurrence in reservation.occurrences"
                :key="occurrence.id"
                class="rounded-2xl border border-base-300 bg-base-100 p-4"
              >
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="text-sm">
                    <div><strong>Date :</strong> {{ formatDate(occurrence.occurrenceDate) }}</div>
                    <div v-if="occurrence.occurrenceTime"><strong>Heure :</strong> {{ occurrence.occurrenceTime }}</div>
                    <div v-if="occurrence.occurrenceLocation"><strong>Lieu :</strong> {{ occurrence.occurrenceLocation }}</div>
                  </div>
                  <button class="btn btn-sm btn-warning btn-outline" :disabled="submitting" @click="cancelOccurrence(occurrence.id)">
                    Annuler cette semaine
                  </button>
                </div>
              </div>
            </div>
            <div v-if="reservation.occurrencePagination.totalPages > 1" class="join mt-4 flex justify-center">
              <button class="btn join-item btn-sm" :disabled="occurrencePage === 1" @click="occurrencePage--">
                <Icon name="mdi:chevron-left" size="18" />
              </button>
              <button class="btn join-item btn-sm no-animation">
                Page {{ occurrencePage }} / {{ reservation.occurrencePagination.totalPages }}
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
interface ManagedReservation {
  id: number
  customerName: string
  email: string
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED'
  deliveryType: 'FARM' | 'PICKUP' | 'TOUR' | null
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

const { data: reservation, pending, refresh } = await useFetch<ManagedReservation>(`/api/reservations/manage/${token}`, {
  query: computed(() => ({
    occurrencePage: occurrencePage.value,
    occurrenceLimit
  })),
  watch: [occurrencePage]
})
const submitting = ref(false)
const subscriptionsEnabled = computed(() => reservation.value?.subscriptionsEnabled ?? false)

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

const statusLabel = (value: ManagedReservation['status']) => ({
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  REJECTED: 'Refusée',
  CANCELLED: 'Annulée'
} as const)[value] ?? value

const cancelReservation = async () => {
  submitting.value = true
  try {
    await $fetch(`/api/reservations/manage/${token}/cancel`, { method: 'POST' })
    $toast.success('Votre demande a bien été prise en compte')
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || 'Impossible d annuler cette reservation')
  } finally {
    submitting.value = false
  }
}

const stopSubscription = async () => {
  submitting.value = true
  try {
    await $fetch(`/api/reservations/manage/${token}/stop`, { method: 'POST' })
    $toast.success('Votre abonnement a bien été arrêté')
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || 'Impossible d arrêter cet abonnement')
  } finally {
    submitting.value = false
  }
}

const cancelOccurrence = async (occurrenceId: number) => {
  submitting.value = true
  try {
    await $fetch(`/api/reservations/manage/${token}/occurrences/${occurrenceId}/cancel`, { method: 'POST' })
    $toast.success('Cette semaine a bien été annulée')
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || 'Impossible d annuler cette semaine')
  } finally {
    submitting.value = false
  }
}

const acceptProposal = async () => {
  submitting.value = true
  try {
    await $fetch(`/api/reservations/manage/${token}/accept-proposal`, { method: 'POST' })
    $toast.success('Le creneau a bien été confirmé')
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || 'Impossible de confirmer ce creneau')
  } finally {
    submitting.value = false
  }
}

const submitProposal = async () => {
  submitting.value = true
  try {
    await $fetch(`/api/reservations/manage/${token}/propose-slot`, {
      method: 'POST',
      body: {
        proposalDate: proposalForm.date,
        proposalTime: proposalForm.time
      }
    })
    $toast.success('Votre contre-proposition a été envoyée')
    proposalForm.date = ''
    proposalForm.time = ''
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || "Impossible d'envoyer votre contre-proposition")
  } finally {
    submitting.value = false
  }
}
</script>
