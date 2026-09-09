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
          <span class="badge" :class="returnStatusBadge(row.returnStatus)">{{ returnStatusLabel(row.returnStatus) }}</span>
        </div>
      </template>
      <template #cell(actions)="{ row }">
        <div class="flex flex-wrap justify-end gap-2">
          <button v-if="row.returnStatus === 'EXPECTED'" class="btn btn-sm btn-primary" @click="openReturnDialog(row)">{{ t('admin.rentalsPage.recordReturn') }}</button>
          <button v-if="row.returnStatus === 'RETURNED_LATE_PENDING'" class="btn btn-sm btn-warning" @click="applyLateFee(row)">{{ t('admin.rentalsPage.applyLateFee') }}</button>
          <button v-if="['RETURNED_LATE_PENDING', 'LATE_FEE_DUE'].includes(row.returnStatus)" class="btn btn-sm btn-ghost" @click="openWaiverDialog(row)">{{ t('admin.rentalsPage.waiveLateFee') }}</button>
          <button v-if="row.returnStatus === 'LATE_FEE_DUE'" class="btn btn-sm btn-success" @click="markLateFeePaid(row)">{{ t('admin.rentalsPage.markLateFeePaid') }}</button>
          <NuxtLink :to="{ path: '/admin/shop/orders', query: { open: row.orderId } }" class="btn btn-sm btn-outline">{{ t('admin.rentalsPage.viewOrder') }}</NuxtLink>
        </div>
      </template>
    </AdminDataTable>

    <dialog ref="returnDialog" class="modal">
      <div class="modal-box max-w-2xl">
        <h2 class="text-xl font-semibold">{{ t('admin.rentalsPage.recordReturnTitle') }}</h2>
        <p v-if="selectedRental" class="mt-1 text-sm opacity-70">{{ selectedRental.product }} · {{ selectedRental.orderNumber }}</p>

        <label class="form-control mt-5 flex flex-col">
          <span class="label"><span class="label-text">{{ t('admin.rentalsPage.actualReturnAt') }}</span></span>
          <input v-model="actualReturnAt" type="datetime-local" class="input input-bordered" />
        </label>
        <button class="btn btn-outline btn-sm mt-3" :disabled="actionPending || !actualReturnAt" @click="previewReturn">
          <span v-if="actionPending" class="loading loading-spinner loading-xs" />
          {{ t('admin.rentalsPage.calculateReturn') }}
        </button>

        <div v-if="returnPreview" class="mt-5 rounded-box border border-base-300 bg-base-200/60 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <strong>{{ returnPreview.lateMinutes > 0 ? t('admin.rentalsPage.returnLate') : t('admin.rentalsPage.returnOnTime') }}</strong>
            <span v-if="returnPreview.lateMinutes > 0" class="badge badge-warning">{{ lateDurationLabel(returnPreview.lateMinutes) }}</span>
            <span v-else class="badge badge-success">{{ returnStatusLabel('RETURNED_ON_TIME') }}</span>
          </div>
          <template v-if="returnPreview.lateMinutes > 0 && returnPreview.feeEnabled">
            <div class="mt-4 flex items-end justify-between gap-4 border-t border-base-300 pt-4">
              <span>{{ t('admin.rentalsPage.calculatedLateFee') }}</span>
              <strong class="text-xl">{{ formatPrice(returnPreview.totalInclTax) }}</strong>
            </div>
            <p class="mt-1 text-right text-xs opacity-65">{{ t('admin.rentalsPage.lateFeeTaxBreakdown', { subtotal: formatPrice(returnPreview.subtotalExclTax), vat: formatPrice(returnPreview.vatAmount), rate: returnPreview.vatRate }) }}</p>
            <fieldset class="mt-4 space-y-2">
              <legend class="mb-2 font-medium">{{ t('admin.rentalsPage.lateFeeDecision') }}</legend>
              <label class="flex cursor-pointer items-center gap-3"><input v-model="returnDecision" type="radio" value="APPLY" class="radio radio-sm" /> {{ t('admin.rentalsPage.applyLateFee') }}</label>
              <label class="flex cursor-pointer items-center gap-3"><input v-model="returnDecision" type="radio" value="WAIVE" class="radio radio-sm" /> {{ t('admin.rentalsPage.waiveLateFee') }}</label>
              <label class="flex cursor-pointer items-center gap-3"><input v-model="returnDecision" type="radio" value="PENDING" class="radio radio-sm" /> {{ t('admin.rentalsPage.decideLater') }}</label>
            </fieldset>
            <label v-if="returnDecision === 'WAIVE'" class="form-control mt-3">
              <span class="label"><span class="label-text">{{ t('admin.rentalsPage.waiverReason') }}</span></span>
              <textarea v-model="waiverReason" class="textarea textarea-bordered" />
            </label>
          </template>
          <p v-else-if="returnPreview.lateMinutes > 0" class="mt-3 text-sm opacity-70">{{ t('admin.rentalsPage.noLateFeeConfigured') }}</p>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" :disabled="actionPending" @click="closeReturnDialog">{{ t('admin.common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="actionPending || !returnPreview" @click="saveReturn">{{ t('admin.rentalsPage.confirmReturn') }}</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="closeReturnDialog">close</button></form>
    </dialog>

    <dialog ref="waiverDialog" class="modal">
      <div class="modal-box">
        <h2 class="text-xl font-semibold">{{ t('admin.rentalsPage.waiveLateFee') }}</h2>
        <label class="form-control mt-4">
          <span class="label"><span class="label-text">{{ t('admin.rentalsPage.waiverReason') }}</span></span>
          <textarea v-model="waiverReason" class="textarea textarea-bordered" />
        </label>
        <div class="modal-action">
          <button class="btn btn-ghost" :disabled="actionPending" @click="closeWaiverDialog">{{ t('admin.common.cancel') }}</button>
          <button class="btn btn-warning" :disabled="actionPending || !waiverReason.trim()" @click="waiveLateFee">{{ t('admin.rentalsPage.confirmWaiver') }}</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button @click="closeWaiverDialog">close</button></form>
    </dialog>
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
  returnStatus: RentalReturnStatus
  lateFeeEnabled: boolean
  return: RentalReturn | null
}

