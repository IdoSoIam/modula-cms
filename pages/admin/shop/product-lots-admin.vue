<template>
  <div class="card bg-base-100 p-6">
    <div class="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.basketsPage.title') }}</h1>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.basketsPage.description') }}</p>
      </div>
      <button class="btn btn-primary" @click="openNew">
        <Icon name="mdi:plus" size="20" /> {{ t('admin.basketsPage.new') }}
      </button>
    </div>

    <div v-if="pending" class="loading loading-spinner" />

    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div v-for="lot in productLots" :key="lot.id" class="card bg-base-200 shadow">
        <figure v-if="lot.imageUrl" class="overflow-hidden rounded-t-2xl">
          <AppImage :src="lot.imageUrl" :alt="lot.name" class="h-48 w-full object-cover" sizes="(min-width: 768px) 50vw, 100vw" />
        </figure>
        <div class="card-body">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="card-title">{{ lot.name }}</h2>
              <p class="text-sm opacity-70">{{ lot.description || lot.slug }}</p>
            </div>
            <span class="badge" :class="lot.active ? 'badge-success' : 'badge-ghost'">
              {{ lot.active ? t('admin.basketsPage.active') : t('admin.basketsPage.inactive') }}
            </span>
          </div>

          <div class="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <div class="opacity-60">{{ t('admin.basketsPage.fieldCategory') }}</div>
              <div class="font-medium">{{ lot.category?.name || '-' }}</div>
            </div>
            <div>
              <div class="opacity-60">{{ t('admin.basketsPage.kind') }}</div>
              <div class="font-medium">{{ lot.kind === 'SINGLE' ? t('admin.basketsPage.kindSingle') : t('admin.basketsPage.kindLot') }}</div>
            </div>
            <div>
              <div class="opacity-60">{{ t('admin.basketsPage.fieldSaleType') }}</div>
              <div class="font-medium">{{ lot.saleType === 'RENTAL' ? t('admin.basketsPage.saleTypeRental') : t('admin.basketsPage.saleTypeSale') }}</div>
            </div>
            <div>
              <div class="opacity-60">{{ t('admin.basketsPage.available') }}</div>
              <div class="font-medium">{{ lot.stock }}</div>
            </div>
            <div>
              <div class="opacity-60">{{ t('admin.basketsPage.composition') }}</div>
              <div class="font-medium">{{ t('admin.basketsPage.vegetablesCount', { count: lot.items.length }) }}</div>
            </div>
            <div>
              <div class="opacity-60">{{ t('admin.basketsPage.finalPrice') }}</div>
              <div class="font-medium text-primary">{{ $formatPrice(lot.price) }}</div>
            </div>
            <div>
              <div class="opacity-60">{{ t('admin.basketsPage.fieldVatRate') }}</div>
              <div class="font-medium">{{ formatVatRate(lot.vatRate) }}</div>
            </div>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <span v-if="lot.allowOfflinePayment" class="badge badge-soft">{{ t('admin.basketsPage.paymentOffline') }}</span>
            <span v-if="lot.allowOnlinePayment" class="badge badge-outline">{{ t('admin.basketsPage.paymentOnline') }}</span>
          </div>

          <div v-if="lot.items.length" class="mt-3 rounded-xl bg-base-100 p-3 text-sm">
            <div class="mb-2 font-medium">{{ t('admin.basketsPage.compositionTitle') }}</div>
            <ul class="space-y-1">
              <li v-for="item in lot.items" :key="`${lot.id}-${item.productId}`" class="flex justify-between gap-3">
                <span>{{ item.product?.name || `#${item.productId}` }}</span>
                <span class="opacity-70">x{{ item.quantity }}</span>
              </li>
            </ul>
          </div>

          <div class="card-actions mt-2 justify-end">
            <button class="btn btn-ghost btn-sm" @click="openEdit(lot)">
              <Icon name="mdi:pencil" size="16" /> {{ t('admin.common.edit') }}
            </button>
            <button class="btn btn-ghost btn-sm text-error" @click="remove(lot)">
              <Icon name="mdi:delete" size="16" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="!productLots?.length" class="py-8 text-center opacity-60 md:col-span-2">
        {{ t('admin.basketsPage.empty') }}
      </div>
    </div>

    <dialog ref="dlg" class="modal">
      <div class="modal-box max-w-4xl">
        <h3 class="mb-4 text-lg font-bold">
          {{ editing.id ? t('admin.basketsPage.editTitle') : t('admin.basketsPage.createTitle') }}
        </h3>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldName') }}</span></label>
            <input v-model="editing.name" class="input input-bordered" />
          </div>
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldSlug') }}</span></label>
            <input v-model="editing.slug" class="input input-bordered" />
          </div>
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldCategory') }}</span></label>
            <select v-model.number="editing.categoryId" class="select select-bordered">
              <option :value="0">{{ t('admin.basketsPage.noCategory') }}</option>
              <option v-for="category in categories || []" :key="category.id" :value="category.id">{{ category.name }}</option>
            </select>
          </div>
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldSaleType') }}</span></label>
            <select v-model="editing.saleType" class="select select-bordered">
              <option value="SALE">{{ t('admin.basketsPage.saleTypeSale') }}</option>
              <option value="RENTAL">{{ t('admin.basketsPage.saleTypeRental') }}</option>
            </select>
          </div>
          <div class="form-control flex flex-col gap-3 md:col-span-2">
            <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldImage') }}</span></label>
            <ImageInput v-model="editing.imageUrl" />
          </div>
          <div class="form-control flex flex-col gap-3 md:col-span-2">
            <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldDescription') }}</span></label>
            <textarea v-model="editing.description" class="textarea textarea-bordered min-h-28" />
          </div>
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ t('admin.basketsPage.kind') }}</span></label>
            <select v-model="editing.kind" class="select select-bordered">
              <option value="LOT">{{ t('admin.basketsPage.kindLot') }}</option>
              <option value="SINGLE">{{ t('admin.basketsPage.kindSingle') }}</option>
            </select>
          </div>
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldAvailable') }}</span></label>
            <input :value="computedStockPreview" class="input input-bordered" disabled />
          </div>
          <template v-if="editing.saleType === 'RENTAL'">
            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldRentalAvailableFrom') }}</span></label>
              <input v-model="editing.rentalAvailableFrom" type="date" class="input input-bordered" />
            </div>
            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldRentalAvailableTo') }}</span></label>
              <input v-model="editing.rentalAvailableTo" type="date" class="input input-bordered" />
            </div>
            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldRentalMinDays') }}</span></label>
              <input v-model.number="editing.rentalMinDays" type="number" min="1" step="1" class="input input-bordered" />
            </div>
            <div class="form-control flex flex-col gap-3">
              <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldRentalMaxDays') }}</span></label>
              <input v-model.number="editing.rentalMaxDays" type="number" min="1" step="1" class="input input-bordered" />
            </div>
            <div class="md:col-span-2 text-sm opacity-70">
              {{ t('admin.basketsPage.rentalHelp') }}
            </div>
          </template>
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ t('admin.basketsPage.editableFinalPrice') }}</span></label>
            <input v-model.number="editing.price" type="number" min="0" step="0.01" class="input input-bordered" />
          </div>
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldVatRate') }}</span></label>
            <input v-model.number="editing.vatRate" type="number" min="0" max="100" step="0.01" class="input input-bordered" />
          </div>
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldTaxBehavior') }}</span></label>
            <select v-model="editing.paymentTaxBehavior" class="select select-bordered">
              <option value="">{{ t('admin.basketsPage.taxBehaviorDefault') }}</option>
              <option value="inclusive">{{ t('admin.basketsPage.taxBehaviorInclusive') }}</option>
              <option value="exclusive">{{ t('admin.basketsPage.taxBehaviorExclusive') }}</option>
            </select>
          </div>
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldTaxCode') }}</span></label>
            <input v-model="editing.paymentTaxCode" class="input input-bordered" placeholder="txcd_..." />
          </div>
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldPosition') }}</span></label>
            <input v-model.number="editing.position" type="number" min="0" step="1" class="input input-bordered" />
          </div>
          <div class="form-control flex gap-3">
            <label class="label cursor-pointer justify-start gap-3">
              <input v-model="editing.allowOfflinePayment" type="checkbox" class="checkbox" :disabled="!lotPaymentCapabilities.allowOfflinePayment" />
              <span class="label-text">{{ t('admin.basketsPage.paymentOffline') }}</span>
            </label>
            <label class="label cursor-pointer justify-start gap-3">
              <input v-model="editing.allowOnlinePayment" type="checkbox" class="checkbox" :disabled="!lotPaymentCapabilities.allowOnlinePayment" />
              <span class="label-text">{{ t('admin.basketsPage.paymentOnline') }}</span>
            </label>
          </div>
          <div class="md:col-span-2">
            <p class="text-sm" :class="lotPaymentConflict ? 'text-error' : 'opacity-70'">
              {{ lotPaymentRuleMessage }}
            </p>
          </div>
          <div class="form-control flex gap-3 md:col-span-2">
            <label class="label cursor-pointer justify-start gap-3">
              <input v-model="editing.active" type="checkbox" class="checkbox" />
              <span class="label-text">{{ t('admin.basketsPage.fieldActive') }}</span>
            </label>
          </div>
        </div>

        <div class="divider">{{ t('admin.basketsPage.compositionTitle') }}</div>

        <div class="space-y-3">
          <div
            v-for="(item, index) in editing.items"
            :key="index"
            class="flex flex-col gap-2 rounded-xl border border-base-300 p-3 md:flex-row md:items-center"
          >
            <select v-model.number="item.productId" class="select select-bordered flex-1">
              <option :value="0" disabled>{{ t('admin.basketsPage.selectVegetable') }}</option>
              <option v-for="product in products" :key="product.id" :value="product.id">
                {{ product.name }} - {{ $formatPrice(product.price) }} - {{ product.stock }}
              </option>
            </select>
            <input v-model.number="item.quantity" type="number" min="0" step="0.1" class="input input-bordered w-full md:w-32" />
            <button class="btn btn-ghost btn-sm text-error md:self-center" @click="removeItem(index)">
              <Icon name="mdi:close" size="16" />
            </button>
          </div>
          <button class="btn btn-sm btn-outline" @click="addItem">
            <Icon name="mdi:plus" size="16" /> {{ t('admin.basketsPage.addVegetable') }}
          </button>
        </div>

        <div class="modal-action">
          <button class="btn" @click="close">{{ t('admin.common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="saving || lotPaymentConflict || (!editing.allowOfflinePayment && !editing.allowOnlinePayment)" @click="save">
            <span v-if="saving" class="loading loading-spinner loading-sm" />
            {{ t('admin.common.save') }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS } from '#modula/shared/adminRoutes'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.shopBaskets
  }
})

