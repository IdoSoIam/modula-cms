<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.ordersPage.title') }}</h1>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.ordersPage.description') }}</p>
      </div>
      <div class="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
        <label class="form-control w-full sm:w-64">
          <span class="label"><span class="label-text">{{ t('admin.ordersPage.filterStatusLabel') }}</span></span>
          <select v-model="selectedStatus" class="select select-bordered w-full">
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="form-control w-full sm:w-64">
          <span class="label"><span class="label-text">{{ t('admin.ordersPage.filterPaymentLabel') }}</span></span>
          <select v-model="selectedPaymentStatus" class="select select-bordered w-full">
            <option v-for="option in paymentStatusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
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
      <div class="modal-box max-w-5xl">
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
                <div v-if="details.providerLastEventId">{{ t('admin.ordersPage.eventIdLabel') }}: <code class="text-xs break-all">{{ details.providerLastEventId }}</code></div>
                <div v-if="details.paymentFailureReason">{{ t('admin.ordersPage.failureReasonLabel') }}: <strong>{{ details.paymentFailureReason }}</strong></div>
                <div v-if="details.refundedAt">{{ t('admin.ordersPage.refundedAtLabel') }}: <strong>{{ $formatDate(details.refundedAt) }}</strong></div>
              </div>
            </div>
          </div>

          <div
            v-if="details.paymentStatus === 'FAILED' || details.paymentFailureReason"
            class="mt-4 rounded-xl border border-error/30 bg-error/10 p-4"
          >
            <div class="font-medium text-error">{{ t('admin.ordersPage.failureDetailsTitle') }}</div>
            <div class="mt-2 space-y-1 text-sm">
              <div>
                {{ t('admin.ordersPage.failureReasonLabel') }}:
                <strong>{{ details.paymentFailureReason || t('admin.ordersPage.failureUnknown') }}</strong>
              </div>
              <div v-if="details.providerPaymentStatus">
                {{ t('admin.ordersPage.intentStatusLabel') }}:
                <strong>{{ paymentStatusLabel(details.providerPaymentStatus.toUpperCase() as any) }}</strong>
              </div>
              <div v-if="details.providerSessionId">
                Session:
                <code class="break-all">{{ details.providerSessionId }}</code>
              </div>
              <div v-if="details.providerPaymentIntentId">
                {{ t('admin.ordersPage.intentIdLabel') }}:
                <code class="break-all">{{ details.providerPaymentIntentId }}</code>
              </div>
              <div v-if="details.providerLastEventId">
                {{ t('admin.ordersPage.eventIdLabel') }}:
                <code class="break-all">{{ details.providerLastEventId }}</code>
              </div>
            </div>
          </div>

          <div class="mt-4 rounded-xl bg-base-200 p-4">
            <div class="font-medium">{{ t('admin.ordersPage.deliveryTitle') }}</div>
            <div class="mt-2 space-y-1 text-sm">
              <div>{{ t('admin.ordersPage.deliveryTypeLabel') }}: <strong>{{ deliveryTypeLabel(details.deliveryType) }}</strong></div>
              <div v-if="details.pickupPoint">{{ t('admin.ordersPage.pickupPointLabel') }}: <strong>{{ details.pickupPoint.name }}</strong></div>
              <div v-if="details.deliveryTour">{{ t('admin.ordersPage.homeDeliverySlotLabel') }}: <strong>{{ details.deliveryTour.name }}</strong></div>
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
                    <td>
                      <div class="font-medium">{{ line.title }}</div>
                      <div v-if="line.meta?.lineKind === 'INSURANCE'" class="mt-1 badge badge-sm badge-outline">{{ t('admin.ordersPage.insuranceLine') }}</div>
                      <div v-if="line.meta?.rentalDurationUnits" class="mt-1 text-xs opacity-65">{{ rentalDurationLabel(line) }}</div>
                      <div class="mt-2 flex flex-wrap gap-2">
                        <a
                          v-for="document in lineDocuments(line)"
                          :key="document.key"
                          :href="document.url"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="btn btn-xs btn-outline"
                        >{{ document.name }}</a>
                      </div>
                    </td>
                    <td>{{ line.quantity }}</td>
                    <td>
                      <div>{{ $formatPrice(line.unitPrice) }}</div>
                      <div class="text-xs opacity-60">{{ vatLineLabel(line) }}</div>
                    </td>
                    <td>{{ $formatPrice(line.totalPrice) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-3">
            <section class="rounded-xl border border-base-300 p-4">
              <h4 class="font-medium">{{ t('admin.ordersPage.workflowTitle') }}</h4>
              <p class="mt-1 text-xs opacity-65">{{ t('admin.ordersPage.workflowHelp') }}</p>
              <div class="mt-3 flex flex-col gap-2">
                <select v-model="nextStatus" class="select select-bordered select-sm w-full" :disabled="!availableStatusTransitions.length">
                  <option value="">{{ t('admin.ordersPage.chooseNextStatus') }}</option>
                  <option v-for="option in availableStatusTransitions" :key="option" :value="option">{{ statusLabel(option) }}</option>
                </select>
                <button class="btn btn-primary btn-sm" :disabled="actionPending || !nextStatus" @click="updateStatus(nextStatus as ShopOrder['status'])">
                  {{ t('admin.ordersPage.applyStatus') }}
                </button>
              </div>
            </section>
            <section class="rounded-xl border border-base-300 p-4">
              <h4 class="font-medium">{{ t('admin.ordersPage.paymentActionsTitle') }}</h4>
              <p class="mt-1 text-xs opacity-65">{{ paymentStatusLabel(details.paymentStatus) }}</p>
              <button
                v-if="details.paymentProvider === 'OFFLINE' && !['PAID', 'REFUNDED'].includes(details.paymentStatus)"
                class="btn btn-success btn-sm mt-3 w-full"
                :disabled="actionPending"
                @click="markPaidOnSite"
              >{{ t('admin.ordersPage.markPaidOnSite') }}</button>
              <p v-else-if="details.paidAt" class="mt-3 text-sm">{{ t('admin.ordersPage.paidAtLabel') }} : {{ $formatDate(details.paidAt) }}</p>
            </section>
            <section class="rounded-xl border border-base-300 p-4">
              <h4 class="font-medium">{{ t('admin.ordersPage.documentsTitle') }}</h4>
            <a
              class="btn btn-outline btn-sm mt-3 w-full"
              :href="`/api/admin/orders/${details.id}/invoice`"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon name="mdi:file-document-outline" size="16" />
              {{ t('admin.ordersPage.viewInvoice') }}
            </a>
            </section>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <button
              v-if="details.afterSalesStatus === 'REFUND_REQUESTED'"
              class="btn btn-warning btn-sm"
              :disabled="actionPending"
              @click="refundOrder"
            >
              {{ t('admin.ordersPage.approveRefundRequest') }}
            </button>
            <button
              v-if="details.afterSalesStatus === 'REFUND_REQUESTED'"
              class="btn btn-outline btn-sm"
              :disabled="actionPending"
              @click="rejectRefundRequest"
            >
              {{ t('admin.ordersPage.rejectRefundRequest') }}
            </button>
            <button
              v-else-if="details.paymentStatus === 'PAID'"
              class="btn btn-error btn-sm"
              :disabled="actionPending"
              @click="refundOrder"
            >
              {{ t('admin.ordersPage.refundOrder') }}
            </button>
            <button
              v-else
              class="btn btn-error btn-sm"
              :disabled="actionPending || details.status === 'CANCELLED'"
              @click="cancelOrder"
            >
              {{ t('admin.ordersPage.cancelOrder') }}
            </button>
          </div>

          <div
            v-if="details.afterSalesStatus !== 'NONE'"
            class="mt-4 rounded-xl border border-base-300 bg-base-200 p-4 text-sm"
          >
            <div class="font-medium">{{ t('admin.ordersPage.afterSalesTitle') }}</div>
            <div class="mt-2 space-y-1">
              <div>
                {{ t('admin.ordersPage.afterSalesStatusLabel') }}:
                <strong>{{ afterSalesStatusLabel(details.afterSalesStatus) }}</strong>
              </div>
              <div v-if="details.refundRequestedAt">
                {{ t('admin.ordersPage.refundRequestedAtLabel') }}:
                <strong>{{ $formatDate(details.refundRequestedAt) }}</strong>
              </div>
              <div v-if="details.refundReviewedAt">
                {{ t('admin.ordersPage.refundReviewedAtLabel') }}:
                <strong>{{ $formatDate(details.refundReviewedAt) }}</strong>
              </div>
              <div v-if="details.refundRequestReason">
                {{ t('admin.ordersPage.refundRequestReasonLabel') }}:
                <strong>{{ details.refundRequestReason }}</strong>
              </div>
              <div v-if="details.refundRequestNote">
                {{ t('admin.ordersPage.refundRequestNoteLabel') }}:
                <strong>{{ details.refundRequestNote }}</strong>
              </div>
            </div>
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

definePageMeta({
  layout: 'admin',
  middleware: 'auth'})

interface ShopOrderLine {
  id: number
  productId: number | null
  title: string
  quantity: number
  unitPrice: number
  totalPrice: number
  meta: Record<string, any>
}

interface ShopOrder {
  id: number
  orderNumber: string
  language: string
  status: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'IN_PREPARATION' | 'READY' | 'IN_DELIVERY' | 'COMPLETED' | 'CANCELLED'
  paymentProvider: 'OFFLINE' | 'STRIPE'
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  afterSalesStatus: 'NONE' | 'REFUND_REQUESTED' | 'REFUND_REJECTED'
  providerSessionId: string | null
  providerPaymentIntentId: string | null
  providerPaymentStatus: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
  providerLastEventId: string | null
  paymentFailureReason: string | null
  refundRequestReason: string | null
  refundRequestNote: string | null
  refundRequestedAt: string | null
  refundReviewedAt: string | null
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
  paidAt: string | null
  refundedAt: string | null
  cancelledAt: string | null
  createdAt: string
  lines: ShopOrderLine[]
}

const { t } = useI18n()
const route = useRoute()
const { $toast, $formatPrice, $formatDate } = useNuxtApp() as any

const page = ref(1)
const selectedStatus = ref('')
const selectedPaymentStatus = ref('')
const detailsDialog = ref<HTMLDialogElement>()
const details = ref<ShopOrder | null>(null)
const loadingDetails = ref(false)
const actionPending = ref(false)
const nextStatus = ref<ShopOrder['status'] | ''>('')

const query = computed(() => ({
  page: page.value,
  limit: 20,
  ...(selectedStatus.value ? { status: selectedStatus.value } : {}),
  ...(selectedPaymentStatus.value ? { paymentStatus: selectedPaymentStatus.value } : {})
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
watch(selectedPaymentStatus, () => {
  page.value = 1
})

const statusOptions = computed(() => [
  { value: '', label: t('admin.ordersPage.filterAll') },
  { value: 'PENDING', label: t('admin.ordersPage.status.pending') },
  { value: 'CONFIRMED', label: t('admin.ordersPage.status.confirmed') },
  { value: 'IN_PREPARATION', label: t('admin.ordersPage.status.inPreparation') },
  { value: 'READY', label: t('admin.ordersPage.status.ready') },
  { value: 'IN_DELIVERY', label: t('admin.ordersPage.status.inDelivery') },
  { value: 'COMPLETED', label: t('admin.ordersPage.status.completed') },
  { value: 'CANCELLED', label: t('admin.ordersPage.status.cancelled') }
])
const paymentStatusOptions = computed(() => [
  { value: '', label: t('admin.ordersPage.filterAll') },
  { value: 'UNPAID', label: t('admin.ordersPage.paymentStatus.unpaid') },
  { value: 'PENDING', label: t('admin.ordersPage.paymentStatus.pending') },
  { value: 'PAID', label: t('admin.ordersPage.paymentStatus.paid') },
  { value: 'FAILED', label: t('admin.ordersPage.paymentStatus.failed') },
  { value: 'REFUNDED', label: t('admin.ordersPage.paymentStatus.refunded') },
])

const statusLabel = (status: ShopOrder['status']) => ({
  DRAFT: t('admin.ordersPage.status.draft'),
  PENDING: t('admin.ordersPage.status.pending'),
  CONFIRMED: t('admin.ordersPage.status.confirmed'),
  IN_PREPARATION: t('admin.ordersPage.status.inPreparation'),
  READY: t('admin.ordersPage.status.ready'),
  IN_DELIVERY: t('admin.ordersPage.status.inDelivery'),
  COMPLETED: t('admin.ordersPage.status.completed'),
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
  CONFIRMED: 'badge-success',
  IN_PREPARATION: 'badge-warning',
  READY: 'badge-info',
  IN_DELIVERY: 'badge-secondary',
  COMPLETED: 'badge-success',
  CANCELLED: 'badge-error'
}[status] || 'badge-ghost')

const afterSalesStatusLabel = (status: ShopOrder['afterSalesStatus']) => ({
  NONE: t('admin.ordersPage.afterSalesStatus.none'),
  REFUND_REQUESTED: t('admin.ordersPage.afterSalesStatus.refundRequested'),
  REFUND_REJECTED: t('admin.ordersPage.afterSalesStatus.refundRejected'),
}[status] || status)

const paymentBadgeClass = (status: ShopOrder['paymentStatus']) => ({
  UNPAID: 'badge-ghost',
  PENDING: 'badge-warning',
  PAID: 'badge-success',
  FAILED: 'badge-error',
  REFUNDED: 'badge-info'
}[status] || 'badge-ghost')

const statusTransitions: Record<ShopOrder['status'], ShopOrder['status'][]> = {
  DRAFT: ['PENDING'],
  PENDING: ['CONFIRMED'],
  CONFIRMED: ['PENDING', 'IN_PREPARATION', 'READY', 'COMPLETED'],
  IN_PREPARATION: ['READY', 'IN_DELIVERY', 'COMPLETED'],
  READY: ['IN_DELIVERY', 'COMPLETED'],
  IN_DELIVERY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
}
const availableStatusTransitions = computed(() => details.value ? statusTransitions[details.value.status] : [])

const deliveryTypeLabel = (value: ShopOrder['deliveryType']) => ({
  ONSITE: t('admin.ordersPage.deliveryTypeOnSite'),
  PICKUP: t('admin.ordersPage.deliveryTypePickup'),
  TOUR: t('admin.ordersPage.deliveryTypeHome')
}[value])

const deliveryAddressLine = (order: ShopOrder) =>
  [order.deliveryAddress, [order.deliveryPostalCode, order.deliveryCity].filter(Boolean).join(' ')].filter(Boolean).join(', ')

const openDetails = async (id: number) => {
  loadingDetails.value = true
  detailsDialog.value?.showModal()
  try {
    details.value = await $fetch<ShopOrder>(`/api/admin/orders/${id}`)
    nextStatus.value = ''
  } catch (error: any) {
    $toast.error(error?.statusMessage || t('common.error'))
    closeDetails()
  } finally {
    loadingDetails.value = false
  }
}

onMounted(() => {
  const requestedOrderId = Number(route.query.open)
  if (Number.isInteger(requestedOrderId) && requestedOrderId > 0) {
    void openDetails(requestedOrderId)
  }
})

const closeDetails = () => {
  detailsDialog.value?.close()
  details.value = null
}

const updateStatus = async (status: ShopOrder['status']) => {
  if (!details.value) return
  actionPending.value = true
  try {
    details.value = await $fetch<ShopOrder>(`/api/admin/orders/${details.value.id}/status`, {
      method: 'POST',
      body: { status }
    })
    await refresh()
    nextStatus.value = ''
    $toast.success(t('admin.ordersPage.saved'))
  } catch (error: any) {
    $toast.error(error?.statusMessage || t('common.error'))
  } finally {
    actionPending.value = false
  }
}

const markPaidOnSite = async () => {
  if (!details.value || actionPending.value) return
  if (!globalThis.confirm(t('admin.ordersPage.markPaidOnSiteConfirm'))) return
  actionPending.value = true
  try {
    details.value = await $fetch<ShopOrder>(`/api/admin/orders/${details.value.id}/mark-paid`, { method: 'POST' })
    await refresh()
    $toast.success(t('admin.ordersPage.markPaidOnSiteSuccess'))
  } catch (error: any) {
    $toast.error(error?.data?.message || error?.statusMessage || t('common.error'))
  } finally {
    actionPending.value = false
  }
}

function rentalDurationLabel(line: ShopOrderLine) {
  const mode = line.meta?.rentalPricingMode === 'HOURLY' ? 'hours' : 'days'
  return t(`admin.ordersPage.rentalDuration.${mode}`, { count: line.meta?.rentalDurationUnits })
}

function vatLineLabel(line: ShopOrderLine) {
  const rate = Number(line.meta?.vatRate || 0)
  return rate > 0 ? t('admin.ordersPage.vatRate', { rate }) : t('admin.ordersPage.vatNotApplicable')
}

function lineDocuments(line: ShopOrderLine) {
  const productId = Number(line.meta?.relatedProductId || line.productId || 0)
  const documents = Array.isArray(line.meta?.linkedBillingDocuments) ? line.meta.linkedBillingDocuments : []
  const files = Array.isArray(line.meta?.linkedFiles) ? line.meta.linkedFiles : []
  return [
    ...documents.filter((document: any) => Number(document?.id) > 0).map((document: any) => ({
      key: `document:${document.id}`,
      name: String(document.name || t('admin.ordersPage.document')),
      url: `/api/shop/billing-documents/${document.id}/preview?productId=${productId}&locale=${encodeURIComponent(details.value?.language || 'fr')}`,
    })),
    ...files.filter((file: any) => file?.url).map((file: any, index: number) => ({
      key: `file:${index}:${file.url}`,
      name: String(file.name || t('admin.ordersPage.document')),
      url: String(file.url),
    })),
  ]
}

const cancelOrder = async () => {
  if (!details.value || actionPending.value) return
  if (!globalThis.confirm(t('admin.ordersPage.cancelConfirm'))) return

  actionPending.value = true
  try {
    details.value = await $fetch<ShopOrder>(`/api/admin/orders/${details.value.id}/cancel`, {
      method: 'POST',
    })
    await refresh()
    $toast.success(t('admin.ordersPage.cancelSuccess'))
  } catch (error: any) {
    $toast.error(error?.data?.message || error?.statusMessage || t('admin.ordersPage.cancelError'))
  } finally {
    actionPending.value = false
  }
}

const refundOrder = async () => {
  if (!details.value || actionPending.value) return
  if (!globalThis.confirm(
    details.value.afterSalesStatus === 'REFUND_REQUESTED'
      ? t('admin.ordersPage.refundApproveConfirm')
      : t('admin.ordersPage.refundConfirm')
  )) return

  actionPending.value = true
  try {
    details.value = await $fetch<ShopOrder>(`/api/admin/orders/${details.value.id}/refund`, {
      method: 'POST',
    })
    await refresh()
    $toast.success(t('admin.ordersPage.refundSuccess'))
  } catch (error: any) {
    $toast.error(error?.data?.message || error?.statusMessage || t('admin.ordersPage.refundError'))
  } finally {
    actionPending.value = false
  }
}

const rejectRefundRequest = async () => {
  if (!details.value || actionPending.value) return
  const note = globalThis.prompt(t('admin.ordersPage.rejectRefundPrompt'))
  if (note === null) return

  actionPending.value = true
  try {
    details.value = await $fetch<ShopOrder>(`/api/admin/orders/${details.value.id}/refund-request/reject`, {
      method: 'POST',
      body: { note },
    })
    await refresh()
    $toast.success(t('admin.ordersPage.rejectRefundSuccess'))
  } catch (error: any) {
    $toast.error(error?.data?.message || error?.statusMessage || t('admin.ordersPage.rejectRefundError'))
  } finally {
    actionPending.value = false
  }
}
</script>
