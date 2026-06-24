<template>
  <section class="py-12">
    <div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-3xl">
          <div class="text-sm uppercase tracking-[0.22em] opacity-60">{{ shopLabel }}</div>
          <h1 class="mt-3 text-4xl font-semibold">{{ pageTitle }}</h1>
          <p class="mt-3 text-base opacity-80">{{ pageSubtitle }}</p>
        </div>
        <button class="btn btn-primary gap-2" @click="goToCart">
          <Icon name="mdi:cart-outline" size="20" />
          {{ cartButtonLabel }}
        </button>
      </div>

      <div v-if="pending" class="loading loading-spinner" />
      <template v-else>
        <div class="mb-6 flex flex-wrap gap-2">
          <button class="btn btn-sm" :class="selectedCategorySlug ? 'btn-ghost' : 'btn-primary'" @click="selectCategory('')">
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
          :add-label="addProductLabel"
          :sold-out-label="soldOutLabel"
          :sale-label="saleLabel"
          :rental-label="rentalLabel"
          :stock-label="stockLabel"
          :offline-label="offlineLabel"
          :online-label="onlineLabel"
          @add="addProductToCart"
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
import type { ProductCategoryPayload, ProductPayload } from '#modula/server/utils/shop'
import { useShopCart } from '#modula/composables/useShopCart'
import ProductList from '#modula/components/shop/ProductList.vue'

const props = defineProps<{
  settings?: CmsBasketsPageSettings | null
}>()

const { locale } = useI18n()
const route = useRoute()
const router = useRouter()
const { $toast } = useNuxtApp() as any
const localePath = useLocalePath()
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

const pageTitle = computed(() => pickCmsLocalizedText(locale.value, props.settings?.title) || (locale.value === 'en' ? 'Shop' : 'Boutique'))
const pageSubtitle = computed(() => pickCmsLocalizedText(locale.value, props.settings?.subtitle) || (locale.value === 'en' ? 'Browse products for sale or rental.' : 'Parcourez les produits à vendre ou à louer.'))
const shopLabel = computed(() => locale.value === 'en' ? 'Products' : 'Produits')
const cartButtonLabel = computed(() => locale.value === 'en' ? `Cart (${count.value})` : `Panier (${count.value})`)
const addProductLabel = computed(() => locale.value === 'en' ? 'Add product' : 'Ajouter le produit')
const soldOutLabel = computed(() => locale.value === 'en' ? 'Sold out' : 'Épuisé')
const saleLabel = computed(() => locale.value === 'en' ? 'Sale' : 'Vente')
const rentalLabel = computed(() => locale.value === 'en' ? 'Rental' : 'Location')
const stockLabel = computed(() => locale.value === 'en' ? 'Stock' : 'Stock')
const allCategoriesLabel = computed(() => locale.value === 'en' ? 'All categories' : 'Toutes les catégories')
const emptyLabel = computed(() => locale.value === 'en' ? 'No product is currently published.' : 'Aucun produit n’est publié pour le moment.')
const offlineLabel = computed(() => locale.value === 'en' ? 'Offline payment' : 'Paiement hors ligne')
const onlineLabel = computed(() => locale.value === 'en' ? 'Online payment' : 'Paiement en ligne')
const itemBackgroundColor = computed(() => 'var(--fallback-b1,oklch(var(--b1)/1))')

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

const addProductToCart = (product: ProductPayload) => {
  add({
    key: `product-${product.id}`,
    kind: 'product',
    productId: product.id,
    productLotId: null,
    title: product.name,
    imageUrl: product.imageUrl,
    description: product.excerpt || product.description,
    quantity: 1,
    availableQuantity: product.stock,
    vatRate: product.vatRate,
    paymentTaxCode: product.paymentTaxCode,
    paymentTaxBehavior: product.paymentTaxBehavior,
    allowOfflinePayment: product.allowOfflinePayment,
    allowOnlinePayment: product.allowOnlinePayment,
    unitPrice: product.price,
    totalPrice: product.price
  })
  $toast.success(locale.value === 'en' ? 'Added to cart' : 'Ajouté au panier')
}

const goToCart = () => navigateTo(localePath('/panier'))
</script>
