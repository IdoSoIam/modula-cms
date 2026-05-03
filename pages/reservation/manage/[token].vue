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
            {{ reservation.monthlySubscription ? 'Vous pouvez annuler seulement une semaine ou arreter completement votre abonnement.' : 'Vous pouvez annuler votre reservation.' }}
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
            {{ reservation.monthlySubscription ? 'Cet abonnement est deja arrete.' : 'Cette reservation est deja annulee.' }}
          </div>

          <div v-else-if="reservation.monthlySubscription && !reservation.subscriptionActive" class="alert alert-info mt-6">
            Cet abonnement n'est plus actif.
          </div>

          <div v-else class="mt-6 flex flex-wrap gap-3">
            <button
              v-if="!reservation.monthlySubscription"
              class="btn btn-warning"
              :disabled="submitting"
              @click="cancelReservation"
            >
              <span v-if="submitting" class="loading loading-spinner loading-sm" />
              Annuler ma reservation
            </button>
            <button
              v-if="reservation.monthlySubscription"
              class="btn btn-error"
              :disabled="submitting"
              @click="stopSubscription"
            >
              <span v-if="submitting" class="loading loading-spinner loading-sm" />
              Arreter mon abonnement
            </button>
            <NuxtLink to="/" class="btn btn-ghost">Retour a l'accueil</NuxtLink>
          </div>

          <div v-if="reservation.monthlySubscription && reservation.occurrences?.length" class="mt-8">
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
  monthlySubscription: boolean
  subscriptionActive: boolean
  fulfillmentDate: string | null
  fulfillmentTime: string | null
  fulfillmentLocation: string | null
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
}

const route = useRoute()
const token = String(route.params.token ?? '')
const { $toast } = useNuxtApp() as any
const occurrencePage = ref(1)
const occurrenceLimit = 5

const { data: reservation, pending, refresh } = await useFetch<ManagedReservation>(`/api/reservations/manage/${token}`, {
  query: computed(() => ({
    occurrencePage: occurrencePage.value,
    occurrenceLimit
  })),
  watch: [occurrencePage]
})
const submitting = ref(false)

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

const statusLabel = (value: ManagedReservation['status']) => ({
  PENDING: 'En attente',
  CONFIRMED: 'Confirmee',
  REJECTED: 'Refusee',
  CANCELLED: 'Annulee'
} as const)[value] ?? value

const cancelReservation = async () => {
  submitting.value = true
  try {
    await $fetch(`/api/reservations/manage/${token}/cancel`, { method: 'POST' })
    $toast.success('Votre demande a bien ete prise en compte')
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
    $toast.success('Votre abonnement a bien ete arrete')
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || 'Impossible d arreter cet abonnement')
  } finally {
    submitting.value = false
  }
}

const cancelOccurrence = async (occurrenceId: number) => {
  submitting.value = true
  try {
    await $fetch(`/api/reservations/manage/${token}/occurrences/${occurrenceId}/cancel`, { method: 'POST' })
    $toast.success('Cette semaine a bien ete annulee')
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || 'Impossible d annuler cette semaine')
  } finally {
    submitting.value = false
  }
}
</script>
