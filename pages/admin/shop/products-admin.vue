<template>
  <div class="card bg-base-100 p-6">
    <div class="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.vegetablesPage.title') }}</h1>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.vegetablesPage.description') }}</p>
      </div>
      <button class="btn btn-primary" @click="openNew">
        <Icon name="mdi:plus" size="20" /> {{ t('admin.vegetablesPage.new') }}
      </button>
    </div>

    <div v-if="pending" class="loading loading-spinner" />

    <div v-else class="overflow-x-auto rounded-box">
      <table class="table">
        <thead>
          <tr>
            <th class="w-16"></th>
            <th>{{ t('admin.vegetablesPage.headers.name') }}</th>
            <th>{{ t('admin.vegetablesPage.headers.slug') }}</th>
            <th>{{ t('admin.vegetablesPage.headers.category') }}</th>
            <th class="text-right">{{ t('admin.vegetablesPage.headers.price') }}</th>
            <th class="text-right">{{ t('admin.vegetablesPage.fieldAvailable') }}</th>
            <th>{{ t('admin.vegetablesPage.headers.saleType') }}</th>
            <th>{{ t('admin.vegetablesPage.headers.unit') }}</th>
            <th>{{ t('admin.vegetablesPage.headers.status') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td>
              <AppImage v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" class="h-12 w-12 rounded object-cover" sizes="48px" />
              <div v-else class="flex h-12 w-12 items-center justify-center rounded bg-base-300">
                <Icon name="mdi:image-off-outline" size="18" class="opacity-40" />
              </div>
            </td>
            <td class="font-medium">{{ product.name }}</td>
            <td><code>{{ product.slug }}</code></td>
            <td>{{ product.category?.name || '-' }}</td>
            <td class="text-right">{{ $formatPrice(product.price) }}</td>
            <td class="text-right">{{ product.stock }}</td>
            <td>{{ product.saleType === 'RENTAL' ? t('admin.vegetablesPage.saleTypeRental') : t('admin.vegetablesPage.saleTypeSale') }}</td>
            <td>{{ product.unitLabel || '-' }}</td>
            <td>
              <span class="badge" :class="product.active ? 'badge-success' : 'badge-ghost'">
                {{ product.active ? t('admin.vegetablesPage.active') : t('admin.vegetablesPage.inactive') }}
              </span>
            </td>
            <td class="text-right">
              <button class="btn btn-ghost btn-sm" @click="openEdit(product)">
                <Icon name="mdi:pencil" size="16" />
              </button>
              <button class="btn btn-ghost btn-sm text-error" @click="remove(product)">
                <Icon name="mdi:delete" size="16" />
              </button>
            </td>
          </tr>
          <tr v-if="!products?.length">
            <td colspan="10" class="py-8 text-center opacity-60">
              {{ t('admin.vegetablesPage.empty') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <dialog ref="dlg" class="modal">
      <div class="modal-box max-w-3xl">
        <h3 class="mb-4 text-lg font-bold">
          {{ editing.id ? t('admin.vegetablesPage.editTitle') : t('admin.vegetablesPage.createTitle') }}
        </h3>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldName') }}</span></label>
            <input v-model="editing.name" class="input input-bordered" />
          </div>
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldSlug') }}</span></label>
            <input v-model="editing.slug" class="input input-bordered" />
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
            <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldPrice') }}</span></label>
            <input v-model.number="editing.price" type="number" min="0" step="0.01" class="input input-bordered" />
          </div>
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldAvailable') }}</span></label>
            <input v-model.number="editing.stock" type="number" min="0" step="1" class="input input-bordered" />
          </div>
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldUnit') }}</span></label>
            <input v-model="editing.unitLabel" class="input input-bordered" :placeholder="t('admin.vegetablesPage.unitPlaceholder')" />
          </div>
          <div class="form-control flex flex-col gap-3">
            <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldPosition') }}</span></label>
            <input v-model.number="editing.position" type="number" min="0" step="1" class="input input-bordered" />
          </div>
          <div class="form-control flex flex-col gap-3 md:col-span-2">
            <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldImage') }}</span></label>
            <ImageInput v-model="editing.imageUrl" />
          </div>
          <div class="form-control flex flex-col gap-3 md:col-span-2">
            <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldExcerpt') }}</span></label>
            <textarea v-model="editing.excerpt" class="textarea textarea-bordered min-h-24" />
          </div>
          <div class="form-control flex flex-col gap-3 md:col-span-2">
            <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldDescription') }}</span></label>
            <textarea v-model="editing.description" class="textarea textarea-bordered min-h-32" />
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

        <div class="modal-action">
          <button class="btn" @click="close">{{ t('admin.common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">
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
    paths: ADMIN_I18N_PATHS.shopVegetables
  }
})

interface Product {
  id: number
  name: string
  slug: string
  saleType: 'SALE' | 'RENTAL'
  categoryId: number | null
  category?: { id: number, name: string, slug: string } | null
  excerpt: string | null
  description: string | null
  imageUrl?: string | null
  price: number
  stock: number
  unitLabel?: string | null
  allowOfflinePayment: boolean
  allowOnlinePayment: boolean
  active: boolean
  position: number
}

interface ProductCategory {
  id: number
  name: string
  slug: string
}

const { data: products, pending, refresh } = await useFetch<Product[]>('/api/admin/products')
const { data: categories } = await useFetch<ProductCategory[]>('/api/admin/product-categories')

const dlg = ref<HTMLDialogElement>()
const saving = ref(false)
const { t } = useI18n()
const { $toast, $formatPrice } = useNuxtApp() as any

const editing = reactive<Partial<Product>>({
  id: undefined,
  name: '',
  slug: '',
  saleType: 'SALE',
  categoryId: 0,
  excerpt: '',
  description: '',
  imageUrl: '',
  price: 0,
  stock: 0,
  unitLabel: '',
  allowOfflinePayment: true,
  allowOnlinePayment: false,
  active: true,
  position: 0
})

const resetEditing = () => {
  Object.assign(editing, {
    id: undefined,
    name: '',
    slug: '',
    saleType: 'SALE',
    categoryId: 0,
    excerpt: '',
    description: '',
    imageUrl: '',
    price: 0,
    stock: 0,
    unitLabel: '',
    allowOfflinePayment: true,
    allowOnlinePayment: false,
    active: true,
    position: 0
  })
}

const openNew = () => {
  resetEditing()
  dlg.value?.showModal()
}

const openEdit = (product: Product) => {
  Object.assign(editing, product)
  dlg.value?.showModal()
}

const close = () => dlg.value?.close()

const save = async () => {
  saving.value = true
  try {
    const payload = {
      name: editing.name,
      slug: editing.slug,
      saleType: editing.saleType,
      categoryId: editing.categoryId || null,
      excerpt: editing.excerpt,
      description: editing.description,
      imageUrl: editing.imageUrl,
      price: editing.price,
      stock: editing.stock,
      unitLabel: editing.unitLabel,
      allowOfflinePayment: editing.allowOfflinePayment,
      allowOnlinePayment: editing.allowOnlinePayment,
      active: editing.active,
      position: editing.position
    }
    if (editing.id) {
      await $fetch(`/api/admin/products/${editing.id}`, { method: 'PUT', body: payload })
    } else {
      await $fetch('/api/admin/products', { method: 'POST', body: payload })
    }
    $toast.success(t('admin.vegetablesPage.saved'))
    close()
    await refresh()
  } catch (error: any) {
    $toast.error(error?.statusMessage || t('common.error'))
  } finally {
    saving.value = false
  }
}

const remove = async (product: Product) => {
  if (!confirm(t('admin.vegetablesPage.deleteConfirm', { name: product.name }))) return
  try {
    await $fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' })
    await refresh()
  } catch (error: any) {
    $toast.error(error?.statusMessage || t('common.error'))
  }
}
</script>
