<template>
  <div class="space-y-6" v-if="page">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.pageEditorPage.title') }}</h1>
        <p class="mt-1 text-sm opacity-70">
          {{ t('admin.pageEditorPage.description') }}
        </p>
      </div>

      <div class="flex gap-2">
        <NuxtLink class="btn btn-outline" :to="localePath('/admin/pages')">{{ t('admin.pageEditorPage.back') }}</NuxtLink>
        <a
          class="btn btn-outline"
          :class="liveEditDisabled ? 'btn-disabled pointer-events-none opacity-50' : ''"
          :href="liveEditUrl"
          target="_blank"
          rel="noreferrer"
        >
          LiveEdit
        </a>
        <button type="button" class="btn btn-primary" :disabled="saving" @click="save">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          {{ t('admin.common.save') }}
        </button>
      </div>
    </div>

    <div class="space-y-6">
      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div class="space-y-6">
          <section class="rounded-box border border-base-300 bg-base-100 p-5">
            <button type="button" class="flex w-full cursor-pointer items-center gap-3 text-left" @click="togglePanel('config')">
              <Icon :name="isPanelOpen('config') ? 'mdi:chevron-down' : 'mdi:chevron-right'" size="20" />
              <div class="min-w-0 flex-1">
                <h2 class="text-lg font-semibold">{{ t('admin.pageEditorPage.configuration') }}</h2>
                <p class="mt-1 text-sm opacity-70">
                  {{ page.path || '/' }} · {{ selectedPageRendererLabel }}
                </p>
              </div>
            </button>

            <div v-if="isPanelOpen('config')" class="mt-5 grid gap-4 md:grid-cols-2">
              <label class="form-control flex flex-col">
                <span class="label-text">{{ t('admin.pageEditorPage.internalTitle') }}</span>
                <input v-model="page.title" class="input input-bordered" />
              </label>
              <label class="form-control flex flex-col">
                <span class="label-text">{{ t('admin.pageEditorPage.slug') }}</span>
                <input v-model="page.slug" class="input input-bordered" />
              </label>
              <label class="form-control flex flex-col md:col-span-2">
                <span class="label-text">{{ t('admin.pageEditorPage.publicPath') }}</span>
                <input v-model="page.path" class="input input-bordered" :placeholder="t('admin.pageEditorPage.publicPathPlaceholder')" />
              </label>
              <label class="form-control flex flex-col">
                <span class="label-text">{{ t('admin.pageEditorPage.renderer') }}</span>
                <select v-model="selectedPageRenderer" class="select select-bordered">
                  <option v-for="option in pageRendererOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <label class="form-control flex flex-col">
                <span class="label-text">{{ t('admin.pageEditorPage.status') }}</span>
                <select v-model="page.status" class="select select-bordered">
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                </select>
              </label>
            </div>
          </section>

          <section class="rounded-box border border-base-300 bg-base-100 p-5">
            <button type="button" class="flex w-full cursor-pointer items-center gap-3 text-left" @click="togglePanel('seo')">
              <Icon :name="isPanelOpen('seo') ? 'mdi:chevron-down' : 'mdi:chevron-right'" size="20" />
              <div class="min-w-0 flex-1">
                <h2 class="text-lg font-semibold">{{ t('admin.pageEditorPage.seoTitle') }}</h2>
                <p class="mt-1 text-sm opacity-70">
                  {{ t('admin.pageEditorPage.seoDescription') }}
                </p>
              </div>
            </button>

            <div v-if="isPanelOpen('seo')" class="mt-5 space-y-4">
              <AdminPageBuilderTranslationTabs :model-value="localizedTitle" :label="t('admin.pageEditorPage.visibleTitle')" @update:model-value="localizedTitle = $event" />
              <AdminPageBuilderTranslationTabs :model-value="localizedNavigationLabel" :label="t('admin.pageEditorPage.navigationLabel')" @update:model-value="localizedNavigationLabel = $event" />
              <AdminPageBuilderTranslationTabs :model-value="localizedMetaTitle" :label="t('admin.pageEditorPage.metaTitle')" @update:model-value="localizedMetaTitle = $event" />
              <AdminPageBuilderTranslationTabs :model-value="localizedMetaDescription" :label="t('admin.pageEditorPage.metaDescription')" multiline @update:model-value="localizedMetaDescription = $event" />

              <label class="form-control">
                <span class="label-text">{{ t('admin.pageEditorPage.ogImage') }}</span>
                <ImageInput v-model="activeTranslation.seo.ogImage" />
              </label>

              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="activeTranslation.seo.noindex" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
                <span class="label-text">{{ t('admin.pageEditorPage.noindex') }}</span>
              </label>
            </div>
          </section>
        </div>
      </div>

      <section v-if="selectedPageRenderer === 'cms'" class="rounded-box border border-base-300 bg-base-100 p-5">
        <button type="button" class="flex w-full cursor-pointer items-center gap-3 text-left" @click="togglePanel('content')">
          <Icon :name="isPanelOpen('content') ? 'mdi:chevron-down' : 'mdi:chevron-right'" size="20" />
          <div class="min-w-0 flex-1">
            <h2 class="text-lg font-semibold">{{ t('admin.pageEditorPage.contentTitle') }}</h2>
            <p class="mt-1 text-sm opacity-70">
              {{ t('admin.pageEditorPage.contentDescription') }}
            </p>
          </div>
        </button>

        <div v-if="isPanelOpen('content')" class="mt-5">
          <div role="tablist" class="tabs tabs-lift flex-wrap">
            <button type="button" class="tab cursor-pointer" :class="contentTab === 'editor' ? 'tab-active' : ''" @click="contentTab = 'editor'">
              {{ t('admin.pageEditorPage.editorTab') }}
            </button>
            <button type="button" class="tab cursor-pointer" :class="contentTab === 'preview' ? 'tab-active' : ''" @click="contentTab = 'preview'">
              {{ t('admin.pageEditorPage.previewTab') }}
            </button>
          </div>

          <div v-if="contentTab === 'editor'" class="rounded-b-box rounded-tr-box border border-base-300 border-t-0 p-5">
            <CmsPageContentBuilder :content="sharedContent" />
          </div>

          <div v-else class="rounded-b-box rounded-tr-box border border-base-300 border-t-0 bg-base-200 p-5">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div class="text-sm opacity-70">
                {{ t('admin.pageEditorPage.previewLanguage', { locale: activeLocale === 'fr' ? 'FR' : 'EN' }) }}
              </div>
            </div>

            <div class="overflow-hidden rounded-[2rem] border border-base-300 bg-base-100">
              <PageRenderer
                :content="sharedContent"
                :locale="activeLocale"
              />
            </div>
          </div>
        </div>
      </section>

      <section v-else class="rounded-box border border-base-300 bg-base-100 p-5">
        <div class="flex items-start gap-3">
          <Icon name="mdi:puzzle-outline" size="22" class="mt-0.5 opacity-70" />
          <div>
            <h2 class="text-lg font-semibold">{{ t('admin.pageEditorPage.componentPageTitle') }}</h2>
            <p class="mt-1 text-sm opacity-70">
              {{ t('admin.pageEditorPage.componentPageDescription', { component: selectedPageRendererLabel }) }}
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import CmsPageContentBuilder from '~/components/admin/cms/CmsPageContentBuilder.vue'
import AdminPageBuilderTranslationTabs from '~/components/admin/page-builder/TranslationTabs.vue'
import PageRenderer from '~/components/page-builder/PageRenderer.vue'
import ImageInput from '~/components/ImageInput.vue'
import { ADMIN_I18N_PATHS } from '~/shared/adminRoutes'
import type { CmsLocale, CmsPagePayload } from '~/shared/cms'
import { clonePageBuilderContent, type PageBuilderContent } from '~/shared/pageBuilder'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.pageEditor
  }
})

