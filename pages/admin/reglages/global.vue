<template>
  <div v-if="model" class="space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">Global</h1>
        <p class="mt-2 max-w-3xl text-sm opacity-70">
          Identité du site, favicon, coordonnées publiques et horaires d'ouverture.
        </p>
      </div>

      <button class="btn btn-primary" :disabled="saving" @click="save">
        <span v-if="saving" class="loading loading-spinner loading-sm" />
        Enregistrer
      </button>
    </div>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
      <div>
        <h2 class="text-xl font-semibold">Identité</h2>
        <p class="mt-1 text-sm opacity-70">Logo, favicon et textes principaux du site.</p>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div class="space-y-3">
          <div class="text-sm font-medium">Logo principal</div>
          <ImageInput v-model="model.settings.logo.src" />
          <AdminHomepageTranslationTabs :model-value="model.settings.logo.alt" label="Texte alternatif du logo" />
        </div>

        <div class="space-y-3">
          <div class="text-sm font-medium">Favicon</div>
          <ImageInput v-model="model.settings.favicon.src" />
          <AdminHomepageTranslationTabs :model-value="model.settings.favicon.alt" label="Texte alternatif du favicon" />
        </div>
      </div>

      <AdminHomepageTranslationTabs :model-value="model.settings.siteName" label="Nom du site" />
      <AdminHomepageTranslationTabs :model-value="model.settings.siteTagline" label="Baseline" />
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
      <div>
        <h2 class="text-xl font-semibold">Coordonnées publiques</h2>
        <p class="mt-1 text-sm opacity-70">Ces informations sont réutilisables dans le footer et les pages publiques.</p>
      </div>

      <label class="form-control gap-2">
        <span class="label"><span class="label-text">Email public</span></span>
        <input v-model="contactEmail" type="email" class="input input-bordered w-full" />
      </label>

      <label class="form-control gap-2">
        <span class="label"><span class="label-text">Téléphone public</span></span>
        <input v-model="publicPhone" class="input input-bordered w-full" />
      </label>

      <label class="form-control gap-2">
        <span class="label"><span class="label-text">Adresse publique</span></span>
        <textarea v-model="farmOpening.address" class="textarea textarea-bordered w-full" rows="4" />
      </label>
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
      <div>
        <h2 class="text-xl font-semibold">Horaires d'ouverture</h2>
        <p class="mt-1 text-sm opacity-70">Référence utilisée dans le footer et les pages qui injectent les horaires.</p>
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <label class="form-control gap-2">
          <span class="label"><span class="label-text">Jour d'ouverture principal</span></span>
          <select v-model.number="farmOpening.dayOfWeek" class="select select-bordered w-full">
            <option :value="1">Lundi</option>
            <option :value="2">Mardi</option>
            <option :value="3">Mercredi</option>
            <option :value="4">Jeudi</option>
            <option :value="5">Vendredi</option>
            <option :value="6">Samedi</option>
            <option :value="0">Dimanche</option>
          </select>
        </label>

        <label class="form-control gap-2">
          <span class="label"><span class="label-text">Début d'ouverture</span></span>
          <input v-model="farmOpening.startTime" type="time" class="input input-bordered w-full" />
        </label>

        <label class="form-control gap-2">
          <span class="label"><span class="label-text">Fin d'ouverture</span></span>
          <input v-model="farmOpening.endTime" type="time" class="input input-bordered w-full" />
        </label>
      </div>

      <div class="rounded-2xl border border-base-300 bg-base-200 p-4 text-sm">
        <div class="font-medium">Aperçu</div>
        <div class="mt-2 opacity-80">{{ openingHoursPreview }}</div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import ImageInput from '~/components/ImageInput.vue'
import AdminHomepageTranslationTabs from '~/components/admin/homepage/TranslationTabs.vue'
import type { CmsNavigationItemPayload, CmsSiteSettings } from '~/shared/cms'

definePageMeta({ layout: 'admin', middleware: 'auth' })

interface SiteShellModel {
  settings: CmsSiteSettings
  navigation: Array<CmsNavigationItemPayload & { id?: number | null }>
}

const { $toast } = useNuxtApp() as any
const saving = ref(false)
const { data } = await useFetch<SiteShellModel>('/api/admin/cms/site-shell')
const { data: settingsData } = await useFetch<{
  farmPickup: {
    address: string
    dayOfWeek: number
    startTime: string
    endTime: string
  }
  contactEmail: string
  adminPhone: string
}>('/api/admin/settings')

if (!data.value) {
  throw createError({
    statusCode: 500,
    statusMessage: 'Configuration CMS indisponible'
  })
}

const model = reactive<SiteShellModel>(structuredClone(data.value))
const publicPhone = ref(settingsData.value?.adminPhone ?? '')
const contactEmail = ref(settingsData.value?.contactEmail ?? '')
const farmOpening = reactive({
  address: settingsData.value?.farmPickup.address ?? '',
  dayOfWeek: settingsData.value?.farmPickup.dayOfWeek ?? 5,
  startTime: settingsData.value?.farmPickup.startTime ?? '17:30',
  endTime: settingsData.value?.farmPickup.endTime ?? '19:00'
})

watchEffect(() => {
  if (!settingsData.value) return
  farmOpening.address = settingsData.value.farmPickup.address
  farmOpening.dayOfWeek = settingsData.value.farmPickup.dayOfWeek
  farmOpening.startTime = settingsData.value.farmPickup.startTime
  farmOpening.endTime = settingsData.value.farmPickup.endTime
  publicPhone.value = settingsData.value.adminPhone
  contactEmail.value = settingsData.value.contactEmail
})

const dayLabels = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const openingHoursPreview = computed(() => {
  const day = dayLabels[farmOpening.dayOfWeek] || 'Vendredi'
  return `${day} ${farmOpening.startTime} - ${farmOpening.endTime}`
})

const save = async () => {
  saving.value = true
  try {
    await Promise.all([
      $fetch('/api/admin/cms/site-shell', {
        method: 'PUT',
        body: model
      }),
      $fetch('/api/admin/settings', {
        method: 'PUT',
        body: {
          contactEmail: contactEmail.value,
          adminPhone: publicPhone.value,
          farmPickupAddress: farmOpening.address,
          farmPickupDayOfWeek: farmOpening.dayOfWeek,
          farmPickupStartTime: farmOpening.startTime,
          farmPickupEndTime: farmOpening.endTime
        }
      })
    ])
    $toast?.success('Réglages globaux enregistrés')
  } catch (error: any) {
    $toast?.error(error.statusMessage || 'Impossible d’enregistrer les réglages globaux')
  } finally {
    saving.value = false
  }
}
</script>
