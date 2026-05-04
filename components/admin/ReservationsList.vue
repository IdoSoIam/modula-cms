<template>
  <div class="space-y-3">
    <div
      v-for="reservation in reservations"
      :key="reservation.id"
      class="card bg-base-200 shadow-sm"
    >
      <div class="card-body p-4">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="cursor-pointer" @click="$emit('select', reservation)">
            <div class="flex items-center gap-2">
              <h2 class="font-bold">{{ reservation.customerName }}</h2>
              <span class="badge" :class="badgeClass(reservation.status)">{{ statusLabel(reservation.status) }}</span>
              <span v-if="reservation.archivedAt" class="badge badge-neutral">Archivée</span>
              <span v-if="reservation.googleCalendarEventId" class="badge badge-info badge-outline">Google</span>
            </div>

            <p class="text-sm opacity-70">
              {{ reservation.basket.name }} - {{ formatPrice(reservation.basket.finalPrice) }} - {{ formatDate(reservation.createdAt) }}
            </p>
            <p class="text-sm">
              <a :href="`mailto:${reservation.email}`" class="link">{{ reservation.email }}</a>
              <span v-if="reservation.phone"> · {{ reservation.phone }}</span>
            </p>

            <p v-if="reservation.message" class="mt-2 text-sm italic opacity-80">"{{ reservation.message }}"</p>

            <div v-if="reservation.deliveryType" class="mt-2 space-y-1 rounded bg-base-300 p-2 text-sm">
              <div class="font-medium">
                {{ reservation.deliveryType === 'TOUR' ? 'Livraison (tournée)' : reservation.deliveryType === 'FARM' ? 'Retrait à la ferme' : 'Retrait en point relais' }}
              </div>
              <div v-if="reservation.deliveryType === 'PICKUP' && reservation.pickupPoint" class="opacity-80">
                {{ reservation.pickupPoint.name }}<span v-if="reservation.pickupPoint.address"> - {{ reservation.pickupPoint.address }}</span>
              </div>
              <div v-if="reservation.deliveryType === 'TOUR' && reservation.deliveryTour" class="opacity-80">
                {{ reservation.deliveryTour.name }} - {{ reservation.deliveryTour.startTime }}-{{ reservation.deliveryTour.endTime }}
              </div>
              <div v-if="reservation.deliveryAddress" class="opacity-80">{{ reservation.deliveryAddress }}</div>
              <div v-if="reservation.deliveryCity" class="opacity-80">
                {{ reservation.deliveryCity }}<span v-if="reservation.deliveryPostalCode"> {{ reservation.deliveryPostalCode }}</span>
              </div>
              <div v-if="subscriptionsEnabled && reservation.monthlySubscription" class="text-success">
                Abonnement mensuel<span v-if="reservation.deliveryTour?.monthlyPrice"> - {{ formatPrice(reservation.deliveryTour.monthlyPrice) }}/mois</span>
              </div>

              <div v-if="reservation.displayDate || reservation.displayTime || reservation.displayLocation" class="mt-2 rounded-box bg-base-100 p-2">
                <div v-if="reservation.displayDate"><strong>{{ subscriptionsEnabled && reservation.monthlySubscription ? 'Prochaine occurrence' : 'Date' }} :</strong> {{ formatDateOnly(reservation.displayDate) }}</div>
                <div v-if="reservation.displayTime"><strong>Heure :</strong> {{ reservation.displayTime }}</div>
                <div v-if="reservation.deliveryType === 'TOUR' && reservation.deliveryTour"><strong>Fenêtre de tournée :</strong> {{ reservation.deliveryTour.startTime }}-{{ reservation.deliveryTour.endTime }}</div>
                <div v-if="reservation.displayLocation"><strong>Lieu :</strong> {{ reservation.displayLocation }}</div>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <button v-if="['PENDING', 'REJECTED', 'CANCELLED'].includes(reservation.status)" class="btn btn-sm btn-success" @click="$emit('confirm', reservation)">
              Confirmer
            </button>
            <button v-if="['PENDING', 'CANCELLED'].includes(reservation.status)" class="btn btn-sm btn-error btn-outline" @click="$emit('reject', reservation)">
              Refuser
            </button>
            <button v-if="reservation.status === 'CONFIRMED'" class="btn btn-sm btn-primary btn-outline" @click="$emit('confirm', reservation)">
              Modifier
            </button>
            <button v-if="reservation.status === 'CONFIRMED'" class="btn btn-sm btn-warning btn-outline" @click="$emit('cancel', reservation)">
              Annuler
            </button>
            <button v-if="['REJECTED', 'CANCELLED'].includes(reservation.status)" class="btn btn-sm btn-neutral btn-outline" @click="$emit('archive', reservation)">
              Archiver
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="join flex justify-center">
      <button class="btn join-item btn-sm" :disabled="page === 1" @click="$emit('update:page', page - 1)">
        <Icon name="mdi:chevron-left" size="18" />
      </button>
      <button class="btn join-item btn-sm no-animation">Page {{ page }} / {{ totalPages }}</button>
      <button class="btn join-item btn-sm" :disabled="page === totalPages" @click="$emit('update:page', page + 1)">
        <Icon name="mdi:chevron-right" size="18" />
      </button>
    </div>

    <div v-if="!reservations.length" class="py-12 text-center opacity-60">Aucune réservation pour le moment.</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  reservations: any[]
  page: number
  totalPages: number
  subscriptionsEnabled: boolean
  statusLabel: (status: string) => string
  badgeClass: (status: string) => string
  formatPrice: (value: number) => string
  formatDate: (value: string | null) => string
  formatDateOnly: (value: string | null) => string
}>()

defineEmits<{
  'confirm': [reservation: any]
  'reject': [reservation: any]
  'cancel': [reservation: any]
  'archive': [reservation: any]
  'select': [reservation: any]
  'update:page': [page: number]
}>()
</script>
