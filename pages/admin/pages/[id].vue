<template>
  <div class="space-y-6" v-if="page">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Édition de page</h1>
        <p class="mt-1 text-sm opacity-70">
          Structure CMS, métadonnées SEO et rendu de page.
        </p>
      </div>

      <div class="flex gap-2">
        <NuxtLink class="btn btn-outline" :to="localePath('/admin/pages')">Retour</NuxtLink>
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
          Enregistrer
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
                <h2 class="text-lg font-semibold">Configuration</h2>
                <p class="mt-1 text-sm opacity-70">
                  {{ page.path || '/' }} · {{ selectedPageRendererLabel }}
                </p>
              </div>
            </button>

            <div v-if="isPanelOpen('config')" class="mt-5 grid gap-4 md:grid-cols-2">
              <label class="form-control flex flex-col">
                <span class="label-text">Titre interne</span>
                <input v-model="page.title" class="input input-bordered" />
              </label>
              <label class="form-control flex flex-col">
                <span class="label-text">Slug</span>
                <input v-model="page.slug" class="input input-bordered" />
              </label>
              <label class="form-control flex flex-col md:col-span-2">
                <span class="label-text">Chemin public</span>
                <input v-model="page.path" class="input input-bordered" placeholder="/exemple" />
              </label>
              <label class="form-control flex flex-col">
                <span class="label-text">Rendu de page</span>
                <select v-model="selectedPageRenderer" class="select select-bordered">
                  <option v-for="option in pageRendererOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>
              <label class="form-control flex flex-col">
                <span class="label-text">Statut</span>
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
                <h2 class="text-lg font-semibold">Contenu et SEO</h2>
                <p class="mt-1 text-sm opacity-70">
                  Titres traduits, menu et métadonnées.
                </p>
              </div>
            </button>

            <div v-if="isPanelOpen('seo')" class="mt-5 space-y-4">
              <AdminPageBuilderTranslationTabs :model-value="localizedTitle" label="Titre visible" @update:model-value="localizedTitle = $event" />
              <AdminPageBuilderTranslationTabs :model-value="localizedNavigationLabel" label="Libellé menu" @update:model-value="localizedNavigationLabel = $event" />
              <AdminPageBuilderTranslationTabs :model-value="localizedMetaTitle" label="Meta title" @update:model-value="localizedMetaTitle = $event" />
              <AdminPageBuilderTranslationTabs :model-value="localizedMetaDescription" label="Meta description" multiline @update:model-value="localizedMetaDescription = $event" />

              <label class="form-control">
                <span class="label-text">OG image</span>
                <ImageInput v-model="activeTranslation.seo.ogImage" />
              </label>

              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="activeTranslation.seo.noindex" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
                <span class="label-text">Noindex</span>
              </label>
            </div>
          </section>
        </div>
      </div>

      <section v-if="selectedPageRenderer === 'cms'" class="rounded-box border border-base-300 bg-base-100 p-5">
        <button type="button" class="flex w-full cursor-pointer items-center gap-3 text-left" @click="togglePanel('content')">
          <Icon :name="isPanelOpen('content') ? 'mdi:chevron-down' : 'mdi:chevron-right'" size="20" />
          <div class="min-w-0 flex-1">
            <h2 class="text-lg font-semibold">Contenu de page</h2>
            <p class="mt-1 text-sm opacity-70">
              Système d'édition de page par blocs, avec aperçu direct sur la traduction active.
            </p>
          </div>
        </button>

        <div v-if="isPanelOpen('content')" class="mt-5">
          <div role="tablist" class="tabs tabs-lift flex-wrap">
            <button type="button" class="tab cursor-pointer" :class="contentTab === 'editor' ? 'tab-active' : ''" @click="contentTab = 'editor'">
              Éditeur
            </button>
            <button type="button" class="tab cursor-pointer" :class="contentTab === 'preview' ? 'tab-active' : ''" @click="contentTab = 'preview'">
              Aperçu
            </button>
          </div>

          <div v-if="contentTab === 'editor'" class="rounded-b-box rounded-tr-box border border-base-300 border-t-0 p-5">
            <CmsPageContentBuilder :content="activeTranslation.content" />
          </div>

          <div v-else class="rounded-b-box rounded-tr-box border border-base-300 border-t-0 bg-base-200 p-5">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div class="text-sm opacity-70">
                Rendu réel de la page pour la langue <strong>{{ activeLocale === 'fr' ? 'FR' : 'EN' }}</strong>.
              </div>
            </div>

            <div class="overflow-hidden rounded-[2rem] border border-base-300 bg-base-100">
              <PageRenderer
                :content="activeTranslation.content"
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
            <h2 class="text-lg font-semibold">Page branchée sur composant</h2>
            <p class="mt-1 text-sm opacity-70">
              Cette page utilisera le composant <strong>{{ selectedPageRendererLabel }}</strong>. Le branchement complet sera fait au moment de l’intégration métier.
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
import type { CmsLocale, CmsPagePayload } from '~/shared/cms'

definePageMeta({ layout: 'admin', middleware: 'auth' })

interface CmsPageEditor extends CmsPagePayload {
  id: number
}

const route = useRoute()
const localePath = useLocalePath()
const { $toast } = useNuxtApp() as any
const activeLocale = ref<CmsLocale>('fr')
const contentTab = ref<'editor' | 'preview'>('editor')
const saving = ref(false)
const openPanelIds = ref<string[]>([])
const pageRendererOptions = [
  { value: 'cms', label: 'Page CMS' },
  { value: 'news', label: 'Actualités' },
  { value: 'baskets', label: 'Paniers' },
  { value: 'shop', label: 'Boutique' },
  { value: 'events', label: 'Événements' }
] as const

const { data } = await useFetch<CmsPageEditor>(`/api/admin/cms/pages/${route.params.id}`)
if (!data.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page CMS introuvable'
  })
}

const page = reactive<CmsPageEditor>(structuredClone(data.value))

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
    await $fetch(`/api/admin/cms/pages/${page.id}`, {
      method: 'PUT',
      body: page
    })
    $toast?.success('Page enregistrée')
  } catch (error: any) {
    $toast?.error(error.statusMessage || 'Erreur lors de l’enregistrement')
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
