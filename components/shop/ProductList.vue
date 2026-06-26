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
        :alt="getLocalizedName(product)"
        class="mb-4 h-44 w-full rounded-2xl object-cover"
        sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
      />
      <div class="mb-3 flex flex-wrap gap-2">
        <span v-if="product.category?.name" class="badge badge-soft">{{ product.category.name }}</span>
        <span class="badge badge-outline">{{ product.saleType === 'RENTAL' ? rentalLabel : saleLabel }}</span>
      </div>
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold">{{ getLocalizedName(product) }}</h3>
          <p v-if="showDescriptions && getLocalizedExcerpt(product)" class="mt-2 text-sm opacity-75">{{ getLocalizedExcerpt(product) }}</p>
        </div>
        <div class="text-right">
          <div class="text-lg font-semibold text-primary">{{ $formatPrice(product.price) }}</div>
          <div class="text-xs opacity-60">{{ getLocalizedUnitLabel(product) }}</div>
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
      <button class="btn btn-outline mt-5 w-full" :disabled="disableOnSoldOut && product.stock <= 0" @click="$emit('add', product)">
        {{ product.stock <= 0 && disableOnSoldOut ? soldOutLabel : product.saleType === 'RENTAL' ? rentalAddLabel : addLabel }}
      </button>
    </article>
  </div>
</template>

<script setup lang="ts">
import { pickCmsLocalizedText } from '#modula/shared/cms'
import type { ProductPayload } from '#modula/server/utils/shop'

const props = defineProps<{
  products: ProductPayload[]
  showImages?: boolean
  showDescriptions?: boolean
  itemBackgroundColor?: string
  addLabel: string
  rentalAddLabel: string
  soldOutLabel: string
  saleLabel: string
  rentalLabel: string
  stockLabel: string
  offlineLabel: string
  onlineLabel: string
  disableOnSoldOut?: boolean
}>()

defineEmits<{
  add: [product: ProductPayload]
}>()

const { locale } = useI18n()

const getLocalizedName = (product: ProductPayload) => pickCmsLocalizedText(locale.value, product.nameLocalized) || product.name
const getLocalizedExcerpt = (product: ProductPayload) => pickCmsLocalizedText(locale.value, product.excerptLocalized) || product.excerpt || ''
const getLocalizedUnitLabel = (product: ProductPayload) => pickCmsLocalizedText(locale.value, product.unitLabelLocalized) || product.unitLabel || ''
</script>
