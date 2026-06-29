<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <button class="btn btn-ghost btn-sm mb-3" @click="goBack">
          <Icon name="mdi:arrow-left" size="16" />
          {{ t('admin.productEditorPage.back') }}
        </button>
        <h1 class="text-3xl font-bold">
          {{ isCreateMode ? t('admin.productEditorPage.createTitle') : t('admin.productEditorPage.editTitle') }}
        </h1>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.productEditorPage.description') }}</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <NuxtLink
          v-if="previewPath"
          :to="previewPath"
          target="_blank"
          class="btn btn-outline"
        >
          <Icon name="mdi:open-in-new" size="18" />
          {{ t('admin.productEditorPage.preview') }}
        </NuxtLink>
        <button v-if="!isCreateMode" class="btn btn-outline btn-error" :disabled="saving || deleting" @click="removeProduct">
          <span v-if="deleting" class="loading loading-spinner loading-sm" />
          <Icon v-else name="mdi:delete" size="18" />
          {{ t('admin.productEditorPage.delete') }}
        </button>
        <button class="btn btn-primary" :disabled="saving" @click="save">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          <Icon v-else name="mdi:content-save-outline" size="18" />
          {{ t('admin.common.save') }}
        </button>
      </div>
    </div>

    <div v-if="loadingProduct" class="card bg-base-100 p-6">
      <span class="loading loading-spinner" />
    </div>

    <template v-else>
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div class="space-y-6">
          <section class="card bg-base-100 p-6 shadow-sm">
            <h2 class="text-xl font-semibold">{{ t('admin.productEditorPage.generalCard') }}</h2>
            <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div class="form-control flex flex-col gap-3 md:col-span-2">
                <AdminPageBuilderTranslationTabs v-model="editing.nameLocalized" :label="t('admin.vegetablesPage.fieldName')" />
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldSlug') }}</span></label>
                <input v-model="editing.slug" class="input input-bordered" :placeholder="t('admin.productEditorPage.slugPlaceholder')" />
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldCategory') }}</span></label>
                <select v-model.number="editing.categoryId" class="select select-bordered">
                  <option :value="0">{{ t('admin.vegetablesPage.noCategory') }}</option>
                  <option v-for="category in categories || []" :key="category.id" :value="category.id">{{ category.name }}</option>
                </select>
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldSaleType') }}</span></label>
                <select v-model="editing.saleType" class="select select-bordered">
                  <option value="SALE">{{ t('admin.vegetablesPage.saleTypeSale') }}</option>
                  <option value="RENTAL">{{ t('admin.vegetablesPage.saleTypeRental') }}</option>
                </select>
              </div>
              <div class="form-control flex flex-col gap-3">
                <AdminPageBuilderTranslationTabs v-model="editing.unitLabelLocalized" :label="t('admin.vegetablesPage.fieldUnit')" />
              </div>
              <div class="form-control flex flex-col gap-3 md:col-span-2">
                <AdminPageBuilderTranslationTabs v-model="editing.excerptLocalized" :label="t('admin.vegetablesPage.fieldExcerpt')" multiline />
              </div>
              <div class="form-control flex flex-col gap-3 md:col-span-2">
                <AdminPageBuilderTranslationTabs v-model="editing.descriptionLocalized" :label="t('admin.vegetablesPage.fieldDescription')" multiline />
              </div>
            </div>
          </section>

          <section class="card bg-base-100 p-6 shadow-sm">
            <h2 class="text-xl font-semibold">{{ t('admin.productEditorPage.mediaCard') }}</h2>
            <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div class="form-control flex flex-col gap-3 md:col-span-2">
                <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldImage') }}</span></label>
                <ImageInput v-model="editing.imageUrl" />
              </div>
              <div v-if="editing.imageUrl" class="md:col-span-2">
                <AppImage :src="editing.imageUrl" :alt="localizedName || 'product'" class="h-72 w-full rounded-3xl object-cover" sizes="100vw" />
              </div>
            </div>
          </section>

          <section class="card bg-base-100 p-6 shadow-sm">
            <h2 class="text-xl font-semibold">{{ t('admin.productEditorPage.commerceCard') }}</h2>
            <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldPrice') }}</span></label>
                <input v-model.number="editing.price" type="number" min="0" step="0.01" class="input input-bordered" />
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldVatRate') }}</span></label>
                <input v-model.number="editing.vatRate" type="number" min="0" max="100" step="0.01" class="input input-bordered" />
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldAvailable') }}</span></label>
                <input v-model.number="editing.stock" type="number" min="0" step="1" class="input input-bordered" />
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldPosition') }}</span></label>
                <input v-model.number="editing.position" type="number" min="0" step="1" class="input input-bordered" />
              </div>
              <div class="form-control flex gap-3">
                <label class="label cursor-pointer justify-start gap-3">
                  <input v-model="editing.allowOfflinePayment" type="checkbox" class="checkbox" />
                  <span class="label-text">{{ t('admin.vegetablesPage.paymentOffline') }}</span>
                </label>
                <label class="label cursor-pointer justify-start gap-3">
                  <input v-model="editing.allowOnlinePayment" type="checkbox" class="checkbox" />
                  <span class="label-text">{{ t('admin.vegetablesPage.paymentOnline') }}</span>
                </label>
              </div>
              <div class="form-control flex gap-3">
                <label class="label cursor-pointer justify-start gap-3">
                  <input v-model="editing.active" type="checkbox" class="checkbox" />
                  <span class="label-text">{{ t('admin.vegetablesPage.fieldActive') }}</span>
                </label>
              </div>
            </div>
          </section>

          <section v-if="editing.saleType === 'RENTAL'" class="card bg-base-100 p-6 shadow-sm">
            <h2 class="text-xl font-semibold">{{ t('admin.productEditorPage.rentalCard') }}</h2>
            <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldRentalAvailableFrom') }}</span></label>
                <input v-model="editing.rentalAvailableFrom" type="date" class="input input-bordered" />
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldRentalAvailableTo') }}</span></label>
                <input v-model="editing.rentalAvailableTo" type="date" class="input input-bordered" />
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldRentalMinDays') }}</span></label>
                <input v-model.number="editing.rentalMinDays" type="number" min="1" step="1" class="input input-bordered" />
              </div>
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldRentalMaxDays') }}</span></label>
                <input v-model.number="editing.rentalMaxDays" type="number" min="1" step="1" class="input input-bordered" />
              </div>
              <div class="md:col-span-2 text-sm opacity-70">
                {{ t('admin.vegetablesPage.rentalHelp') }}
              </div>
            </div>
          </section>

          <section class="card bg-base-100 p-6 shadow-sm">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 class="text-xl font-semibold">{{ t('admin.productEditorPage.sectionsCard') }}</h2>
                <p class="mt-1 text-sm opacity-70">{{ t('admin.productEditorPage.sectionsHelp') }}</p>
              </div>
              <button class="btn btn-outline btn-sm" @click="addSection">
                <Icon name="mdi:plus" size="16" />
                {{ t('admin.productEditorPage.addSection') }}
              </button>
            </div>

            <div class="mt-5 space-y-4">
              <div
                v-for="(section, sectionIndex) in editing.detailSections"
                :key="section.id"
                class="rounded-3xl border border-base-300 bg-base-50 p-4"
              >
                <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div class="form-control flex flex-col gap-3 flex-1">
                    <AdminPageBuilderTranslationTabs v-model="section.titleLocalized" :label="t('admin.productEditorPage.sectionTitle')" />
                  </div>
                  <button class="btn btn-ghost btn-sm text-error lg:self-end" @click="removeSection(sectionIndex)">
                    <Icon name="mdi:delete" size="16" />
                    {{ t('admin.productEditorPage.removeSection') }}
                  </button>
                </div>

                <div class="space-y-3">
                  <div
                    v-for="(item, itemIndex) in section.items"
                    :key="item.id"
                    class="grid grid-cols-1 gap-3 rounded-2xl border border-base-300 bg-base-100 p-3"
                  >
                    <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                      <div class="form-control flex flex-col gap-3">
                        <AdminPageBuilderTranslationTabs v-model="item.labelLocalized" :label="t('admin.productEditorPage.fieldLabel')" />
                      </div>
                      <div class="form-control flex flex-col gap-3">
                        <AdminPageBuilderTranslationTabs v-model="item.valueLocalized" :label="t('admin.productEditorPage.fieldValue')" multiline />
                      </div>
                      <button class="btn btn-ghost btn-sm text-error md:self-end" @click="removeSectionItem(sectionIndex, itemIndex)">
                        <Icon name="mdi:close" size="16" />
                      </button>
                    </div>
                    <div class="grid grid-cols-1 gap-3 md:grid-cols-[12rem_minmax(0,1fr)]">
                      <div class="form-control flex flex-col gap-3">
                        <label class="label"><span class="label-text">{{ t('admin.productEditorPage.fieldMediaType') }}</span></label>
                        <select v-model="item.mediaKind" class="select select-bordered">
                          <option :value="null">{{ t('admin.productEditorPage.fieldMediaNone') }}</option>
                          <option value="image">{{ t('admin.productEditorPage.fieldMediaImage') }}</option>
                          <option value="pdf">{{ t('admin.productEditorPage.fieldMediaPdf') }}</option>
                        </select>
                      </div>
                      <div v-if="item.mediaKind === 'image'" class="form-control flex flex-col gap-3">
                        <label class="label"><span class="label-text">{{ t('admin.productEditorPage.fieldMediaFile') }}</span></label>
                        <ImageInput v-model="item.mediaUrl" />
                      </div>
                      <div v-else-if="item.mediaKind === 'pdf'" class="form-control flex flex-col gap-3">
                        <label class="label"><span class="label-text">{{ t('admin.productEditorPage.fieldMediaFile') }}</span></label>
                        <input v-model="item.mediaUrl" type="url" class="input input-bordered" :placeholder="t('admin.productEditorPage.fieldMediaPdfPlaceholder')" />
                      </div>
                    </div>
                  </div>
                </div>

                <button class="btn btn-ghost btn-sm mt-4" @click="addSectionItem(sectionIndex)">
                  <Icon name="mdi:plus" size="16" />
                  {{ t('admin.productEditorPage.addField') }}
                </button>
              </div>

              <div v-if="!editing.detailSections.length" class="rounded-3xl border border-dashed border-base-300 px-4 py-10 text-center opacity-60">
                {{ t('admin.productEditorPage.noSection') }}
              </div>
            </div>
          </section>
        </div>

        <aside class="space-y-6">
          <section class="card bg-base-100 p-6 shadow-sm">
            <h2 class="text-xl font-semibold">{{ t('admin.productEditorPage.summaryCard') }}</h2>
            <dl class="mt-5 space-y-4 text-sm">
              <div class="flex items-start justify-between gap-4">
                <dt class="font-medium">{{ t('admin.vegetablesPage.headers.status') }}</dt>
                <dd>
                  <span class="badge" :class="editing.active ? 'badge-success' : 'badge-ghost'">
                    {{ editing.active ? t('admin.vegetablesPage.active') : t('admin.vegetablesPage.inactive') }}
                  </span>
                </dd>
              </div>
              <div class="flex items-start justify-between gap-4">
                <dt class="font-medium">{{ t('admin.vegetablesPage.headers.saleType') }}</dt>
                <dd>{{ editing.saleType === 'RENTAL' ? t('admin.vegetablesPage.saleTypeRental') : t('admin.vegetablesPage.saleTypeSale') }}</dd>
              </div>
              <div class="flex items-start justify-between gap-4">
                <dt class="font-medium">{{ t('admin.vegetablesPage.headers.price') }}</dt>
                <dd>{{ $formatPrice(editing.price || 0) }}</dd>
              </div>
              <div class="flex items-start justify-between gap-4">
                <dt class="font-medium">{{ t('admin.vegetablesPage.fieldAvailable') }}</dt>
                <dd>{{ editing.stock || 0 }}</dd>
              </div>
              <div class="flex items-start justify-between gap-4">
                <dt class="font-medium">{{ t('admin.productEditorPage.sectionCount') }}</dt>
                <dd>{{ editing.detailSections.length }}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { getAdminRoutePath, normalizeAdminRouteLocale } from '#modula/shared/adminRoutes'
