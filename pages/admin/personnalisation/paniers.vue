<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Personnalisation paniers</h1>
        <p class="mt-1 text-sm opacity-70">Réglage du rendu de la liste et des cartes paniers.</p>
      </div>
      <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
        <span v-if="saving" class="loading loading-spinner loading-sm" />
        Enregistrer
      </button>
    </div>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
      <AdminPageBuilderTranslationTabs :model-value="model.settings.basketsPage.title" label="Titre" />
      <AdminPageBuilderTranslationTabs :model-value="model.settings.basketsPage.subtitle" label="Sous-titre" multiline />

      <div class="grid gap-4 lg:grid-cols-3">
        <label class="form-control gap-2">
          <span class="label"><span class="label-text">Largeur du conteneur</span></span>
          <select v-model="model.settings.basketsPage.containerWidth" class="select select-bordered w-full">
            <option v-for="width in SECTION_CONTAINER_WIDTHS" :key="width" :value="width">{{ SECTION_CONTAINER_WIDTH_LABELS[width] }}</option>
          </select>
        </label>

        <label class="form-control gap-2">
          <span class="label"><span class="label-text">Colonnes de liste</span></span>
          <select v-model.number="model.settings.basketsPage.gridColumns" class="select select-bordered w-full">
            <option v-for="count in CMS_APPLICATION_GRID_COLUMNS" :key="count" :value="count">{{ CMS_APPLICATION_GRID_COLUMN_LABELS[count] }}</option>
          </select>
        </label>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.basketsPage.showOrdersBanner" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">Afficher la bannière commandes fermées</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.basketsPage.showImages" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">Afficher les images</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.basketsPage.showDescriptions" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">Afficher les descriptions</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.basketsPage.showComposition" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">Afficher la composition</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.basketsPage.showAvailabilityBadges" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">Afficher les badges disponibilité</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.basketsPage.showPrice" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">Afficher le prix</span>
        </label>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <ThemeColorPicker v-model="model.settings.basketsPage.cardBackgroundColor" label="Fond des cartes panier" :allowed-tokens="CMS_THEME_COLOR_TOKENS" :allow-custom="false" default-token="base-200" />
        <ThemeColorPicker v-model="model.settings.basketsPage.itemBackgroundColor" label="Fond des items de composition" :allowed-tokens="CMS_THEME_COLOR_TOKENS" :allow-custom="false" default-token="base-200" />
      </div>
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-4">
      <div>
        <h2 class="text-xl font-semibold">Aperçu</h2>
        <p class="mt-1 text-sm opacity-70">Rendu réel du composant paniers avec vos réglages.</p>
      </div>
      <div class="rounded-[2rem] border border-base-300 bg-base-200 p-4">
        <BasketsPage :settings="model.settings.basketsPage" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import BasketsPage from '~/components/pages/BasketsPage.vue'
import ThemeColorPicker from '~/components/admin/ThemeColorPicker.vue'
import AdminPageBuilderTranslationTabs from '~/components/admin/page-builder/TranslationTabs.vue'
import { CMS_APPLICATION_GRID_COLUMNS, CMS_APPLICATION_GRID_COLUMN_LABELS, CMS_THEME_COLOR_TOKENS, type CmsNavigationItemPayload, type CmsSiteSettings } from '~/shared/cms'
import { SECTION_CONTAINER_WIDTH_LABELS, SECTION_CONTAINER_WIDTHS } from '~/shared/pageBuilder'

definePageMeta({ layout: 'admin', middleware: 'auth' })

interface SiteShellModel {
  settings: CmsSiteSettings
  navigation: Array<CmsNavigationItemPayload & { id?: number | null }>
}

const { $toast } = useNuxtApp() as any
const saving = ref(false)
const { data } = await useFetch<SiteShellModel>('/api/admin/cms/site-shell')

if (!data.value) {
  throw createError({ statusCode: 500, statusMessage: 'Configuration CMS indisponible' })
}

const model = reactive<SiteShellModel>(structuredClone(data.value))

const save = async () => {
  saving.value = true
  try {
    await $fetch('/api/admin/cms/site-shell', { method: 'PUT', body: model })
    $toast?.success('Personnalisation paniers enregistrée')
  } catch (error: any) {
    $toast?.error(error.statusMessage || 'Impossible d’enregistrer les paniers')
  } finally {
    saving.value = false
  }
}
</script>
