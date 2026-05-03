<template>
  <div>
    <h1 class="mb-6 text-3xl font-bold">Tableau de bord</h1>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div class="stat rounded-box bg-base-200">
        <div class="stat-title">A traiter</div>
        <div class="stat-value text-warning">{{ stats?.pendingReservations ?? '-' }}</div>
        <div class="stat-desc">Reservations en attente</div>
        <NuxtLink to="/admin/reservations" class="stat-actions"><button class="btn btn-sm btn-ghost">Voir</button></NuxtLink>
      </div>

      <div class="stat rounded-box bg-base-200">
        <div class="stat-title">Cette semaine</div>
        <div class="stat-value text-success">{{ stats?.upcomingOccurrences7Days ?? '-' }}</div>
        <div class="stat-desc">{{ SUBSCRIPTIONS_ENABLED ? 'Occurrences planifiees sur 7 jours' : 'Reservations confirmees sur 7 jours' }}</div>
      </div>

      <div class="stat rounded-box bg-base-200">
        <div class="stat-title">Ce mois-ci</div>
        <div class="stat-value text-primary">{{ stats?.upcomingOccurrencesMonth ?? '-' }}</div>
        <div class="stat-desc">{{ SUBSCRIPTIONS_ENABLED ? 'Occurrences restantes du mois' : 'Reservations confirmees restantes du mois' }}</div>
      </div>

      <div v-if="SUBSCRIPTIONS_ENABLED" class="stat rounded-box bg-base-200">
        <div class="stat-title">Abonnements actifs</div>
        <div class="stat-value text-secondary">{{ stats?.activeSubscriptions ?? '-' }}</div>
        <div class="stat-desc">Reservations recurrentes confirmees</div>
      </div>
      <div v-else class="stat rounded-box bg-base-200">
        <div class="stat-title">Archives</div>
        <div class="stat-value text-secondary">{{ stats?.archivedReservations ?? '-' }}</div>
        <div class="stat-desc">Reservations archivees</div>
      </div>
    </div>

    <div class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div class="rounded-box bg-base-200 p-5">
        <div class="text-sm uppercase opacity-60">Historique</div>
        <div class="mt-2 text-3xl font-bold">{{ stats?.completedOccurrences ?? '-' }}</div>
        <div class="mt-1 text-sm opacity-70">{{ SUBSCRIPTIONS_ENABLED ? 'Occurrences passees comptabilisees' : 'Reservations passees comptabilisees' }}</div>
      </div>

      <div class="rounded-box bg-base-200 p-5">
        <div class="text-sm uppercase opacity-60">Annulations futures</div>
        <div class="mt-2 text-3xl font-bold text-warning">{{ stats?.cancelledOccurrences ?? '-' }}</div>
        <div class="mt-1 text-sm opacity-70">{{ SUBSCRIPTIONS_ENABLED ? 'Occurrences annulees encore a venir' : 'Reservations annulees encore a venir' }}</div>
      </div>

      <div v-if="SUBSCRIPTIONS_ENABLED" class="rounded-box bg-base-200 p-5">
        <div class="text-sm uppercase opacity-60">Archives</div>
        <div class="mt-2 text-3xl font-bold text-neutral">{{ stats?.archivedReservations ?? '-' }}</div>
        <div class="mt-1 text-sm opacity-70">Reservations archivees</div>
      </div>
      <div v-else class="rounded-box bg-base-200 p-5">
        <div class="text-sm uppercase opacity-60">Refusees</div>
        <div class="mt-2 text-3xl font-bold text-error">{{ stats?.rejectedReservations ?? '-' }}</div>
        <div class="mt-1 text-sm opacity-70">Reservations refusees non archivees</div>
      </div>
    </div>

    <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-box bg-base-200 p-5">
        <div class="text-sm uppercase opacity-60">Legumes</div>
        <div class="mt-2 text-2xl font-bold">{{ stats?.vegetables ?? '-' }}</div>
      </div>
      <div class="rounded-box bg-base-200 p-5">
        <div class="text-sm uppercase opacity-60">Paniers actifs</div>
        <div class="mt-2 text-2xl font-bold">{{ stats?.activeBaskets ?? '-' }}</div>
      </div>
      <div class="rounded-box bg-base-200 p-5">
        <div class="text-sm uppercase opacity-60">Reservations a venir</div>
        <div class="mt-2 text-2xl font-bold">{{ stats?.upcomingReservations ?? '-' }}</div>
      </div>
      <div class="rounded-box bg-base-200 p-5">
        <div class="text-sm uppercase opacity-60">Refusees non archivees</div>
        <div class="mt-2 text-2xl font-bold text-error">{{ stats?.rejectedReservations ?? '-' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SUBSCRIPTIONS_ENABLED } from '~/shared/constants/reservationFeatures'

definePageMeta({ layout: 'admin', middleware: 'auth' })

const { data: stats } = await useFetch('/api/admin/stats')
</script>