import AdminPageBuilderTranslationTabs from '#modula/components/admin/page-builder/TranslationTabs.vue'
import { createEmptyCmsLocalizedText, pickCmsLocalizedText, type CmsLocalizedText } from '#modula/shared/cms'
import type { ProductDetailField, ProductDetailSection, ProductPayload } from '#modula/server/utils/shop'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

interface ProductCategory {
  id: number
  name: string
  slug: string
}

interface ProductEditorState {
  id?: number
  nameLocalized: CmsLocalizedText
  slug: string
  saleType: 'SALE' | 'RENTAL'
  categoryId: number
  excerptLocalized: CmsLocalizedText
  descriptionLocalized: CmsLocalizedText
  imageUrl: string
  price: number
  vatRate: number
  stock: number
  rentalAvailableFrom: string
  rentalAvailableTo: string
  rentalMinDays: number
  rentalMaxDays: number | null
  unitLabelLocalized: CmsLocalizedText
  allowOfflinePayment: boolean
  allowOnlinePayment: boolean
  active: boolean
  position: number
  detailSections: ProductDetailSection[]
}

const route = useRoute()
const localePath = useLocalePath()
const { locale, t } = useI18n()
const { locales: siteLocales } = useSiteLocales()
const { $toast } = useNuxtApp() as any
const productsBasePath = computed(() => getAdminRoutePath('shopVegetables', normalizeAdminRouteLocale(locale.value)))
const editorLocales = computed(() => siteLocales.value.length ? [...siteLocales.value] : ['fr', 'en'])

