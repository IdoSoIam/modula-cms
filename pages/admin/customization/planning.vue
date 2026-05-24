<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Personnalisation planning</h1>
        <p class="mt-1 text-sm opacity-70">Réglez la page publique planning avec une vue semaine et une vue calendrier.</p>
      </div>
      <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
        <span v-if="saving" class="loading loading-spinner loading-sm" />
        Enregistrer
      </button>
    </div>

    <section class="space-y-5 rounded-box border border-base-300 bg-base-100 p-6">
      <AdminPageBuilderTranslationTabs :model-value="model.settings.planningPage.title" label="Titre visible" />
      <AdminPageBuilderTranslationTabs :model-value="model.settings.planningPage.subtitle" label="Sous-titre visible" multiline />

      <div class="grid gap-4 lg:grid-cols-2">
        <label class="form-control gap-2">
          <span class="label-text">Largeur du container</span>
          <select v-model="model.settings.planningPage.containerWidth" class="select select-bordered w-full">
            <option v-for="width in SECTION_CONTAINER_WIDTHS" :key="width" :value="width">{{ SECTION_CONTAINER_WIDTH_LABELS[width] }}</option>
          </select>
        </label>
        <label class="form-control gap-2">
          <span class="label-text">Vue par défaut</span>
          <select v-model="model.settings.planningPage.defaultViewMode" class="select select-bordered w-full">
            <option value="week">Semaine</option>
            <option value="calendar">Calendrier</option>
          </select>
        </label>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.planningPage.showViewToggle" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">Afficher le sélecteur de vue</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.planningPage.showCoverImage" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">Afficher l’image de couverture</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.planningPage.showDate" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">Afficher la date</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.planningPage.showLocation" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">Afficher le lieu</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.planningPage.showExcerpt" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">Afficher l’extrait</span>
        </label>
      </div>

      <label class="form-control gap-2">
        <span class="label-text">Lignes d’extrait</span>
        <select v-model.number="model.settings.planningPage.excerptLines" class="select select-bordered w-full max-w-xs">
          <option :value="2">2 lignes</option>
          <option :value="3">3 lignes</option>
          <option :value="4">4 lignes</option>
        </select>
      </label>

      <ThemeColorPicker v-model="model.settings.planningPage.cardBackgroundColor" label="Fond des cartes" :allowed-tokens="CMS_THEME_COLOR_TOKENS" :allow-custom="false" default-token="base-200" />
      <AdminPageBuilderTranslationTabs :model-value="model.settings.planningPage.detailLabel" label="Libellé CTA détail" />
      <AdminPageBuilderTranslationTabs :model-value="model.settings.planningPage.becomeVolunteerLabel" label="Libellé bouton devenir bénévole" />
      <AdminPageBuilderTranslationTabs :model-value="model.settings.planningPage.internalParticipationLabel" label="Libellé participation interne" />
      <AdminPageBuilderTranslationTabs :model-value="model.settings.planningPage.guestInfoLabel" label="Message invité" multiline />
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-6">
      <PlanningPage :settings="model.settings.planningPage" :preview="true" />
    </section>
  </div>
</template>

<script setup lang="ts">
import ThemeColorPicker from '~/components/admin/ThemeColorPicker.vue'
import AdminPageBuilderTranslationTabs from '~/components/admin/page-builder/TranslationTabs.vue'
import PlanningPage from '~/components/pages/PlanningPage.vue'
import { ADMIN_I18N_PATHS } from '~/shared/adminRoutes'
import { CMS_THEME_COLOR_TOKENS, type CmsNavigationItemPayload, type CmsSiteSettings } from '~/shared/cms'
import { SECTION_CONTAINER_WIDTH_LABELS, SECTION_CONTAINER_WIDTHS } from '~/shared/pageBuilder'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.customizationPlanning
  }
})

interface SiteShellModel {
  settings: CmsSiteSettings
  navigation: Array<CmsNavigationItemPayload & { id?: number | null }>
}

const { $toast } = useNuxtApp() as any
const saving = ref(false)
const { data } = await useFetch<SiteShellModel>('/api/admin/cms/site-shell')
if (!data.value) {
  throw createError({ statusCode: 500, statusMessage: 'Impossible de charger la personnalisation planning' })
}

const model = reactive<SiteShellModel>(structuredClone(data.value))

const save = async () => {
  saving.value = true
  try {
    await $fetch('/api/admin/cms/site-shell', { method: 'PUT', body: model })
    $toast?.success('Personnalisation planning enregistrée')
  } catch (error: any) {
    $toast?.error(error?.statusMessage || 'Impossible d’enregistrer la personnalisation planning')
  } finally {
    saving.value = false
  }
}
</script>
