<template>
  <section class="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <NuxtLink :to="localePath(shopPagePath)" class="mb-6 inline-flex items-center gap-1 text-sm opacity-70 hover:opacity-100">
      <Icon name="mdi:arrow-left" size="16" />
      <span>{{ resolvedBackLabel }}</span>
    </NuxtLink>

    <div v-if="!product" class="py-16 text-center">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <article v-else class="space-y-8">
      <header class="space-y-4">
        <div class="flex flex-wrap items-center gap-2">
          <span v-if="product.category?.name" class="badge badge-soft">{{ product.category.name }}</span>
          <span class="badge badge-outline">{{ product.saleType === 'RENTAL' ? rentalLabel : saleLabel }}</span>
          <span v-if="product.allowOfflinePayment" class="badge badge-soft">{{ offlineLabel }}</span>
          <span v-if="product.allowOnlinePayment" class="badge badge-outline">{{ onlineLabel }}</span>
        </div>
        <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-3xl">
            <h1 class="text-4xl font-bold">{{ getLocalizedProductName(product) }}</h1>
            <p v-if="getLocalizedProductExcerpt(product)" class="mt-3 text-lg opacity-75 wrap-break-word">{{ getLocalizedProductExcerpt(product) }}</p>
          </div>
          <div class="modula-card border border-base-300 bg-base-100 px-6 py-4 text-right shadow-sm">
            <div class="text-sm uppercase tracking-[0.16em] opacity-60">{{ priceLabel }}</div>
            <div v-for="rate in rentalRateLabels" :key="rate.unit" class="mt-1">
              <span class="text-3xl font-semibold text-primary">{{ $formatPrice(rate.price) }}</span>
              <span class="ml-1 text-sm opacity-65">/ {{ rate.unit }}</span>
            </div>
            <template v-if="product.saleType !== 'RENTAL'">
              <div class="mt-1 text-3xl font-semibold text-primary">{{ $formatPrice(product.price) }}</div>
              <div v-if="getLocalizedProductUnitLabel(product)" class="mt-1 text-sm opacity-65">{{ getLocalizedProductUnitLabel(product) }}</div>
            </template>
          </div>
        </div>
      </header>

      <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <div class="space-y-6">
          <figure
            v-if="product.imageUrl"
            class="modula-card overflow-hidden border border-base-300 bg-base-100 shadow-sm"
          >
            <AppImage
              :src="product.imageUrl"
              :alt="getLocalizedProductName(product)"
              class="h-full max-h-[34rem] w-full object-cover"
              sizes="(max-width: 1280px) 100vw, 900px"
              loading="eager"
              fetchpriority="high"
            />
          </figure>

          <section class="modula-card border border-base-300 bg-base-100 p-6 shadow-sm">
            <h2 class="text-2xl font-semibold">{{ descriptionTitle }}</h2>
            <p v-if="getLocalizedProductDescription(product)" class="mt-4 whitespace-pre-line leading-7 opacity-85 wrap-break-word">{{ getLocalizedProductDescription(product) }}</p>
            <p v-else class="mt-4 opacity-65">{{ noDescriptionLabel }}</p>
          </section>

          <div class="grid gap-6 lg:grid-cols-2">
            <section class="modula-card border border-base-300 bg-base-100 p-6 shadow-sm">
              <h2 class="text-2xl font-semibold">{{ detailsTitle }}</h2>
              <dl class="mt-4 space-y-4 text-sm">
                <div class="flex items-start justify-between gap-4">
                  <dt class="font-medium">{{ categoryLabel }}</dt>
                  <dd class="text-right opacity-75">{{ product.category?.name || noneLabel }}</dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="font-medium">{{ stockLabel }}</dt>
                  <dd class="text-right opacity-75">{{ product.stock }}</dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="font-medium">{{ vatLabel }}</dt>
                  <dd class="text-right opacity-75">{{ formatVatRate(product.vatRate) }}</dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="font-medium">{{ typeLabel }}</dt>
                  <dd class="text-right opacity-75">{{ product.saleType === 'RENTAL' ? rentalLabel : saleLabel }}</dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="font-medium">{{ paymentLabel }}</dt>
                  <dd class="text-right opacity-75">{{ paymentModesSummary }}</dd>
                </div>
              </dl>
            </section>

            <section
              v-if="product.saleType === 'RENTAL'"
              class="modula-card border border-base-300 bg-base-100 p-6 shadow-sm"
            >
              <h2 class="text-2xl font-semibold">{{ rentalConditionsTitle }}</h2>
              <dl class="mt-4 space-y-4 text-sm">
                <div class="flex items-start justify-between gap-4">
                  <dt class="font-medium">{{ rentalAvailabilityLabel }}</dt>
                  <dd class="text-right opacity-75">{{ rentalAvailabilitySummary }}</dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="font-medium">{{ rentalMinLabel }}</dt>
                  <dd class="text-right opacity-75">{{ rentalMinSummary }}</dd>
                </div>
                <div class="flex items-start justify-between gap-4">
                  <dt class="font-medium">{{ rentalMaxLabel }}</dt>
                  <dd class="text-right opacity-75">{{ rentalMaxSummary }}</dd>
                </div>
              </dl>
            </section>
          </div>

          <section v-if="product.detailSections.length" class="space-y-4">
            <div class="flex items-center justify-between gap-4">
              <h2 class="text-2xl font-semibold">{{ moreDetailsTitle }}</h2>
            </div>
            <div class="grid gap-4 lg:grid-cols-2">
              <article
                v-for="section in product.detailSections"
                :key="section.id"
                class="modula-card border border-base-300 bg-base-100 p-6 shadow-sm"
              >
                <h3 class="text-xl font-semibold">{{ getLocalizedSectionTitle(section) }}</h3>
                <div class="mt-4 grid gap-3">
                  <article v-for="item in section.items" :key="item.id" class="rounded-box border border-base-300 bg-base-200/35 p-4">
                    <div class="flex flex-col gap-1">
                      <h4 class="font-medium">{{ getLocalizedDetailLabel(item) }}</h4>
                      <p v-if="getLocalizedDetailValue(item)" class="whitespace-pre-line text-sm leading-6 opacity-75">{{ getLocalizedDetailValue(item) }}</p>
                    </div>
                    <div v-if="item.mediaUrl || item.mediaDocumentId" class="mt-4">
                      <AppImage
                        v-if="item.mediaKind === 'image'"
                        :src="item.mediaUrl || ''"
                        :alt="getLocalizedDetailLabel(item)"
                        class="max-h-64 w-full rounded-box object-cover"
                        sizes="(min-width: 1024px) 38vw, 100vw"
                      />
                      <div v-else class="flex flex-col flex-wrap gap-3 border border-base-300 bg-base-100 p-3 sm:flex-row sm:items-center sm:justify-between rounded-box">
                        <div class="flex min-w-0 items-center gap-3">
                          <span class="grid size-10 shrink-0 place-items-center rounded-field bg-primary/10 text-primary">
                            <Icon :name="item.mediaKind === 'pdf' ? 'mdi:file-pdf-box' : 'mdi:file-document-outline'" size="22" />
                          </span>
                          <div class="min-w-0">
                            <div class="text-xs uppercase tracking-[0.12em] opacity-55">{{ documentAvailableLabel }}</div>
                            <div class="truncate text-sm font-medium">{{ item.mediaDocumentName || getLocalizedDetailLabel(item) }}</div>
                          </div>
                        </div>
                        <a
                          :href="item.mediaKind === 'billingDocument' && item.mediaDocumentId ? buildBillingDocumentPreviewUrl(item.mediaDocumentId) : item.mediaUrl || '#'"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="btn btn-sm btn-outline shrink-0"
                        >
                          <Icon name="mdi:eye-outline" size="18" />
                          {{ item.mediaKind === 'pdf' ? openPdfLabel : openDocumentLabel }}
                        </a>
                      </div>
                    </div>
                  </article>
                </div>
              </article>
            </div>
          </section>

          <section v-if="relatedProducts.length" class="modula-card border border-base-300 bg-base-100 p-6 shadow-sm">
            <div class="flex items-center justify-between gap-4">
              <h2 class="text-2xl font-semibold">{{ relatedTitle }}</h2>
              <NuxtLink :to="localePath(shopPagePath)" class="btn btn-sm btn-ghost">{{ resolvedBrowseLabel }}</NuxtLink>
            </div>
            <div class="mt-5 grid gap-4 md:grid-cols-3">
              <NuxtLink
                v-for="related in relatedProducts"
                :key="related.id"
                :to="localePath(`/products/${related.slug}`)"
                class="modula-card border border-base-300 bg-base-50 p-4 transition hover:border-primary/40 hover:shadow-sm"
              >
                <AppImage
                  v-if="related.imageUrl"
                  :src="related.imageUrl"
                  :alt="getLocalizedProductName(related)"
                  class="mb-3 h-36 w-full rounded-2xl object-cover"
                  sizes="(min-width: 768px) 20vw, 100vw"
                />
                <div class="text-sm opacity-65">{{ related.category?.name || (related.saleType === 'RENTAL' ? rentalLabel : saleLabel) }}</div>
                <div class="mt-1 font-semibold">{{ getLocalizedProductName(related) }}</div>
                <div class="mt-2 text-primary">{{ $formatPrice(related.price) }}</div>
              </NuxtLink>
            </div>
          </section>
        </div>

        <aside class="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section class="modula-card border border-base-300 bg-base-100 p-6 shadow-sm">
            <div class="text-sm uppercase tracking-[0.16em] opacity-60">{{ actionTitle }}</div>
            <div class="mt-2 text-3xl font-semibold text-primary">{{ $formatPrice(product.saleType === 'RENTAL' && selectedRentalStartDate ? selectedRentalPayablePrice : product.price) }}</div>
            <div v-if="product.saleType === 'RENTAL'" class="text-sm opacity-65">{{ selectedPricingMode === 'HOURLY' ? hourUnitLabel : dayUnitLabel }}</div>
            <p class="mt-2 text-sm opacity-75">{{ actionIntro }}</p>

            <div class="mt-5 space-y-4">
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ quantityLabel }}</span></label>
                <div class="flex items-center gap-3">
                  <button class="btn btn-sm btn-ghost" :disabled="quantity <= 1" @click="quantity = Math.max(1, quantity - 1)">
                    <Icon name="mdi:minus" size="16" />
                  </button>
                  <span class="w-10 text-center font-medium">{{ quantity }}</span>
                  <button class="btn btn-sm btn-ghost" :disabled="quantity >= maxQuantity" @click="quantity = Math.min(maxQuantity, quantity + 1)">
                    <Icon name="mdi:plus" size="16" />
                  </button>
                </div>
              </div>

              <template v-if="product.saleType === 'RENTAL'">
                <div class="rounded-box bg-base-200 p-4 text-sm">
                  <div class="font-medium">{{ selectedPeriodTitle }}</div>
                  <div class="mt-1 opacity-80">{{ selectedPeriodSummary }}</div>
                  <div v-if="selectedRentalStartDate" class="mt-1 font-medium">{{ rentalDurationSummary }}</div>
                </div>
                <div v-if="rentalInsuranceOptions.length" class="space-y-3 rounded-box border border-base-300 p-4">
                  <div>
                    <div class="font-medium">{{ insuranceTitleLabel }}</div>
                    <div class="text-xs opacity-65">{{ insuranceHelpLabel }}</div>
                  </div>
                  <label v-for="insurance in rentalInsuranceOptions" :key="insurance.documentId" class="flex items-start gap-3">
                    <input
                      v-model="selectedInsuranceDocumentIds"
                      type="checkbox"
                      class="checkbox checkbox-sm mt-0.5"
                      :value="insurance.documentId"
                      :disabled="insurance.required"
                    >
                    <span class="min-w-0 flex-1 text-sm">
                      <span class="font-medium">{{ insurance.name }}</span>
                      <span class="ml-2 badge badge-sm" :class="insurance.required ? 'badge-primary' : 'badge-ghost'">
                        {{ insurance.required ? requiredLabel : optionalLabel }}
                      </span>
                      <span class="block opacity-70">{{ $formatPrice(insurance.unitPrice) }}</span>
                    </span>
                    <a :href="insurance.previewUrl" target="_blank" rel="noopener noreferrer" class="link text-xs" @click.stop>
                      {{ viewDocumentLabel }}
                    </a>
                  </label>
                </div>
                <dl v-if="selectedRentalStartDate" class="space-y-2 border-t border-base-300 pt-4 text-sm">
                  <div class="flex justify-between gap-4"><dt>{{ rentalBasePriceLabel }}</dt><dd>{{ $formatPrice(selectedRentalPrice * quantity) }}</dd></div>
                  <div v-for="insurance in selectedRentalInsurances" :key="insurance.documentId" class="flex justify-between gap-4">
                    <dt>{{ insurance.name }}</dt><dd>{{ $formatPrice(insurance.unitPrice * quantity) }}</dd>
                  </div>
                  <div class="flex justify-between gap-4 border-t border-base-300 pt-2"><dt>{{ totalExclTaxLabel }}</dt><dd>{{ $formatPrice(selectedRentalTotalExclTax) }}</dd></div>
                  <div v-if="selectedRentalVatAmount > 0" class="flex justify-between gap-4 opacity-75">
                    <dt>{{ vatAmountLabel }} ({{ formatVatRate(product.vatRate) }})</dt><dd>{{ $formatPrice(selectedRentalVatAmount) }}</dd>
                  </div>
                  <div v-else class="flex justify-between gap-4 opacity-70"><dt>{{ vatNotApplicableLabel }}</dt><dd>{{ $formatPrice(0) }}</dd></div>
                  <div class="flex justify-between gap-4 border-t border-base-300 pt-2 font-semibold"><dt>{{ totalInclTaxLabel }}</dt><dd>{{ $formatPrice(selectedRentalTotalInclTax) }}</dd></div>
                </dl>
                <button class="btn btn-outline w-full" :disabled="product.stock <= 0" @click="rentalModalOpen = true">
                  {{ chooseRentalPeriodLabel }}
                </button>
                <button class="btn btn-primary w-full" :disabled="!canAddRentalToCart" @click="addRentalToCart">
                  {{ addRentalLabel }}
                </button>
              </template>

              <template v-else>
                <button class="btn btn-primary w-full" :disabled="product.stock <= 0" @click="addSaleToCart">
                  {{ product.stock > 0 ? addToCartLabel : soldOutLabel }}
                </button>
              </template>

              <button class="btn btn-ghost w-full" @click="navigateTo(localePath('/panier'))">
                {{ cartLabel }}
              </button>
            </div>
          </section>
        </aside>
      </section>
    </article>

    <RentalAvailabilityModal
      v-if="product?.saleType === 'RENTAL'"
      :open="rentalModalOpen"
      source-kind="product"
      :source-id="product?.id ?? null"
      :source-name="product ? getLocalizedProductName(product) : ''"
      @close="rentalModalOpen = false"
      @confirm="onRentalDatesSelected"
    />
  </section>
