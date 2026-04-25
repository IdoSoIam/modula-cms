<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Tableau de bord</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="stat bg-base-200 rounded-box">
        <div class="stat-title">Légumes</div>
        <div class="stat-value text-primary">{{ stats?.vegetables ?? '—' }}</div>
        <NuxtLink to="/admin/legumes" class="stat-actions">
          <button class="btn btn-sm btn-ghost">Gérer</button>
        </NuxtLink>
      </div>
      <div class="stat bg-base-200 rounded-box">
        <div class="stat-title">Paniers actifs</div>
        <div class="stat-value text-secondary">{{ stats?.activeBaskets ?? '—' }}</div>
        <NuxtLink to="/admin/paniers" class="stat-actions">
          <button class="btn btn-sm btn-ghost">Gérer</button>
        </NuxtLink>
      </div>
      <div class="stat bg-base-200 rounded-box">
        <div class="stat-title">Réservations en attente</div>
        <div class="stat-value text-accent">{{ stats?.pendingReservations ?? '—' }}</div>
        <NuxtLink to="/admin/reservations" class="stat-actions">
          <button class="btn btn-sm btn-ghost">Voir</button>
        </NuxtLink>
      </div>
      <div class="stat bg-base-200 rounded-box">
        <div class="stat-title">Réservations confirmées</div>
        <div class="stat-value">{{ stats?.confirmedReservations ?? '—' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const { data: stats } = await useFetch('/api/admin/stats')
</script>
