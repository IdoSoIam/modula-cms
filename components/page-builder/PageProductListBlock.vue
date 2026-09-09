<template>
  <div class="w-full">
    <h2 v-if="resolvedTitle" class="mb-5 text-2xl font-semibold">{{ resolvedTitle }}</h2>
    <div v-if="pending" class="flex min-h-32 items-center justify-center">
      <span class="loading loading-spinner loading-md" />
    </div>
    <ProductList
      v-else-if="products.length"
      :products="products"
      :show-images="item.showImages"
      :show-descriptions="item.showDescriptions"
      :view-label="viewProductLabel"
      :add-label="addToCartLabel"
      :rental-add-label="viewProductLabel"
      :sold-out-label="soldOutLabel"
      :sale-label="saleLabel"
      :rental-label="rentalLabel"
      :stock-label="stockLabel"
      :offline-label="offlineLabel"
      :online-label="onlineLabel"
      :layout="item.display"
      :grid-columns="item.gridColumns"
      @add="handleProductAction"
      @view="openProductDetail"
    />
    <div v-else class="modula-card border border-dashed border-base-300 px-5 py-10 text-center text-sm opacity-60">
      {{ emptyLabel }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PageBuilderProductListItem } from '#modula/shared/pageBuilder'
import { pickLocalizedText } from '#modula/shared/pageBuilder'
import type { ProductPayload } from '#modula/server/utils/shop'
import ProductList from '#modula/components/shop/ProductList.vue'
import { useShopCart } from '#modula/composables/useShopCart'
import { pickCmsLocalizedText } from '#modula/shared/cms'

const props = defineProps<{
  item: PageBuilderProductListItem
  locale: string
}>()

const { publicText } = usePublicDictionary()
const localePath = usePublicLocalePath()
const { add } = useShopCart()
const { $toast } = useNuxtApp() as any
const pageSize = computed(() => Math.max(1, Math.min(12, Number(props.item.limit) || 6)))
const { data, pending } = await useFetch<{ products: ProductPayload[] }>('/api/shop/catalog', {
  query: computed(() => ({
    categoryIds: props.item.categoryIds?.join(',') || undefined,
    pageSize: pageSize.value,
    page: 1,
  })),
})

const products = computed(() => data.value?.products || [])
const resolvedTitle = computed(() => pickLocalizedText(props.locale, props.item.title))
const viewProductLabel = computed(() => publicText('shop.catalog.viewProduct', 'Voir le produit'))
const addToCartLabel = computed(() => publicText('shop.catalog.addToCart', 'Ajouter au panier'))
const soldOutLabel = computed(() => publicText('shop.catalog.soldOut', 'Épuisé'))
const saleLabel = computed(() => publicText('shop.catalog.sale', 'Vente'))
const rentalLabel = computed(() => publicText('shop.catalog.rental', 'Location'))
const stockLabel = computed(() => publicText('shop.catalog.stock', 'Stock'))
const offlineLabel = computed(() => publicText('shop.catalog.onsitePayment', 'Paiement sur place'))
const onlineLabel = computed(() => publicText('shop.catalog.onlinePayment', 'Paiement en ligne'))
const emptyLabel = computed(() => publicText('shop.catalog.empty', 'Aucun produit n’est publié pour le moment.'))

const localizedName = (product: ProductPayload) => pickCmsLocalizedText(props.locale, product.nameLocalized) || product.name
const localizedExcerpt = (product: ProductPayload) => pickCmsLocalizedText(props.locale, product.excerptLocalized) || product.excerpt || ''
const openProductDetail = (product: ProductPayload) => navigateTo(localePath(`/products/${product.slug}`))

const handleProductAction = (product: ProductPayload) => {
  if (product.saleType === 'RENTAL') {
    openProductDetail(product)
    return
  }
  add({
    key: `product-${product.id}`,
    kind: 'product',
    productId: product.id,
    slug: product.slug,
    title: localizedName(product),
    imageUrl: product.imageUrl,
    description: localizedExcerpt(product),
    quantity: 1,
    saleType: product.saleType,
    availableQuantity: product.stock,
    vatRate: product.vatRate,
    paymentTaxCode: product.paymentTaxCode,
    paymentTaxBehavior: product.paymentTaxBehavior,
    allowOfflinePayment: product.allowOfflinePayment,
    allowOnlinePayment: product.allowOnlinePayment,
    unitPrice: product.price,
    totalPrice: product.price,
  })
  $toast.success(publicText('shop.catalog.addSaleSuccess', 'Ajouté au panier'))
}
</script>