</template>

<script setup lang="ts">
import { pickCmsLocalizedText } from '#modula/shared/cms'
import type { ProductDetailField, ProductDetailSection, ProductPayload } from '#modula/server/utils/shop'
import { useShopCart } from '#modula/composables/useShopCart'
import RentalAvailabilityModal from '#modula/components/shop/RentalAvailabilityModal.vue'

definePageMeta({
  layout: 'default',
  i18n: false,
})

const route = useRoute()
const localePath = usePublicLocalePath()
const { contentLocale } = useContentLocale()
const { publicText } = usePublicDictionary()
const initialSiteConfig = await ensureSiteConfigState({ path: route.path, locale: contentLocale.value })
const siteConfig = useSiteConfigState()
const locale = computed(() => contentLocale.value)
const { $toast, $formatPrice, $formatDate } = useNuxtApp() as any
const { add } = useShopCart()
const slug = computed(() => String(route.params.slug || ''))

const { data } = await useFetch<{
  product: ProductPayload
  relatedProducts: ProductPayload[]
}>(() => `/api/shop/products/${slug.value}`, {
  onResponseError: () => {
    throw createError({
      statusCode: 404,
      statusMessage: publicText('shop.product.notFound', 'Produit introuvable')
    })
  }
})

const product = computed(() => data.value?.product || null)
const shopPagePath = computed(() => siteConfig.value?.shopPagePath || initialSiteConfig?.shopPagePath || '/boutique')
const relatedProducts = computed(() => data.value?.relatedProducts || [])
const quantity = ref(1)
const rentalModalOpen = ref(false)
const selectedRentalStartDate = ref('')
const selectedRentalEndDate = ref('')
const selectedPricingMode = ref<'HOURLY' | 'DAILY'>('DAILY')
const selectedInsuranceDocumentIds = ref<number[]>([])
const customReturnToListingLabel = computed(() =>
  pickCmsLocalizedText(
    contentLocale.value,
    siteConfig.value?.cms?.settings?.basketsPage?.returnToListingLabel
      || initialSiteConfig?.cms?.settings?.basketsPage?.returnToListingLabel
  )
)

