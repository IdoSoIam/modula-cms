<template>
  <div>
    <h1 class="mb-6 text-3xl font-bold">{{ t('admin.dashboardPage.title') }}</h1>

    <div class="card bg-base-100 p-8">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="stat rounded-box bg-base-200">
          <div class="stat-title">{{ t('admin.dashboardPage.pendingTitle') }}</div>
          <div class="stat-value text-warning">{{ stats?.pendingReservations ?? '-' }}</div>
          <div class="stat-desc">{{ t('admin.dashboardPage.pendingDesc') }}</div>
          <NuxtLink :to="localePath('/admin/shop/orders')" class="stat-actions"><button class="btn btn-sm btn-ghost">{{ t('common.view') }}</button></NuxtLink>
        </div>

        <div class="stat rounded-box bg-base-200">
          <div class="stat-title">{{ t('admin.dashboardPage.thisWeekTitle') }}</div>
          <div class="stat-value text-success">{{ stats?.upcomingOccurrences7Days ?? '-' }}</div>
          <div class="stat-desc">{{ subscriptionsEnabled ? t('admin.dashboardPage.thisWeekDescSubscriptions') : t('admin.dashboardPage.thisWeekDescReservations') }}</div>
        </div>

        <div class="stat rounded-box bg-base-200">
          <div class="stat-title">{{ t('admin.dashboardPage.thisMonthTitle') }}</div>
          <div class="stat-value text-primary">{{ stats?.upcomingOccurrencesMonth ?? '-' }}</div>
          <div class="stat-desc">{{ subscriptionsEnabled ? t('admin.dashboardPage.thisMonthDescSubscriptions') : t('admin.dashboardPage.thisMonthDescReservations') }}</div>
        </div>

        <div v-if="subscriptionsEnabled" class="stat rounded-box bg-base-200">
          <div class="stat-title">{{ t('admin.dashboardPage.activeSubscriptionsTitle') }}</div>
          <div class="stat-value text-secondary">{{ stats?.activeSubscriptions ?? '-' }}</div>
          <div class="stat-desc">{{ t('admin.dashboardPage.activeSubscriptionsDesc') }}</div>
        </div>
        <div v-else class="stat rounded-box bg-base-200">
          <div class="stat-title">{{ t('admin.dashboardPage.archivedTitle') }}</div>
          <div class="stat-value text-secondary">{{ stats?.archivedReservations ?? '-' }}</div>
          <div class="stat-desc">{{ t('admin.dashboardPage.archivedDesc') }}</div>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">{{ t('admin.dashboardPage.historyTitle') }}</div>
          <div class="mt-2 text-3xl font-bold">{{ stats?.completedOccurrences ?? '-' }}</div>
          <div class="mt-1 text-sm opacity-70">{{ subscriptionsEnabled ? t('admin.dashboardPage.historyDescSubscriptions') : t('admin.dashboardPage.historyDescReservations') }}</div>
        </div>

        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">{{ t('admin.dashboardPage.futureCancelledTitle') }}</div>
          <div class="mt-2 text-3xl font-bold text-warning">{{ stats?.cancelledOccurrences ?? '-' }}</div>
          <div class="mt-1 text-sm opacity-70">{{ subscriptionsEnabled ? t('admin.dashboardPage.futureCancelledDescSubscriptions') : t('admin.dashboardPage.futureCancelledDescReservations') }}</div>
        </div>

        <div v-if="subscriptionsEnabled" class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">{{ t('admin.dashboardPage.archivedTitle') }}</div>
          <div class="mt-2 text-3xl font-bold text-neutral">{{ stats?.archivedReservations ?? '-' }}</div>
          <div class="mt-1 text-sm opacity-70">{{ t('admin.dashboardPage.archivedDesc') }}</div>
        </div>
        <div v-else class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">{{ t('admin.dashboardPage.rejectedTitle') }}</div>
          <div class="mt-2 text-3xl font-bold text-error">{{ stats?.rejectedReservations ?? '-' }}</div>
          <div class="mt-1 text-sm opacity-70">{{ t('admin.dashboardPage.rejectedDesc') }}</div>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">{{ t('admin.navigation.items.vegetables') }}</div>
          <div class="mt-2 text-2xl font-bold">{{ stats?.vegetables ?? '-' }}</div>
        </div>
        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">{{ t('admin.dashboardPage.activeBasketsTitle') }}</div>
          <div class="mt-2 text-2xl font-bold">{{ stats?.activeBaskets ?? '-' }}</div>
        </div>
        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">{{ t('admin.dashboardPage.upcomingReservationsTitle') }}</div>
          <div class="mt-2 text-2xl font-bold">{{ stats?.upcomingReservations ?? '-' }}</div>
        </div>
        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">{{ t('admin.dashboardPage.rejectedTitle') }}</div>
          <div class="mt-2 text-2xl font-bold text-error">{{ stats?.rejectedReservations ?? '-' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS } from '~/shared/adminRoutes'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.dashboard
  }
})

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

const { t } = useI18n()
const { data: stats } = await useFetch<Stats>('/api/admin/stats')
const localePath = useLocalePath()
const subscriptionsEnabled = computed(() => stats.value?.subscriptionsEnabled ?? false)
</script>