const routeId = computed(() => String(route.params.id || ''))
const isCreateMode = computed(() => routeId.value === 'new')
const loadingProduct = ref(false)
const saving = ref(false)
const deleting = ref(false)

const { data: categories } = await useFetch<ProductCategory[]>('/api/admin/product-categories')
const { data: settingsData } = await useFetch<{ shopDefaultVatRate: number }>('/api/admin/settings')

const defaultVatRate = computed(() => Number(settingsData.value?.shopDefaultVatRate ?? 20))

const editing = reactive<ProductEditorState>(createEmptyEditorState(defaultVatRate.value, t, editorLocales.value))
const localizedName = computed(() => pickCmsLocalizedText(locale.value, editing.nameLocalized) || editing.slug || '')

const previewPath = computed(() => {
  if (!editing.slug.trim()) return null
  return localePath(`/products/${editing.slug.trim()}`)
})

watch(defaultVatRate, (value) => {
  if (!editing.id && !editing.vatRate) {
    editing.vatRate = value
  }
})

watch(() => routeId.value, async () => {
  await loadProduct()
}, { immediate: true })

async function loadProduct() {
  if (isCreateMode.value) {
    Object.assign(editing, createEmptyEditorState(defaultVatRate.value, t, editorLocales.value))
    return
  }

  loadingProduct.value = true
  try {
    const product = await $fetch<ProductPayload>(`/api/admin/products/${routeId.value}`)
    Object.assign(editing, mapProductToEditor(product))
  } finally {
    loadingProduct.value = false
  }
}

