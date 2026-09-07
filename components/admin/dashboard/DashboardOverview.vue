<template>
  <div class="space-y-6">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.dashboardPage.title') }}</h1>
        <p class="mt-2 text-sm opacity-70">{{ t('admin.dashboardAdvanced.description') }}</p>
      </div>
      <button type="button" class="btn btn-outline btn-sm" :disabled="pending" @click="refresh()">{{ t('admin.dashboardAdvanced.refresh') }}</button>
    </header>
    <div v-if="error" class="alert alert-error" role="alert">{{ t('admin.dashboardAdvanced.error') }}</div>
    <div v-else-if="pending" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="status" :aria-label="t('admin.dashboardAdvanced.loading')">
      <AdminDashboardDashboardKpiCard v-for="n in 4" :key="n" :label="t('admin.dashboardAdvanced.loading')" loading />
    </div>
    <template v-else-if="data?.kpis.length">
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminDashboardDashboardKpiCard v-for="kpi in data.kpis" :key="kpi.key" :label="t('admin.dashboardAdvanced.' + kpi.key)" :value="kpi.value" />
      </div>
      <div class="grid gap-6 lg:grid-cols-2">
        <AdminDashboardDashboardChartCard v-for="chart in data.distributions" :key="chart.key"
          :title="t('admin.dashboardAdvanced.' + chart.key) + ' · ' + t('admin.dashboardAdvanced.publication')"
          :items="chart.items.map(item => ({ label: t('admin.eventsEditor.' + item.key), value: item.value }))"
          :empty-label="t('admin.dashboardAdvanced.empty')" />
      </div>
    </template>
    <AdminDashboardDashboardEmptyState v-else :label="t('admin.dashboardAdvanced.noAccess')" />
  </div>
</template>
<script setup lang="ts">
import AdminDashboardDashboardKpiCard from './DashboardKpiCard.vue'
import AdminDashboardDashboardChartCard from './DashboardChartCard.vue'
import AdminDashboardDashboardEmptyState from './DashboardEmptyState.vue'
import type { DashboardStats } from '#modula/shared/dashboard'
const { t } = useI18n()
const { data, pending, error, refresh } = await useFetch<DashboardStats>('/api/admin/stats', { key: 'admin-dashboard-stats' })
</script>
