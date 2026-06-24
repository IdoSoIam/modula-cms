<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.ordersPage.title') }}</h1>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.ordersPage.description') }}</p>
      </div>
      <div class="join">
        <button
          v-for="option in statusOptions"
          :key="option.value"
          class="btn join-item btn-sm"
          :class="selectedStatus === option.value ? 'btn-primary' : 'btn-ghost'"
          @click="selectedStatus = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div class="card bg-base-100 p-6">
      <div v-if="pending" class="loading loading-spinner" />

      <div v-else class="overflow-x-auto rounded-box">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('admin.ordersPage.number') }}</th>
              <th>{{ t('admin.ordersPage.customer') }}</th>
              <th>{{ t('admin.ordersPage.total') }}</th>
              <th>{{ t('admin.ordersPage.statusLabel') }}</th>
              <th>{{ t('admin.ordersPage.paymentStatusLabel') }}</th>
              <th>{{ t('admin.ordersPage.createdAtLabel') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td class="font-medium">{{ order.orderNumber }}</td>
              <td>
                <div>{{ order.customerName }}</div>
                <div class="text-xs opacity-70">{{ order.email }}</div>
              </td>
              <td>{{ $formatPrice(order.total) }}</td>
              <td>
                <span class="badge" :class="statusBadgeClass(order.status)">
                  {{ statusLabel(order.status) }}
                </span>
              </td>
              <td>
                <span class="badge badge-outline" :class="paymentBadgeClass(order.paymentStatus)">
                  {{ paymentStatusLabel(order.paymentStatus) }}
                </span>
              </td>
              <td>{{ $formatDate(order.createdAt) }}</td>
              <td class="text-right">
                <button class="btn btn-ghost btn-sm" @click="openDetails(order.id)">
                  <Icon name="mdi:eye-outline" size="16" />
                </button>
              </td>
            </tr>
            <tr v-if="!orders.length">
              <td colspan="7" class="py-8 text-center opacity-60">{{ t('admin.ordersPage.empty') }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 flex items-center justify-between">
        <button class="btn btn-sm btn-ghost" :disabled="page <= 1 || pending" @click="page -= 1">
          {{ t('admin.common.previous') }}
        </button>
        <div class="text-sm opacity-70">{{ t('admin.ordersPage.pagination', { page, total: totalPages }) }}</div>
        <button class="btn btn-sm btn-ghost" :disabled="page >= totalPages || pending" @click="page += 1">
          {{ t('admin.common.next') }}
        </button>
      </div>
    </div>

    <dialog ref="detailsDialog" class="modal">
      <div class="modal-box max-w-3xl">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold">{{ details?.orderNumber || '-' }}</h3>
            <p class="text-sm opacity-70">{{ details?.customerName }} - {{ details?.email }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <span v-if="details" class="badge" :class="statusBadgeClass(details.status)">{{ statusLabel(details.status) }}</span>
            <span v-if="details" class="badge badge-outline" :class="paymentBadgeClass(details.paymentStatus)">{{ paymentStatusLabel(details.paymentStatus) }}</span>
          </div>
        </div>

        <div v-if="loadingDetails" class="loading loading-spinner" />

        <template v-else-if="details">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div class="rounded-xl bg-base-200 p-4">
              <div class="font-medium">{{ t('admin.ordersPage.customerDetails') }}</div>
              <div class="mt-2 text-sm">
                <div>{{ details.customerName }}</div>
                <div>{{ details.email }}</div>
                <div v-if="details.phone">{{ details.phone }}</div>
                <div v-if="details.message" class="mt-2 opacity-80">{{ details.message }}</div>
              </div>
            </div>
            <div class="rounded-xl bg-base-200 p-4">
              <div class="font-medium">{{ t('admin.ordersPage.checkoutDetails') }}</div>
              <div class="mt-2 space-y-1 text-sm">
                <div>{{ t('admin.ordersPage.total') }} : <strong>{{ $formatPrice(details.total) }}</strong></div>
                <div>{{ t('admin.ordersPage.providerLabel') }} : <strong>{{ details.paymentProvider }}</strong></div>
                <div v-if="details.providerSessionId">Session : <code class="break-all">{{ details.providerSessionId }}</code></div>
                <div v-if="details.providerPaymentIntentId">{{ t('admin.ordersPage.intentIdLabel') }} : <code class="text-xs break-all">{{ details.providerPaymentIntentId }}</code></div>
                <div v-if="details.providerPaymentStatus">{{ t('admin.ordersPage.intentStatusLabel') }}: <strong>{{ paymentStatusLabel(details.providerPaymentStatus.toUpperCase() as any) }}</strong></div>
                <div v-if="details.paymentFailureReason">{{ t('admin.ordersPage.failureReasonLabel') }}: <strong>{{ details.paymentFailureReason }}</strong></div>
                <div v-if="details.refundedAt">{{ t('admin.ordersPage.refundedAtLabel') }}: <strong>{{ $formatDate(details.refundedAt) }}</strong></div>
              </div>
            </div>
          </div>

          <div class="mt-4 rounded-xl bg-base-200 p-4">
            <div class="font-medium">{{ t('admin.ordersPage.deliveryTitle') }}</div>
            <div class="mt-2 space-y-1 text-sm">
              <div>{{ t('admin.ordersPage.deliveryTypeLabel') }}: <strong>{{ deliveryTypeLabel(details.deliveryType) }}</strong></div>
              <div v-if="details.pickupPoint">{{ t('admin.ordersPage.pickupPointLabel') }}: <strong>{{ details.pickupPoint.name }}</strong></div>
              <div v-if="details.deliveryTour">{{ t('admin.ordersPage.tourLabel') }}: <strong>{{ details.deliveryTour.name }}</strong></div>
              <div v-if="deliveryAddressLine(details)">
                {{ t('admin.ordersPage.deliveryAddressLabel') }}: <strong>{{ deliveryAddressLine(details) }}</strong>
              </div>
              <div v-if="details.fulfillmentLocation">{{ t('admin.ordersPage.fulfillmentLabel') }}: <strong>{{ details.fulfillmentLocation }}</strong></div>
              <div v-if="details.fulfillmentDate || details.fulfillmentTime">
                {{ t('admin.ordersPage.deliveryDateLabel') }}:
                <strong>{{ [details.fulfillmentDate ? $formatDate(details.fulfillmentDate) : '', details.fulfillmentTime || ''].filter(Boolean).join(' · ') }}</strong>
              </div>
            </div>
          </div>

          <div class="mt-6">
            <div class="mb-3 font-medium">{{ t('admin.ordersPage.linesTitle') }}</div>
            <div class="overflow-x-auto rounded-xl border border-base-300">
              <table class="table">
                <thead>
                  <tr>
                    <th>{{ t('admin.ordersPage.productLabel') }}</th>
                    <th>{{ t('admin.ordersPage.quantityLabel') }}</th>
                    <th>{{ t('admin.ordersPage.unitPriceLabel') }}</th>
                    <th>{{ t('admin.ordersPage.total') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="line in details.lines" :key="line.id">
                    <td>{{ line.title }}</td>
                    <td>{{ line.quantity }}</td>
                    <td>{{ $formatPrice(line.unitPrice) }}</td>
                    <td>{{ $formatPrice(line.totalPrice) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap gap-2">
            <button class="btn btn-success btn-sm" :disabled="actionPending || details.status === 'PAID'" @click="updateStatus('PAID', 'PAID')">
              {{ t('admin.ordersPage.markPaid') }}
            </button>
            <button class="btn btn-warning btn-sm" :disabled="actionPending || details.status === 'PENDING'" @click="updateStatus('PENDING', details.paymentStatus)">
              {{ t('admin.ordersPage.markPending') }}
            </button>
            <button class="btn btn-error btn-sm" :disabled="actionPending || details.status === 'CANCELLED'" @click="updateStatus('CANCELLED', details.paymentStatus === 'PAID' ? 'REFUNDED' : 'FAILED')">
              {{ t('admin.ordersPage.cancelOrder') }}
            </button>
          </div>
        </template>

        <div class="modal-action">
          <button class="btn" @click="closeDetails">{{ t('admin.common.close') }}</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS } from '#modula/shared/adminRoutes'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.shopOrders
  }
})

interface ShopOrderLine {
  id: number
  title: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface ShopOrder {
  id: number
  orderNumber: string
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED'
  paymentProvider: 'OFFLINE' | 'STRIPE'
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  providerSessionId: string | null
  providerPaymentIntentId: string | null
  providerPaymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
  providerLastEventId: string | null
  paymentFailureReason: string | null
  customerName: string
  email: string
  phone: string | null
  message: string | null
  deliveryType: 'ONSITE' | 'PICKUP' | 'TOUR'
  deliveryAddress: string | null
  deliveryCity: string | null
  deliveryPostalCode: string | null
  fulfillmentDate: string | null
  fulfillmentTime: string | null
  fulfillmentLocation: string | null
  pickupPoint: { id: number, name: string, address: string | null } | null
  deliveryTour: { id: number, name: string, dayOfWeek: number, startTime: string, endTime: string } | null
  total: number
  refundedAt: string | null
  createdAt: string
  lines: ShopOrderLine[]
}

const { t } = useI18n()
const { $toast, $formatPrice, $formatDate } = useNuxtApp() as any

const page = ref(1)
const selectedStatus = ref('')
const detailsDialog = ref<HTMLDialogElement>()
const details = ref<ShopOrder | null>(null)
const loadingDetails = ref(false)
const actionPending = ref(false)

const query = computed(() => ({
  page: page.value,
  limit: 20,
  ...(selectedStatus.value ? { status: selectedStatus.value } : {})
}))

const { data, pending, refresh } = await useFetch<{ items: ShopOrder[], pagination: { totalPages: number } }>('/api/admin/orders', {
  query,
  watch: [query]
})

const orders = computed(() => data.value?.items || [])
const totalPages = computed(() => data.value?.pagination?.totalPages || 1)

watch(selectedStatus, () => {
  page.value = 1
})

const statusOptions = computed(() => [
  { value: '', label: t('admin.ordersPage.filterAll') },
  { value: 'PENDING', label: t('admin.ordersPage.status.pending') },
  { value: 'PAID', label: t('admin.ordersPage.status.confirmed') },
  { value: 'CANCELLED', label: t('admin.ordersPage.status.cancelled') }
])

const statusLabel = (status: ShopOrder['status']) => ({
  DRAFT: t('admin.ordersPage.status.draft'),
  PENDING: t('admin.ordersPage.status.pending'),
  PAID: t('admin.ordersPage.status.confirmed'),
  CANCELLED: t('admin.ordersPage.status.cancelled')
}[status] || status)

const paymentStatusLabel = (status: ShopOrder['paymentStatus']) => ({
  UNPAID: t('admin.ordersPage.paymentStatus.unpaid'),
  PENDING: t('admin.ordersPage.paymentStatus.pending'),
  PAID: t('admin.ordersPage.paymentStatus.paid'),
  FAILED: t('admin.ordersPage.paymentStatus.failed'),
  REFUNDED: t('admin.ordersPage.paymentStatus.refunded')
}[status] || status)

const statusBadgeClass = (status: ShopOrder['status']) => ({
  DRAFT: 'badge-ghost',
  PENDING: 'badge-warning',
  PAID: 'badge-success',
  CANCELLED: 'badge-error'
}[status] || 'badge-ghost')

const paymentBadgeClass = (status: ShopOrder['paymentStatus']) => ({
  UNPAID: 'badge-ghost',
  PENDING: 'badge-warning',
  PAID: 'badge-success',
  FAILED: 'badge-error',
  REFUNDED: 'badge-info'
}[status] || 'badge-ghost')

const deliveryTypeLabel = (value: ShopOrder['deliveryType']) => ({
  ONSITE: t('admin.ordersPage.deliveryTypeOnSite'),
  PICKUP: t('admin.ordersPage.deliveryTypePickup'),
  TOUR: t('admin.ordersPage.deliveryTypeTour')
}[value])

const deliveryAddressLine = (order: ShopOrder) =>
  [order.deliveryAddress, [order.deliveryPostalCode, order.deliveryCity].filter(Boolean).join(' ')].filter(Boolean).join(', ')

const openDetails = async (id: number) => {
  loadingDetails.value = true
  detailsDialog.value?.showModal()
  try {
    details.value = await $fetch<ShopOrder>(`/api/admin/orders/${id}`)
  } catch (error: any) {
    $toast.error(error?.statusMessage || t('common.error'))
    closeDetails()
  } finally {
    loadingDetails.value = false
  }
}

const closeDetails = () => {
  detailsDialog.value?.close()
  details.value = null
}

const updateStatus = async (status: ShopOrder['status'], paymentStatus: ShopOrder['paymentStatus']) => {
  if (!details.value) return
  actionPending.value = true
  try {
    details.value = await $fetch<ShopOrder>(`/api/admin/orders/${details.value.id}/status`, {
      method: 'POST',
      body: { status, paymentStatus }
    })
    await refresh()
    $toast.success(t('admin.ordersPage.saved'))
  } catch (error: any) {
    $toast.error(error?.statusMessage || t('common.error'))
  } finally {
    actionPending.value = false
  }
}
</script>