function goBack() {
  return navigateTo(localePath(productsBasePath.value))
}

function addSection() {
  editing.detailSections.push(createDetailSection(t('admin.productEditorPage.newSectionTitle'), editorLocales.value))
}

function removeSection(index: number) {
  editing.detailSections.splice(index, 1)
}

function addSectionItem(sectionIndex: number) {
  editing.detailSections[sectionIndex]?.items.push(createDetailField(editorLocales.value))
}

function removeSectionItem(sectionIndex: number, itemIndex: number) {
  editing.detailSections[sectionIndex]?.items.splice(itemIndex, 1)
}

async function save() {
  if (!localizedName.value.trim()) {
    $toast.error(t('admin.productEditorPage.nameRequired'))
    return
  }
  if (!editing.allowOfflinePayment && !editing.allowOnlinePayment) {
    $toast.error(t('admin.productEditorPage.paymentRequired'))
    return
  }

  saving.value = true
  try {
    const payload = {
      nameLocalized: editing.nameLocalized,
      slug: editing.slug,
      saleType: editing.saleType,
      categoryId: editing.categoryId || null,
      excerptLocalized: editing.excerptLocalized,
      descriptionLocalized: editing.descriptionLocalized,
      imageUrl: editing.imageUrl,
      price: editing.price,
      vatRate: editing.vatRate,
      stock: editing.stock,
      rentalAvailableFrom: editing.saleType === 'RENTAL' ? normalizeDateValue(editing.rentalAvailableFrom) : null,
      rentalAvailableTo: editing.saleType === 'RENTAL' ? normalizeDateValue(editing.rentalAvailableTo) : null,
      rentalMinDays: editing.saleType === 'RENTAL' ? Number(editing.rentalMinDays || 1) : 1,
      rentalMaxDays: editing.saleType === 'RENTAL' ? normalizeNullableNumber(editing.rentalMaxDays) : null,
      unitLabelLocalized: editing.unitLabelLocalized,
      allowOfflinePayment: editing.allowOfflinePayment,
      allowOnlinePayment: editing.allowOnlinePayment,
      active: editing.active,
      position: editing.position,
      detailSections: normalizeDetailSectionsForSave(editing.detailSections, editorLocales.value)
    }

    const response = isCreateMode.value
      ? await $fetch<ProductPayload>('/api/admin/products', { method: 'POST', body: payload })
      : await $fetch<ProductPayload>(`/api/admin/products/${editing.id}`, { method: 'PUT', body: payload })

    $toast.success(t('admin.vegetablesPage.saved'))

    if (isCreateMode.value) {
      await navigateTo(localePath(`${productsBasePath.value}/${response.id}`))
      return
    }

    Object.assign(editing, mapProductToEditor(response))
  } catch (error: any) {
    $toast.error(error?.statusMessage || t('common.error'))
  } finally {
    saving.value = false
  }
}