type RentalReturnStatus = 'EXPECTED' | 'RETURNED_ON_TIME' | 'RETURNED_LATE_PENDING' | 'LATE_FEE_DUE' | 'LATE_FEE_WAIVED' | 'LATE_FEE_PAID'
type RentalReturnDecision = 'PENDING' | 'APPLY' | 'WAIVE'
interface RentalReturn {
  lateMinutes: number
  subtotalExclTax: number
  vatRate: number
  vatAmount: number
  totalInclTax: number
  feeEnabled?: boolean
}

const { t, locale } = useI18n()
const { $toast } = useNuxtApp() as any
const { data: rentals, pending, refresh } = await useFetch<RentalRow[]>('/api/admin/rentals', { default: () => [] })
const returnDialog = ref<HTMLDialogElement | null>(null)
const waiverDialog = ref<HTMLDialogElement | null>(null)
const selectedRental = ref<RentalRow | null>(null)
const actualReturnAt = ref('')
const returnPreview = ref<RentalReturn | null>(null)
const returnDecision = ref<RentalReturnDecision>('PENDING')
const waiverReason = ref('')
const actionPending = ref(false)
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
const returnStatusLabel = (status: RentalReturnStatus) => t(`admin.rentalsPage.returnStatus.${status.toLowerCase()}`)
const returnStatusBadge = (status: RentalReturnStatus) => ({
  EXPECTED: 'badge-ghost', RETURNED_ON_TIME: 'badge-success', RETURNED_LATE_PENDING: 'badge-warning',
  LATE_FEE_DUE: 'badge-error', LATE_FEE_WAIVED: 'badge-info', LATE_FEE_PAID: 'badge-success',
} as Record<RentalReturnStatus, string>)[status]
const formatPrice = (value: number) => new Intl.NumberFormat(locale.value, { style: 'currency', currency: 'EUR' }).format(value)
const lateDurationLabel = (minutes: number) => minutes < 60
  ? t('admin.rentalsPage.lateMinutes', { count: minutes })
  : t('admin.rentalsPage.lateHours', { count: Math.ceil(minutes / 60) })

