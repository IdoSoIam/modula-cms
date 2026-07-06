<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.customizationBasketsPage.title') }}</h1>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.customizationBasketsPage.description') }}</p>
      </div>
      <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
        <span v-if="saving" class="loading loading-spinner loading-sm" />
        {{ t('admin.common.save') }}
      </button>
    </div>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
      <AdminPageBuilderTranslationTabs :model-value="model.settings.basketsPage.title" :label="t('admin.customizationBasketsPage.titleField')" />
      <AdminPageBuilderTranslationTabs :model-value="model.settings.basketsPage.subtitle" :label="t('admin.customizationBasketsPage.subtitleField')" multiline />

      <div class="grid gap-4 lg:grid-cols-3">
        <label class="form-control gap-2">
          <span class="label"><span class="label-text">{{ t('admin.customizationBasketsPage.containerWidth') }}</span></span>
          <select v-model="model.settings.basketsPage.containerWidth" class="select select-bordered w-full">
            <option v-for="width in SECTION_CONTAINER_WIDTHS" :key="width" :value="width">{{ SECTION_CONTAINER_WIDTH_LABELS[width] }}</option>
          </select>
        </label>

        <label class="form-control gap-2">
          <span class="label"><span class="label-text">{{ t('admin.customizationBasketsPage.gridColumns') }}</span></span>
          <select v-model.number="model.settings.basketsPage.gridColumns" class="select select-bordered w-full">
            <option v-for="count in CMS_APPLICATION_GRID_COLUMNS" :key="count" :value="count">{{ CMS_APPLICATION_GRID_COLUMN_LABELS[count] }}</option>
          </select>
        </label>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.basketsPage.showOrdersBanner" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text text-wrap">{{ t('admin.customizationBasketsPage.showOrdersBanner') }}</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.basketsPage.showImages" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text text-wrap">{{ t('admin.customizationBasketsPage.showImages') }}</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.basketsPage.showDescriptions" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text text-wrap">{{ t('admin.customizationBasketsPage.showDescriptions') }}</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.basketsPage.showComposition" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text text-wrap">{{ t('admin.customizationBasketsPage.showComposition') }}</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.basketsPage.showAvailabilityBadges" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text text-wrap">{{ t('admin.customizationBasketsPage.showAvailabilityBadges') }}</span>
        </label>
        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="model.settings.basketsPage.showPrice" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text text-wrap">{{ t('admin.customizationBasketsPage.showPrice') }}</span>
      </label>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <ThemeColorPicker v-model="model.settings.basketsPage.cardBackgroundColor" :label="t('admin.customizationBasketsPage.cardBackground')" :allowed-tokens="CMS_THEME_COLOR_TOKENS" :allow-custom="false" default-token="base-200" />
        <ThemeColorPicker v-model="model.settings.basketsPage.itemBackgroundColor" :label="t('admin.customizationBasketsPage.itemBackground')" :allowed-tokens="CMS_THEME_COLOR_TOKENS" :allow-custom="false" default-token="base-200" />
      </div>
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-2 space-y-4">
      <div class="px-4 py-2">
        <h2 class="text-xl font-semibold">{{ t('admin.customizationBasketsPage.previewTitle') }}</h2>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.customizationBasketsPage.previewDescription') }}</p>
      </div>
      <ShopPage :settings="model.settings.basketsPage" />
    </section>
  </div>
</template>

<script setup lang="ts">
import ShopPage from '#modula/components/pages/ShopPage.vue'
import ThemeColorPicker from '#modula/components/admin/ThemeColorPicker.vue'
import AdminPageBuilderTranslationTabs from '#modula/components/admin/page-builder/TranslationTabs.vue'
import { CMS_APPLICATION_GRID_COLUMNS, CMS_APPLICATION_GRID_COLUMN_LABELS, CMS_THEME_COLOR_TOKENS, type CmsNavigationItemPayload, type CmsSiteSettings } from '#modula/shared/cms'
import { SECTION_CONTAINER_WIDTH_LABELS, SECTION_CONTAINER_WIDTHS } from '#modula/shared/pageBuilder'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'})

interface SiteShellModel {
  settings: CmsSiteSettings
  navigation: Array<CmsNavigationItemPayload & { id?: number | null }>
}

const { $toast } = useNuxtApp() as any
const { t } = useI18n()
const saving = ref(false)
const { data } = await useFetch<SiteShellModel>('/api/admin/cms/site-shell')

if (!data.value) {
  throw createError({ statusCode: 500, statusMessage: t('admin.customizationBasketsPage.loadError') })
}

const model = reactive<SiteShellModel>(structuredClone(data.value))

const save = async () => {
  saving.value = true
  try {
    await $fetch('/api/admin/cms/site-shell', { method: 'PUT', body: model })
    $toast?.success(t('admin.customizationBasketsPage.saved'))
  } catch (error: any) {
    $toast?.error(error.statusMessage || t('admin.customizationBasketsPage.saveError'))
  } finally {
    saving.value = false
  }
}
</script>