interface CmsPageEditor extends CmsPagePayload {
  id: number
}

const route = useRoute()
const localePath = useLocalePath()
const { $toast } = useNuxtApp() as any
const { t } = useI18n()
const activeLocale = ref<CmsLocale>('fr')
const contentTab = ref<'editor' | 'preview'>('editor')
const saving = ref(false)
const openPanelIds = ref<string[]>([])
const pageRendererOptions = [
  { value: 'cms', label: t('admin.pageEditorPage.rendererCms') },
  { value: 'news', label: t('admin.pageEditorPage.rendererNews') },
  { value: 'baskets', label: t('admin.pageEditorPage.rendererBaskets') },
  { value: 'shop', label: t('admin.pageEditorPage.rendererShop') },
  { value: 'events', label: t('admin.pageEditorPage.rendererEvents') }
] as const

const { data } = await useFetch<CmsPageEditor>(`/api/admin/cms/pages/${route.params.id}`)
if (!data.value) {
  throw createError({
    statusCode: 404,
    statusMessage: t('admin.pageEditorPage.notFound')
  })
}

const page = reactive<CmsPageEditor>(structuredClone(data.value))

const isEmptyPageBuilderContent = (content: PageBuilderContent | null | undefined) =>
  !content || !Array.isArray(content.sections) || content.sections.length === 0

