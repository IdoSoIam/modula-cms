<template>
  <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
    <article
      v-for="lot in productLots"
      :key="`lot-${lot.id}`"
      class="overflow-hidden rounded-[2rem] border border-base-300 bg-base-100 shadow-sm"
      :style="{ backgroundColor: cardBackgroundColor }"
    >
      <AppImage
        v-if="showImages && lot.imageUrl"
        :src="lot.imageUrl"
        :alt="lot.name"
        class="h-56 w-full object-cover"
        sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
      />
      <div class="space-y-4 p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="text-2xl font-semibold">{{ lot.name }}</h3>
            <p v-if="showDescriptions && lot.description" class="mt-2 text-sm opacity-75">{{ lot.description }}</p>
          </div>
          <div class="flex flex-col gap-2">
            <span class="badge badge-outline">{{ lot.kind === 'SINGLE' ? singleLabel : lotLabel }}</span>
            <span class="badge badge-soft">{{ lot.saleType === 'RENTAL' ? rentalLabel : saleLabel }}</span>
          </div>
        </div>
        <div v-if="lot.category?.name" class="text-sm opacity-70">
          {{ lot.category.name }}
        </div>
        <ul v-if="lot.items.length && showComposition" class="space-y-2 rounded-2xl bg-base-200/70 p-4 text-sm">
          <li v-for="item in lot.items" :key="`${lot.id}-${item.productId}`" class="flex justify-between gap-3">
            <span>{{ getLocalizedNestedProductName(item) }}</span>
            <span class="opacity-70">x{{ item.quantity }}</span>
          </li>
        </ul>
        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="text-sm opacity-60">{{ stockLabel }}</div>
            <div class="font-medium">{{ lot.stock }}</div>
          </div>
          <div class="text-right">
            <div class="text-sm opacity-60">{{ priceLabel }}</div>
            <div class="text-2xl font-semibold text-primary">{{ $formatPrice(lot.price) }}</div>
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <span v-if="lot.allowOfflinePayment" class="badge badge-soft">{{ offlineLabel }}</span>
          <span v-if="lot.allowOnlinePayment" class="badge badge-outline">{{ onlineLabel }}</span>
        </div>
        <button class="btn btn-primary w-full" :disabled="lot.stock <= 0" @click="$emit('add', lot)">
          {{ lot.stock <= 0 ? soldOutLabel : lot.saleType === 'RENTAL' ? rentalAddLabel : addLabel }}
        </button>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { pickCmsLocalizedText } from '#modula/shared/cms'
import type { ProductLotPayload } from '#modula/server/utils/shop'

defineProps<{
  productLots: ProductLotPayload[]
  showImages?: boolean
  showDescriptions?: boolean
  showComposition?: boolean
  cardBackgroundColor?: string
  addLabel: string
  rentalAddLabel: string
  soldOutLabel: string
  saleLabel: string
  rentalLabel: string
  offlineLabel: string
  onlineLabel: string
  singleLabel: string
  lotLabel: string
  stockLabel: string
  priceLabel: string
}>()

defineEmits<{
  add: [productLot: ProductLotPayload]
}>()

const { contentLocale } = useContentLocale()
const getLocalizedNestedProductName = (lot: ProductLotPayload['items'][number]) =>
  pickCmsLocalizedText(contentLocale.value, lot.product?.nameLocalized) || lot.product?.name || ''
</script>
