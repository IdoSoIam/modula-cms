<template>
  <section class="py-12">
    <div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-3xl">
          <h1 class="text-4xl font-semibold">{{ pageTitle }}</h1>
          <p v-if="pageSubtitle" class="mt-3 text-base opacity-80">{{ pageSubtitle }}</p>
        </div>
        <button type="button" class="btn btn-primary gap-2" @click="goToCart">
          <Icon name="mdi:cart-outline" size="20" />
          {{ cartButtonLabel }}
        </button>
      </div>

      <div v-if="pending" class="loading loading-spinner" />
      <template v-else>
        <div v-if="showCatalogControls" class="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div v-if="showCategoryFilters" class="flex flex-wrap gap-2">
            <button
              type="button"
              class="btn btn-sm"
              :class="selectedCategorySlug ? 'btn-ghost' : 'btn-primary'"
              @click="selectCategory('')"
            >
              {{ allCategoriesLabel }}
            </button>
            <button
              v-for="category in categories"
              :key="category.id"
              type="button"
              class="btn btn-sm"
              :class="selectedCategorySlug === category.slug ? 'btn-primary' : 'btn-ghost'"
              @click="selectCategory(category.slug)"
            >
              {{ category.name }}
            </button>
          </div>
          <div v-if="showViewToggle" class="join" :aria-label="viewModeLabel">
            <button type="button" class="btn btn-sm join-item" :class="viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'" :aria-label="gridViewLabel" @click="viewMode = 'grid'">
              <Icon name="mdi:view-grid-outline" size="18" />
              <span class="hidden sm:inline">{{ gridViewLabel }}</span>
            </button>
            <button type="button" class="btn btn-sm join-item" :class="viewMode === 'list' ? 'btn-primary' : 'btn-ghost'" :aria-label="listViewLabel" @click="viewMode = 'list'">
              <Icon name="mdi:view-list-outline" size="18" />
              <span class="hidden sm:inline">{{ listViewLabel }}</span>
            </button>
          </div>
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
          :layout="viewMode"
          :grid-columns="settings?.gridColumns || 3"
          @add="handleProductAction"
          @view="openProductDetail"
        />

        <div v-else class="modula-card border border-dashed border-base-300 px-6 py-14 text-center opacity-60">
          {{ emptyLabel }}
        </div>

        <nav v-if="pagination.totalPages > 1" class="mt-8 flex flex-wrap items-center justify-center gap-3" :aria-label="paginationLabel">
          <button type="button" class="btn btn-sm btn-outline" :disabled="pagination.page <= 1" @click="goToPage(pagination.page - 1)">
            <Icon name="mdi:chevron-left" size="18" />
            <span class="hidden sm:inline">{{ previousPageLabel }}</span>
          </button>
          <div class="join">
            <button
              v-for="pageNumber in visiblePageNumbers"
              :key="pageNumber"
              type="button"
              class="btn btn-sm join-item"
              :class="pageNumber === pagination.page ? 'btn-primary' : 'btn-ghost'"
              :aria-current="pageNumber === pagination.page ? 'page' : undefined"
              @click="goToPage(pageNumber)"
            >
              {{ pageNumber }}
            </button>
          </div>
          <button type="button" class="btn btn-sm btn-outline" :disabled="pagination.page >= pagination.totalPages" @click="goToPage(pagination.page + 1)">
            <span class="hidden sm:inline">{{ nextPageLabel }}</span>
            <Icon name="mdi:chevron-right" size="18" />
          </button>
          <p class="w-full text-center text-xs opacity-60">{{ paginationSummary }}</p>
        </nav>

        <section v-if="categoryLinks.length" class="mt-8" :aria-labelledby="categoryLinksTitleId">
          <h2 :id="categoryLinksTitleId" class="mb-4 text-xl font-semibold">{{ categoryLinksTitle }}</h2>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NuxtLink
              v-for="link in categoryLinks"
              :key="`${link.category.id}-${link.href}`"
              :to="localePath(link.href)"
              class="modula-card group flex min-h-32 overflow-hidden border border-base-300 bg-base-100 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
            >
              <div v-if="link.imageUrl" class="w-32 shrink-0 overflow-hidden bg-base-200 sm:w-36">
                <img :src="link.imageUrl" :alt="link.category.name" class="h-full w-full object-cover transition duration-300 group-hover:scale-105">
              </div>
              <div class="flex min-w-0 flex-1 flex-col justify-center p-4">
                <h3 class="text-lg font-semibold">{{ link.category.name }}</h3>
                <p v-if="link.category.description" class="mt-1 line-clamp-2 text-sm opacity-65">{{ link.category.description }}</p>
                <span class="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {{ categoryLinkAction }}
                  <Icon name="mdi:arrow-right" size="17" />
                </span>
              </div>
            </NuxtLink>
          </div>
        </section>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { CmsBasketsPageSettings, CmsPageApplicationConfig } from '#modula/shared/cms'
import { pickCmsLocalizedText } from '#modula/shared/cms'
import ProductList from '#modula/components/shop/ProductList.vue'
import { useShopCart } from '#modula/composables/useShopCart'
import type { ProductCategoryPayload, ProductPayload } from '#modula/server/utils/shop'

interface ShopCategoryLinkPayload {
  category: ProductCategoryPayload
  href: string
  imageUrl: string | null
}

