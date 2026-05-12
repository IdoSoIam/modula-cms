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

const editableResolvedPage = ref<ResolvedCmsPage>(structuredClone(props.resolvedPage))
const editorPage = ref<CmsPageEditor | null>(null)
const activeTarget = ref<PageBuilderEditTarget | null>(null)
const modalOpen = ref(false)
const loadingEditor = ref(false)
const saving = ref(false)

const currentLocale = computed<CmsLocale>(() => locale.value === 'en' ? 'en' : 'fr')
const wantsLiveEdit = computed(() => route.query.liveEdit === '1')
const liveEditEnabled = computed(() =>
  import.meta.client
  && wantsLiveEdit.value
  && authStore.isAdmin
  && editableResolvedPage.value.id !== null
  && editableResolvedPage.value.pageType !== 'APPLICATION'
)

watch(() => props.resolvedPage, (value) => {
  editableResolvedPage.value = structuredClone(value)
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
  const translation = editorPage.value.translations[currentLocale.value]
  editableResolvedPage.value = {
    ...editableResolvedPage.value,
    title: translation.title || editorPage.value.title,
    navigationLabel: translation.navigationLabel || translation.title || editorPage.value.title,
    seo: structuredClone(translation.seo),
    content: structuredClone(translation.content)
  }
}

async function ensureEditorPage() {
  if (!liveEditEnabled.value || !editableResolvedPage.value.id) return null
  if (editorPage.value) return editorPage.value

  loadingEditor.value = true
  try {
    const page = await $fetch<CmsPageEditor>(`/api/admin/cms/pages/${editableResolvedPage.value.id}`)
    editorPage.value = structuredClone(page)
    syncLocalizedContentFromEditor()
    return editorPage.value
  } catch (error: any) {
    $toast?.error(error?.statusMessage || 'Impossible de charger la page CMS')
    return null
  } finally {
    loadingEditor.value = false
  }
}

async function reloadEditorPage() {
  if (!liveEditEnabled.value || !editableResolvedPage.value.id) return
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
  if (!page || !editableResolvedPage.value.id) return

  saving.value = true
  try {
    page.translations[currentLocale.value].content = structuredClone(editableResolvedPage.value.content)
    const saved = await $fetch<CmsPageEditor>(`/api/admin/cms/pages/${editableResolvedPage.value.id}`, {
      method: 'PUT',
      body: page
    })
    editorPage.value = structuredClone(saved)
    syncLocalizedContentFromEditor()
    $toast?.success('Page enregistrée')
  } catch (error: any) {
    $toast?.error(error?.statusMessage || 'Erreur lors de l’enregistrement')
  } finally {
    saving.value = false
  }
}
</script>
