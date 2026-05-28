<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-3xl font-bold mb-8">{{ $t('orders.title') }}</h1>

      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- Empty state -->
      <div v-else-if="!orders || orders.length === 0" class="text-center py-12">
        <Icon name="mdi:package-variant" size="64" class="text-gray-400 mb-4" />
        <p class="text-gray-600 text-lg mb-4">{{ $t('orders.noOrders') }}</p>
        <NuxtLink to="/shop" class="btn btn-primary">
          {{ $t('orders.startShopping') }}
        </NuxtLink>
      </div>

      <!-- Orders list -->
      <div v-else class="space-y-6">
        <div 
          v-for="order in orders" 
          :key="order.id"
          class="card bg-base-100 shadow-xl"
        >
          <div class="card-body">
            <!-- Order header -->
            <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h3 class="card-title">
                  {{ $t('orders.orderNumber') }} #{{ order.id }}
                </h3>
                <p class="text-sm text-gray-600">
                  {{ $t('orders.orderDate') }}: {{ $formatDate(order.createdAt) }}
                </p>
              </div>
              <div class="mt-2 md:mt-0">
                <div class="badge" :class="getStatusClass(order.status)">
                  {{ $t(`orders.status.${order.status}`) }}
                </div>
              </div>
            </div>

            <!-- Order items -->
            <div class="overflow-x-auto">
              <table class="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>{{ $t('orders.product') }}</th>
                    <th>{{ $t('orders.quantity') }}</th>
                    <th>{{ $t('orders.unitPrice') }}</th>
                    <th>{{ $t('orders.total') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in order.items" :key="item.id">
                    <td>
                      <div class="flex items-center gap-3">
                        <div class="w-12 h-12">
                          <ProductImage
                            v-if="item.product?.image"
                            :src="item.product.image"
                            :alt="item.product.name"
                            class="rounded w-full h-full object-cover"
                          />
                          <ImagePlaceholder
                            v-else
                            :alt="item.product?.name || 'Product'"
                            class="rounded w-full h-full object-cover"
                          />
                        </div>
                        <span class="font-medium">{{ item.product?.name || item.productName }}</span>
                      </div>
                    </td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ item.price.toFixed(2) }}€</td>
                    <td>{{ (item.price * item.quantity).toFixed(2) }}€</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Order summary -->
            <div class="flex flex-col md:flex-row md:justify-between md:items-end mt-4 pt-4 border-t">
              <div>
                <p class="text-sm text-gray-600">
                  {{ $t('orders.shippingAddress') }}:
                </p>
                <div v-if="order.shippingAddress" class="text-sm">
                  <p>{{ order.shippingAddress.street }}</p>
                  <p>{{ order.shippingAddress.postalCode }} {{ order.shippingAddress.city }}</p>
                  <p>{{ order.shippingAddress.country }}</p>
                </div>
                <p v-else class="text-gray-500 text-sm">
                  {{ $t('orders.noShippingAddress') }}
                </p>
              </div>
              
              <div class="text-right mt-4 md:mt-0">
                <div class="space-y-1">
                  <div class="flex justify-between gap-4">
                    <span>{{ $t('orders.subtotal') }}:</span>
                    <span>{{ order.subtotal.toFixed(2) }}€</span>
                  </div>
                  <div class="flex justify-between gap-4">
                    <span>{{ $t('orders.shipping') }}:</span>
                    <span>{{ order.shipping.toFixed(2) }}€</span>
                  </div>
                  <div class="divider my-1"></div>
                  <div class="flex justify-between gap-4 font-bold text-lg">
                    <span>{{ $t('orders.total') }}:</span>
                    <span>{{ order.total.toFixed(2) }}€</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Order actions -->
            <div class="card-actions justify-end mt-4">
              <button 
                v-if="order.status === 'pending'"
                class="btn btn-error btn-outline btn-sm"
                @click="cancelOrder(order.id)"
                :disabled="isUpdating"
              >
                {{ $t('orders.cancel') }}
              </button>
              <button 
                class="btn btn-primary btn-outline btn-sm"
                @click="downloadInvoice(order.id)"
                :disabled="isUpdating"
              >
                {{ $t('orders.downloadInvoice') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Error message -->
      <div v-if="error" class="alert alert-error mt-4">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '#modula/stores/auth'

definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()
const { $toast, $formatPrice, $formatDate } = useNuxtApp()

interface OrderItem {
  id: number
  productId: number
  productName: string
  quantity: number
  price: number
  product?: {
    name: string
    image?: string
  }
}

interface Order {
  id: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  subtotal: number
  shipping: number
  total: number
  createdAt: string
  shippingAddress?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  items: OrderItem[]
}

const orders = ref<Order[]>([])
const isLoading = ref(true)
const isUpdating = ref(false)
const error = ref('')

onMounted(async () => {
  await fetchOrders()
})

const fetchOrders = async () => {
  isLoading.value = true
  error.value = ''
  
  try {
    const response = await $fetch<{ orders: Order[] }>('/api/orders')
    orders.value = response.orders || []
  } catch (e: any) {
    error.value = e?.data?.message || 'Erreur lors du chargement des commandes'
    console.error('Error fetching orders:', e)
  } finally {
    isLoading.value = false
  }
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'badge-warning',
    confirmed: 'badge-info',
    shipped: 'badge-primary',
    delivered: 'badge-success',
    cancelled: 'badge-error'
  }
  return classes[status] || 'badge-neutral'
}

const cancelOrder = async (orderId: number) => {
  if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
    return
  }
  
  isUpdating.value = true
  error.value = ''
    try {
    await $fetch(`/api/orders/${orderId}/cancel`, {
      method: 'PATCH'
    })
    
    // Update local state
    const orderIndex = orders.value.findIndex(o => o.id === orderId)
    if (orderIndex !== -1) {
      orders.value[orderIndex].status = 'cancelled'
    }
    
    $toast.success('Commande annulée avec succès')
  } catch (e: any) {
    error.value = e?.data?.message || 'Erreur lors de l\'annulation de la commande'
    $toast.error('Erreur lors de l\'annulation')
  } finally {
    isUpdating.value = false
  }
}

const downloadInvoice = async (orderId: number) => {
  isUpdating.value = true
  
  try {
    // This would typically download a PDF invoice
    const response = await $fetch(`/api/orders/${orderId}/invoice`, {
      method: 'GET'
    })
    
    // For now, just show a success message
    $toast.success('Facture téléchargée')
  } catch (e: any) {
    error.value = e?.data?.message || 'Erreur lors du téléchargement de la facture'
    $toast.error('Erreur lors du téléchargement')
  } finally {
    isUpdating.value = false
  }
}
</script>