interface ShopCatalogResponse {
  categories: ProductCategoryPayload[]
  categoryLinks: ShopCategoryLinkPayload[]
  selectedCategorySlug: string
  products: ProductPayload[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

const props = defineProps<{
  settings?: CmsBasketsPageSettings | null
  applicationConfig?: CmsPageApplicationConfig | null
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
const viewMode = ref<'grid' | 'list'>(props.applicationConfig?.shopDefaultViewMode === 'list' ? 'list' : 'grid')
const viewPreferenceLoaded = ref(false)
const viewPreferenceKey = computed(() => `modula:shop-view:${route.path}`)
const requestedPage = computed(() => {
  const value = Number(route.query.page)
  return Number.isInteger(value) && value > 0 ? value : 1
})
const configuredPageSize = computed(() => Math.max(1, Math.min(48, Number(props.applicationConfig?.shopPageSize) || 12)))
const configuredCategoryLinks = computed(() => (props.applicationConfig?.shopCategoryLinks || [])
  .filter(link => Number(link.categoryId) > 0 && Number(link.pageId) > 0)
  .map(link => `${link.categoryId}:${link.pageId}`)
  .join(','))
const { data, pending } = await useFetch<ShopCatalogResponse>('/api/shop/catalog', {
  query: computed(() => ({
    view: 'products',
    category: selectedCategorySlug.value || undefined,
    categoryIds: props.applicationConfig?.shopCategoryIds?.join(',') || undefined,
    categoryLinks: configuredCategoryLinks.value || undefined,
    page: requestedPage.value,
    pageSize: configuredPageSize.value,
  }))
})

const categories = computed(() => data.value?.categories || [])
const categoryLinks = computed(() => data.value?.categoryLinks || [])
const products = computed(() => data.value?.products || [])
const pagination = computed(() => data.value?.pagination || {
  page: 1,
  pageSize: configuredPageSize.value,
  total: products.value.length,
  totalPages: 1,
})
const visiblePageNumbers = computed(() => {
  const start = Math.max(1, Math.min(pagination.value.page - 2, pagination.value.totalPages - 4))
  const end = Math.min(pagination.value.totalPages, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

const pageTitle = computed(() =>
  String(props.pageTitleOverride || '').trim()
  || pickCmsLocalizedText(locale.value, props.settings?.title)
  || publicText('shop.catalog.title', 'Boutique')
)
const pageSubtitle = computed(() =>
  String(props.pageSubtitleOverride || '').trim()
  || pickCmsLocalizedText(locale.value, props.settings?.subtitle)
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
const offlineLabel = computed(() => publicText('shop.catalog.onsitePayment', 'Paiement sur place'))
const onlineLabel = computed(() => publicText('shop.catalog.onlinePayment', 'Paiement en ligne'))
const viewModeLabel = computed(() => publicText('shop.catalog.viewMode', 'Affichage des produits'))
const gridViewLabel = computed(() => publicText('shop.catalog.gridView', 'Grille'))
const listViewLabel = computed(() => publicText('shop.catalog.listView', 'Liste'))
const categoryLinksTitle = computed(() => publicText('shop.catalog.categoryLinksTitle', 'Explorer aussi'))
const categoryLinkAction = computed(() => publicText('shop.catalog.categoryLinkAction', 'Découvrir'))
const paginationLabel = computed(() => publicText('shop.catalog.pagination', 'Pagination des produits'))
const previousPageLabel = computed(() => publicText('shop.catalog.previousPage', 'Précédent'))
const nextPageLabel = computed(() => publicText('shop.catalog.nextPage', 'Suivant'))
const paginationSummary = computed(() => publicText('shop.catalog.paginationSummary', 'Page {page} sur {total}', {
  page: pagination.value.page,
  total: pagination.value.totalPages,
}))
const categoryLinksTitleId = useId()
const itemBackgroundColor = computed(() => 'var(--fallback-b1,oklch(var(--b1)/1))')
const showCategoryFilters = computed(() => categories.value.length > 1)
const showViewToggle = computed(() => props.applicationConfig?.shopShowViewToggle !== false)
const showCatalogControls = computed(() => showCategoryFilters.value || showViewToggle.value)

watch(() => route.query.category, (value) => {
  const nextSlug = typeof value === 'string' ? value : ''
  if (nextSlug !== selectedCategorySlug.value) selectedCategorySlug.value = nextSlug
})

watch(() => props.applicationConfig?.shopDefaultViewMode, value => {
  if (!viewPreferenceLoaded.value) viewMode.value = value === 'list' ? 'list' : 'grid'
})

onMounted(() => {
  const savedViewMode = localStorage.getItem(viewPreferenceKey.value)
  if (savedViewMode === 'grid' || savedViewMode === 'list') viewMode.value = savedViewMode
  viewPreferenceLoaded.value = true
})

watch(viewMode, (value) => {
  if (import.meta.client && viewPreferenceLoaded.value) localStorage.setItem(viewPreferenceKey.value, value)
})

const selectCategory = async (slug: string) => {
  selectedCategorySlug.value = slug
  await router.replace({
    query: {
      ...route.query,
      category: slug || undefined,
      page: undefined,
    }
  })
}

const goToPage = async (pageNumber: number) => {
  const nextPage = Math.max(1, Math.min(pagination.value.totalPages, pageNumber))
  await router.replace({
    query: {
      ...route.query,
      page: nextPage > 1 ? String(nextPage) : undefined,
    },
  })
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
    slug: product.slug,
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
