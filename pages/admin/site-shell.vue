<template>
  <div v-if="model" class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Global</h1>
        <p class="mt-1 text-sm opacity-70">
          Identité du site, images globales et navigation publique.
        </p>
      </div>

      <button class="btn btn-primary" :disabled="saving" @click="save">
        <span v-if="saving" class="loading loading-spinner loading-sm" />
        Enregistrer
      </button>
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section class="rounded-box border border-base-300 bg-base-100 p-5 space-y-5">
        <h2 class="text-lg font-semibold">Identité</h2>

        <div class="grid gap-5 lg:grid-cols-2">
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
        <AdminHomepageTranslationTabs :model-value="model.settings.footerDescription" label="Texte du footer" />
      </section>

      <section class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-lg font-semibold">Réseaux sociaux</h2>
          <button class="btn btn-sm btn-outline" @click="addSocialLink">Ajouter</button>
        </div>

        <div v-for="(link, index) in model.settings.socialLinks" :key="link.id" class="rounded-xl border border-base-300 p-4 space-y-4">
          <div class="flex justify-end">
            <button class="btn btn-xs btn-outline btn-error" @click="model.settings.socialLinks.splice(index, 1)">Supprimer</button>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="form-control">
              <span class="label-text">ID</span>
              <input v-model="link.id" class="input input-bordered" />
            </label>
            <label class="form-control">
              <span class="label-text">Icône</span>
              <input v-model="link.icon" class="input input-bordered" placeholder="mdi:facebook" />
            </label>
            <label class="form-control md:col-span-2">
              <span class="label-text">URL</span>
              <input v-model="link.href" class="input input-bordered" />
            </label>
            <div class="md:col-span-2">
              <AdminHomepageTranslationTabs :model-value="link.label" label="Libellé" />
            </div>
          </div>
        </div>
      </section>
    </div>

    <section class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold">Navigation</h2>
        <button class="btn btn-sm btn-outline" @click="addNavigationItem">Ajouter un lien</button>
      </div>

      <div class="space-y-4">
        <div v-for="(item, index) in model.navigation" :key="item.id ?? `new-${index}`" class="rounded-xl border border-base-300 p-4 space-y-4">
          <div class="flex items-center justify-between gap-2">
            <div class="font-medium">Lien {{ index + 1 }}</div>
            <button class="btn btn-xs btn-outline btn-error" @click="model.navigation.splice(index, 1)">Supprimer</button>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <label class="form-control">
              <span class="label-text">Menu</span>
              <select v-model="item.menu" class="select select-bordered">
                <option value="PRIMARY">PRIMARY</option>
                <option value="FOOTER">FOOTER</option>
              </select>
            </label>
            <label class="form-control">
              <span class="label-text">Type</span>
              <select v-model="item.itemType" class="select select-bordered">
                <option value="CMS_PAGE">CMS_PAGE</option>
                <option value="APPLICATION_ROUTE">APPLICATION_ROUTE</option>
                <option value="EXTERNAL_URL">EXTERNAL_URL</option>
              </select>
            </label>
            <label class="form-control">
              <span class="label-text">Position</span>
              <input v-model.number="item.position" type="number" class="input input-bordered" />
            </label>
            <label class="form-control">
              <span class="label-text">Titre interne</span>
              <input v-model="item.title" class="input input-bordered" />
            </label>
            <label class="form-control md:col-span-2">
              <span class="label-text">Href</span>
              <input v-model="item.href" class="input input-bordered" />
            </label>
            <div class="md:col-span-2">
              <AdminHomepageTranslationTabs :model-value="item.labels" label="Libellé du lien" />
            </div>
            <div class="space-y-3">
              <label class="label cursor-pointer justify-start gap-2">
                <input v-model="item.visible" type="checkbox" class="checkbox checkbox-sm checkbox-primary" />
                <span class="label-text">Visible</span>
              </label>
              <label class="label cursor-pointer justify-start gap-2">
                <input v-model="item.newTab" type="checkbox" class="checkbox checkbox-sm checkbox-primary" />
                <span class="label-text">Nouvel onglet</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4">
      <h2 class="text-lg font-semibold">Horaires d'ouverture</h2>
      <p class="text-sm opacity-70">
        Adresse et créneau public de la ferme. Ils servent aussi de base pour le retrait des paniers.
      </p>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="form-control flex flex-col">
          <span class="label-text">Adresse précise</span>
          <textarea v-model="farmOpening.address" class="textarea textarea-bordered" rows="3" />
        </label>
        <label class="form-control flex flex-col">
          <span class="label-text">Jour d'ouverture principal</span>
          <select v-model.number="farmOpening.dayOfWeek" class="select select-bordered">
            <option :value="1">Lundi</option>
            <option :value="2">Mardi</option>
            <option :value="3">Mercredi</option>
            <option :value="4">Jeudi</option>
            <option :value="5">Vendredi</option>
            <option :value="6">Samedi</option>
            <option :value="0">Dimanche</option>
          </select>
        </label>
        <label class="form-control flex flex-col">
          <span class="label-text">Début d’ouverture</span>
          <input v-model="farmOpening.startTime" type="time" class="input input-bordered" />
        </label>
        <label class="form-control flex flex-col">
          <span class="label-text">Fin d’ouverture</span>
          <input v-model="farmOpening.endTime" type="time" class="input input-bordered" />
        </label>
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
}>('/api/admin/settings')

if (!data.value) {
  throw createError({
    statusCode: 500,
    statusMessage: 'Configuration CMS indisponible'
  })
}

const model = reactive<SiteShellModel>(structuredClone(data.value))
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
})

const addSocialLink = () => {
  model.settings.socialLinks.push({
    id: `social-${Date.now()}`,
    label: { fr: '', en: '' },
    href: '',
    icon: ''
  })
}

const addNavigationItem = () => {
  model.navigation.push({
    menu: 'PRIMARY',
    itemType: 'APPLICATION_ROUTE',
    title: 'Nouveau lien',
    labels: { fr: '', en: '' },
    href: '/',
    pageId: null,
    newTab: false,
    visible: true,
    position: model.navigation.length
  })
}

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
          farmPickupAddress: farmOpening.address,
          farmPickupDayOfWeek: farmOpening.dayOfWeek,
          farmPickupStartTime: farmOpening.startTime,
          farmPickupEndTime: farmOpening.endTime
        }
      })
    ])
    $toast?.success('Configuration du site enregistrée')
  } catch (error: any) {
    $toast?.error(error.statusMessage || 'Impossible d’enregistrer la configuration')
  } finally {
    saving.value = false
  }
}
</script>
