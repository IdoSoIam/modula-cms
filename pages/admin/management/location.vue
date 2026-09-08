<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-3xl font-bold">{{ t('admin.rentalsPage.title') }}</h1>
      <p class="mt-1 text-sm opacity-70">{{ t('admin.rentalsPage.description') }}</p>
    </header>

    <div class="grid gap-4 sm:grid-cols-3">
      <div v-for="stat in stats" :key="stat.label" class="rounded-box border border-base-300 bg-base-100 p-5">
        <div class="text-sm opacity-65">{{ stat.label }}</div>
        <div class="mt-1 text-3xl font-semibold">{{ stat.value }}</div>
      </div>
    </div>

    <AdminDataTable
      :columns="columns"
      :data="rentals || []"
      :loading="pending"
      :empty-text="t('admin.rentalsPage.empty')"
      :search-fields="['product', 'customer', 'email', 'orderNumber']"
      :page-size="10"
      :initial-sort="{ key: 'startAt', direction: 'asc' }"
    >
      <template #cell(product)="{ row }">
        <div class="font-medium">{{ row.product }}</div>
        <div class="text-xs opacity-60">{{ row.orderNumber }}</div>
      </template>
      <template #cell(customer)="{ row }">
        <div>{{ row.customer }}</div>
        <div class="text-xs opacity-60">{{ row.email }}</div>
      </template>
      <template #cell(period)="{ row }">
        <div>{{ formatDateTime(row.startAt) }}</div>
        <div class="text-xs opacity-60">{{ t('admin.rentalsPage.until') }} {{ formatDateTime(row.endAt) }}</div>
        <div class="mt-1 font-medium">{{ durationLabel(row) }}</div>
      </template>
      <template #cell(status)="{ row }">
        <div class="flex flex-wrap gap-1">
          <span class="badge" :class="orderStatusBadge(row.orderStatus)">{{ orderStatusLabel(row.orderStatus) }}</span>
          <span class="badge" :class="paymentStatusBadge(row.paymentStatus)">{{ paymentStatusLabel(row.paymentStatus) }}</span>
        </div>
      </template>
      <template #cell(actions)="{ row }">
        <NuxtLink :to="{ path: '/admin/shop/orders', query: { open: row.orderId } }" class="btn btn-sm btn-outline">{{ t('admin.rentalsPage.viewOrder') }}</NuxtLink>
      </template>
    </AdminDataTable>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface RentalRow extends Record<string, unknown> {
  id: number
  orderId: number
  orderNumber: string
  product: string
  customer: string
  email: string
  quantity: number
  startAt: string
  endAt: string
  orderStatus: string
  paymentStatus: string
  pricingMode: 'HOURLY' | 'DAILY'
  durationUnits: number
}

const { t, locale } = useI18n()
const { data: rentals, pending } = await useFetch<RentalRow[]>('/api/admin/rentals', { default: () => [] })
const now = computed(() => Date.now())
const stats = computed(() => [
  { label: t('admin.rentalsPage.upcoming'), value: rentals.value.filter(row => Date.parse(row.startAt) > now.value).length },
  { label: t('admin.rentalsPage.active'), value: rentals.value.filter(row => Date.parse(row.startAt) <= now.value && Date.parse(row.endAt) >= now.value).length },
  { label: t('admin.rentalsPage.past'), value: rentals.value.filter(row => Date.parse(row.endAt) < now.value).length },
])
const columns = computed(() => [
  { key: 'product', label: t('admin.rentalsPage.product'), sortable: true },
  { key: 'customer', label: t('admin.rentalsPage.customer'), sortable: true },
  { key: 'period', label: t('admin.rentalsPage.period'), sortValue: (row: RentalRow) => row.startAt },
  { key: 'quantity', label: t('admin.rentalsPage.quantity'), align: 'center' as const },
  { key: 'status', label: t('admin.rentalsPage.status'), sortable: false },
  { key: 'actions', label: '', sortable: false, hideable: false, align: 'right' as const },
])
const formatDateTime = (value: string) => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const orderStatusLabel = (status: string) => t(`admin.ordersPage.status.${({
  DRAFT: 'draft', PENDING: 'pending', CONFIRMED: 'confirmed', IN_PREPARATION: 'inPreparation',
  READY: 'ready', IN_DELIVERY: 'inDelivery', COMPLETED: 'completed', CANCELLED: 'cancelled',
} as Record<string, string>)[status] || 'pending'}`)
const paymentStatusLabel = (status: string) => t(`admin.ordersPage.paymentStatus.${({
  UNPAID: 'unpaid', PENDING: 'pending', PAID: 'paid', FAILED: 'failed', REFUNDED: 'refunded',
} as Record<string, string>)[status] || 'unpaid'}`)
const orderStatusBadge = (status: string) => ({
  PENDING: 'badge-warning', CONFIRMED: 'badge-success', IN_PREPARATION: 'badge-warning', READY: 'badge-info',
  IN_DELIVERY: 'badge-secondary', COMPLETED: 'badge-success', CANCELLED: 'badge-error',
} as Record<string, string>)[status] || 'badge-ghost'
const paymentStatusBadge = (status: string) => ({
  PENDING: 'badge-warning', PAID: 'badge-success', FAILED: 'badge-error', REFUNDED: 'badge-info',
} as Record<string, string>)[status] || 'badge-ghost'
const durationLabel = (row: RentalRow) => t(
  row.pricingMode === 'HOURLY' ? 'admin.rentalsPage.durationHours' : 'admin.rentalsPage.durationDays',
  { count: row.durationUnits },
)
</script>
