<template>
  <section class="py-12">
    <div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-3xl">
          <h1 class="text-4xl font-semibold">{{ pageTitle }}</h1>
          <p v-if="pageSubtitle" class="mt-3 text-base opacity-80">{{ pageSubtitle }}</p>
        </div>
        <button class="btn btn-primary gap-2" @click="goToCart">
          <Icon name="mdi:cart-outline" size="20" />
          {{ cartButtonLabel }}
        </button>
      </div>

      <div v-if="pending" class="loading loading-spinner" />
      <template v-else>
        <div v-if="showCategoryFilters" class="mb-6 flex flex-wrap gap-2">
          <button
            v-if="showAllCategoriesButton"
            class="btn btn-sm"
            :class="selectedCategorySlug ? 'btn-ghost' : 'btn-primary'"
            @click="selectCategory('')"
          >
            {{ allCategoriesLabel }}
          </button>
          <button
            v-for="category in categories"
            :key="category.id"
            class="btn btn-sm"
            :class="selectedCategorySlug === category.slug ? 'btn-primary' : 'btn-ghost'"
            @click="selectCategory(category.slug)"
          >
            {{ category.name }}
          </button>
        </div>

        <ProductList
          v-if="products.length"
          :products="products"
          :show-images="settings?.showImages !== false"
          :show-descriptions="settings?.showDescriptions !== false"
          :item-background-color="itemBackgroundColor"
          :view-label="viewProductLabel"
          :add-label="addToCartLabel"
          :rental-add-label="viewProductLabel"
          :sold-out-label="soldOutLabel"
          :sale-label="saleLabel"
          :rental-label="rentalLabel"
          :stock-label="stockLabel"
          :offline-label="offlineLabel"
          :online-label="onlineLabel"
          :disable-on-sold-out="false"
          @add="handleProductAction"
          @view="openProductDetail"
        />

        <div v-else class="rounded-3xl border border-dashed border-base-300 px-6 py-14 text-center opacity-60">
          {{ emptyLabel }}
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CmsBasketsPageSettings } from '#modula/shared/cms'
import { pickCmsLocalizedText } from '#modula/shared/cms'
import ProductList from '#modula/components/shop/ProductList.vue'
import { useShopCart } from '#modula/composables/useShopCart'
import type { ProductCategoryPayload, ProductPayload } from '#modula/server/utils/shop'

const props = defineProps<{
  settings?: CmsBasketsPageSettings | null
  pageTitleOverride?: string | null
  pageSubtitleOverride?: string | null
}>()

const { contentLocale } = useContentLocale()
const { publicText } = usePublicDictionary()
const locale = contentLocale
const route = useRoute()
const router = useRouter()
const localePath = usePublicLocalePath()
const { $toast } = useNuxtApp() as any
const { count, add } = useShopCart()

const selectedCategorySlug = ref(typeof route.query.category === 'string' ? route.query.category : '')
const { data, pending, refresh } = await useFetch<{ categories: ProductCategoryPayload[], products: ProductPayload[] }>('/api/shop/catalog', {
  query: computed(() => ({
    view: 'products',
    category: selectedCategorySlug.value || undefined
  }))
})

const categories = computed(() => data.value?.categories || [])
const products = computed(() => data.value?.products || [])

const pageTitle = computed(() =>
  pickCmsLocalizedText(locale.value, props.settings?.title)
  || String(props.pageTitleOverride || '').trim()
  || publicText('shop.catalog.title', 'Boutique')
)
const pageSubtitle = computed(() =>
  pickCmsLocalizedText(locale.value, props.settings?.subtitle)
  || String(props.pageSubtitleOverride || '').trim()
  || publicText('shop.catalog.subtitle', 'Parcourez les produits a vendre ou a louer.')
)
const cartButtonLabel = computed(() => publicText('shop.catalog.cartButton', 'Panier ({count})', { count: count.value }))
const addToCartLabel = computed(() => publicText('shop.catalog.addToCart', 'Ajouter au panier'))
const viewProductLabel = computed(() => publicText('shop.catalog.viewProduct', 'Voir le produit'))
const soldOutLabel = computed(() => publicText('shop.catalog.soldOut', 'Epuise'))
const saleLabel = computed(() => publicText('shop.catalog.sale', 'Vente'))
const rentalLabel = computed(() => publicText('shop.catalog.rental', 'Location'))
const stockLabel = computed(() => publicText('shop.catalog.stock', 'Stock'))
const allCategoriesLabel = computed(() => publicText('shop.catalog.allCategories', 'Toutes les categories'))
const emptyLabel = computed(() => publicText('shop.catalog.empty', 'Aucun produit n est publie pour le moment.'))
const offlineLabel = computed(() => publicText('shop.catalog.offlinePayment', 'Paiement hors ligne'))
const onlineLabel = computed(() => publicText('shop.catalog.onlinePayment', 'Paiement en ligne'))
const itemBackgroundColor = computed(() => 'var(--fallback-b1,oklch(var(--b1)/1))')
const showCategoryFilters = computed(() => categories.value.length > 0)
const showAllCategoriesButton = computed(() => categories.value.length > 1)

const selectCategory = async (slug: string) => {
  selectedCategorySlug.value = slug
  await router.replace({
    query: {
      ...route.query,
      category: slug || undefined
    }
  })
  await refresh()
}

const getLocalizedName = (product: ProductPayload) =>
  pickCmsLocalizedText(contentLocale.value, product.nameLocalized) || product.name || ''

const getLocalizedExcerpt = (product: ProductPayload) =>
  pickCmsLocalizedText(contentLocale.value, product.excerptLocalized) || product.excerpt || ''

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
    title: getLocalizedName(product),
    imageUrl: product.imageUrl,
    description: getLocalizedExcerpt(product),
    quantity: 1,
    saleType: product.saleType,
    availableQuantity: product.stock,
    vatRate: product.vatRate,
    paymentTaxCode: product.paymentTaxCode,
    paymentTaxBehavior: product.paymentTaxBehavior,
    allowOfflinePayment: product.allowOfflinePayment,
    allowOnlinePayment: product.allowOnlinePayment,
    unitPrice: product.price,
    totalPrice: product.price
  })

  $toast.success(publicText('shop.catalog.addSaleSuccess', 'Ajoute au panier'))
}

const goToCart = () => navigateTo(localePath('/panier'))
</script>
