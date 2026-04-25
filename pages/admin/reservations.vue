<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Réservations</h1>

    <div v-if="pending" class="loading loading-spinner" />

    <div v-else class="space-y-3">
      <div
        v-for="r in reservations"
        :key="r.id"
        class="card bg-base-200 shadow-sm"
      >
        <div class="card-body p-4">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <h2 class="font-bold">{{ r.customerName }}</h2>
                <span class="badge" :class="badgeClass(r.status)">{{ statusLabel(r.status) }}</span>
              </div>
              <p class="text-sm opacity-70">
                {{ r.basket.name }} — {{ $formatPrice(r.basket.finalPrice) }} — {{ $formatDate(r.createdAt) }}
              </p>
              <p class="text-sm">
                <a :href="`mailto:${r.email}`" class="link">{{ r.email }}</a>
                <span v-if="r.phone"> · <a :href="`tel:${r.phone}`" class="link">{{ r.phone }}</a></span>
              </p>
              <p v-if="r.message" class="mt-2 text-sm italic opacity-80">« {{ r.message }} »</p>
            </div>
            <div class="flex gap-2">
              <template v-if="r.status === 'PENDING'">
                <button class="btn btn-sm btn-success" @click="open(r, 'confirmed')">
                  <Icon name="mdi:check" size="16" /> Confirmer
                </button>
                <button class="btn btn-sm btn-error btn-outline" @click="open(r, 'rejected')">
                  <Icon name="mdi:close" size="16" /> Refuser
                </button>
              </template>
              <span v-else class="text-xs opacity-60">
                {{ r.confirmedAt ? `Confirmée le ${$formatDate(r.confirmedAt)}` : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!reservations?.length" class="text-center opacity-60 py-12">
        Aucune réservation pour le moment.
      </div>
    </div>

    <!-- Decision dialog -->
    <dialog ref="dlg" class="modal">
      <div class="modal-box max-w-2xl">
        <h3 class="font-bold text-lg mb-2">
          {{ decisionAction === 'confirmed' ? 'Confirmer la réservation' : 'Refuser la réservation' }}
        </h3>
        <p class="text-sm opacity-70 mb-4">
          Email envoyé à <strong>{{ current?.email }}</strong> via Gmail.
        </p>

        <div v-if="decisionAction === 'rejected'" class="form-control mb-3">
          <label class="label"><span class="label-text">Raison (visible dans l'email)</span></label>
          <input v-model="adminNote" class="input input-bordered" placeholder="Ex : Plus de stock cette semaine" />
        </div>

         <div class="grid grid-cols-1 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Sujet</span>
              <button type="button" class="label-text-alt link" @click="reloadPreview">Recharger le modèle</button>
            </label>
            <input v-model="emailDraft.subject" class="input input-bordered w-full" />
          </div>

          <div class="form-control">
            <label class="label"><span class="label-text">Message</span></label>
            <textarea v-model="emailDraft.body" rows="14" class="textarea textarea-bordered font-mono text-sm w-full" />
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="close">Annuler</button>
          <button
            class="btn"
            :class="decisionAction === 'confirmed' ? 'btn-success' : 'btn-error'"
            :disabled="sending"
            @click="submit"
          >
            <span v-if="sending" class="loading loading-spinner loading-sm" />
            {{ decisionAction === 'confirmed' ? 'Confirmer & envoyer' : 'Refuser & envoyer' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Reservation {
  id: number; customerName: string; email: string; phone: string | null
  message: string | null; status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED'
  adminNote: string | null; createdAt: string; confirmedAt: string | null
  basket: { id: number; name: string; finalPrice: number }
}

const { data: reservations, pending, refresh } = await useFetch<Reservation[]>('/api/admin/reservations')
const { $toast, $formatPrice, $formatDate } = useNuxtApp() as any

const dlg = ref<HTMLDialogElement>()
const current = ref<Reservation | null>(null)
const decisionAction = ref<'confirmed' | 'rejected'>('confirmed')
const adminNote = ref('')
const emailDraft = reactive({ subject: '', body: '' })
const sending = ref(false)

const statusLabel = (s: string) => ({
  PENDING: 'En attente', CONFIRMED: 'Confirmée', REJECTED: 'Refusée', CANCELLED: 'Annulée'
} as Record<string, string>)[s] ?? s
const badgeClass = (s: string) => ({
  PENDING: 'badge-warning', CONFIRMED: 'badge-success',
  REJECTED: 'badge-error', CANCELLED: 'badge-ghost'
} as Record<string, string>)[s] ?? 'badge-ghost'

const loadPreview = async () => {
  if (!current.value) return
  const params = new URLSearchParams({ action: decisionAction.value })
  if (decisionAction.value === 'rejected') params.set('adminNote', adminNote.value)
  const preview = await $fetch<{ subject: string; body: string }>(
    `/api/admin/reservations/${current.value.id}/preview?${params.toString()}`
  )
  emailDraft.subject = preview.subject
  emailDraft.body = preview.body
}

const open = async (r: Reservation, action: 'confirmed' | 'rejected') => {
  current.value = r
  decisionAction.value = action
  adminNote.value = ''
  await loadPreview()
  dlg.value?.showModal()
}
const close = () => dlg.value?.close()
const reloadPreview = () => loadPreview()

watch(adminNote, () => {
  if (decisionAction.value === 'rejected') {
    emailDraft.body = emailDraft.body.replace(/\{\{adminNote\}\}/g, adminNote.value)
  }
})

const submit = async () => {
  if (!current.value) return
  sending.value = true
  try {
    await $fetch(`/api/admin/reservations/${current.value.id}/decide`, {
      method: 'POST',
      body: {
        decision: decisionAction.value === 'confirmed' ? 'CONFIRMED' : 'REJECTED',
        adminNote: adminNote.value || null,
        email: { subject: emailDraft.subject, body: emailDraft.body }
      }
    })
    $toast.success('Email envoyé')
    close()
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || 'Erreur (Gmail connecté ?)')
  } finally {
    sending.value = false
  }
}
</script>
