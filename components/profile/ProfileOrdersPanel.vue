<template>
  <section class="space-y-6">
    <div class="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <div class="card border border-base-300 bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 class="card-title text-2xl">{{ publicText('orders.title', 'Mes commandes') }}</h2>
              <p class="text-sm opacity-65">{{ publicText('orders.historyDescription', 'Suivez vos commandes récentes, leur paiement et leur livraison.') }}</p>
            </div>
            <div class="hidden rounded-2xl bg-primary/10 p-3 text-primary md:block">
              <Icon name="mdi:invoice" size="28" />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-2xl border border-base-300 bg-base-200/60 p-4">
              <div class="text-xs uppercase tracking-[0.18em] opacity-60">{{ publicText('orders.countLabel', 'Commandes') }}</div>
              <div class="mt-2 text-2xl font-black">{{ orders.length }}</div>
            </div>
            <div class="rounded-2xl border border-base-300 bg-base-200/60 p-4">
              <div class="text-xs uppercase tracking-[0.18em] opacity-60">{{ publicText('orders.latestLabel', 'Dernière commande') }}</div>
              <div class="mt-2 text-sm font-semibold">
                {{ latestOrder ? latestOrder.orderNumber : publicText('orders.none', 'Aucune') }}
              </div>
              <div v-if="latestOrder" class="mt-1 text-xs opacity-65">
                {{ formatDateTime(latestOrder.createdAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card border border-base-300 bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 class="card-title text-2xl">{{ publicText('orders.statusOverview', 'Vue d’ensemble des statuts') }}</h2>
              <p class="text-sm opacity-65">{{ publicText('orders.statusOverviewDescription', 'Consultez rapidement l’état de votre dernière commande.') }}</p>
            </div>
            <div class="hidden rounded-2xl bg-secondary/10 p-3 text-secondary md:block">
              <Icon name="mdi:truck-outline" size="28" />
            </div>
          </div>

          <div v-if="latestOrder" class="space-y-3">
            <div class="flex flex-wrap gap-2">
              <span class="badge badge-lg" :class="orderStatusBadgeClass(latestOrder.status)">
                {{ orderStatusLabel(latestOrder.status) }}
              </span>
              <span class="badge badge-lg" :class="paymentStatusBadgeClass(latestOrder.paymentStatus)">
                {{ paymentStatusLabel(latestOrder.paymentStatus) }}
              </span>
              <span class="badge badge-lg badge-outline">
                {{ deliveryTypeLabel(latestOrder.deliveryType) }}
              </span>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200/60 p-4 text-sm">
              <div><strong>{{ publicText('orders.total', 'Total') }}:</strong> {{ formatPrice(latestOrder.total) }}</div>
              <div><strong>{{ publicText('orders.paymentMethod', 'Mode de règlement') }}:</strong> {{ paymentProviderLabel(latestOrder.paymentProvider) }}</div>
              <div><strong>{{ publicText('orders.fulfillmentLabel', 'Livraison') }}:</strong> {{ fulfillmentSummary(latestOrder) }}</div>
            </div>
          </div>

          <div v-else class="rounded-2xl border border-dashed border-base-300 bg-base-200/40 p-5 text-sm opacity-70">
            {{ publicText('orders.noOrders', 'Aucune commande pour le moment.') }}
          </div>
        </div>
      </div>
    </div>

    <div class="card border border-base-300 bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 class="card-title text-2xl">{{ publicText('orders.orderHistory', 'Historique des commandes') }}</h2>
            <p class="text-sm opacity-65">{{ publicText('orders.historyHelp', 'Ouvrez une commande pour voir les lignes, le règlement et la livraison.') }}</p>
          </div>
          <button type="button" class="btn btn-ghost btn-sm" :disabled="loading" @click="loadOrders">
            <span v-if="loading" class="loading loading-spinner loading-xs"></span>
            {{ refreshLabel }}
          </button>
        </div>

        <div v-if="loading && !orders.length" class="py-10 text-center text-sm opacity-70">
          {{ publicText('orders.loading', 'Chargement des commandes...') }}
        </div>

        <div v-else-if="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>

        <div v-else-if="!orders.length" class="rounded-2xl border border-dashed border-base-300 bg-base-200/40 p-6 text-sm opacity-70">
          {{ publicText('orders.noOrders', 'Aucune commande pour le moment.') }}
        </div>

        <div v-else class="space-y-4">
          <article
            v-for="order in orders"
            :key="order.id"
            class="rounded-3xl border border-base-300 bg-base-200/50 p-5"
          >
            <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div class="space-y-3">
                <div class="flex flex-wrap items-center gap-3">
                  <h3 class="text-lg font-bold">{{ order.orderNumber }}</h3>
                  <span class="badge" :class="orderStatusBadgeClass(order.status)">
                    {{ orderStatusLabel(order.status) }}
                  </span>
                  <span class="badge" :class="paymentStatusBadgeClass(order.paymentStatus)">
                    {{ paymentStatusLabel(order.paymentStatus) }}
                  </span>
                </div>

                <div class="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <div class="text-xs uppercase tracking-[0.18em] opacity-60">{{ publicText('orders.orderDate', 'Date de commande') }}</div>
                    <div class="mt-1 font-medium">{{ formatDateTime(order.createdAt) }}</div>
                  </div>
                  <div>
                    <div class="text-xs uppercase tracking-[0.18em] opacity-60">{{ publicText('orders.total', 'Total') }}</div>
                    <div class="mt-1 font-medium">{{ formatPrice(order.total) }}</div>
                  </div>
                  <div>
                    <div class="text-xs uppercase tracking-[0.18em] opacity-60">{{ publicText('orders.deliveryMethod', 'Mode de livraison') }}</div>
                    <div class="mt-1 font-medium">{{ deliveryTypeLabel(order.deliveryType) }}</div>
                  </div>
                  <div>
                    <div class="text-xs uppercase tracking-[0.18em] opacity-60">{{ publicText('orders.paymentMethod', 'Mode de règlement') }}</div>
                    <div class="mt-1 font-medium">{{ paymentProviderLabel(order.paymentProvider) }}</div>
                  </div>
                </div>

                <div class="text-sm opacity-75">
                  {{ fulfillmentSummary(order) }}
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <button type="button" class="btn btn-primary btn-sm" @click="openOrder(order.id)">
                  {{ publicText('orders.viewDetails', 'Voir le détail') }}
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>

    <dialog class="modal" :class="{ 'modal-open': detailOpen }">
      <div class="modal-box max-w-5xl">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 class="text-2xl font-bold">
              {{ selectedOrder?.orderNumber || publicText('orders.detailTitle', 'Détail de la commande') }}
            </h3>
            <p class="mt-1 text-sm opacity-65">{{ publicText('orders.detailDescription', 'Consultez les lignes, le règlement et la livraison de cette commande.') }}</p>
          </div>
          <button type="button" class="btn btn-sm btn-circle" @click="closeOrder">x</button>
        </div>

        <div v-if="detailLoading" class="py-10 text-center text-sm opacity-70">
          {{ publicText('orders.loadingDetails', 'Chargement du détail...') }}
        </div>

        <div v-else-if="detailError" class="alert alert-error">
          {{ detailError }}
        </div>

        <div v-else-if="selectedOrder" class="space-y-6">
          <div class="flex flex-wrap gap-2">
            <span class="badge badge-lg" :class="orderStatusBadgeClass(selectedOrder.status)">
              {{ orderStatusLabel(selectedOrder.status) }}
            </span>
            <span class="badge badge-lg" :class="paymentStatusBadgeClass(selectedOrder.paymentStatus)">
              {{ paymentStatusLabel(selectedOrder.paymentStatus) }}
            </span>
            <span class="badge badge-lg badge-outline">
              {{ deliveryTypeLabel(selectedOrder.deliveryType) }}
            </span>
          </div>

          <div class="grid gap-4 lg:grid-cols-3">
            <div class="rounded-2xl border border-base-300 bg-base-200/60 p-4">
              <div class="text-xs uppercase tracking-[0.18em] opacity-60">{{ publicText('orders.customerLabel', 'Client') }}</div>
              <div class="mt-2 font-semibold">{{ selectedOrder.customerName }}</div>
              <div class="mt-1 text-sm opacity-80">{{ selectedOrder.email }}</div>
              <div v-if="selectedOrder.phone" class="mt-1 text-sm opacity-80">{{ selectedOrder.phone }}</div>
            </div>
            <div class="rounded-2xl border border-base-300 bg-base-200/60 p-4">
              <div class="text-xs uppercase tracking-[0.18em] opacity-60">{{ publicText('orders.paymentLabel', 'Paiement') }}</div>
              <div class="mt-2 text-sm">
                <div><strong>{{ publicText('orders.paymentMethod', 'Mode de règlement') }}:</strong> {{ paymentProviderLabel(selectedOrder.paymentProvider) }}</div>
                <div><strong>{{ publicText('orders.paymentState', 'État du paiement') }}:</strong> {{ paymentStatusLabel(selectedOrder.paymentStatus) }}</div>
                <div v-if="selectedOrder.paidAt"><strong>{{ publicText('orders.paidAt', 'Payé le') }}:</strong> {{ formatDateTime(selectedOrder.paidAt) }}</div>
                <div v-if="selectedOrder.refundedAt"><strong>{{ publicText('orders.refundedAt', 'Remboursé le') }}:</strong> {{ formatDateTime(selectedOrder.refundedAt) }}</div>
                <div v-if="selectedOrder.paymentFailureReason"><strong>{{ publicText('orders.failureReason', 'Raison de l’échec') }}:</strong> {{ selectedOrder.paymentFailureReason }}</div>
              </div>
            </div>
            <div class="rounded-2xl border border-base-300 bg-base-200/60 p-4">
              <div class="text-xs uppercase tracking-[0.18em] opacity-60">{{ publicText('orders.fulfillmentLabel', 'Livraison') }}</div>
              <div class="mt-2 text-sm">
                <div><strong>{{ publicText('orders.deliveryMethod', 'Mode de livraison') }}:</strong> {{ deliveryTypeLabel(selectedOrder.deliveryType) }}</div>
                <div><strong>{{ publicText('orders.fulfillmentDate', 'Date') }}:</strong> {{ selectedOrder.fulfillmentDate ? formatDate(selectedOrder.fulfillmentDate) : publicText('orders.noFulfillmentYet', 'Pas encore planifié') }}</div>
                <div><strong>{{ publicText('orders.fulfillmentTime', 'Heure') }}:</strong> {{ selectedOrder.fulfillmentTime || publicText('orders.noFulfillmentYet', 'Pas encore planifié') }}</div>
                <div><strong>{{ publicText('orders.fulfillmentLocation', 'Lieu') }}:</strong> {{ selectedOrder.fulfillmentLocation || publicText('orders.noFulfillmentYet', 'Pas encore planifié') }}</div>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-100">
            <div class="border-b border-base-300 px-4 py-3">
              <div class="font-semibold">{{ publicText('orders.orderItems', 'Articles commandés') }}</div>
            </div>
            <div class="divide-y divide-base-300">
              <div v-for="line in selectedOrder.lines" :key="line.id" class="flex flex-col gap-3 px-4 py-4 md:flex-row md:items-start md:justify-between">
                <div class="min-w-0">
                  <div class="font-medium">{{ line.title }}</div>
                  <div class="mt-1 text-sm opacity-70">
                    {{ lineDescription(line) }}
                  </div>
                </div>
                <div class="grid gap-2 text-sm md:min-w-[220px]">
                  <div class="flex items-center justify-between gap-3">
                    <span class="opacity-70">{{ publicText('orders.quantity', 'Quantité') }}</span>
                    <span class="font-medium">{{ line.quantity }}</span>
                  </div>
                  <div class="flex items-center justify-between gap-3">
                    <span class="opacity-70">{{ publicText('orders.unitPrice', 'Prix unitaire') }}</span>
                    <span class="font-medium">{{ formatPrice(line.unitPrice) }}</span>
                  </div>
                  <div class="flex items-center justify-between gap-3">
                    <span class="opacity-70">{{ publicText('orders.total', 'Total') }}</span>
                    <span class="font-semibold">{{ formatPrice(line.totalPrice) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid gap-4 lg:grid-cols-2">
            <div class="rounded-2xl border border-base-300 bg-base-200/60 p-4 text-sm">
              <div class="mb-2 text-xs uppercase tracking-[0.18em] opacity-60">{{ publicText('orders.messageLabel', 'Message') }}</div>
              <div v-if="selectedOrder.message" class="whitespace-pre-wrap">{{ selectedOrder.message }}</div>
              <div v-else class="opacity-70">{{ publicText('orders.noMessage', 'Aucun message.') }}</div>
            </div>

            <div class="rounded-2xl border border-base-300 bg-base-200/60 p-4 text-sm">
              <div class="mb-2 text-xs uppercase tracking-[0.18em] opacity-60">{{ publicText('orders.actionsTitle', 'Actions') }}</div>
              <div v-if="canCancel(selectedOrder)" class="opacity-80">
                {{ publicText('orders.cancelComingSoon', 'L’annulation en ligne sera disponible prochainement pour cette commande.') }}
              </div>
              <div v-else class="opacity-70">
                {{ publicText('orders.noActions', 'Aucune action disponible pour cette commande.') }}
              </div>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button type="button" class="btn" @click="closeOrder">{{ closeLabel }}</button>
        </div>
      </div>
    </dialog>
  </section>
</template>

<script setup lang="ts">
interface ShopOrderLine {
  id: number
  orderId: number
  productLotId: number | null
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
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED'
  paymentProvider: 'OFFLINE' | 'STRIPE'
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  paymentFailureReason: string | null
  customerName: string
  email: string
  phone: string | null
  message: string | null
  deliveryType: 'ONSITE' | 'PICKUP' | 'TOUR' | null
  fulfillmentDate: string | null
  fulfillmentTime: string | null
  fulfillmentLocation: string | null
  total: number
  paidAt: string | null
  refundedAt: string | null
  createdAt: string
  lines: ShopOrderLine[]
}

const props = defineProps<{
  active: boolean
  initialOrderId?: number | null
}>()

const { publicText } = usePublicDictionary()

const refreshLabel = computed(() => publicText('orders.refresh', 'Rafraîchir'))
const closeLabel = computed(() => publicText('orders.close', 'Fermer'))

const loading = ref(false)
const detailLoading = ref(false)
const ordersLoaded = ref(false)
const detailOpen = ref(false)
const orders = ref<ShopOrder[]>([])
const selectedOrder = ref<ShopOrder | null>(null)
const errorMessage = ref('')
const detailError = ref('')
const openedOrderIds = ref<number[]>([])

const latestOrder = computed(() => orders.value[0] ?? null)

const formatPrice = (value: number) => (useNuxtApp() as any).$formatPrice(value) as string
const formatDate = (value: string) => (useNuxtApp() as any).$formatDate(value) as string
const formatDateTime = (value: string) => (useNuxtApp() as any).$formatDateTime(value) as string
const formatTime = (value: string) => (useNuxtApp() as any).$formatTime(value) as string

const orderStatusLabel = (value: ShopOrder['status']) => {
  const key = value === 'PAID' ? 'paid' : value === 'CANCELLED' ? 'cancelled' : value === 'DRAFT' ? 'draft' : 'pending'
  return publicText(`orders.shopStatus.${key}`, key)
}

const paymentStatusLabel = (value: ShopOrder['paymentStatus']) => {
  const key = value === 'UNPAID'
    ? 'unpaid'
    : value === 'PENDING'
      ? 'pending'
      : value === 'PAID'
        ? 'paid'
        : value === 'FAILED'
          ? 'failed'
          : 'refunded'
  return publicText(`orders.paymentStatus.${key}`, key)
}

const paymentProviderLabel = (value: ShopOrder['paymentProvider']) => {
  return value === 'STRIPE'
    ? publicText('orders.paymentProvider.stripe', 'Paiement en ligne')
    : publicText('orders.paymentProvider.offline', 'Paiement sur place')
}

const deliveryTypeLabel = (value: ShopOrder['deliveryType']) => {
  if (value === 'TOUR') return publicText('orders.deliveryType.home', 'Livraison à domicile')
  if (value === 'PICKUP') return publicText('orders.deliveryType.pickup', 'Point relais')
  if (value === 'ONSITE') return publicText('orders.deliveryType.onSite', 'Retrait sur place')
  return publicText('orders.none', 'Aucune')
}

const orderStatusBadgeClass = (value: ShopOrder['status']) => {
  if (value === 'PAID') return 'badge-success'
  if (value === 'CANCELLED') return 'badge-error'
  if (value === 'DRAFT') return 'badge-neutral'
  return 'badge-warning'
}

const paymentStatusBadgeClass = (value: ShopOrder['paymentStatus']) => {
  if (value === 'PAID') return 'badge-success'
  if (value === 'FAILED') return 'badge-error'
  if (value === 'REFUNDED') return 'badge-info'
  if (value === 'PENDING') return 'badge-warning'
  return 'badge-neutral'
}

const fulfillmentSummary = (order: ShopOrder) => {
  const parts = [
    deliveryTypeLabel(order.deliveryType),
    order.fulfillmentDate ? formatDate(order.fulfillmentDate) : null,
    order.fulfillmentTime ? formatTime(order.fulfillmentTime) : null,
    order.fulfillmentLocation || null,
  ].filter(Boolean)
  return parts.length ? parts.join(' - ') : publicText('orders.noFulfillmentYet', 'Pas encore planifié')
}

const lineDescription = (line: ShopOrderLine) => {
  const pieces: string[] = []
  if (line.meta?.unitLabel) {
    pieces.push(String(line.meta.unitLabel))
  }
  if (line.meta?.kind === 'LOT') {
    pieces.push(publicText('orders.productLotLabel', 'Lot produit'))
  }
  if (Array.isArray(line.meta?.items) && line.meta.items.length) {
    pieces.push(
      line.meta.items
        .map((item: any) => `${item.productName} x${item.quantity}`)
        .filter(Boolean)
        .join(', ')
    )
  }
  return pieces.length ? pieces.join(' - ') : publicText('orders.standardLine', 'Ligne standard')
}

const canCancel = (order: ShopOrder) => order.status === 'PENDING' && order.paymentStatus !== 'PAID' && order.paymentStatus !== 'REFUNDED'

const loadOrders = async () => {
  if (loading.value) return
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await $fetch<{ items: ShopOrder[] }>('/api/profile/orders')
    orders.value = response.items || []
    ordersLoaded.value = true
    if (props.initialOrderId && !openedOrderIds.value.includes(props.initialOrderId)) {
      openedOrderIds.value.push(props.initialOrderId)
      await openOrder(props.initialOrderId)
    }
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.statusMessage || publicText('orders.loadError', 'Impossible de charger les commandes.')
  } finally {
    loading.value = false
  }
}

const openOrder = async (orderId: number) => {
  detailOpen.value = true
  detailLoading.value = true
  detailError.value = ''

  try {
    selectedOrder.value = await $fetch<ShopOrder>(`/api/profile/orders/${orderId}`)
  } catch (error: any) {
    detailError.value = error?.data?.message || error?.statusMessage || publicText('orders.loadDetailError', 'Impossible de charger le détail de la commande.')
    selectedOrder.value = null
  } finally {
    detailLoading.value = false
  }
}

const closeOrder = () => {
  detailOpen.value = false
  detailError.value = ''
  selectedOrder.value = null
}

watch(
  () => props.active,
  async (active) => {
    if (active && !ordersLoaded.value) {
      await loadOrders()
    }
  },
  { immediate: true }
)

watch(
  () => props.initialOrderId,
  async (orderId) => {
    if (!props.active || !orderId || !ordersLoaded.value || openedOrderIds.value.includes(orderId)) return
    openedOrderIds.value.push(orderId)
    await openOrder(orderId)
  }
)
</script>
