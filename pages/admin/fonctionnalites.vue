<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Fonctionnalités</h1>
        <p class="mt-1 text-sm opacity-70">
          Activation des options publiques et période de commandes.
        </p>
      </div>

      <button class="btn btn-primary" :disabled="saving || pending" @click="save">
        <span v-if="saving" class="loading loading-spinner loading-sm" />
        Enregistrer
      </button>
    </div>

    <div v-if="pending" class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200 p-4">
      <span class="loading loading-spinner loading-md" />
      <span>Chargement des fonctionnalités...</span>
    </div>

    <template v-else>
      <section class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4">
        <h2 class="text-lg font-semibold">Comportement du site</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <label class="label cursor-pointer justify-start gap-3">
            <input v-model="form.inDevelopment" type="checkbox" class="toggle toggle-primary" />
            <span class="label-text">Site en cours de construction</span>
          </label>
          <label class="label cursor-pointer justify-start gap-3">
            <input v-model="form.registerEnabled" type="checkbox" class="toggle toggle-primary" />
            <span class="label-text">Inscription publique active</span>
          </label>
          <label class="label cursor-pointer justify-start gap-3">
            <input v-model="form.subscriptionsEnabled" type="checkbox" class="toggle toggle-primary" />
            <span class="label-text">Abonnements paniers actifs</span>
          </label>
          <label class="label cursor-pointer justify-start gap-3">
            <input v-model="form.facebookFluxDeactivated" type="checkbox" class="toggle toggle-primary" />
            <span class="label-text">Désactiver le flux Facebook public</span>
          </label>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import OrdersWindowSettings from '~/components/admin/OrdersWindowSettings.vue'

definePageMeta({ layout: 'admin', middleware: 'auth' })

interface SettingsData {
  facebookFluxDeactivated: boolean
  inDevelopment: boolean
  registerEnabled: boolean
  subscriptionsEnabled: boolean
  ordersOpenFrom: string
  ordersOpenTo: string
  ordersClosedMessage: string
}

const { $toast } = useNuxtApp() as any
const saving = ref(false)
const { data, pending } = await useFetch<SettingsData>('/api/admin/settings')

const form = reactive({
  facebookFluxDeactivated: false,
  inDevelopment: false,
  registerEnabled: false,
  subscriptionsEnabled: false
})

const ordersWindow = ref({
  ordersOpenFrom: '',
  ordersOpenTo: '',
  ordersClosedMessage: ''
})

watchEffect(() => {
  if (!data.value) return
  form.facebookFluxDeactivated = data.value.facebookFluxDeactivated
  form.inDevelopment = data.value.inDevelopment
  form.registerEnabled = data.value.registerEnabled
  form.subscriptionsEnabled = data.value.subscriptionsEnabled
  ordersWindow.value = {
    ordersOpenFrom: data.value.ordersOpenFrom,
    ordersOpenTo: data.value.ordersOpenTo,
    ordersClosedMessage: data.value.ordersClosedMessage
  }
})

const save = async () => {
  saving.value = true
  try {
    await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: {
        facebookFluxDeactivated: form.facebookFluxDeactivated,
        inDevelopment: form.inDevelopment,
        registerEnabled: form.registerEnabled,
        subscriptionsEnabled: form.subscriptionsEnabled,
        ordersOpenFrom: ordersWindow.value.ordersOpenFrom,
        ordersOpenTo: ordersWindow.value.ordersOpenTo,
        ordersClosedMessage: ordersWindow.value.ordersClosedMessage
      }
    })
    $toast?.success('Fonctionnalités enregistrées')
  } catch (error: any) {
    $toast?.error(error.statusMessage || 'Impossible d’enregistrer les fonctionnalités')
  } finally {
    saving.value = false
  }
}
</script>
