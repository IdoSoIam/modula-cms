<template>
  <div class="card bg-base-100 p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">{{ t('admin.basketsPage.title') }}</h1>
      <button class="btn btn-primary" @click="openNew">
        <Icon name="mdi:plus" size="20" /> {{ t('admin.basketsPage.new') }}
      </button>
    </div>

    <div v-if="pending" class="loading loading-spinner" />

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="b in baskets"
        :key="b.id"
        class="card bg-base-200 shadow"
      >
        <div class="card-body">
          <div class="flex items-start justify-between">
            <div>
              <h2 class="card-title">{{ b.name }}</h2>
              <p class="text-sm opacity-70">{{ b.description }}</p>
            </div>
            <span class="badge" :class="b.active ? 'badge-success' : 'badge-ghost'">
              {{ b.active ? t('admin.basketsPage.active') : t('admin.basketsPage.inactive') }}
            </span>
          </div>

          <div class="text-sm mt-2">
            <div class="flex justify-between">
              <span class="opacity-70">{{ t('admin.basketsPage.composition') }}</span>
              <span>{{ t('admin.basketsPage.vegetablesCount', { count: b.items.length }) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="opacity-70">{{ t('admin.basketsPage.computedPrice') }}</span>
              <span>{{ $formatPrice(b.computedPrice) }}</span>
            </div>
            <div class="flex justify-between font-semibold">
              <span>{{ t('admin.basketsPage.finalPrice') }}</span>
              <span class="text-primary">{{ $formatPrice(b.finalPrice) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="opacity-70">{{ t('admin.basketsPage.available') }}</span>
              <span>{{ b.available }}</span>
            </div>
          </div>

          <div class="card-actions justify-end mt-2">
            <button class="btn btn-ghost btn-sm" @click="openEdit(b)">
              <Icon name="mdi:pencil" size="16" /> {{ t('admin.common.edit') }}
            </button>
            <button class="btn btn-ghost btn-sm text-error" @click="remove(b)">
              <Icon name="mdi:delete" size="16" />
            </button>
          </div>
        </div>
      </div>

      <div v-if="!baskets?.length" class="md:col-span-2 text-center opacity-60 py-8">
        {{ t('admin.basketsPage.empty') }}
      </div>
    </div>

    <!-- Editor -->
    <dialog ref="dlg" class="modal">
      <div class="modal-box max-w-3xl">
        <h3 class="font-bold text-lg mb-4">
          {{ editing.id ? t('admin.basketsPage.editTitle') : t('admin.basketsPage.createTitle') }}
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control gap-3 flex flex-col">
            <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldName') }}</span></label>
            <input v-model="editing.name" class="input input-bordered" :placeholder="t('admin.basketsPage.fieldName')" />
          </div>
          <div class="form-control gap-3 flex flex-col">
            <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldImage') }}</span></label>
            <ImageInput v-model="editing.imageUrl" />
          </div>
          <div class="form-control gap-3 flex flex-col">
            <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldDescription') }}</span></label>
            <textarea v-model="editing.description" class="textarea textarea-bordered" rows="2" />
          </div>
          <div class="form-control gap-3 flex flex-col">
            <label class="label"><span class="label-text">{{ t('admin.basketsPage.fieldAvailable') }}</span></label>
            <input v-model.number="editing.available" type="number" min="0" class="input input-bordered" />
          </div>
          <div class="form-control gap-3 flex flex-col">
            <label class="label cursor-pointer">
              <span class="label-text">{{ t('admin.basketsPage.fieldActive') }}</span>
              <input v-model="editing.active" type="checkbox" class="checkbox" />
            </label>
          </div>
        </div>

        <div class="divider">{{ t('admin.basketsPage.compositionTitle') }}</div>

        <div class="space-y-2">
          <div
            v-for="(it, idx) in editing.items"
            :key="idx"
            class="flex gap-2 items-center"
          >
            <select v-model.number="it.vegetableId" class="select select-bordered flex-1">
              <option :value="0" disabled>{{ t('admin.basketsPage.selectVegetable') }}</option>
              <option v-for="v in vegetables" :key="v.id" :value="v.id">
                {{ v.name }} ({{ $formatPrice(v.price) }}/{{ v.unit === 'KG' ? 'kg' : 'pièce' }})
              </option>
            </select>
            <input
              v-model.number="it.quantity"
              type="number"
              step="0.1"
              min="0"
              class="input input-bordered w-28"
              :placeholder="t('admin.basketsPage.quantityPlaceholder')"
            />
            <span class="text-sm opacity-70 w-20">
              {{ vegetables?.find(v => v.id === it.vegetableId)?.unit === 'KG' ? 'kg' : 'piece(s)' }}
            </span>
            <button class="btn btn-ghost btn-sm text-error" @click="removeItem(idx)">
              <Icon name="mdi:close" size="16" />
            </button>
          </div>
          <button class="btn btn-sm btn-outline" @click="addItem">
            <Icon name="mdi:plus" size="16" /> {{ t('admin.basketsPage.addVegetable') }}
          </button>
        </div>

        <div class="divider">{{ t('admin.basketsPage.priceTitle') }}</div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control gap-3 flex">
            <label class="label">
              <span class="label-text">{{ t('admin.basketsPage.autoComputedPrice') }}</span>
            </label>
            <div class="input input-bordered flex items-center bg-base-300">
              {{ $formatPrice(computedPrice) }}
            </div>
          </div>
          <div class="form-control gap-3 flex">
            <label class="label">
              <span class="label-text">{{ t('admin.basketsPage.editableFinalPrice') }}</span>
              <button type="button" class="label-text-alt link" @click="editing.finalPrice = computedPrice">
                {{ t('admin.basketsPage.useComputedPrice') }}
              </button>
            </label>
            <input v-model.number="editing.finalPrice" type="number" step="0.01" min="0" class="input input-bordered" />
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
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: {
      fr: '/admin/boutique/paniers',
      en: '/admin/shop/baskets'
    }
  }
})

interface Vegetable { id: number; name: string; unit: 'KG' | 'PIECE'; price: number; active: boolean }
interface BasketItem { id?: number; vegetableId: number; quantity: number; vegetable?: Vegetable }
interface Basket {
  id: number; name: string; description: string | null; imageUrl: string | null
  computedPrice: number; finalPrice: number; available: number; active: boolean
  position: number; items: BasketItem[]
}

const { data: baskets, pending, refresh } = await useFetch<Basket[]>('/api/admin/baskets')
const { data: vegetables } = await useFetch<Vegetable[]>('/api/admin/vegetables')

const dlg = ref<HTMLDialogElement>()
const saving = ref(false)
const { $toast, $formatPrice } = useNuxtApp() as any
const { t } = useI18n()

const editing = reactive<{
  id?: number; name: string; description: string; imageUrl: string
  available: number; active: boolean; finalPrice: number
  items: { vegetableId: number; quantity: number }[]
}>({
  id: undefined, name: '', description: '', imageUrl: '',
  available: 0, active: true, finalPrice: 0, items: []
})

const computedPrice = computed(() => {
  if (!vegetables.value) return 0
  return editing.items.reduce((sum, it) => {
    const v = vegetables.value!.find(x => x.id === it.vegetableId)
    return v ? sum + v.price * (it.quantity || 0) : sum
  }, 0)
})

const openNew = () => {
  Object.assign(editing, {
    id: undefined, name: '', description: '', imageUrl: '',
    available: 0, active: true, finalPrice: 0, items: []
  })
  dlg.value?.showModal()
}
const openEdit = (b: Basket) => {
  Object.assign(editing, {
    id: b.id, name: b.name, description: b.description ?? '', imageUrl: b.imageUrl ?? '',
    available: b.available, active: b.active, finalPrice: b.finalPrice,
    items: b.items.map(it => ({ vegetableId: it.vegetableId, quantity: it.quantity }))
  })
  dlg.value?.showModal()
}
const close = () => dlg.value?.close()

const addItem = () => editing.items.push({ vegetableId: 0, quantity: 1 })
const removeItem = (idx: number) => editing.items.splice(idx, 1)

const save = async () => {
  saving.value = true
  try {
    const validItems = editing.items.filter(i => i.vegetableId > 0 && i.quantity > 0)
    const payload = {
      name: editing.name,
      description: editing.description || null,
      imageUrl: editing.imageUrl || null,
      available: editing.available,
      active: editing.active,
      finalPrice: editing.finalPrice,
      items: validItems
    }
    if (editing.id) {
      await $fetch(`/api/admin/baskets/${editing.id}`, { method: 'PUT', body: payload })
    } else {
      await $fetch('/api/admin/baskets', { method: 'POST', body: payload })
    }
    $toast.success(t('admin.basketsPage.saved'))
    close()
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || t('common.error'))
  } finally {
    saving.value = false
  }
}

const remove = async (b: Basket) => {
  if (!confirm(t('admin.basketsPage.deleteConfirm', { name: b.name }))) return
  try {
    await $fetch(`/api/admin/baskets/${b.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || t('common.error'))
  }
}
</script>