interface Product {
  id: number
  name: string
  price: number
  vatRate: number
  paymentTaxCode: string | null
  paymentTaxBehavior: 'inclusive' | 'exclusive' | null
  stock: number
  rentalAvailableFrom: string | null
  rentalAvailableTo: string | null
  rentalMinDays: number
  rentalMaxDays: number | null
  allowOfflinePayment: boolean
  allowOnlinePayment: boolean
}

interface ProductLotItem {
  id?: number
  productId: number
  quantity: number
  product?: Product | null
}

interface ProductLot {
  id: number
  name: string
  slug: string
  saleType: 'SALE' | 'RENTAL'
  categoryId: number | null
  category?: { id: number, name: string, slug: string } | null
  description: string | null
  imageUrl: string | null
  kind: 'SINGLE' | 'LOT'
  price: number
  vatRate: number
  paymentTaxCode: string | null
  paymentTaxBehavior: 'inclusive' | 'exclusive' | null
  stock: number
  allowOfflinePayment: boolean
  allowOnlinePayment: boolean
  active: boolean
  position: number
  items: ProductLotItem[]
}

interface ProductCategory {
  id: number
  name: string
  slug: string
}

const { data: productLots, pending, refresh } = await useFetch<ProductLot[]>('/api/admin/product-lots')
const { data: products } = await useFetch<Product[]>('/api/admin/products')
const { data: categories } = await useFetch<ProductCategory[]>('/api/admin/product-categories')
const { data: settingsData } = await useFetch<{ shopDefaultVatRate: number }>('/api/admin/settings')

