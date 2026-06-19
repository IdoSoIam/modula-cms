<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    <article
      v-for="product in products"
      :key="`product-${product.id}`"
      class="rounded-[1.75rem] border border-base-300 bg-base-100 p-5 shadow-sm"
      :style="{ backgroundColor: itemBackgroundColor }"
    >
      <AppImage
        v-if="showImages && product.imageUrl"
        :src="product.imageUrl"
        :alt="product.name"
        class="mb-4 h-44 w-full rounded-2xl object-cover"
        sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
      />
      <div class="mb-3 flex flex-wrap gap-2">
        <span v-if="product.category?.name" class="badge badge-soft">{{ product.category.name }}</span>
        <span class="badge badge-outline">{{ product.saleType === 'RENTAL' ? rentalLabel : saleLabel }}</span>
      </div>
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold">{{ product.name }}</h3>
          <p v-if="showDescriptions && product.excerpt" class="mt-2 text-sm opacity-75">{{ product.excerpt }}</p>
        </div>
        <div class="text-right">
          <div class="text-lg font-semibold text-primary">{{ $formatPrice(product.price) }}</div>
          <div class="text-xs opacity-60">{{ product.unitLabel || '' }}</div>
        </div>
      </div>
      <div class="mt-4 flex items-center justify-between gap-3 text-sm">
        <div>
          <div class="opacity-60">{{ stockLabel }}</div>
          <div class="font-medium">{{ product.stock }}</div>
        </div>
        <div class="flex flex-wrap justify-end gap-2">
          <span v-if="product.allowOfflinePayment" class="badge badge-soft">{{ offlineLabel }}</span>
          <span v-if="product.allowOnlinePayment" class="badge badge-outline">{{ onlineLabel }}</span>
        </div>
      </div>
      <button class="btn btn-outline mt-5 w-full" :disabled="product.stock <= 0" @click="$emit('add', product)">
        {{ product.stock <= 0 ? soldOutLabel : addLabel }}
      </button>
    </article>
  </div>
</template>

<script setup lang="ts">
import type { ProductPayload } from '#modula/server/utils/shop'

defineProps<{
  products: ProductPayload[]
  showImages?: boolean
  showDescriptions?: boolean
  itemBackgroundColor?: string
  addLabel: string
  soldOutLabel: string
  saleLabel: string
  rentalLabel: string
  stockLabel: string
  offlineLabel: string
  onlineLabel: string
}>()

defineEmits<{
  add: [product: ProductPayload]
}>()
</script>