const backLabel = computed(() => publicText('shop.product.backToShop', 'Retour à la boutique'))
const saleLabel = computed(() => publicText('shop.product.sale', 'Vente'))
const rentalLabel = computed(() => publicText('shop.product.rental', 'Location'))
const offlineLabel = computed(() => publicText('shop.product.offlinePayment', 'Paiement hors ligne'))
const onlineLabel = computed(() => publicText('shop.product.onlinePayment', 'Paiement en ligne'))
const priceLabel = computed(() => publicText('shop.product.price', 'Prix'))
const descriptionTitle = computed(() => publicText('shop.product.descriptionTitle', 'Description'))
const noDescriptionLabel = computed(() => publicText('shop.product.noDescription', 'Aucune description détaillée n’est encore renseignée.'))
const detailsTitle = computed(() => publicText('shop.product.detailsTitle', 'Détails du produit'))
const categoryLabel = computed(() => publicText('shop.product.category', 'Catégorie'))
const stockLabel = computed(() => publicText('shop.product.availableStock', 'Stock disponible'))
const vatLabel = computed(() => publicText('shop.product.vat', 'TVA'))
const vatNotApplicableLabel = computed(() => publicText('shop.product.vatNotApplicable', 'TVA non applicable'))
const typeLabel = computed(() => publicText('shop.product.offerType', 'Type d’offre'))
const paymentLabel = computed(() => publicText('shop.product.payment', 'Paiement'))
const noneLabel = computed(() => publicText('shop.product.none', 'Aucun'))
const moreDetailsTitle = computed(() => publicText('shop.product.moreDetails', 'Informations détaillées'))
const openPdfLabel = computed(() => publicText('shop.product.openPdf', 'Ouvrir le PDF'))
const openDocumentLabel = computed(() => publicText('shop.product.openDocument', 'Ouvrir le document'))
const documentAvailableLabel = computed(() => publicText('shop.product.documentAvailable', 'Document disponible'))
const rentalConditionsTitle = computed(() => publicText('shop.product.rentalConditions', 'Conditions de location'))
const rentalAvailabilityLabel = computed(() => publicText('shop.product.availability', 'Disponibilité'))
const rentalMinLabel = computed(() => publicText('shop.product.minimumDuration', 'Durée minimale'))
const rentalMaxLabel = computed(() => publicText('shop.product.maximumDuration', 'Durée maximale'))
const relatedTitle = computed(() => publicText('shop.product.relatedTitle', 'Autres produits liés'))
const browseLabel = computed(() => publicText('shop.product.browseShop', 'Voir la boutique'))
const resolvedBackLabel = computed(() => customReturnToListingLabel.value || backLabel.value)
const resolvedBrowseLabel = computed(() => customReturnToListingLabel.value || browseLabel.value)
const actionTitle = computed(() => publicText('shop.product.orderTitle', 'Commander'))
const actionIntro = computed(() => {
  if (!product.value) return ''
  return product.value.saleType === 'RENTAL'
    ? publicText('shop.product.actionIntroRental', 'Choisissez une période de location puis ajoutez ce produit au panier.')
    : publicText('shop.product.actionIntroSale', 'Ajustez la quantité puis ajoutez ce produit au panier.')
})
const quantityLabel = computed(() => publicText('shop.product.quantity', 'Quantité'))
const selectedPeriodTitle = computed(() => publicText('shop.product.selectedRentalPeriod', 'Période de location choisie'))
const chooseRentalPeriodLabel = computed(() => publicText('shop.product.chooseRentalPeriod', 'Choisir la période'))
const selectedPeriodSummary = computed(() => {
  if (!selectedRentalStartDate.value || !selectedRentalEndDate.value) {
    return publicText('shop.product.noSelectedRentalPeriod', 'Aucune période de location sélectionnée pour le moment.')
  }
  return `${$formatDate(selectedRentalStartDate.value)} → ${$formatDate(selectedRentalEndDate.value)}`
})
const addRentalLabel = computed(() => publicText('shop.product.addRental', 'Ajouter la location au panier'))
const addToCartLabel = computed(() => publicText('shop.product.addToCart', 'Ajouter au panier'))
const soldOutLabel = computed(() => publicText('shop.product.soldOut', 'Épuisé'))
const cartLabel = computed(() => publicText('shop.product.viewCart', 'Voir le panier'))
const hourUnitLabel = computed(() => publicText('shop.rentalModal.hourUnit', 'heure'))
const dayUnitLabel = computed(() => publicText('shop.rentalModal.dayUnit', 'jour'))
const insuranceTitleLabel = computed(() => publicText('shop.product.insuranceTitle', 'Assurances'))
const insuranceHelpLabel = computed(() => publicText('shop.product.insuranceHelp', 'Les assurances obligatoires sont incluses. Vous pouvez ajouter les assurances facultatives.'))
const requiredLabel = computed(() => publicText('shop.product.required', 'Obligatoire'))
const optionalLabel = computed(() => publicText('shop.product.optional', 'Facultative'))
const viewDocumentLabel = computed(() => publicText('shop.product.viewDocument', 'Voir'))
const rentalBasePriceLabel = computed(() => publicText('shop.product.rentalBasePrice', 'Location'))
const totalExclTaxLabel = computed(() => publicText('shop.product.totalExclTax', 'Total HT'))
const vatAmountLabel = computed(() => publicText('shop.product.vatAmount', 'Montant de la TVA'))
const totalInclTaxLabel = computed(() => publicText('shop.product.totalInclTax', 'Total TTC'))
const rentalRateLabels = computed(() => {
  if (!product.value || product.value.saleType !== 'RENTAL') return []
  const rates: Array<{ price: number, unit: string }> = []
  if (product.value.rentalBookingMode !== 'MULTI_DAY') rates.push({ price: Number(product.value.rentalHourlyPrice ?? product.value.price), unit: hourUnitLabel.value })
  if (product.value.rentalBookingMode !== 'SINGLE_DAY') rates.push({ price: Number(product.value.rentalDailyPrice ?? product.value.price), unit: dayUnitLabel.value })
  return rates
})
const selectedRentalPrice = computed(() => {
  if (!product.value || !selectedRentalStartDate.value || !selectedRentalEndDate.value) return product.value?.price || 0
  const milliseconds = new Date(selectedRentalEndDate.value).getTime() - new Date(selectedRentalStartDate.value).getTime()
  if (selectedPricingMode.value === 'HOURLY') {
    return Number(product.value.rentalHourlyPrice ?? product.value.price) * Math.max(0, milliseconds / 3600000)
  }
  const days = Math.floor(milliseconds / 86400000) + 1
  return Number(product.value.rentalDailyPrice ?? product.value.price) * Math.max(1, days)
})
const rentalDurationUnits = computed(() => {
  if (!selectedRentalStartDate.value || !selectedRentalEndDate.value) return 0
  const milliseconds = new Date(selectedRentalEndDate.value).getTime() - new Date(selectedRentalStartDate.value).getTime()
  return selectedPricingMode.value === 'HOURLY'
    ? Math.max(0, milliseconds / 3600000)
    : Math.max(1, Math.floor(milliseconds / 86400000) + 1)
})
const rentalDurationSummary = computed(() => publicText(
  selectedPricingMode.value === 'HOURLY' ? 'shop.product.rentalHourCount' : 'shop.product.rentalDayCount',
  selectedPricingMode.value === 'HOURLY' ? '{count} heure(s)' : '{count} jour(s)',
  { count: rentalDurationUnits.value },
))
const rentalInsuranceOptions = computed(() => {
  if (!product.value || product.value.saleType !== 'RENTAL') return []
  const unique = new Map<number, { documentId: number, name: string, required: boolean, unitPrice: number, previewUrl: string }>()
  for (const item of product.value.detailSections.flatMap(section => section.items)) {
    const documentId = Number(item.mediaDocumentId || 0)
    if (item.mediaKind !== 'billingDocument' || item.mediaDocumentKind !== 'ASSURANCE' || !documentId || unique.has(documentId)) continue
    const rate = selectedPricingMode.value === 'HOURLY'
      ? item.mediaDocumentRentalHourlyPrice
      : item.mediaDocumentRentalDailyPrice
    unique.set(documentId, {
      documentId,
      name: item.mediaDocumentName || getLocalizedDetailLabel(item) || insuranceTitleLabel.value,
      required: item.mediaDocumentRequiredForRental,
      unitPrice: Math.round(Number(rate || 0) * rentalDurationUnits.value * 100) / 100,
      previewUrl: buildBillingDocumentPreviewUrl(documentId),
    })
  }
  return Array.from(unique.values())
})
const selectedRentalInsurances = computed(() => rentalInsuranceOptions.value.filter(insurance =>
  insurance.required || selectedInsuranceDocumentIds.value.includes(insurance.documentId),
))
const selectedRentalPayablePrice = computed(() => selectedRentalPrice.value + selectedRentalInsurances.value.reduce((sum, insurance) => sum + insurance.unitPrice, 0))
const selectedRentalTotalInclTax = computed(() => roundCurrency(selectedRentalPayablePrice.value * quantity.value))
const selectedRentalTotalExclTax = computed(() => {
  const rate = Math.max(0, Number(product.value?.vatRate || 0))
  return rate > 0 ? roundCurrency(selectedRentalTotalInclTax.value / (1 + rate / 100)) : selectedRentalTotalInclTax.value
})
const selectedRentalVatAmount = computed(() => roundCurrency(selectedRentalTotalInclTax.value - selectedRentalTotalExclTax.value))
const associatedDocuments = computed(() => {
  if (!product.value) return []
  const unique = new Map<string, { key: string, name: string, kind: 'pdf' | 'billingDocument', url: string, documentId?: number | null }>()
  for (const item of product.value.detailSections.flatMap(section => section.items)) {
    if (item.mediaKind === 'pdf' && item.mediaUrl) {
      const key = `pdf:${item.mediaUrl}`
      unique.set(key, { key, name: getLocalizedDetailLabel(item) || openPdfLabel.value, kind: 'pdf', url: item.mediaUrl })
    } else if (item.mediaKind === 'billingDocument' && item.mediaDocumentId) {
      const key = `document:${item.mediaDocumentId}`
      unique.set(key, { key, name: item.mediaDocumentName || getLocalizedDetailLabel(item) || openDocumentLabel.value, kind: 'billingDocument', url: buildBillingDocumentPreviewUrl(item.mediaDocumentId), documentId: item.mediaDocumentId })
    }
  }
  return Array.from(unique.values())
})