const dlg = ref<HTMLDialogElement>()
const saving = ref(false)
const { t } = useI18n()
const { $toast, $formatPrice } = useNuxtApp() as any
const defaultVatRate = computed(() => Number(settingsData.value?.shopDefaultVatRate ?? 20))
const formatVatRate = (value: number) => `${Number(value || 0).toFixed(2)}%`
const editing = reactive<{
  id?: number
  name: string
  slug: string
  saleType: 'SALE' | 'RENTAL'
  categoryId: number
  description: string
  imageUrl: string
  kind: 'SINGLE' | 'LOT'
  price: number
  vatRate: number
  paymentTaxCode: string
  paymentTaxBehavior: '' | 'inclusive' | 'exclusive'
  rentalAvailableFrom: string
  rentalAvailableTo: string
  rentalMinDays: number
  rentalMaxDays: number | null
  allowOfflinePayment: boolean
  allowOnlinePayment: boolean
  active: boolean
  position: number
  items: Array<{ productId: number, quantity: number }>
}>({
  id: undefined,
  name: '',
  slug: '',
  saleType: 'SALE',
  categoryId: 0,
  description: '',
  imageUrl: '',
  kind: 'LOT',
  price: 0,
  vatRate: defaultVatRate.value,
  paymentTaxCode: '',
  paymentTaxBehavior: '',
  rentalAvailableFrom: '',
  rentalAvailableTo: '',
  rentalMinDays: 1,
  rentalMaxDays: null,
  allowOfflinePayment: true,
  allowOnlinePayment: false,
  active: true,
  position: 0,
  items: []
})