async function removeProduct() {
  if (!editing.id) return
  if (!confirm(t('admin.vegetablesPage.deleteConfirm', { name: localizedName.value || `#${editing.id}` }))) return

  deleting.value = true
  try {
    await $fetch(`/api/admin/products/${editing.id}`, { method: 'DELETE' })
    $toast.success(t('admin.productEditorPage.deleted'))
    await navigateTo(localePath(productsBasePath.value))
  } catch (error: any) {
    $toast.error(error?.statusMessage || t('common.error'))
  } finally {
    deleting.value = false
  }
}

function createEmptyEditorState(vatRate: number, translate: (key: string) => string, locales: string[]): ProductEditorState {
  return {
    id: undefined,
    nameLocalized: createEmptyCmsLocalizedText(locales),
    slug: '',
    saleType: 'SALE',
    categoryId: 0,
    excerptLocalized: createEmptyCmsLocalizedText(locales),
    descriptionLocalized: createEmptyCmsLocalizedText(locales),
    imageUrl: '',
    price: 0,
    vatRate,
    stock: 0,
    rentalAvailableFrom: '',
    rentalAvailableTo: '',
    rentalMinDays: 1,
    rentalMaxDays: null,
    unitLabelLocalized: createEmptyCmsLocalizedText(locales),
    allowOfflinePayment: true,
    allowOnlinePayment: false,
    active: true,
    position: 0,
    detailSections: [
      createDetailSection(translate('admin.productEditorPage.defaultSectionGeneral'), locales),
      createDetailSection(translate('admin.productEditorPage.defaultSectionTechnical'), locales),
      createDetailSection(translate('admin.productEditorPage.defaultSectionPractical'), locales)
    ]
  }
}