function getLocalizedProductName(entry: ProductPayload | null | undefined) {
  if (!entry) return ''
  return pickCmsLocalizedText(contentLocale.value, entry.nameLocalized) || entry.name || ''
}

function getLocalizedProductExcerpt(entry: ProductPayload | null | undefined) {
  if (!entry) return ''
  return pickCmsLocalizedText(contentLocale.value, entry.excerptLocalized) || entry.excerpt || ''
}

function getLocalizedProductDescription(entry: ProductPayload | null | undefined) {
  if (!entry) return ''
  return pickCmsLocalizedText(contentLocale.value, entry.descriptionLocalized) || entry.description || ''
}

function getLocalizedProductUnitLabel(entry: ProductPayload | null | undefined) {
  if (!entry) return ''
  return pickCmsLocalizedText(contentLocale.value, entry.unitLabelLocalized) || entry.unitLabel || ''
}

function getLocalizedSectionTitle(section: ProductDetailSection | null | undefined) {
  if (!section) return ''
  return pickCmsLocalizedText(contentLocale.value, section.titleLocalized) || section.title || ''
}

function getLocalizedDetailLabel(item: ProductDetailField | null | undefined) {
  if (!item) return ''
  return pickCmsLocalizedText(contentLocale.value, item.labelLocalized) || item.label || ''
}