const resetEditing = () => {
  Object.assign(editing, {
    id: undefined,
    name: '',
    slug: '',
    saleType: 'SALE',
    categoryId: 0,
    description: '',
    imageUrl: '',
    kind: 'LOT',
    price: 0,
    vatRate: defaultVatRate.value,
    paymentTaxCode: '',
    paymentTaxBehavior: '',
    rentalAvailableFrom: '',
    rentalAvailableTo: '',
    rentalMinDays: 1,
    rentalMaxDays: null,
    allowOfflinePayment: true,
    allowOnlinePayment: false,
    active: true,
    position: 0,
    items: []
  })
}

const computedStockPreview = computed(() => {
  const candidates = editing.items
    .filter((item) => item.productId > 0 && item.quantity > 0)
    .map((item) => {
      const product = products.value?.find((entry) => entry.id === item.productId)
      if (!product) return 0
      return Math.floor(product.stock / item.quantity)
    })

  if (!candidates.length) return 0
  return Math.max(0, Math.min(...candidates))
})

const lotPaymentCapabilities = computed(() => {
  const selectedProducts = editing.items
    .filter((item) => item.productId > 0 && item.quantity > 0)
    .map((item) => products.value?.find((entry) => entry.id === item.productId))
    .filter((entry): entry is Product => Boolean(entry))

  if (!selectedProducts.length) {
    return {
      allowOfflinePayment: true,
      allowOnlinePayment: true
    }
  }

  return {
    allowOfflinePayment: selectedProducts.every((product) => product.allowOfflinePayment),
    allowOnlinePayment: selectedProducts.every((product) => product.allowOnlinePayment)
  }
})

const lotPaymentConflict = computed(() =>
  !lotPaymentCapabilities.value.allowOfflinePayment && !lotPaymentCapabilities.value.allowOnlinePayment
)

const lotPaymentRuleMessage = computed(() => {
  if (lotPaymentConflict.value) return t('admin.basketsPage.paymentRuleConflict')
  if (!lotPaymentCapabilities.value.allowOfflinePayment && lotPaymentCapabilities.value.allowOnlinePayment) {
    return t('admin.basketsPage.paymentRuleOnlineOnly')
  }
  if (lotPaymentCapabilities.value.allowOfflinePayment && !lotPaymentCapabilities.value.allowOnlinePayment) {
    return t('admin.basketsPage.paymentRuleOfflineOnly')
  }
  return t('admin.basketsPage.paymentRuleFlexible')
})

watch(lotPaymentCapabilities, (value) => {
  if (!value.allowOfflinePayment) {
    editing.allowOfflinePayment = false
  }
  if (!value.allowOnlinePayment) {
    editing.allowOnlinePayment = false
  }
  if (!value.allowOfflinePayment && value.allowOnlinePayment) {
    editing.allowOnlinePayment = true
  }
  if (value.allowOfflinePayment && !value.allowOnlinePayment) {
    editing.allowOfflinePayment = true
  }
}, { deep: true, immediate: true })

