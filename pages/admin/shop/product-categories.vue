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
      <div class="modal-box max-h-[90vh] max-w-3xl overflow-y-auto">
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
          <div class="form-control gap-3 md:col-span-2 flex flex-col">
            <label class="label"><span class="label-text">{{ t('admin.productCategoriesPage.fieldDescription') }}</span></label>
            <textarea v-model="editing.description" class="textarea textarea-bordered min-h-24" />
          </div>
          <AdminSortPositionControl
            v-model="editingPosition"
            class="md:col-span-2"
            :label="t('admin.productCategoriesPage.fieldPosition')"
            :help="t('admin.productCategoriesPage.fieldPositionHelp')"
          />
          <div class="form-control gap-3 flex flex-col">
            <label class="label cursor-pointer justify-start gap-3">
              <input v-model="editing.active" type="checkbox" class="checkbox" />
              <span class="label-text">{{ t('admin.productCategoriesPage.fieldActive') }}</span>
            </label>
          </div>
        </div>
        <details class="mt-5 rounded-box border border-base-300 bg-base-200/40">
          <summary class="cursor-pointer p-4 font-semibold">{{ t('admin.productCategoriesPage.fieldsTitle') }} ({{ editing.fields?.length || 0 }})</summary>
          <div class="space-y-4 border-t border-base-300 p-4">
            <p class="text-sm opacity-70">{{ t('admin.productCategoriesPage.fieldsHelp') }}</p>
            <div v-for="(field, index) in editing.fields || []" :key="index" class="rounded-box border border-base-300 bg-base-100 p-4">
              <div class="mb-3 flex items-center justify-between gap-3">
                <strong>{{ field.label || t('admin.productCategoriesPage.newField') }}</strong>
                <button type="button" class="btn btn-square btn-sm btn-ghost text-error" @click="editing.fields?.splice(index, 1)">
                  <Icon name="mdi:delete-outline" size="18" />
                </button>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="form-control flex flex-col gap-2 sm:col-span-2">
                  <AdminPageBuilderTranslationTabs v-model="field.labelLocalized" :label="t('admin.productCategoriesPage.fieldLabel')" />
                </div>
                <div class="form-control flex flex-col gap-2">
                  <label class="label-text">{{ t('admin.productCategoriesPage.fieldKey') }}</label>
                  <input v-model="field.key" class="input input-bordered" :disabled="Boolean(editing.id && originalFieldKeys.includes(field.key))" placeholder="capacity" />
                </div>
                <div class="form-control flex flex-col gap-2">
                  <label class="label-text">{{ t('admin.productCategoriesPage.fieldType') }}</label>
                  <select v-model="field.type" class="select select-bordered">
                    <option value="TEXT">{{ t('admin.productCategoriesPage.fieldTypeText') }}</option>
                    <option value="NUMBER">{{ t('admin.productCategoriesPage.fieldTypeNumber') }}</option>
                  </select>
                </div>
                <div v-if="field.type === 'NUMBER'" class="form-control flex flex-col gap-2 sm:col-span-2">
                  <label class="label-text">{{ t('admin.productCategoriesPage.fieldPurpose') }}</label>
                  <select v-model="field.purpose" class="select select-bordered">
                    <option value="NONE">{{ t('admin.productCategoriesPage.fieldPurposeNone') }}</option>
                    <option value="RENTAL_PARTY_CAPACITY">{{ t('admin.productCategoriesPage.fieldPurposeCapacity') }}</option>
                  </select>
                </div>
                <label class="flex items-center gap-2 sm:col-span-2">
                  <input v-model="field.required" type="checkbox" class="checkbox checkbox-sm" />
                  {{ t('admin.productCategoriesPage.fieldRequired') }}
                </label>
              </div>
            </div>
            <button type="button" class="btn btn-sm btn-outline" @click="addField">
              <Icon name="mdi:plus" size="17" /> {{ t('admin.productCategoriesPage.addField') }}
            </button>
          </div>
        </details>
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
import type { ProductCategoryPayload } from '#modula/server/utils/shop'
import type { ProductCategoryFieldDefinition } from '#modula/shared/productCategoryFields'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'})

const { t } = useI18n()
const { $toast } = useNuxtApp() as any
const { data: categories, pending, refresh } = await useFetch<ProductCategoryPayload[]>('/api/admin/product-categories')

const dlg = ref<HTMLDialogElement>()
const saving = ref(false)
const originalFieldKeys = ref<string[]>([])
const editing = reactive<Partial<ProductCategoryPayload>>({
  id: undefined,
  name: '',
  slug: '',
  description: '',
  position: 0,
  active: true,
  fields: [],
})
const editingPosition = computed({
  get: () => Number(editing.position || 0),
  set: (value: number) => { editing.position = value }
})

const openNew = () => {
  Object.assign(editing, { id: undefined, name: '', slug: '', description: '', position: 0, active: true, fields: [] })
  originalFieldKeys.value = []
  dlg.value?.showModal()
}

const openEdit = (category: ProductCategoryPayload) => {
  Object.assign(editing, { ...category, fields: structuredClone(category.fields || []) })
  originalFieldKeys.value = (category.fields || []).map((field) => field.key)
  dlg.value?.showModal()
}

const close = () => dlg.value?.close()

const addField = () => {
  const fields = editing.fields || (editing.fields = [])
  fields.push({ key: '', label: '', labelLocalized: { fr: '', en: '' }, type: 'TEXT', required: false, purpose: 'NONE' } satisfies ProductCategoryFieldDefinition)
}

const save = async () => {
  const fields = editing.fields || []
  const keys = fields.map((field) => field.key.trim().toLowerCase())
  if (keys.some((key) => !/^[a-z][a-z0-9_-]*$/.test(key)) || new Set(keys).size !== keys.length || fields.some((field) => !Object.values(field.labelLocalized || {}).some((value) => value.trim()))) {
    $toast.error(t('admin.productCategoriesPage.fieldsInvalid'))
    return
  }
  if (fields.filter((field) => field.type === 'NUMBER' && field.purpose === 'RENTAL_PARTY_CAPACITY').length > 1) {
    $toast.error(t('admin.productCategoriesPage.capacityUnique'))
    return
  }
  saving.value = true
  try {
    const payload = {
      name: editing.name,
      slug: editing.slug,
      description: editing.description,
      position: editing.position,
      active: editing.active,
      fields,
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