function getLocalizedDetailValue(item: ProductDetailField | null | undefined) {
  if (!item) return ''
  return pickCmsLocalizedText(contentLocale.value, item.valueLocalized) || item.value || ''
}

function buildBillingDocumentPreviewUrl(documentId: number) {
  const localeQuery = encodeURIComponent(contentLocale.value || 'fr')
  const productId = encodeURIComponent(String(product.value?.id || ''))
  return `/api/shop/billing-documents/${documentId}/preview?productId=${productId}&locale=${localeQuery}`
}

const maxQuantity = computed(() => {
  if (!product.value) return 1
  return Math.max(1, Number(product.value.stock || 1))
})

const paymentModesSummary = computed(() => {
  if (!product.value) return ''
  if (product.value.allowOfflinePayment && product.value.allowOnlinePayment) {
    return publicText('shop.product.paymentOfflineOrOnline', 'Sur place ou en ligne')
  }
  if (product.value.allowOnlinePayment) return onlineLabel.value
  if (product.value.allowOfflinePayment) return offlineLabel.value
  return noneLabel.value
})

const rentalAvailabilitySummary = computed(() => {
  if (!product.value) return ''
  const parts: string[] = []
  if (product.value.rentalAvailableFrom) parts.push($formatDate(product.value.rentalAvailableFrom))
  if (product.value.rentalAvailableTo) parts.push($formatDate(product.value.rentalAvailableTo))
  if (!parts.length) {
    return publicText('shop.product.noDateRestriction', 'Pas de restriction de dates')
  }
  return parts.join(' → ')
})

