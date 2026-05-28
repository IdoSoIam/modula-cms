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
        <NuxtLink class="btn btn-outline" :to="localePath('/admin/content/pages')">{{ t('admin.pageEditorPage.back') }}</NuxtLink>
        <a
          v-if="liveEditAvailable"
          class="btn btn-outline"
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
              <label class="label cursor-pointer justify-start gap-3 md:col-span-2">
                <input
                  :checked="page.specialRole === 'construction'"
                  type="checkbox"
                  class="checkbox checkbox-primary checkbox-sm"
                  @change="page.specialRole = ($event.target as HTMLInputElement).checked ? 'construction' : null"
                >
                <span class="label-text">Cette page est la page de construction du site</span>
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
              <AdminPageBuilderTranslationTabs
                :model-value="applicationLocalizedTitle ?? localizedTitle"
                :label="t('admin.pageEditorPage.visibleTitle')"
                @update:model-value="updateVisibleTitle"
              />
              <AdminPageBuilderTranslationTabs
                v-if="applicationLocalizedSubtitle"
                :model-value="applicationLocalizedSubtitle"
                :label="t('admin.pageEditorPage.visibleSubtitle')"
                multiline
                @update:model-value="updateVisibleSubtitle"
              />
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
import CmsPageContentBuilder from '#modula/components/admin/cms/CmsPageContentBuilder.vue'
import AdminPageBuilderTranslationTabs from '#modula/components/admin/page-builder/TranslationTabs.vue'
import PageRenderer from '#modula/components/page-builder/PageRenderer.vue'
import ImageInput from '#modula/components/ImageInput.vue'
import { ADMIN_I18N_PATHS } from '#modula/shared/adminRoutes'
import type { CmsLocale, CmsNavigationItemPayload, CmsPagePayload, CmsSiteSettings } from '#modula/shared/cms'
import { clonePageBuilderContent, type PageBuilderContent } from '#modula/shared/pageBuilder'

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
const allPageRendererOptions = [
  { value: 'cms', label: t('admin.pageEditorPage.rendererCms') },
  { value: 'news', label: t('admin.pageEditorPage.rendererNews') },
  { value: 'baskets', label: t('admin.pageEditorPage.rendererBaskets') },
  { value: 'shop', label: t('admin.pageEditorPage.rendererShop') },
  { value: 'events', label: t('admin.pageEditorPage.rendererEvents') },
  { value: 'planning', label: t('admin.pageEditorPage.rendererPlanning') }
] as const

const { data } = await useFetch<CmsPageEditor>(`/api/admin/cms/pages/${route.params.id}`)
const { data: siteShellData } = await useFetch<{ settings: CmsSiteSettings, navigation: Array<CmsNavigationItemPayload & { id?: number | null }>, featureFlags: {
  inDevelopment: boolean
  registerEnabled: boolean
  subscriptionsEnabled: boolean
  shop: {
    enabled: boolean
    basketsEnabled: boolean
    vegetablesEnabled: boolean
  }
  associationRolesEnabled: boolean
  eventsEnabled: boolean
  newsEnabled: boolean
} }>('/api/admin/cms/site-shell')
if (!data.value) {
  throw createError({
    statusCode: 404,
    statusMessage: t('admin.pageEditorPage.notFound')
  })
}
if (!siteShellData.value) {
  throw createError({
    statusCode: 500,
    statusMessage: t('admin.pageEditorPage.loadError')
  })
}

const page = reactive<CmsPageEditor>(structuredClone(data.value))
const siteShellModel = reactive(structuredClone(siteShellData.value))
const featureFlags = computed(() => siteShellModel.featureFlags)

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
    if (page.rendererKey === 'planning') return 'planning'
    return 'cms'
  },
  set: (value: 'cms' | 'news' | 'baskets' | 'shop' | 'events' | 'planning') => {
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

const pageRendererOptions = computed(() => allPageRendererOptions.filter((option) => {
  if (option.value === 'news') return featureFlags.value.newsEnabled
  if (option.value === 'baskets') return featureFlags.value.shop.enabled && featureFlags.value.shop.basketsEnabled
  if (option.value === 'shop') return featureFlags.value.shop.enabled && (featureFlags.value.shop.basketsEnabled || featureFlags.value.shop.vegetablesEnabled)
  if (option.value === 'events' || option.value === 'planning') return featureFlags.value.eventsEnabled
  return true
}))

const selectedPageRendererLabel = computed(() =>
  pageRendererOptions.value.find(option => option.value === selectedPageRenderer.value)?.label || page.rendererKey || 'Page CMS'
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
const applicationLocalizedTitle = computed<null | { fr: string, en: string }>(() => {
  if (selectedPageRenderer.value === 'baskets') return siteShellModel.settings.basketsPage.title
  if (selectedPageRenderer.value === 'news') return siteShellModel.settings.newsPage.title
  if (selectedPageRenderer.value === 'events') return siteShellModel.settings.eventsPage.title
  if (selectedPageRenderer.value === 'planning') return siteShellModel.settings.planningPage.title
  return null
})
const applicationLocalizedSubtitle = computed<null | { fr: string, en: string }>(() => {
  if (selectedPageRenderer.value === 'baskets') return siteShellModel.settings.basketsPage.subtitle
  if (selectedPageRenderer.value === 'news') return siteShellModel.settings.newsPage.subtitle
  if (selectedPageRenderer.value === 'events') return siteShellModel.settings.eventsPage.subtitle
  if (selectedPageRenderer.value === 'planning') return siteShellModel.settings.planningPage.subtitle
  return null
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

const liveEditAvailable = computed(() => selectedPageRenderer.value === 'cms' && Boolean(page.path?.trim()))

const isPanelOpen = (id: string) => openPanelIds.value.includes(id)

const togglePanel = (id: string) => {
  if (isPanelOpen(id)) {
    openPanelIds.value = openPanelIds.value.filter(panelId => panelId !== id)
    return
  }

  openPanelIds.value = [...openPanelIds.value, id]
}

const updateVisibleTitle = (value: { fr: string, en: string }) => {
  if (selectedPageRenderer.value === 'baskets') {
    siteShellModel.settings.basketsPage.title = structuredClone(value)
    return
  }
  if (selectedPageRenderer.value === 'news') {
    siteShellModel.settings.newsPage.title = structuredClone(value)
    return
  }
  if (selectedPageRenderer.value === 'events') {
    siteShellModel.settings.eventsPage.title = structuredClone(value)
    return
  }
  if (selectedPageRenderer.value === 'planning') {
    siteShellModel.settings.planningPage.title = structuredClone(value)
    return
  }
  localizedTitle.value = value
}

const updateVisibleSubtitle = (value: { fr: string, en: string }) => {
  if (selectedPageRenderer.value === 'baskets') {
    siteShellModel.settings.basketsPage.subtitle = structuredClone(value)
    return
  }
  if (selectedPageRenderer.value === 'news') {
    siteShellModel.settings.newsPage.subtitle = structuredClone(value)
    return
  }
  if (selectedPageRenderer.value === 'events') {
    siteShellModel.settings.eventsPage.subtitle = structuredClone(value)
    return
  }
  if (selectedPageRenderer.value === 'planning') {
    siteShellModel.settings.planningPage.subtitle = structuredClone(value)
  }
}

const save = async () => {
  saving.value = true
  try {
    synchronizeSharedContent(sharedContent.value)
    await Promise.all([
      $fetch(`/api/admin/cms/pages/${page.id}`, {
        method: 'PUT',
        body: page
      }),
      $fetch('/api/admin/cms/site-shell', {
        method: 'PUT',
        body: siteShellModel
      })
    ])
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
