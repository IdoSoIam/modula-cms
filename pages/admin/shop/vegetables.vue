<template>
  <div class="card bg-base-100 p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">{{ t('admin.vegetablesPage.title') }}</h1>
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
            <th>{{ t('admin.vegetablesPage.headers.unit') }}</th>
            <th class="text-right">{{ t('admin.vegetablesPage.headers.price') }}</th>
            <th>{{ t('admin.vegetablesPage.headers.status') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in vegetables" :key="v.id">
            <td>
              <AppImage v-if="v.imageUrl" :src="v.imageUrl" :alt="v.name" class="w-12 h-12 object-cover rounded" sizes="48px" />
              <div v-else class="w-12 h-12 bg-base-300 rounded flex items-center justify-center">
                <Icon name="mdi:image-off-outline" size="18" class="opacity-40" />
              </div>
            </td>
            <td class="font-medium">{{ v.name }}</td>
            <td>{{ v.unit === 'KG' ? '€/kg' : '€/piece' }}</td>
            <td class="text-right">{{ $formatPrice(v.price) }}</td>
            <td>
              <span class="badge" :class="v.active ? 'badge-success' : 'badge-ghost'">
                {{ v.active ? t('admin.vegetablesPage.active') : t('admin.vegetablesPage.inactive') }}
              </span>
            </td>
            <td class="text-right">
              <button class="btn btn-ghost btn-sm" @click="openEdit(v)">
                <Icon name="mdi:pencil" size="16" />
              </button>
              <button class="btn btn-ghost btn-sm text-error" @click="remove(v)">
                <Icon name="mdi:delete" size="16" />
              </button>
            </td>
          </tr>
          <tr v-if="!vegetables?.length">
            <td colspan="6" class="text-center opacity-60 py-8">
              {{ t('admin.vegetablesPage.empty') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Dialog -->
    <dialog ref="dlg" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">
          {{ editing.id ? t('admin.vegetablesPage.editTitle') : t('admin.vegetablesPage.createTitle') }}
        </h3>
        <div class="space-y-3">
          <div class="form-control gap-3 flex">
            <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldName') }}</span></label>
            <input v-model="editing.name" class="input input-bordered" />
          </div>
          <div class="form-control gap-3 flex">
            <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldUnit') }}</span></label>
            <select v-model="editing.unit" class="select select-bordered">
              <option value="KG">{{ t('admin.vegetablesPage.unitKg') }}</option>
              <option value="PIECE">{{ t('admin.vegetablesPage.unitPiece') }}</option>
            </select>
          </div>
          <div class="form-control gap-3 flex">
            <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldPrice') }}</span></label>
            <input v-model.number="editing.price" type="number" step="0.01" min="0" class="input input-bordered" />
          </div>
          <div class="form-control gap-3 flex">
            <label class="label"><span class="label-text">{{ t('admin.vegetablesPage.fieldImage') }}</span></label>
            <ImageInput v-model="editing.imageUrl" />
          </div>
          <div class="form-control gap-3 flex">
            <label class="label cursor-pointer">
              <span class="label-text">{{ t('admin.vegetablesPage.fieldActive') }}</span>
              <input v-model="editing.active" type="checkbox" class="checkbox" />
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
import { ADMIN_I18N_PATHS } from '~/shared/adminRoutes'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.shopVegetables
  }
})

interface Vegetable {
  id: number; name: string; unit: 'KG' | 'PIECE'; price: number; active: boolean; imageUrl?: string | null
}

const { data: vegetables, pending, refresh } = await useFetch<Vegetable[]>('/api/admin/vegetables')

const dlg = ref<HTMLDialogElement>()
const saving = ref(false)
const { t } = useI18n()
const editing = reactive<Partial<Vegetable>>({
  id: undefined, name: '', unit: 'KG', price: 0, active: true, imageUrl: ''
})
const { $toast, $formatPrice } = useNuxtApp() as any

const openNew = () => {
  Object.assign(editing, { id: undefined, name: '', unit: 'KG', price: 0, active: true, imageUrl: '' })
  dlg.value?.showModal()
}
const openEdit = (v: Vegetable) => {
  Object.assign(editing, v)
  dlg.value?.showModal()
}
const close = () => dlg.value?.close()

const save = async () => {
  saving.value = true
  try {
    if (editing.id) {
      await $fetch(`/api/admin/vegetables/${editing.id}`, { method: 'PUT', body: editing })
    } else {
      await $fetch('/api/admin/vegetables', { method: 'POST', body: editing })
    }
    $toast.success(t('admin.vegetablesPage.saved'))
    close()
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || t('common.error'))
  } finally {
    saving.value = false
  }
}

const remove = async (v: Vegetable) => {
  if (!confirm(t('admin.vegetablesPage.deleteConfirm', { name: v.name }))) return
  try {
    await $fetch(`/api/admin/vegetables/${v.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || t('common.error'))
  }
}
</script>