const rentalMinSummary = computed(() => {
  const value = Number(product.value?.rentalMinDays || 1)
  return publicText('shop.product.dayCount', '{count} jour(s)', { count: value })
})

const rentalMaxSummary = computed(() => {
  const value = product.value?.rentalMaxDays
  if (value == null) return publicText('shop.product.noMaximum', 'Aucun maximum')
  return publicText('shop.product.dayCount', '{count} jour(s)', { count: value })
})

const canAddRentalToCart = computed(() => {
  const currentProduct = product.value
  return Boolean(currentProduct)
    && (currentProduct?.stock ?? 0) > 0
    && selectedRentalStartDate.value.trim().length > 0
    && selectedRentalEndDate.value.trim().length > 0
})

watch(product, (value) => {
  quantity.value = 1
  selectedRentalStartDate.value = ''
  selectedRentalEndDate.value = ''
  selectedPricingMode.value = value?.rentalBookingMode === 'SINGLE_DAY' ? 'HOURLY' : 'DAILY'
  selectedInsuranceDocumentIds.value = value
    ? value.detailSections.flatMap(section => section.items)
        .filter(item => item.mediaDocumentKind === 'ASSURANCE' && item.mediaDocumentRequiredForRental && item.mediaDocumentId)
        .map(item => Number(item.mediaDocumentId))
    : []
}, { immediate: true })

