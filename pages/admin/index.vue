<template>
  <div>
    <h1 class="mb-6 flex items-center justify-center text-3xl font-bold">{{ t('admin.dashboardPage.title') }}</h1>

    <div class="card bg-base-100 p-8">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="stat rounded-box bg-base-200">
          <div class="stat-title">{{ t('admin.navigation.items.orders') }}</div>
          <div class="stat-value text-warning">{{ stats?.pendingOrders ?? '-' }}</div>
          <div class="stat-desc">{{ t('admin.ordersPage.status.pending') }}</div>
          <NuxtLink :to="localePath(shopOrdersPath)" class="stat-actions"><button class="btn btn-sm btn-ghost">{{ t('common.view') }}</button></NuxtLink>
        </div>

        <div class="stat rounded-box bg-base-200">
          <div class="stat-title">{{ t('admin.navigation.items.products') }}</div>
          <div class="stat-value text-success">{{ stats?.activeProducts ?? '-' }}</div>
          <div class="stat-desc">{{ t('admin.common.active') }}</div>
        </div>

        <div class="stat rounded-box bg-base-200">
          <div class="stat-title">{{ t('admin.ordersPage.paymentStatus.paid') }}</div>
          <div class="stat-value text-primary">{{ stats?.paidOrders ?? '-' }}</div>
          <div class="stat-desc">{{ t('admin.ordersPage.paymentStatusLabel') }}</div>
        </div>

        <div class="stat rounded-box bg-base-200">
          <div class="stat-title">{{ t('admin.navigation.items.productCategories') }}</div>
          <div class="stat-value text-secondary">{{ stats?.categories ?? '-' }}</div>
          <div class="stat-desc">{{ t('admin.common.active') }}</div>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">{{ t('admin.ordersPage.paymentStatus.unpaid') }}</div>
          <div class="mt-2 text-3xl font-bold">{{ stats?.unpaidOrders ?? '-' }}</div>
          <div class="mt-1 text-sm opacity-70">{{ t('admin.ordersPage.paymentStatusLabel') }}</div>
        </div>

        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">{{ t('admin.ordersPage.status.cancelled') }}</div>
          <div class="mt-2 text-3xl font-bold text-warning">{{ stats?.cancelledOrders ?? '-' }}</div>
          <div class="mt-1 text-sm opacity-70">{{ t('admin.ordersPage.statusLabel') }}</div>
        </div>

        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">{{ t('admin.ordersPage.createdAtLabel') }}</div>
          <div class="mt-2 text-3xl font-bold text-neutral">{{ stats?.monthOrders ?? '-' }}</div>
          <div class="mt-1 text-sm opacity-70">{{ t('admin.dashboardPage.thisMonthTitle') }}</div>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">{{ t('admin.navigation.items.products') }}</div>
          <div class="mt-2 text-2xl font-bold">{{ stats?.totalProducts ?? '-' }}</div>
        </div>
        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">{{ t('admin.ordersPage.status.pending') }}</div>
          <div class="mt-2 text-2xl font-bold">{{ stats?.pendingOrders ?? '-' }}</div>
        </div>
        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">{{ t('admin.ordersPage.paymentStatus.paid') }}</div>
          <div class="mt-2 text-2xl font-bold">{{ stats?.paidOrders ?? '-' }}</div>
        </div>
        <div class="rounded-box bg-base-200 p-5">
          <div class="text-sm uppercase opacity-60">{{ t('admin.ordersPage.status.cancelled') }}</div>
          <div class="mt-2 text-2xl font-bold text-error">{{ stats?.cancelledOrders ?? '-' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getAdminRoutePath, normalizeAdminRouteLocale } from '#modula/shared/adminRoutes'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'})

interface Stats {
  activeProducts?: number
  totalProducts?: number
  categories?: number
  pendingOrders?: number
  paidOrders?: number
  cancelledOrders?: number
  unpaidOrders?: number
  monthOrders?: number
}

const { locale, t } = useI18n()
const { data: stats } = await useFetch<Stats>('/api/admin/stats')
const localePath = useLocalePath()
const shopOrdersPath = computed(() => getAdminRoutePath('shopOrders', normalizeAdminRouteLocale(locale.value)))
</script>
