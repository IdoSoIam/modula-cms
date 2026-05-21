<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.customizationNewsPage.title') }}</h1>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.customizationNewsPage.description') }}</p>
      </div>
      <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
        <span v-if="saving" class="loading loading-spinner loading-sm" />
        {{ t('admin.common.save') }}
      </button>
    </div>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
      <AdminPageBuilderTranslationTabs :model-value="model.settings.newsPage.title" :label="t('admin.customizationNewsPage.titleField')" />
      <AdminPageBuilderTranslationTabs :model-value="model.settings.newsPage.subtitle" :label="t('admin.customizationNewsPage.subtitleField')" multiline />

      <div class="grid gap-4 lg:grid-cols-3">
        <label class="form-control gap-2">
          <span class="label"><span class="label-text">{{ t('admin.customizationNewsPage.containerWidth') }}</span></span>
          <select v-model="model.settings.newsPage.containerWidth" class="select select-bordered w-full">
            <option v-for="width in SECTION_CONTAINER_WIDTHS" :key="width" :value="width">{{ SECTION_CONTAINER_WIDTH_LABELS[width] }}</option>
          </select>
        </label>

        <label class="form-control gap-2">
          <span class="label"><span class="label-text">{{ t('admin.customizationNewsPage.defaultView') }}</span></span>
          <select v-model="model.settings.newsPage.defaultViewMode" class="select select-bordered w-full">
            <option v-for="mode in CMS_APPLICATION_VIEW_MODES" :key="mode" :value="mode">{{ CMS_APPLICATION_VIEW_MODE_LABELS[mode] }}</option>
          </select>
        </label>

        <label class="form-control gap-2">
          <span class="label"><span class="label-text">{{ t('admin.customizationNewsPage.gridColumns') }}</span></span>
          <select v-model.number="model.settings.newsPage.gridColumns" class="select select-bordered w-full">
            <option :value="1">{{ t('admin.customizationNewsPage.gridColumnOne') }}</option>
            <option :value="2">{{ t('admin.customizationNewsPage.gridColumnTwo') }}</option>
            <option :value="3">{{ t('admin.customizationNewsPage.gridColumnThree') }}</option>
          </select>
        </label>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.newsPage.showSort" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">{{ t('admin.customizationNewsPage.showSort') }}</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.newsPage.showViewToggle" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">{{ t('admin.customizationNewsPage.showViewToggle') }}</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.newsPage.showCoverImage" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">{{ t('admin.customizationNewsPage.showCoverImage') }}</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.newsPage.showPublishedDate" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">{{ t('admin.customizationNewsPage.showPublishedDate') }}</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.newsPage.showExcerpt" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">{{ t('admin.customizationNewsPage.showExcerpt') }}</span>
        </label>

        <label class="form-control gap-2">
          <span class="label"><span class="label-text">{{ t('admin.customizationNewsPage.excerptLines') }}</span></span>
          <select v-model.number="model.settings.newsPage.excerptLines" class="select select-bordered w-full">
            <option :value="2">{{ t('admin.customizationNewsPage.excerptLinesTwo') }}</option>
            <option :value="3">{{ t('admin.customizationNewsPage.excerptLinesThree') }}</option>
            <option :value="4">{{ t('admin.customizationNewsPage.excerptLinesFour') }}</option>
          </select>
        </label>
      </div>

      <ThemeColorPicker v-model="model.settings.newsPage.cardBackgroundColor" :label="t('admin.customizationNewsPage.cardBackground')" :allowed-tokens="CMS_THEME_COLOR_TOKENS" :allow-custom="false" default-token="base-200" />
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-4">
      <div>
        <h2 class="text-xl font-semibold">{{ t('admin.customizationNewsPage.previewTitle') }}</h2>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.customizationNewsPage.previewDescription') }}</p>
      </div>
      <NewsListPage :settings="model.settings.newsPage" :force-articles="true" :preview="true" :disable-seo="true" />
    </section>
  </div>
</template>

<script setup lang="ts">
import NewsListPage from '~/components/pages/NewsListPage.vue'
import ThemeColorPicker from '~/components/admin/ThemeColorPicker.vue'
import AdminPageBuilderTranslationTabs from '~/components/admin/page-builder/TranslationTabs.vue'
import { ADMIN_I18N_PATHS } from '~/shared/adminRoutes'
import { CMS_APPLICATION_VIEW_MODE_LABELS, CMS_APPLICATION_VIEW_MODES, CMS_THEME_COLOR_TOKENS, type CmsNavigationItemPayload, type CmsSiteSettings } from '~/shared/cms'
import { SECTION_CONTAINER_WIDTH_LABELS, SECTION_CONTAINER_WIDTHS } from '~/shared/pageBuilder'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.customizationNews
  }
})

interface SiteShellModel {
  settings: CmsSiteSettings
  navigation: Array<CmsNavigationItemPayload & { id?: number | null }>
}

const { $toast } = useNuxtApp() as any
const { t } = useI18n()
const saving = ref(false)
const { data } = await useFetch<SiteShellModel>('/api/admin/cms/site-shell')

if (!data.value) {
  throw createError({ statusCode: 500, statusMessage: t('admin.customizationNewsPage.loadError') })
}

const model = reactive<SiteShellModel>(structuredClone(data.value))

const save = async () => {
  saving.value = true
  try {
    await $fetch('/api/admin/cms/site-shell', { method: 'PUT', body: model })
    $toast?.success(t('admin.customizationNewsPage.saved'))
  } catch (error: any) {
    $toast?.error(error.statusMessage || t('admin.customizationNewsPage.saveError'))
  } finally {
    saving.value = false
  }
}
</script>
