<template>
  <div>
    <h1 class="mb-6 text-3xl font-bold">Tableau de bord</h1>

    <div class="card bg-base-100 p-6">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="stat rounded-box bg-base-200">
          <div class="stat-title">À traiter</div>
          <div class="stat-value text-warning">{{ stats?.pendingReservations ?? '-' }}</div>
          <div class="stat-desc">Réservations en attente</div>
          <NuxtLink :to="localePath('/admin/reservations')" class="stat-actions"><button class="btn btn-sm btn-ghost">Voir</button></NuxtLink>
        </div>

        <div class="stat rounded-box bg-base-200">
          <div class="stat-title">Cette semaine</div>
          <div class="stat-value text-success">{{ stats?.upcomingOccurrences7Days ?? '-' }}</div>
          <div class="stat-desc">{{ subscriptionsEnabled ? 'Occurrences planifiées sur 7 jours' : 'Réservations confirmées sur 7 jours' }}</div>
        </div>

        <div class="stat rounded-box bg-base-200">
          <div class="stat-title">Ce mois-ci</div>
          <div class="stat-value text-primary">{{ stats?.upcomingOccurrencesMonth ?? '-' }}</div>
          <div class="stat-desc">{{ subscriptionsEnabled ? 'Occurrences restantes du mois' : 'Réservations confirmées restantes du mois' }}</div>
        </div>

        <div v-if="subscriptionsEnabled" class="stat rounded-box bg-base-200">
          <div class="stat-title">Abonnements actifs</div>
          <div class="stat-value text-secondary">{{ stats?.activeSubscriptions ?? '-' }}</div>
          <div class="stat-desc">Réservations récurrentes confirmées</div>
        </div>
        <div v-else class="stat rounded-box bg-base-200">
          <div class="stat-title">Archivés</div>
          <div class="stat-value text-secondary">{{ stats?.archivedReservations ?? '-' }}</div>
          <div class="stat-desc">Réservations archivées</div>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">Historique</div>
          <div class="mt-2 text-3xl font-bold">{{ stats?.completedOccurrences ?? '-' }}</div>
          <div class="mt-1 text-sm opacity-70">{{ subscriptionsEnabled ? 'Occurrences passées comptabilisées' : 'Réservations passées comptabilisées' }}</div>
        </div>

        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">Annulations futures</div>
          <div class="mt-2 text-3xl font-bold text-warning">{{ stats?.cancelledOccurrences ?? '-' }}</div>
          <div class="mt-1 text-sm opacity-70">{{ subscriptionsEnabled ? 'Occurrences annulées encore à venir' : 'Réservations annulées encore à venir' }}</div>
        </div>

        <div v-if="subscriptionsEnabled" class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">Archivés</div>
          <div class="mt-2 text-3xl font-bold text-neutral">{{ stats?.archivedReservations ?? '-' }}</div>
          <div class="mt-1 text-sm opacity-70">Réservations archivées</div>
        </div>
        <div v-else class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">Refusées</div>
          <div class="mt-2 text-3xl font-bold text-error">{{ stats?.rejectedReservations ?? '-' }}</div>
          <div class="mt-1 text-sm opacity-70">Réservations refusées non archivées</div>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">Légumes</div>
          <div class="mt-2 text-2xl font-bold">{{ stats?.vegetables ?? '-' }}</div>
        </div>
        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">Paniers actifs</div>
          <div class="mt-2 text-2xl font-bold">{{ stats?.activeBaskets ?? '-' }}</div>
        </div>
        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">Réservations à venir</div>
          <div class="mt-2 text-2xl font-bold">{{ stats?.upcomingReservations ?? '-' }}</div>
        </div>
        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">Refusées non archivées</div>
          <div class="mt-2 text-2xl font-bold text-error">{{ stats?.rejectedReservations ?? '-' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Stats {
  subscriptionsEnabled?: boolean
  rejectedReservations?: number
  upcomingReservations?: number
  archivedReservations?: number
  activeBaskets?: number
  vegetables?: number
  baskets?: number
  basketOccurrences?: number
  cancelledOccurrences?: number
  completedOccurrences?: number
  activeSubscriptions?: number
  upcomingOccurrencesMonth?: number
  upcomingOccurrences7Days?: number
  pendingReservations?: number
  confirmedReservations?: number
  cancelledReservations?: number
  completedReservations?: number
}

const { data: stats } = await useFetch<Stats>('/api/admin/stats')
const localePath = useLocalePath()
const subscriptionsEnabled = computed(() => stats.value?.subscriptionsEnabled ?? false)
</script>