function mapProductToEditor(product: ProductPayload): ProductEditorState {
  return {
    id: product.id,
    nameLocalized: structuredClone(product.nameLocalized),
    slug: product.slug,
    saleType: product.saleType,
    categoryId: product.categoryId || 0,
    excerptLocalized: structuredClone(product.excerptLocalized),
    descriptionLocalized: structuredClone(product.descriptionLocalized),
    imageUrl: product.imageUrl || '',
    price: product.price,
    vatRate: product.vatRate,
    stock: product.stock,
    rentalAvailableFrom: toDateInputValue(product.rentalAvailableFrom),
    rentalAvailableTo: toDateInputValue(product.rentalAvailableTo),
    rentalMinDays: product.rentalMinDays || 1,
    rentalMaxDays: product.rentalMaxDays ?? null,
    unitLabelLocalized: structuredClone(product.unitLabelLocalized),
    allowOfflinePayment: product.allowOfflinePayment,
    allowOnlinePayment: product.allowOnlinePayment,
    active: product.active,
    position: product.position,
    detailSections: Array.isArray(product.detailSections) && product.detailSections.length
      ? product.detailSections.map((section) => ({
          id: section.id,
          title: section.title,
          titleLocalized: structuredClone(section.titleLocalized),
          items: section.items.map((item) => ({
            id: item.id,
            label: item.label,
            labelLocalized: structuredClone(item.labelLocalized),
            value: item.value,
            valueLocalized: structuredClone(item.valueLocalized),
            mediaKind: item.mediaKind ?? null,
            mediaUrl: item.mediaUrl ?? null
          }))
        }))
      : [
          createDetailSection(t('admin.productEditorPage.defaultSectionGeneral'), editorLocales.value),
          createDetailSection(t('admin.productEditorPage.defaultSectionTechnical'), editorLocales.value),
          createDetailSection(t('admin.productEditorPage.defaultSectionPractical'), editorLocales.value)
        ]
  }
}

function createDetailSection(title: string, locales: string[]): ProductDetailSection {
  const titleLocalized = createFilledLocalizedText(locales, title)
  return {
    id: crypto.randomUUID(),
    title,
    titleLocalized,
    items: [createDetailField(locales)]
  }
}

function createDetailField(locales: string[]): ProductDetailField {
  return {
    id: crypto.randomUUID(),
    label: '',
    labelLocalized: createEmptyCmsLocalizedText(locales),
    value: '',
    valueLocalized: createEmptyCmsLocalizedText(locales),
    mediaKind: null,
    mediaUrl: null
  }
}

function createFilledLocalizedText(locales: string[], value: string) {
  const normalizedValue = String(value || '').trim()
  const entries = locales.length ? locales : ['fr', 'en']
  return Object.fromEntries(
    entries.map((localeCode, index) => [
      localeCode,
      index === 0 || localeCode === 'fr' || localeCode === 'en' ? normalizedValue : ''
    ])
  ) as CmsLocalizedText
}

function normalizeLocalizedTextForSave(value: CmsLocalizedText | null | undefined, locales: string[]) {
  const normalized = createEmptyCmsLocalizedText(locales)
  for (const localeCode of locales) {
    normalized[localeCode] = String(value?.[localeCode] || '').trim()
  }
  for (const [localeCode, localeValue] of Object.entries(value || {})) {
    if (!locales.includes(localeCode)) {
      normalized[localeCode] = String(localeValue || '').trim()
    }
  }
  return normalized
}

function normalizeDetailSectionsForSave(value: ProductDetailSection[], locales: string[]) {
  return value
    .map((section) => ({
      id: section.id || crypto.randomUUID(),
      titleLocalized: normalizeLocalizedTextForSave(section.titleLocalized, locales),
      items: section.items
        .map((item) => ({
          id: item.id || crypto.randomUUID(),
          labelLocalized: normalizeLocalizedTextForSave(item.labelLocalized, locales),
          valueLocalized: normalizeLocalizedTextForSave(item.valueLocalized, locales),
          mediaKind: item.mediaKind === 'image' || item.mediaKind === 'pdf' ? item.mediaKind : null,
          mediaUrl: item.mediaUrl?.trim() ? item.mediaUrl.trim() : null
        }))
        .filter((item) =>
          Object.values(item.labelLocalized).some((entry) => entry)
          || Object.values(item.valueLocalized).some((entry) => entry)
          || Boolean(item.mediaUrl)
        )
    }))
    .filter((section) =>
      Object.values(section.titleLocalized).some((entry) => entry)
      || section.items.length
    )
}

function toDateInputValue(value: string | null | undefined) {
  return value ? String(value).slice(0, 10) : ''
}

function normalizeDateValue(value: string | null | undefined) {
  return value?.trim() ? value.trim() : null
}

function normalizeNullableNumber(value: number | null | undefined) {
  if (value === '' as never) return null
  if (value == null || Number.isNaN(Number(value))) return null
  return Number(value)
}
</script>
