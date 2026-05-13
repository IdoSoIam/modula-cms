<template>
  <div class="relative">
    <CmsPageRenderer
      :resolved-page="editableResolvedPage"
      :locale="locale"
      :editable="liveEditEnabled"
      @edit="openLiveEditor"
    />

    <PageEditModal
      :open="liveEditEnabled && modalOpen"
      :target="activeTarget"
      @close="modalOpen = false"
    />

    <div
      v-if="liveEditEnabled"
      class="pointer-events-none fixed bottom-5 right-5 z-[120] flex justify-end"
    >
      <div class="pointer-events-auto flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100/95 px-4 py-3 shadow-xl backdrop-blur">
        <div class="text-sm">
          <div class="font-semibold">LiveEdit actif</div>
          <div class="opacity-65">Page : {{ editableResolvedPage.path }}</div>
        </div>

        <button
          type="button"
          class="btn btn-sm btn-outline"
          :disabled="loadingEditor"
          @click="reloadEditorPage"
        >
          Recharger
        </button>

        <button
          type="button"
          class="btn btn-sm btn-primary"
          :disabled="saving || loadingEditor"
          @click="saveLiveEdit"
        >
          <span v-if="saving" class="loading loading-spinner loading-xs" />
          Enregistrer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CmsLocale, CmsPagePayload, ResolvedCmsPage } from '~/shared/cms'
import type { PageBuilderEditTarget } from '~/shared/pageBuilderEditor'
import CmsPageRenderer from '~/components/cms/CmsPageRenderer.vue'
import PageEditModal from '~/components/page-builder/PageEditModal.vue'
import { useAuthStore } from '~/stores/auth'

interface CmsPageEditor extends CmsPagePayload {
  id: number
}

const props = defineProps<{
  resolvedPage: ResolvedCmsPage
}>()

const route = useRoute()
const { locale } = useI18n()
const authStore = useAuthStore()
const { $toast } = useNuxtApp() as any
const cloneCmsData = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const editableResolvedPage = ref<ResolvedCmsPage>(cloneCmsData(props.resolvedPage))
const editorPage = ref<CmsPageEditor | null>(null)
const activeTarget = ref<PageBuilderEditTarget | null>(null)
const modalOpen = ref(false)
const loadingEditor = ref(false)
const saving = ref(false)
const liveEditHydrated = ref(false)

const currentLocale = computed<CmsLocale>(() => locale.value === 'en' ? 'en' : 'fr')
const wantsLiveEdit = computed(() => route.query.liveEdit === '1')
const liveEditEnabled = computed(() =>
  liveEditHydrated.value
  && wantsLiveEdit.value
  && authStore.isAdmin
  && editableResolvedPage.value.pageType !== 'APPLICATION'
)

onMounted(() => {
  liveEditHydrated.value = true
})

watch(() => props.resolvedPage, (value) => {
  editableResolvedPage.value = cloneCmsData(value)
  syncLocalizedContentFromEditor()
}, { deep: true, immediate: true })

watch(currentLocale, () => {
  syncLocalizedContentFromEditor()
})

usePageSeo({
  title: computed(() => editableResolvedPage.value.seo.metaTitle || editableResolvedPage.value.title),
  description: computed(() => editableResolvedPage.value.seo.metaDescription || ''),
  noindex: computed(() => editableResolvedPage.value.seo.noindex)
})

function syncLocalizedContentFromEditor() {
  if (!editorPage.value) return
  const translation = editorPage.value.translations?.[currentLocale.value]
    ?? editorPage.value.translations?.fr
    ?? editorPage.value.translations?.en

  if (!translation) return

  editableResolvedPage.value = {
    ...editableResolvedPage.value,
    title: translation.title || editorPage.value.title,
    navigationLabel: translation.navigationLabel || translation.title || editorPage.value.title,
    seo: cloneCmsData(translation.seo),
    content: cloneCmsData(translation.content)
  }
}

function getErrorMessage(error: any, fallback: string) {
  return error?.data?.statusMessage
    || error?.statusMessage
    || error?.data?.message
    || error?.message
    || fallback
}

async function bootstrapCurrentPage() {
  const page = await $fetch<CmsPageEditor>('/api/admin/cms/bootstrap-current', {
    method: 'POST',
    body: {
      resolvedPage: cloneCmsData(editableResolvedPage.value),
      locale: currentLocale.value
    }
  })

  editorPage.value = cloneCmsData(page)
  editableResolvedPage.value = {
    ...editableResolvedPage.value,
    id: page.id
  }
  syncLocalizedContentFromEditor()
  return editorPage.value
}

async function ensureEditorPage() {
  if (!liveEditEnabled.value) return null
  if (editorPage.value) return editorPage.value

  loadingEditor.value = true
  try {
    if (!editableResolvedPage.value.id) {
      return await bootstrapCurrentPage()
    }

    const page = await $fetch<CmsPageEditor>(`/api/admin/cms/pages/${editableResolvedPage.value.id}`)
    editorPage.value = cloneCmsData(page)
    syncLocalizedContentFromEditor()
    return editorPage.value
  } catch (error: any) {
    if (editableResolvedPage.value.path === '/' || error?.statusCode === 404) {
      try {
        return await bootstrapCurrentPage()
      } catch (bootstrapError: any) {
        console.error('LiveEdit bootstrap failed', bootstrapError)
        $toast?.error(getErrorMessage(bootstrapError, 'Impossible d’initialiser la page CMS'))
        return null
      }
    }

    console.error('LiveEdit load failed', error)
    $toast?.error(getErrorMessage(error, 'Impossible de charger la page CMS'))
    return null
  } finally {
    loadingEditor.value = false
  }
}

async function reloadEditorPage() {
  if (!liveEditEnabled.value) return
  editorPage.value = null
  await ensureEditorPage()
}

async function openLiveEditor(target: PageBuilderEditTarget) {
  const page = await ensureEditorPage()
  if (!page) return
  activeTarget.value = target
  modalOpen.value = true
}

async function saveLiveEdit() {
  const page = await ensureEditorPage()
  if (!page) return

  saving.value = true
  try {
    if (!page.translations?.[currentLocale.value]) {
      page.translations = {
        fr: page.translations?.fr ?? {
          title: page.title,
          navigationLabel: page.title,
          seo: cloneCmsData(editableResolvedPage.value.seo),
          content: cloneCmsData(editableResolvedPage.value.content)
        },
        en: page.translations?.en ?? {
          title: page.title,
          navigationLabel: page.title,
          seo: cloneCmsData(editableResolvedPage.value.seo),
          content: cloneCmsData(editableResolvedPage.value.content)
        }
      }
    }

    page.translations[currentLocale.value].content = cloneCmsData(editableResolvedPage.value.content)
    const saved = await $fetch<CmsPageEditor>(`/api/admin/cms/pages/${page.id}`, {
      method: 'PUT',
      body: page
    })
    editorPage.value = cloneCmsData(saved)
    editableResolvedPage.value = {
      ...editableResolvedPage.value,
      id: saved.id
    }
    syncLocalizedContentFromEditor()
    $toast?.success('Page enregistrée')
  } catch (error: any) {
    console.error('LiveEdit save failed', error)
    $toast?.error(getErrorMessage(error, 'Erreur lors de l’enregistrement'))
  } finally {
    saving.value = false
  }
}
</script>
