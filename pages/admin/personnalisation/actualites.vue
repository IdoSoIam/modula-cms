<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Personnalisation actualités</h1>
        <p class="mt-1 text-sm opacity-70">Réglage du rendu de la liste et des cartes d’actualité.</p>
      </div>
      <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
        <span v-if="saving" class="loading loading-spinner loading-sm" />
        Enregistrer
      </button>
    </div>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
      <AdminPageBuilderTranslationTabs :model-value="model.settings.newsPage.title" label="Titre" />
      <AdminPageBuilderTranslationTabs :model-value="model.settings.newsPage.subtitle" label="Sous-titre" multiline />

      <div class="grid gap-4 lg:grid-cols-3">
        <label class="form-control gap-2">
          <span class="label"><span class="label-text">Largeur du conteneur</span></span>
          <select v-model="model.settings.newsPage.containerWidth" class="select select-bordered w-full">
            <option v-for="width in SECTION_CONTAINER_WIDTHS" :key="width" :value="width">{{ SECTION_CONTAINER_WIDTH_LABELS[width] }}</option>
          </select>
        </label>

        <label class="form-control gap-2">
          <span class="label"><span class="label-text">Vue par défaut</span></span>
          <select v-model="model.settings.newsPage.defaultViewMode" class="select select-bordered w-full">
            <option v-for="mode in CMS_APPLICATION_VIEW_MODES" :key="mode" :value="mode">{{ CMS_APPLICATION_VIEW_MODE_LABELS[mode] }}</option>
          </select>
        </label>

        <label class="form-control gap-2">
          <span class="label"><span class="label-text">Colonnes en grille</span></span>
          <select v-model.number="model.settings.newsPage.gridColumns" class="select select-bordered w-full">
            <option :value="1">1 colonne</option>
            <option :value="2">2 colonnes</option>
            <option :value="3">3 colonnes</option>
          </select>
        </label>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.newsPage.showSort" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">Afficher le tri</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.newsPage.showViewToggle" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">Afficher le switch grille / liste</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.newsPage.showCoverImage" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">Afficher l’image de couverture</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.newsPage.showPublishedDate" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">Afficher la date</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.newsPage.showExcerpt" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">Afficher l’extrait</span>
        </label>

        <label class="form-control gap-2">
          <span class="label"><span class="label-text">Nombre de lignes d’extrait</span></span>
          <select v-model.number="model.settings.newsPage.excerptLines" class="select select-bordered w-full">
            <option :value="2">2 lignes</option>
            <option :value="3">3 lignes</option>
            <option :value="4">4 lignes</option>
          </select>
        </label>
      </div>

      <ThemeColorPicker v-model="model.settings.newsPage.cardBackgroundColor" label="Fond des cartes actualité" :allowed-tokens="CMS_THEME_COLOR_TOKENS" :allow-custom="false" default-token="base-200" />
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-4">
      <div>
        <h2 class="text-xl font-semibold">Aperçu</h2>
        <p class="mt-1 text-sm opacity-70">Rendu réel de la liste d’actualités avec vos réglages.</p>
      </div>
      <div class="rounded-[2rem] border border-base-300 bg-base-200 p-4">
        <NewsListPage :settings="model.settings.newsPage" :force-articles="true" :disable-seo="true" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import NewsListPage from '~/components/pages/NewsListPage.vue'
import ThemeColorPicker from '~/components/admin/ThemeColorPicker.vue'
import AdminPageBuilderTranslationTabs from '~/components/admin/page-builder/TranslationTabs.vue'
import { CMS_APPLICATION_VIEW_MODE_LABELS, CMS_APPLICATION_VIEW_MODES, CMS_THEME_COLOR_TOKENS, type CmsNavigationItemPayload, type CmsSiteSettings } from '~/shared/cms'
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
    $toast?.success('Personnalisation actualités enregistrée')
  } catch (error: any) {
    $toast?.error(error.statusMessage || 'Impossible d’enregistrer les actualités')
  } finally {
    saving.value = false
  }
}
</script>