usePageSeo({
  title: computed(() => getLocalizedProductName(product.value) || publicText('shop.product.seoFallbackTitle', 'Produit')),
  description: computed(() => getLocalizedProductExcerpt(product.value) || getLocalizedProductDescription(product.value) || '')
})

function formatVatRate(value: number) {
  const normalized = Number(value || 0)
  if (normalized <= 0) return vatNotApplicableLabel.value
  return `${normalized.toFixed(2)}%`
}

function roundCurrency(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function onRentalDatesSelected(payload: { rentalStartDate: string, rentalEndDate: string, pricingMode: 'HOURLY' | 'DAILY' }) {
  selectedRentalStartDate.value = payload.rentalStartDate
  selectedRentalEndDate.value = payload.rentalEndDate
  selectedPricingMode.value = payload.pricingMode
  rentalModalOpen.value = false
}

function addSaleToCart() {
  if (!product.value) return
  add({
    key: `product-${product.value.id}`,
    kind: 'product',
    productId: product.value.id,
    title: getLocalizedProductName(product.value),
    imageUrl: product.value.imageUrl,
    description: getLocalizedProductExcerpt(product.value) || getLocalizedProductDescription(product.value),
    quantity: quantity.value,
    saleType: product.value.saleType,
    availableQuantity: product.value.stock,
    vatRate: product.value.vatRate,
    paymentTaxCode: product.value.paymentTaxCode,
    paymentTaxBehavior: product.value.paymentTaxBehavior,
    allowOfflinePayment: product.value.allowOfflinePayment,
    allowOnlinePayment: product.value.allowOnlinePayment,
    unitPrice: product.value.price,
    totalPrice: product.value.price * quantity.value
  })
  $toast.success(publicText('shop.product.addSaleSuccess', 'Ajouté au panier'))
}

function addRentalToCart() {
  if (!product.value || !canAddRentalToCart.value) return
  add({
    key: `product-${product.value.id}-${selectedRentalStartDate.value}-${selectedRentalEndDate.value}-${selectedRentalInsurances.value.map(entry => entry.documentId).sort().join('-')}`,
    kind: 'product',
    productId: product.value.id,
    title: getLocalizedProductName(product.value),
    imageUrl: product.value.imageUrl,
    description: getLocalizedProductExcerpt(product.value) || getLocalizedProductDescription(product.value),
    quantity: quantity.value,
    saleType: product.value.saleType,
    rentalStartDate: selectedRentalStartDate.value,
    rentalEndDate: selectedRentalEndDate.value,
    rentalPricingMode: selectedPricingMode.value,
    rentalBaseUnitPrice: selectedRentalPrice.value,
    insuranceSelections: selectedRentalInsurances.value.map(entry => ({ ...entry })),
    associatedDocuments: associatedDocuments.value,
    availableQuantity: product.value.stock,
    vatRate: product.value.vatRate,
    paymentTaxCode: product.value.paymentTaxCode,
    paymentTaxBehavior: product.value.paymentTaxBehavior,
    allowOfflinePayment: product.value.allowOfflinePayment,
    allowOnlinePayment: product.value.allowOnlinePayment,
    unitPrice: selectedRentalPayablePrice.value,
    totalPrice: selectedRentalPayablePrice.value * quantity.value
  })
  $toast.success(publicText('shop.product.addRentalSuccess', 'Location ajoutée au panier'))
}
</script>
