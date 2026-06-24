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

        <ProductLotList
          v-if="productLots.length"
          :product-lots="productLots"
          :show-images="settings?.showImages !== false"
          :show-descriptions="settings?.showDescriptions !== false"
          :show-composition="settings?.showComposition !== false"
          :card-background-color="cardBackgroundColor"
          :add-label="addLotLabel"
          :sold-out-label="soldOutLabel"
          :sale-label="saleLabel"
          :rental-label="rentalLabel"
          :offline-label="offlineLabel"
          :online-label="onlineLabel"
          :single-label="singleLabel"
          :lot-label="lotLabel"
          :stock-label="stockLabel"
          :price-label="priceLabel"
          @add="addLotToCart"
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
import type { ProductCategoryPayload, ProductLotPayload } from '#modula/server/utils/shop'
import { useShopCart } from '#modula/composables/useShopCart'
import ProductLotList from '#modula/components/shop/ProductLotList.vue'

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
const { data, pending, refresh } = await useFetch<{ categories: ProductCategoryPayload[], productLots: ProductLotPayload[] }>('/api/shop/catalog', {
  query: computed(() => ({
    view: 'lots',
    category: selectedCategorySlug.value || undefined
  }))
})
const categories = computed(() => data.value?.categories || [])
const productLots = computed(() => data.value?.productLots || [])

const pageTitle = computed(() => pickCmsLocalizedText(locale.value, props.settings?.title) || (locale.value === 'en' ? 'Product lots' : 'Lots de produits'))
const pageSubtitle = computed(() => pickCmsLocalizedText(locale.value, props.settings?.subtitle) || (locale.value === 'en' ? 'Browse curated product lots for sale or rental.' : 'Parcourez les lots de produits à vendre ou à louer.'))
const shopLabel = computed(() => locale.value === 'en' ? 'Product lots' : 'Lots de produits')
const cartButtonLabel = computed(() => locale.value === 'en' ? `Cart (${count.value})` : `Panier (${count.value})`)
const addLotLabel = computed(() => locale.value === 'en' ? 'Add lot to cart' : 'Ajouter le lot')
const soldOutLabel = computed(() => locale.value === 'en' ? 'Sold out' : 'Épuisé')
const saleLabel = computed(() => locale.value === 'en' ? 'Sale' : 'Vente')
const rentalLabel = computed(() => locale.value === 'en' ? 'Rental' : 'Location')
const onlineLabel = computed(() => locale.value === 'en' ? 'Online payment' : 'Paiement en ligne')
const singleLabel = computed(() => locale.value === 'en' ? 'Single' : 'Simple')
const lotLabel = computed(() => locale.value === 'en' ? 'Lot' : 'Lot')
const stockLabel = computed(() => locale.value === 'en' ? 'Stock' : 'Stock')
const priceLabel = computed(() => locale.value === 'en' ? 'Price' : 'Prix')
const allCategoriesLabel = computed(() => locale.value === 'en' ? 'All categories' : 'Toutes les catégories')
const emptyLabel = computed(() => locale.value === 'en' ? 'No product lot is currently published.' : 'Aucun lot de produits n’est publié pour le moment.')
const offlineLabel = computed(() => locale.value === 'en' ? 'Offline payment' : 'Paiement hors ligne')
const cardBackgroundColor = computed(() => 'var(--fallback-b1,oklch(var(--b1)/1))')

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

const addLotToCart = (lot: ProductLotPayload) => {
  add({
    key: `lot-${lot.id}`,
    kind: 'productLot',
    productId: null,
    productLotId: lot.id,
    title: lot.name,
    imageUrl: lot.imageUrl,
    description: lot.description,
    quantity: 1,
    availableQuantity: lot.stock,
    vatRate: lot.vatRate,
    paymentTaxCode: lot.paymentTaxCode,
    paymentTaxBehavior: lot.paymentTaxBehavior,
    allowOfflinePayment: lot.allowOfflinePayment,
    allowOnlinePayment: lot.allowOnlinePayment,
    unitPrice: lot.price,
    totalPrice: lot.price
  })
  $toast.success(locale.value === 'en' ? 'Added to cart' : 'Ajouté au panier')
}

const goToCart = () => navigateTo(localePath('/panier'))
</script>
