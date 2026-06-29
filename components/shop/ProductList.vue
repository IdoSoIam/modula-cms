<template>
  <div :class="containerClass">
    <article
      v-for="product in products"
      :key="`product-${product.id}`"
      class="rounded-[1.75rem] border border-base-300 bg-base-100 p-5 shadow-sm"
      :class="articleClass"
      :style="{ backgroundColor: itemBackgroundColor }"
    >
      <div :class="contentClass">
        <AppImage
          v-if="showImages && product.imageUrl"
          :src="product.imageUrl"
          :alt="getLocalizedName(product)"
          class="w-full rounded-2xl object-cover"
          :class="imageClass"
          :sizes="imageSizes"
        />
        <div class="flex min-w-0 flex-1 flex-col">
          <div class="mb-3 flex flex-wrap gap-2">
            <span v-if="product.category?.name" class="badge badge-soft">{{ product.category.name }}</span>
            <span class="badge badge-outline">{{ product.saleType === 'RENTAL' ? rentalLabel : saleLabel }}</span>
          </div>
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
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
          <button class="btn btn-outline mt-5 w-full lg:mt-auto" :disabled="disableOnSoldOut && product.stock <= 0" @click="$emit('add', product)">
            {{ product.stock <= 0 && disableOnSoldOut ? soldOutLabel : product.saleType === 'RENTAL' ? rentalAddLabel : addLabel }}
          </button>
        </div>
      </div>
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

const { contentLocale } = useContentLocale()
const isSingleProduct = computed(() => props.products.length === 1)
const containerClass = computed(() => isSingleProduct.value
  ? 'grid grid-cols-1 gap-6'
  : 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4')
const articleClass = computed(() => isSingleProduct.value ? 'overflow-hidden xl:col-span-1' : '')
const contentClass = computed(() => isSingleProduct.value ? 'flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] lg:gap-8' : '')
const imageClass = computed(() => isSingleProduct.value ? 'h-72 lg:h-full lg:min-h-[24rem]' : 'mb-4 h-44')
const imageSizes = computed(() => isSingleProduct.value
  ? '(min-width: 1024px) 55vw, 100vw'
  : '(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw')

const getLocalizedName = (product: ProductPayload) => pickCmsLocalizedText(contentLocale.value, product.nameLocalized) || product.name
const getLocalizedExcerpt = (product: ProductPayload) => pickCmsLocalizedText(contentLocale.value, product.excerptLocalized) || product.excerpt || ''
const getLocalizedUnitLabel = (product: ProductPayload) => pickCmsLocalizedText(contentLocale.value, product.unitLabelLocalized) || product.unitLabel || ''
</script>