const openNew = () => {
  resetEditing()
  dlg.value?.showModal()
}

const openEdit = (lot: ProductLot) => {
  Object.assign(editing, {
    id: lot.id,
    name: lot.name,
    slug: lot.slug,
    saleType: lot.saleType,
    categoryId: lot.categoryId || 0,
    description: lot.description || '',
    imageUrl: lot.imageUrl || '',
    kind: lot.kind,
    price: lot.price,
    vatRate: lot.vatRate,
    paymentTaxCode: lot.paymentTaxCode || '',
    paymentTaxBehavior: lot.paymentTaxBehavior || '',
    rentalAvailableFrom: toDateInputValue(lot.rentalAvailableFrom),
    rentalAvailableTo: toDateInputValue(lot.rentalAvailableTo),
    rentalMinDays: lot.rentalMinDays || 1,
    rentalMaxDays: lot.rentalMaxDays ?? null,
    allowOfflinePayment: lot.allowOfflinePayment,
    allowOnlinePayment: lot.allowOnlinePayment,
    active: lot.active,
    position: lot.position,
    items: lot.items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
  })
  dlg.value?.showModal()
}

const close = () => dlg.value?.close()
const addItem = () => editing.items.push({ productId: 0, quantity: 1 })
const removeItem = (index: number) => editing.items.splice(index, 1)

const save = async () => {
  if (lotPaymentConflict.value) {
    $toast.error(t('admin.basketsPage.paymentRuleConflict'))
    return
  }
  if (!editing.allowOfflinePayment && !editing.allowOnlinePayment) {
    $toast.error(t('admin.basketsPage.paymentRuleMissing'))
    return
  }
  saving.value = true
  try {
    const payload = {
      name: editing.name,
      slug: editing.slug,
      saleType: editing.saleType,
      categoryId: editing.categoryId || null,
      description: editing.description,
      imageUrl: editing.imageUrl,
      kind: editing.kind,
      price: editing.price,
      vatRate: editing.vatRate,
      paymentTaxCode: editing.paymentTaxCode.trim() || null,
      paymentTaxBehavior: editing.paymentTaxBehavior || null,
      rentalAvailableFrom: editing.saleType === 'RENTAL' ? normalizeDateValue(editing.rentalAvailableFrom) : null,
      rentalAvailableTo: editing.saleType === 'RENTAL' ? normalizeDateValue(editing.rentalAvailableTo) : null,
      rentalMinDays: editing.saleType === 'RENTAL' ? Number(editing.rentalMinDays || 1) : 1,
      rentalMaxDays: editing.saleType === 'RENTAL' ? normalizeNullableNumber(editing.rentalMaxDays) : null,
      allowOfflinePayment: editing.allowOfflinePayment,
      allowOnlinePayment: editing.allowOnlinePayment,
      active: editing.active,
      position: editing.position,
      items: editing.items.filter((item) => item.productId > 0 && item.quantity > 0)
    }
    if (editing.id) {
      await $fetch(`/api/admin/product-lots/${editing.id}`, { method: 'PUT', body: payload })
    } else {
      await $fetch('/api/admin/product-lots', { method: 'POST', body: payload })
    }
    $toast.success(t('admin.basketsPage.saved'))
    close()
    await refresh()
  } catch (error: any) {
    $toast.error(error?.statusMessage || t('common.error'))
  } finally {
    saving.value = false
  }
}

const remove = async (lot: ProductLot) => {
  if (!confirm(t('admin.basketsPage.deleteConfirm', { name: lot.name }))) return
  try {
    await $fetch(`/api/admin/product-lots/${lot.id}`, { method: 'DELETE' })
    await refresh()
  } catch (error: any) {
    $toast.error(error?.statusMessage || t('common.error'))
  }
}

function toDateInputValue(value: string | null | undefined) {
  return value ? String(value).slice(0, 10) : ''
}

function normalizeDateValue(value: string | null | undefined) {
  return value?.trim() ? value.trim() : null
}

function normalizeNullableNumber(value: number | null | undefined) {
  if (value === '' as any) return null
  if (value == null || Number.isNaN(Number(value))) return null
  return Number(value)
}
</script>
