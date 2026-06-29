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
          :rental-add-label="chooseRentalPeriodLabel"
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

    <RentalAvailabilityModal
      :open="rentalModalOpen"
      source-kind="productLot"
      :source-id="selectedRentalLot?.id ?? null"
      :source-name="selectedRentalLot?.name || ''"
      @close="closeRentalModal"
      @confirm="confirmRentalSelection"
    />
  </section>
</template>

<script setup lang="ts">
import type { CmsBasketsPageSettings } from '#modula/shared/cms'
import { pickCmsLocalizedText } from '#modula/shared/cms'
import type { ProductCategoryPayload, ProductLotPayload } from '#modula/server/utils/shop'
import { useShopCart } from '#modula/composables/useShopCart'
import ProductLotList from '#modula/components/shop/ProductLotList.vue'
import RentalAvailabilityModal from '#modula/components/shop/RentalAvailabilityModal.vue'

const props = defineProps<{
  settings?: CmsBasketsPageSettings | null
}>()

const { contentLocale } = useContentLocale()
const { publicText } = usePublicDictionary()
const locale = contentLocale
const route = useRoute()
const router = useRouter()
const { $toast } = useNuxtApp() as any
const localePath = usePublicLocalePath()
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

const pageTitle = computed(() => pickCmsLocalizedText(locale.value, props.settings?.title) || publicText('shop.lots.title', 'Lots de produits'))
const pageSubtitle = computed(() => pickCmsLocalizedText(locale.value, props.settings?.subtitle) || publicText('shop.lots.subtitle', 'Parcourez les lots de produits à vendre ou à louer.'))
const shopLabel = computed(() => publicText('shop.lots.eyebrow', 'Lots de produits'))
const cartButtonLabel = computed(() => publicText('shop.lots.cartButton', 'Panier ({count})', { count: count.value }))
const addLotLabel = computed(() => publicText('shop.lots.addLot', 'Ajouter le lot'))
const soldOutLabel = computed(() => publicText('shop.lots.soldOut', 'Épuisé'))
const saleLabel = computed(() => publicText('shop.lots.sale', 'Vente'))
const rentalLabel = computed(() => publicText('shop.lots.rental', 'Location'))
const onlineLabel = computed(() => publicText('shop.lots.onlinePayment', 'Paiement en ligne'))
const singleLabel = computed(() => publicText('shop.lots.single', 'Simple'))
const lotLabel = computed(() => publicText('shop.lots.lot', 'Lot'))
const stockLabel = computed(() => publicText('shop.lots.stock', 'Stock'))
const priceLabel = computed(() => publicText('shop.lots.price', 'Prix'))
const allCategoriesLabel = computed(() => publicText('shop.lots.allCategories', 'Toutes les catégories'))
const emptyLabel = computed(() => publicText('shop.lots.empty', 'Aucun lot de produits n’est publié pour le moment.'))
const offlineLabel = computed(() => publicText('shop.lots.offlinePayment', 'Paiement hors ligne'))
const chooseRentalPeriodLabel = computed(() => publicText('shop.lots.chooseRentalPeriod', 'Choisir la période'))
const cardBackgroundColor = computed(() => 'var(--fallback-b1,oklch(var(--b1)/1))')
const rentalModalOpen = ref(false)
const selectedRentalLot = ref<ProductLotPayload | null>(null)

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
  if (lot.saleType === 'RENTAL') {
    selectedRentalLot.value = lot
    rentalModalOpen.value = true
    return
  }

  add({
    key: `lot-${lot.id}`,
    kind: 'productLot',
    productId: null,
    productLotId: lot.id,
    title: lot.name,
    imageUrl: lot.imageUrl,
    description: lot.description,
    quantity: 1,
    saleType: lot.saleType,
    availableQuantity: lot.stock,
    vatRate: lot.vatRate,
    paymentTaxCode: lot.paymentTaxCode,
    paymentTaxBehavior: lot.paymentTaxBehavior,
    allowOfflinePayment: lot.allowOfflinePayment,
    allowOnlinePayment: lot.allowOnlinePayment,
    unitPrice: lot.price,
    totalPrice: lot.price
  })
  $toast.success(publicText('shop.lots.addSuccess', 'Ajouté au panier'))
}

const closeRentalModal = () => {
  rentalModalOpen.value = false
  selectedRentalLot.value = null
}

const confirmRentalSelection = ({ rentalStartDate, rentalEndDate }: { rentalStartDate: string, rentalEndDate: string }) => {
  const lot = selectedRentalLot.value
  if (!lot) return

  add({
    key: `lot-${lot.id}-${rentalStartDate}-${rentalEndDate}`,
    kind: 'productLot',
    productId: null,
    productLotId: lot.id,
    title: lot.name,
    imageUrl: lot.imageUrl,
    description: lot.description,
    quantity: 1,
    saleType: lot.saleType,
    rentalStartDate,
    rentalEndDate,
    availableQuantity: lot.stock,
    vatRate: lot.vatRate,
    paymentTaxCode: lot.paymentTaxCode,
    paymentTaxBehavior: lot.paymentTaxBehavior,
    allowOfflinePayment: lot.allowOfflinePayment,
    allowOnlinePayment: lot.allowOnlinePayment,
    unitPrice: lot.price,
    totalPrice: lot.price
  })
  $toast.success(publicText('shop.lots.rentalAddSuccess', 'Location ajoutée au panier'))
  closeRentalModal()
}

const goToCart = () => navigateTo(localePath('/panier'))
</script>
