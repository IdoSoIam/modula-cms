<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-3xl font-bold">
          {{ t('admin.productOptions.pageTitle') }}
        </h1>
        <p class="mt-1 max-w-3xl text-sm opacity-70">
          {{ t('admin.productOptions.pageDescription') }}
        </p>
      </div>
      <button class="btn btn-primary" @click="createSet">
        <Icon name="mdi:plus" size="18" />
        {{ t('admin.productOptions.createSet') }}
      </button>
    </div>

    <div class="grid gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <aside class="card bg-base-100 p-4 shadow-sm">
        <div v-if="pending" class="grid place-items-center py-12">
          <span class="loading loading-spinner" />
        </div>
        <div v-else class="space-y-2">
          <button
            v-for="set in optionSets || []"
            :key="set.id"
            type="button"
            class="modula-nav-item flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
            :class="editing.id === set.id ? 'bg-primary text-primary-content' : 'hover:bg-base-200'"
            @click="selectSet(set)"
          >
            <span class="min-w-0">
              <span class="block truncate font-medium">{{ set.name }}</span>
              <span class="block text-xs opacity-65">{{
                t('admin.productOptions.groupCount', {
                  count: set.optionGroups.length,
                })
              }}</span>
            </span>
            <span class="badge badge-sm" :class="set.active ? 'badge-success' : 'badge-ghost'" />
          </button>
          <div v-if="!optionSets?.length" class="py-10 text-center text-sm opacity-60">
            {{ t('admin.productOptions.noSets') }}
          </div>
        </div>
      </aside>

      <main class="space-y-6">
        <section class="card bg-base-100 p-5 shadow-sm sm:p-6">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0 flex-1">
              <label class="form-control gap-2">
                <span class="label-text">{{ t('admin.productOptions.setName') }}</span>
                <input v-model="editing.name" class="input input-bordered w-full" />
              </label>
            </div>
            <label class="label cursor-pointer justify-start gap-3 lg:mt-7">
              <input v-model="editing.active" type="checkbox" class="toggle toggle-primary" />
              <span class="label-text">{{ t('admin.productOptions.active') }}</span>
            </label>
          </div>

          <div class="mt-6 grid gap-6 lg:grid-cols-2">
            <fieldset class="rounded-box border border-base-300 p-4">
              <legend class="px-2 font-medium">
                {{ t('admin.productOptions.saleTypes') }}
              </legend>
              <div class="flex flex-wrap gap-4">
                <label class="label cursor-pointer justify-start gap-3">
                  <input v-model="editing.saleTypes" type="checkbox" value="SALE" class="checkbox" />
                  <span>{{ t('admin.productsPage.saleTypeSale') }}</span>
                </label>
                <label class="label cursor-pointer justify-start gap-3">
                  <input v-model="editing.saleTypes" type="checkbox" value="RENTAL" class="checkbox" />
                  <span>{{ t('admin.productsPage.saleTypeRental') }}</span>
                </label>
              </div>
            </fieldset>

            <AdminSortPositionControl v-model="editing.position" :label="t('admin.productOptions.priority')" :help="t('admin.productOptions.priorityHelp')" />
          </div>

          <div class="mt-6 grid gap-6 lg:grid-cols-2">
            <fieldset class="rounded-box border border-base-300 p-4">
              <legend class="px-2 font-medium">
                {{ t('admin.productOptions.categories') }}
              </legend>
              <p class="mb-3 text-xs opacity-65">
                {{ t('admin.productOptions.targetsHelp') }}
              </p>
              <div class="max-h-56 space-y-1 overflow-auto gap-4 flex flex-wrap">
                <label v-for="category in categories || []" :key="category.id" class="label cursor-pointer justify-start gap-3">
                  <input v-model="editing.categoryIds" type="checkbox" :value="category.id" class="checkbox checkbox-sm" />
                  <span>{{ category.name }}</span>
                </label>
              </div>
            </fieldset>

            <fieldset class="rounded-box border border-base-300 p-4">
              <legend class="px-2 font-medium">
                {{ t('admin.productOptions.specificProducts') }}
              </legend>
              <p class="mb-3 text-xs opacity-65">
                {{ t('admin.productOptions.targetsHelp') }}
              </p>
              <div class="max-h-56 space-y-1 overflow-auto gap-4 flex flex-wrap">
                <label v-for="product in products || []" :key="product.id" class="label cursor-pointer justify-start gap-3">
                  <input v-model="editing.productIds" type="checkbox" :value="product.id" class="checkbox checkbox-sm" />
                  <span>{{ product.name }}</span>
                </label>
              </div>
            </fieldset>
          </div>
        </section>

        <section class="card bg-base-100 p-5 shadow-sm sm:p-6">
          <AdminShopProductOptionGroupsEditor
            v-model="editing.optionGroups"
            :locales="editorLocales"
            :products="products || []"
            :billing-documents="billingDocuments || []"
            :excluded-category-ids="excludedAccessoryCategoryIds"
          />
        </section>

        <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          <button v-if="editing.id" class="btn btn-outline btn-error" :disabled="saving" @click="removeSet">
            <Icon name="mdi:delete-outline" size="18" />
            {{ t('admin.common.delete') }}
          </button>
          <div class="flex gap-3 sm:ml-auto">
            <button class="btn btn-ghost" :disabled="saving" @click="resetEditing">
              {{ t('admin.common.cancel') }}
            </button>
            <button class="btn btn-primary" :disabled="saving || !editing.name.trim() || !editing.saleTypes.length" @click="save">
              <span v-if="saving" class="loading loading-spinner loading-sm" />
              <Icon v-else name="mdi:content-save-outline" size="18" />
              {{ t('admin.common.save') }}
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { createEmptyCmsLocalizedText } from '#modula/shared/cms'
import type { ProductOptionGroup } from '#modula/shared/productOptions'
import type { ProductOptionSetPayload, ProductPayload } from '#modula/server/utils/shop'

definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Category {
  id: number
  name: string
}
interface BillingDocument {
  id: number
  name: string
  kind: 'INVOICE' | 'CONTRACT' | 'ASSURANCE'
}
interface EditorState {
  id?: number
  name: string
  categoryIds: number[]
  productIds: number[]
  saleTypes: Array<'SALE' | 'RENTAL'>
  optionGroups: ProductOptionGroup[]
  active: boolean
  position: number
}

const { t } = useI18n()
const { locales } = useSiteLocales()
const { $toast } = useNuxtApp() as any
const editorLocales = computed(() => (locales.value.length ? [...locales.value] : ['fr', 'en']))
const { data: optionSets, pending, refresh } = await useFetch<ProductOptionSetPayload[]>('/api/admin/product-option-sets')
const { data: categories } = await useFetch<Category[]>('/api/admin/product-categories')
const { data: products } = await useFetch<ProductPayload[]>('/api/admin/products')
const { data: billingDocuments } = await useFetch<BillingDocument[]>('/api/admin/billing-documents')
const editing = reactive<EditorState>(emptyState())
const saving = ref(false)
const excludedAccessoryCategoryIds = computed(() =>
  Array.from(
    new Set([
      ...editing.categoryIds,
      ...editing.productIds.map((productId) => products.value?.find((product) => product.id === productId)?.categoryId || 0).filter(Boolean),
    ]),
  ),
)

function emptyState(): EditorState {
  return {
    name: '',
    categoryIds: [],
    productIds: [],
    saleTypes: ['SALE', 'RENTAL'],
    optionGroups: [],
    active: true,
    position: 0,
  }
}

function createSet() {
  delete editing.id
  Object.assign(editing, emptyState())
}

function selectSet(set: ProductOptionSetPayload) {
  Object.assign(editing, {
    id: set.id,
    name: set.name,
    categoryIds: [...set.categoryIds],
    productIds: [...set.productIds],
    saleTypes: [...set.saleTypes],
    optionGroups: structuredClone(set.optionGroups),
    active: set.active,
    position: set.position,
  })
}

function resetEditing() {
  const current = optionSets.value?.find((set) => set.id === editing.id)
  if (current) selectSet(current)
  else createSet()
}

async function save() {
  saving.value = true
  try {
    const path = editing.id ? `/api/admin/product-option-sets/${editing.id}` : '/api/admin/product-option-sets'
    const result = await $fetch<ProductOptionSetPayload>(path, {
      method: editing.id ? 'PUT' : 'POST',
      body: {
        name: editing.name,
        categoryIds: editing.categoryIds,
        productIds: editing.productIds,
        saleTypes: editing.saleTypes,
        optionGroups: editing.optionGroups,
        active: editing.active,
        position: editing.position,
      },
    })
    await refresh()
    selectSet(result)
    $toast.success(t('admin.productOptions.saved'))
  } catch (error: any) {
    $toast.error(error?.data?.message || error?.message || t('common.error'))
  } finally {
    saving.value = false
  }
}

async function removeSet() {
  if (!editing.id || !confirm(t('admin.productOptions.deleteConfirm', { name: editing.name }))) return
  saving.value = true
  try {
    await $fetch(`/api/admin/product-option-sets/${editing.id}`, {
      method: 'DELETE',
    })
    await refresh()
    createSet()
    $toast.success(t('admin.productOptions.deleted'))
  } finally {
    saving.value = false
  }
}
</script>
