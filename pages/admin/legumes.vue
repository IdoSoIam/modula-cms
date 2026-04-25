<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">Légumes</h1>
      <button class="btn btn-primary" @click="openNew">
        <Icon name="mdi:plus" size="20" /> Nouveau légume
      </button>
    </div>

    <div v-if="pending" class="loading loading-spinner" />

    <div v-else class="overflow-x-auto bg-base-200 rounded-box">
      <table class="table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Unité</th>
            <th class="text-right">Prix</th>
            <th>État</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in vegetables" :key="v.id">
            <td class="font-medium">{{ v.name }}</td>
            <td>{{ v.unit === 'KG' ? '€/kg' : '€/pièce' }}</td>
            <td class="text-right">{{ $formatPrice(v.price) }}</td>
            <td>
              <span class="badge" :class="v.active ? 'badge-success' : 'badge-ghost'">
                {{ v.active ? 'Actif' : 'Inactif' }}
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
            <td colspan="5" class="text-center opacity-60 py-8">
              Aucun légume. Ajoutez-en un pour composer vos paniers.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Dialog -->
    <dialog ref="dlg" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">
          {{ editing.id ? 'Modifier le légume' : 'Nouveau légume' }}
        </h3>
        <div class="space-y-3">
          <div class="form-control">
            <label class="label"><span class="label-text">Nom</span></label>
            <input v-model="editing.name" class="input input-bordered" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Unité</span></label>
            <select v-model="editing.unit" class="select select-bordered">
              <option value="KG">Au kilo (€/kg)</option>
              <option value="PIECE">À la pièce (€/pièce)</option>
            </select>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Prix (€)</span></label>
            <input v-model.number="editing.price" type="number" step="0.01" min="0" class="input input-bordered" />
          </div>
          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text">Actif</span>
              <input v-model="editing.active" type="checkbox" class="checkbox" />
            </label>
          </div>
        </div>
        <div class="modal-action">
          <button class="btn" @click="close">Annuler</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">
            <span v-if="saving" class="loading loading-spinner loading-sm" />
            Enregistrer
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Vegetable {
  id: number; name: string; unit: 'KG' | 'PIECE'; price: number; active: boolean
}

const { data: vegetables, pending, refresh } = await useFetch<Vegetable[]>('/api/admin/vegetables')

const dlg = ref<HTMLDialogElement>()
const saving = ref(false)
const editing = reactive<Partial<Vegetable>>({
  id: undefined, name: '', unit: 'KG', price: 0, active: true
})
const { $toast, $formatPrice } = useNuxtApp() as any

const openNew = () => {
  Object.assign(editing, { id: undefined, name: '', unit: 'KG', price: 0, active: true })
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
    $toast.success('Enregistré')
    close()
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || 'Erreur')
  } finally {
    saving.value = false
  }
}

const remove = async (v: Vegetable) => {
  if (!confirm(`Supprimer "${v.name}" ?`)) return
  try {
    await $fetch(`/api/admin/vegetables/${v.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || 'Erreur')
  }
}
</script>
