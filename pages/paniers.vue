<template>
  <div class="min-h-screen container mx-auto px-4 py-8">
    <header class="text-center mb-10">
      <h1 class="text-4xl font-bold mb-2">Paniers de légumes</h1>
      <p class="opacity-70 max-w-2xl mx-auto">
        Réservez votre panier hebdomadaire de légumes frais, bio et de saison, récoltés à la ferme.
        Une fois votre demande envoyée, nous la confirmerons par email avec les détails de retrait.
      </p>
    </header>

    <div v-if="pending" class="text-center py-12">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="!baskets?.length" class="text-center py-12 opacity-60">
      Aucun panier disponible pour le moment. Revenez bientôt !
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="b in baskets"
        :key="b.id"
        class="card bg-base-200 shadow-xl"
      >
        <figure v-if="b.imageUrl" class="h-48 overflow-hidden">
          <img :src="b.imageUrl" :alt="b.name" class="object-cover w-full h-full" />
        </figure>
        <div class="card-body">
          <h2 class="card-title">
            {{ b.name }}
            <span v-if="b.remaining === 0" class="badge badge-error">Complet</span>
            <span v-else-if="b.remaining <= 3" class="badge badge-warning">
              Plus que {{ b.remaining }}
            </span>
          </h2>
          <p v-if="b.description" class="opacity-80">{{ b.description }}</p>

          <div class="mt-2">
            <details class="collapse collapse-arrow bg-base-300">
              <summary class="collapse-title text-sm font-medium">
                Composition ({{ b.items.length }} légumes)
              </summary>
              <div class="collapse-content text-sm">
                <ul class="list-disc list-inside">
                  <li v-for="(it, idx) in b.items" :key="idx">
                    {{ it.vegetable.name }} — {{ it.quantity }}{{ it.vegetable.unit === 'KG' ? ' kg' : ' pièce(s)' }}
                  </li>
                </ul>
              </div>
            </details>
          </div>

          <div class="card-actions justify-between items-center mt-4">
            <div class="text-2xl font-bold text-primary">{{ $formatPrice(b.finalPrice) }}</div>
            <button
              class="btn btn-primary"
              :disabled="b.remaining === 0"
              @click="openReservation(b)"
            >
              Réserver
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Reservation dialog -->
    <dialog ref="dlg" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-2">
          Réserver — {{ selected?.name }}
        </h3>
        <p class="text-sm opacity-70 mb-4">
          {{ selected ? $formatPrice(selected.finalPrice) : '' }} — réservation à confirmer par l'admin.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label"><span class="label-text">Nom complet *</span></label>
            <input v-model="form.customerName" class="input input-bordered" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Email *</span></label>
            <input v-model="form.email" type="email" class="input input-bordered" />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Téléphone</span></label>
            <input v-model="form.phone" type="tel" class="input input-bordered" />
          </div>
        </div>

        
        <div class="w-full">
          <div class="form-control">
            <label class="label"><span class="label-text">Message (optionnel)</span></label>
            <textarea v-model="form.message" class="textarea textarea-bordered w-full" rows="3" />
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="close">Annuler</button>
          <button class="btn btn-primary" :disabled="submitting" @click="submit">
            <span v-if="submitting" class="loading loading-spinner loading-sm" />
            Envoyer la demande
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
interface PublicBasket {
  id: number; name: string; description: string | null; imageUrl: string | null
  finalPrice: number; remaining: number; available: number
  items: { quantity: number; vegetable: { name: string; unit: 'KG' | 'PIECE' } }[]
}

const { data: baskets, pending, refresh } = await useFetch<PublicBasket[]>('/api/baskets')
const authStore = useAuthStore()
const { $toast, $formatPrice } = useNuxtApp() as any

const dlg = ref<HTMLDialogElement>()
const selected = ref<PublicBasket | null>(null)
const submitting = ref(false)

const form = reactive({
  customerName: '',
  email: '',
  phone: '',
  message: ''
})

const openReservation = (b: PublicBasket) => {
  selected.value = b
  if (authStore.user) {
    form.customerName = `${authStore.user.firstName ?? ''} ${authStore.user.lastName ?? ''}`.trim()
    form.email = authStore.user.email
  }
  dlg.value?.showModal()
}
const close = () => dlg.value?.close()

const submit = async () => {
  if (!selected.value) return
  submitting.value = true
  try {
    await $fetch('/api/reservations', {
      method: 'POST',
      body: { basketId: selected.value.id, ...form }
    })
    $toast.success('Réservation envoyée — vous recevrez un email de confirmation.')
    close()
    Object.assign(form, { customerName: '', email: '', phone: '', message: '' })
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || 'Erreur lors de l\'envoi')
  } finally {
    submitting.value = false
  }
}
</script>
