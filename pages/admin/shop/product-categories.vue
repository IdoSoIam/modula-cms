<template>
  <div class="card bg-base-100 p-6">
    <div class="mb-6 flex items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.productCategoriesPage.title') }}</h1>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.productCategoriesPage.description') }}</p>
      </div>
      <button class="btn btn-primary" @click="openNew">
        <Icon name="mdi:plus" size="20" /> {{ t('admin.productCategoriesPage.new') }}
      </button>
    </div>

    <div v-if="pending" class="loading loading-spinner" />

    <div v-else class="overflow-x-auto rounded-box">
      <table class="table">
        <thead>
          <tr>
            <th>{{ t('admin.productCategoriesPage.headers.name') }}</th>
            <th>{{ t('admin.productCategoriesPage.headers.slug') }}</th>
            <th>{{ t('admin.productCategoriesPage.headers.status') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="category in categories" :key="category.id">
            <td class="font-medium">{{ category.name }}</td>
            <td><code>{{ category.slug }}</code></td>
            <td>
              <span class="badge" :class="category.active ? 'badge-success' : 'badge-ghost'">
                {{ category.active ? t('admin.productCategoriesPage.active') : t('admin.productCategoriesPage.inactive') }}
              </span>
            </td>
            <td class="text-right">
              <button class="btn btn-ghost btn-sm" @click="openEdit(category)">
                <Icon name="mdi:pencil" size="16" />
              </button>
              <button class="btn btn-ghost btn-sm text-error" @click="remove(category)">
                <Icon name="mdi:delete" size="16" />
              </button>
            </td>
          </tr>
          <tr v-if="!categories?.length">
            <td colspan="4" class="py-8 text-center opacity-60">{{ t('admin.productCategoriesPage.empty') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <dialog ref="dlg" class="modal">
      <div class="modal-box max-w-2xl">
        <h3 class="mb-4 text-lg font-bold">
          {{ editing.id ? t('admin.productCategoriesPage.editTitle') : t('admin.productCategoriesPage.createTitle') }}
        </h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="form-control gap-3">
            <label class="label"><span class="label-text">{{ t('admin.productCategoriesPage.fieldName') }}</span></label>
            <input v-model="editing.name" class="input input-bordered" />
          </div>
          <div class="form-control gap-3">
            <label class="label"><span class="label-text">{{ t('admin.productCategoriesPage.fieldSlug') }}</span></label>
            <input v-model="editing.slug" class="input input-bordered" />
          </div>
          <div class="form-control gap-3 md:col-span-2">
            <label class="label"><span class="label-text">{{ t('admin.productCategoriesPage.fieldDescription') }}</span></label>
            <textarea v-model="editing.description" class="textarea textarea-bordered min-h-24" />
          </div>
          <div class="form-control gap-3">
            <label class="label"><span class="label-text">{{ t('admin.productCategoriesPage.fieldPosition') }}</span></label>
            <input v-model.number="editing.position" type="number" min="0" step="1" class="input input-bordered" />
          </div>
          <div class="form-control gap-3">
            <label class="label cursor-pointer justify-start gap-3">
              <input v-model="editing.active" type="checkbox" class="checkbox" />
              <span class="label-text">{{ t('admin.productCategoriesPage.fieldActive') }}</span>
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
import type { ProductCategoryPayload } from '#modula/server/utils/shop'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.shopProductCategories
  }
})

const { t } = useI18n()
const { $toast } = useNuxtApp() as any
const { data: categories, pending, refresh } = await useFetch<ProductCategoryPayload[]>('/api/admin/product-categories')

const dlg = ref<HTMLDialogElement>()
const saving = ref(false)
const editing = reactive<Partial<ProductCategoryPayload>>({
  id: undefined,
  name: '',
  slug: '',
  description: '',
  position: 0,
  active: true
})

const openNew = () => {
  Object.assign(editing, { id: undefined, name: '', slug: '', description: '', position: 0, active: true })
  dlg.value?.showModal()
}

const openEdit = (category: ProductCategoryPayload) => {
  Object.assign(editing, category)
  dlg.value?.showModal()
}

const close = () => dlg.value?.close()

const save = async () => {
  saving.value = true
  try {
    const payload = {
      name: editing.name,
      slug: editing.slug,
      description: editing.description,
      position: editing.position,
      active: editing.active
    }
    if (editing.id) {
      await $fetch(`/api/admin/product-categories/${editing.id}`, { method: 'PUT', body: payload })
    } else {
      await $fetch('/api/admin/product-categories', { method: 'POST', body: payload })
    }
    close()
    await refresh()
    $toast.success(t('admin.productCategoriesPage.saved'))
  } catch (error: any) {
    $toast.error(error?.statusMessage || t('common.error'))
  } finally {
    saving.value = false
  }
}

const remove = async (category: ProductCategoryPayload) => {
  if (!confirm(t('admin.productCategoriesPage.deleteConfirm', { name: category.name }))) return
  try {
    await $fetch(`/api/admin/product-categories/${category.id}`, { method: 'DELETE' })
    await refresh()
  } catch (error: any) {
    $toast.error(error?.statusMessage || t('common.error'))
  }
}
</script>