const resolveSharedContent = () => {
  if (!isEmptyPageBuilderContent(page.translations.fr.content)) {
    return clonePageBuilderContent(page.translations.fr.content)
  }

  if (!isEmptyPageBuilderContent(page.translations.en.content)) {
    return clonePageBuilderContent(page.translations.en.content)
  }

  return clonePageBuilderContent(page.translations.fr.content)
}

const synchronizeSharedContent = (content: PageBuilderContent) => {
  page.translations.fr.content = clonePageBuilderContent(content)
  page.translations.en.content = clonePageBuilderContent(content)
}

synchronizeSharedContent(resolveSharedContent())

const selectedPageRenderer = computed({
  get: () => {
    if (page.rendererKey === 'news') return 'news'
    if (page.rendererKey === 'baskets') return 'baskets'
    if (page.rendererKey === 'shop') return 'shop'
    if (page.rendererKey === 'events') return 'events'
    return 'cms'
  },
  set: (value: 'cms' | 'news' | 'baskets' | 'shop' | 'events') => {
    if (value === 'cms') {
      page.pageType = 'CMS'
      page.templateKey = 'default'
      page.rendererKey = ''
      page.applicationPosition = 'AFTER_CONTENT'
      return
    }

    page.pageType = 'APPLICATION'
    page.templateKey = 'default'
    page.rendererKey = value
    page.applicationPosition = 'AFTER_CONTENT'
  }
})

const selectedPageRendererLabel = computed(() =>
  pageRendererOptions.find(option => option.value === selectedPageRenderer.value)?.label || 'Page CMS'
)

const activeTranslation = computed(() => page.translations[activeLocale.value])
const sharedContent = computed(() => page.translations.fr.content)
const localizedTitle = computed({
  get: () => ({
    fr: page.translations.fr.title,
    en: page.translations.en.title
  }),
  set: (value: { fr: string, en: string }) => {
    page.translations.fr.title = value.fr
    page.translations.en.title = value.en
  }
})
const localizedNavigationLabel = computed({
  get: () => ({
    fr: page.translations.fr.navigationLabel,
    en: page.translations.en.navigationLabel
  }),
  set: (value: { fr: string, en: string }) => {
    page.translations.fr.navigationLabel = value.fr
    page.translations.en.navigationLabel = value.en
  }
})
const localizedMetaTitle = computed({
  get: () => ({
    fr: page.translations.fr.seo.metaTitle,
    en: page.translations.en.seo.metaTitle
  }),
  set: (value: { fr: string, en: string }) => {
    page.translations.fr.seo.metaTitle = value.fr
    page.translations.en.seo.metaTitle = value.en
  }
})
const localizedMetaDescription = computed({
  get: () => ({
    fr: page.translations.fr.seo.metaDescription,
    en: page.translations.en.seo.metaDescription
  }),
  set: (value: { fr: string, en: string }) => {
    page.translations.fr.seo.metaDescription = value.fr
    page.translations.en.seo.metaDescription = value.en
  }
})

const normalizePublicPath = (path: string) => {
  const trimmed = path.trim()
  if (!trimmed) return '/'
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

const liveEditUrl = computed(() => {
  const publicPath = localePath(normalizePublicPath(page.path))
  const separator = publicPath.includes('?') ? '&' : '?'
  return `${publicPath}${separator}liveEdit=1`
})

const liveEditDisabled = computed(() => !page.path?.trim())

const isPanelOpen = (id: string) => openPanelIds.value.includes(id)

const togglePanel = (id: string) => {
  if (isPanelOpen(id)) {
    openPanelIds.value = openPanelIds.value.filter(panelId => panelId !== id)
    return
  }

  openPanelIds.value = [...openPanelIds.value, id]
}

const save = async () => {
  saving.value = true
  try {
    synchronizeSharedContent(sharedContent.value)
    await $fetch(`/api/admin/cms/pages/${page.id}`, {
      method: 'PUT',
      body: page
    })
    $toast?.success(t('admin.pageEditorPage.saved'))
  } catch (error: any) {
    $toast?.error(error.statusMessage || t('admin.pageEditorPage.saveError'))
  } finally {
    saving.value = false
  }
}

watch(selectedPageRenderer, () => {
  if (selectedPageRenderer.value !== 'cms' && contentTab.value !== 'editor') {
    contentTab.value = 'editor'
  }
}, { immediate: true })
</script>
