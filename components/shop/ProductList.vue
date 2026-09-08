<template>
  <div :class="containerClass">
    <article
      v-for="product in products"
      :key="`product-${product.id}`"
      class="modula-card flex h-full flex-col border border-base-300 bg-base-100 p-5 shadow-sm"
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
              <p v-if="showDescriptions && getLocalizedExcerpt(product)" class="mt-2 text-sm opacity-75 wrap-break-word">{{ getLocalizedExcerpt(product) }}</p>
            </div>
            <div class="text-right">
              <template v-if="product.saleType === 'RENTAL'">
                <div v-for="rate in getRentalRates(product)" :key="rate.unit" class="whitespace-nowrap">
                  <span class="text-lg font-semibold text-primary">{{ $formatPrice(rate.price) }}</span>
                  <span class="text-xs opacity-60"> / {{ rate.unit }}</span>
                </div>
              </template>
              <template v-else>
                <div class="text-lg font-semibold text-primary">{{ $formatPrice(product.price) }}</div>
                <div class="text-xs opacity-60">{{ getLocalizedUnitLabel(product) }}</div>
              </template>
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
          <div class="mt-auto grid grid-cols-1 gap-2 pt-8" :class="isSingleProduct && product.saleType !== 'RENTAL' ? 'sm:grid-cols-2' : ''">
            <button v-if="product.saleType !== 'RENTAL'" type="button" class="btn btn-ghost h-auto min-h-10 whitespace-normal py-2 leading-tight" @click="$emit('view', product)">
              {{ viewLabel }}
            </button>
            <button
              type="button"
              class="btn btn-primary h-auto min-h-10 whitespace-normal py-2 leading-tight"
              :disabled="disableOnSoldOut && product.stock <= 0"
              @click="$emit('add', product)"
            >
              {{ product.stock <= 0 && disableOnSoldOut ? soldOutLabel : product.saleType === 'RENTAL' ? rentalAddLabel : addLabel }}
            </button>
          </div>
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
  viewLabel: string
  addLabel: string
  rentalAddLabel: string
  soldOutLabel: string
  saleLabel: string
  rentalLabel: string
  stockLabel: string
  offlineLabel: string
  onlineLabel: string
  disableOnSoldOut?: boolean
  layout?: 'grid' | 'list'
  gridColumns?: 1 | 2 | 3 | 4
}>()

defineEmits<{
  add: [product: ProductPayload]
  view: [product: ProductPayload]
}>()

const { contentLocale } = useContentLocale()
const { publicText } = usePublicDictionary()
const hourUnitLabel = computed(() => publicText('shop.rentalModal.hourUnit', 'heure'))
const dayUnitLabel = computed(() => publicText('shop.rentalModal.dayUnit', 'jour'))
const isSingleProduct = computed(() => props.products.length === 1)
const isListLayout = computed(() => props.layout === 'list')
const gridColumnsClass = computed(() => ({
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
}[props.gridColumns || 3]))
const containerClass = computed(() => {
  if (isSingleProduct.value) return 'grid grid-cols-1 gap-6'
  if (isListLayout.value) return 'flex flex-col gap-4'
  return ['grid gap-4', gridColumnsClass.value]
})
const articleClass = computed(() => isSingleProduct.value || isListLayout.value ? 'overflow-hidden' : '')
const contentClass = computed(() => isSingleProduct.value || isListLayout.value
  ? 'flex h-full flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] lg:gap-8'
  : 'flex h-full flex-col')
const imageClass = computed(() => isSingleProduct.value || isListLayout.value ? 'h-72 lg:h-full lg:min-h-[18rem]' : 'mb-4 h-44')
const imageSizes = computed(() => isSingleProduct.value || isListLayout.value
  ? '(min-width: 1024px) 55vw, 100vw'
  : '(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw')

const getLocalizedName = (product: ProductPayload) => pickCmsLocalizedText(contentLocale.value, product.nameLocalized) || product.name
const getLocalizedExcerpt = (product: ProductPayload) => pickCmsLocalizedText(contentLocale.value, product.excerptLocalized) || product.excerpt || ''
const getLocalizedUnitLabel = (product: ProductPayload) => pickCmsLocalizedText(contentLocale.value, product.unitLabelLocalized) || product.unitLabel || ''
const getRentalRates = (product: ProductPayload) => {
  const rates: Array<{ price: number, unit: string }> = []
  if (product.rentalBookingMode !== 'MULTI_DAY') rates.push({ price: Number(product.rentalHourlyPrice ?? product.price), unit: hourUnitLabel.value })
  if (product.rentalBookingMode !== 'SINGLE_DAY') rates.push({ price: Number(product.rentalDailyPrice ?? product.price), unit: dayUnitLabel.value })
  return rates
}
</script>