function openReturnDialog(row: RentalRow) {
  selectedRental.value = row
  actualReturnAt.value = toLocalDateTimeInput(new Date())
  returnPreview.value = null
  returnDecision.value = 'PENDING'
  waiverReason.value = ''
  returnDialog.value?.showModal()
}

function closeReturnDialog() {
  returnDialog.value?.close()
  selectedRental.value = null
  returnPreview.value = null
}

async function previewReturn() {
  if (!selectedRental.value || !actualReturnAt.value) return
  await runAction(async () => {
    returnPreview.value = await $fetch<RentalReturn>(`/api/admin/rentals/${selectedRental.value!.id}/return`, {
      method: 'POST', body: { actualReturnAt: new Date(actualReturnAt.value).toISOString(), preview: true },
    })
  }, false)
}

async function saveReturn() {
  if (!selectedRental.value || !returnPreview.value) return
  if (returnDecision.value === 'WAIVE' && !waiverReason.value.trim()) {
    $toast?.error(t('admin.rentalsPage.waiverReasonRequired'))
    return
  }
  await runAction(async () => {
    await $fetch(`/api/admin/rentals/${selectedRental.value!.id}/return`, {
      method: 'POST',
      body: { actualReturnAt: new Date(actualReturnAt.value).toISOString(), decision: returnDecision.value, waiverReason: waiverReason.value },
    })
    closeReturnDialog()
    $toast?.success(t('admin.rentalsPage.returnSaved'))
  })
}

async function applyLateFee(row: RentalRow) {
  if (!globalThis.confirm(t('admin.rentalsPage.applyLateFeeConfirm'))) return
  selectedRental.value = row
  await runAction(async () => {
    await $fetch(`/api/admin/rentals/${row.id}/late-fee/decision`, { method: 'POST', body: { apply: true } })
    $toast?.success(t('admin.rentalsPage.actionSaved'))
  })
}

function openWaiverDialog(row: RentalRow) {
  selectedRental.value = row
  waiverReason.value = ''
  waiverDialog.value?.showModal()
}

function closeWaiverDialog() {
  waiverDialog.value?.close()
  selectedRental.value = null
}

async function waiveLateFee() {
  if (!selectedRental.value || !waiverReason.value.trim()) return
  await runAction(async () => {
    await $fetch(`/api/admin/rentals/${selectedRental.value!.id}/late-fee/waive`, { method: 'POST', body: { reason: waiverReason.value } })
    closeWaiverDialog()
    $toast?.success(t('admin.rentalsPage.actionSaved'))
  })
}

async function markLateFeePaid(row: RentalRow) {
  if (!globalThis.confirm(t('admin.rentalsPage.markLateFeePaidConfirm'))) return
  await runAction(async () => {
    await $fetch(`/api/admin/rentals/${row.id}/late-fee/mark-paid`, { method: 'POST' })
    $toast?.success(t('admin.rentalsPage.actionSaved'))
  })
}

async function runAction(callback: () => Promise<void>, reload = true) {
  if (actionPending.value) return
  actionPending.value = true
  try {
    await callback()
    if (reload) await refresh()
  } catch (error: any) {
    $toast?.error(error?.data?.message || error?.message || t('common.error'))
  } finally {
    actionPending.value = false
  }
}

function toLocalDateTimeInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}
</script>
