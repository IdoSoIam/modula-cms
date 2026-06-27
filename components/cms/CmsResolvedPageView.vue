<template>
  <div class="relative">
    <CmsPageRenderer
      :resolved-page="editableResolvedPage"
      :locale="locale"
      :editable="liveEditEnabled"
      @edit="openLiveEditor"
    />

    <div
      v-if="showEnterLiveEditButton"
      class="pointer-events-none fixed bottom-5 right-5 z-[120] flex justify-end"
    >
      <div class="pointer-events-auto rounded-2xl border border-base-300 bg-base-100/95 px-3 py-3 shadow-xl backdrop-blur">
        <button type="button" class="btn btn-sm btn-outline" @click="toggleLiveEdit(true)">
          Éditer la page
        </button>
      </div>
    </div>

    <ClientOnly>
      <PageEditModal
        :open="liveEditEnabled && modalOpen"
        :target="activeTarget"
        @close="modalOpen = false"
      />
    </ClientOnly>

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
          class="btn btn-sm btn-outline"
          @click="toggleLiveEdit(false)"
        >
          Quitter
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
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { CmsLocale, CmsPagePayload, ResolvedCmsPage } from '#modula/shared/cms'
import type { PageBuilderEditTarget } from '#modula/shared/pageBuilderEditor'
import type { PageBuilderButton, PageBuilderCard, PageBuilderColumnItem, PageBuilderSection, PageBuilderSectionItem } from '#modula/shared/pageBuilder'
import CmsPageRenderer from '#modula/components/cms/CmsPageRenderer.vue'
import { useAuthStore } from '#modula/stores/auth'

interface CmsPageEditor extends CmsPagePayload {
  id: number
}

const props = defineProps<{
  resolvedPage: ResolvedCmsPage
}>()

const PageEditModal = defineAsyncComponent(() => import('#modula/components/page-builder/PageEditModal.vue'))

const route = useRoute()
const router = useRouter()
const { contentLocale } = useContentLocale()
const authStore = useAuthStore()
const { $toast } = useNuxtApp() as any
const cloneCmsData = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const locale = computed(() => contentLocale.value)
const currentLocale = computed<CmsLocale>(() => contentLocale.value)

const editableResolvedPage = ref<ResolvedCmsPage>(cloneCmsData(props.resolvedPage))
const editorPage = ref<CmsPageEditor | null>(null)
const activeTarget = ref<PageBuilderEditTarget | null>(null)
const modalOpen = ref(false)
const loadingEditor = ref(false)
const saving = ref(false)
const liveEditHydrated = ref(false)
const savedEditorSnapshot = ref('')
const savedResolvedPageState = ref<ResolvedCmsPage | null>(null)
const savedEditorPageState = ref<CmsPageEditor | null>(null)
const wantsLiveEdit = computed(() => route.query.liveEdit === '1')
const liveEditEnabled = computed(() =>
  liveEditHydrated.value
  && wantsLiveEdit.value
  && authStore.isAdmin
  && editableResolvedPage.value.pageType !== 'APPLICATION'
)
const showEnterLiveEditButton = computed(() =>
  liveEditHydrated.value
  && !wantsLiveEdit.value
  && authStore.isAdmin
  && editableResolvedPage.value.pageType !== 'APPLICATION'
)
const liveEditDirty = computed(() =>
  liveEditEnabled.value
  && Boolean(savedEditorSnapshot.value)
  && serializeEditorState() !== savedEditorSnapshot.value
)

onMounted(() => {
  liveEditHydrated.value = true
  if (!import.meta.client) return
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  window.removeEventListener('beforeunload', handleBeforeUnload)
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

function serializeEditorState() {
  return JSON.stringify({
    locale: currentLocale.value,
    pageId: editableResolvedPage.value.id ?? null,
    path: editableResolvedPage.value.path,
    title: editableResolvedPage.value.title,
    navigationLabel: editableResolvedPage.value.navigationLabel,
    seo: editableResolvedPage.value.seo,
    content: editableResolvedPage.value.content
  })
}

function syncEditorSnapshot() {
  savedEditorSnapshot.value = serializeEditorState()
  savedResolvedPageState.value = cloneCmsData(editableResolvedPage.value)
  savedEditorPageState.value = editorPage.value ? cloneCmsData(editorPage.value) : null
}

function confirmDiscardLiveEditChanges() {
  if (!liveEditDirty.value || !import.meta.client) return true
  return window.confirm('Des modifications non sauvegardées sont en cours. Êtes-vous sûr de vouloir quitter ?')
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!liveEditDirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

function restoreEditorState() {
  modalOpen.value = false
  activeTarget.value = null
  editorPage.value = savedEditorPageState.value ? cloneCmsData(savedEditorPageState.value) : null
  editableResolvedPage.value = savedResolvedPageState.value
    ? cloneCmsData(savedResolvedPageState.value)
    : cloneCmsData(props.resolvedPage)
}

function allSections() {
  return editableResolvedPage.value.content.sections || []
}

function findSectionById(id: string) {
  return allSections().find(section => section.id === id) || null
}

function findItemById(id: string) {
  for (const section of allSections()) {
    const beforeItemIndex = section.beforeItems.findIndex(item => item.id === id)
    if (beforeItemIndex >= 0) {
      return {
        section,
        column: null,
        item: section.beforeItems[beforeItemIndex] as PageBuilderSectionItem,
        itemIndex: beforeItemIndex,
        parentItems: section.beforeItems
      }
    }

    for (const column of section.columns) {
      const itemIndex = column.items.findIndex(item => item.id === id)
      if (itemIndex >= 0) {
        return {
          section,
          column,
          item: column.items[itemIndex] as PageBuilderColumnItem,
          itemIndex,
          parentItems: column.items
        }
      }
    }

    const afterItemIndex = section.afterItems.findIndex(item => item.id === id)
    if (afterItemIndex >= 0) {
      return {
        section,
        column: null,
        item: section.afterItems[afterItemIndex] as PageBuilderSectionItem,
        itemIndex: afterItemIndex,
        parentItems: section.afterItems
      }
    }
  }
  return null
}

async function toggleLiveEdit(enabled: boolean) {
  if (!enabled && !confirmDiscardLiveEditChanges()) return
  if (!enabled) restoreEditorState()
  const query = { ...route.query }
  if (enabled) query.liveEdit = '1'
  else delete query.liveEdit
  await router.replace({ query })
}

function findCardById(id: string) {
  for (const section of allSections()) {
    for (const column of section.columns) {
      for (const item of column.items) {
        if (item.type !== 'cards') continue
        const cardIndex = item.cards.findIndex(card => card.id === id)
        if (cardIndex >= 0) {
          return {
            section,
            column,
            item,
            card: item.cards[cardIndex] as PageBuilderCard,
            cardIndex
          }
        }
      }
    }
  }
  return null
}

function sameButton(a: PageBuilderButton | null | undefined, b: PageBuilderButton | null | undefined) {
  return Boolean(
    a && b
    && a.href === b.href
    && a.label.fr === b.label.fr
    && a.label.en === b.label.en
    && a.tone === b.tone
    && a.size === b.size
  )
}

function resolveLiveEditTarget(target: PageBuilderEditTarget): PageBuilderEditTarget {
  if (target.kind === 'section') {
    const sections = allSections()
    const section = findSectionById(target.section.id) || sections[target.sectionIndex] || target.section
    const sectionIndex = Math.max(0, sections.indexOf(section as PageBuilderSection))
    return { ...target, section: section as PageBuilderSection, sections, sectionIndex }
  }

  if (target.kind === 'column') {
    const section = findSectionById(target.section.id) || allSections()[target.columnIndex] || target.section
    const column = section?.columns[target.columnIndex] || target.column
    return { ...target, section: section as PageBuilderSection, column, columnIndex: target.columnIndex }
  }

  if (target.kind === 'item') {
    const found = findItemById(target.item.id)
    if (!found) return target
    return {
      ...target,
      item: found.item,
      parentItems: found.parentItems,
      itemIndex: found.itemIndex
    }
  }

  if (target.kind === 'card') {
    const found = findCardById(target.card.id)
    if (!found) return target
    return {
      ...target,
      card: found.card,
      parentCards: found.item.cards,
      cardIndex: found.cardIndex
    }
  }

  if (target.kind === 'button') {
    for (const section of allSections()) {
      for (const column of section.columns) {
        for (const item of column.items) {
          if (item.type === 'buttons') {
            if (sameButton(item.primaryButton, target.button)) return { ...target, button: item.primaryButton! }
            if (sameButton(item.secondaryButton, target.button)) return { ...target, button: item.secondaryButton! }
          }
          if (item.type === 'cards') {
            for (const card of item.cards) {
              if (sameButton(card.primaryButton, target.button)) return { ...target, button: card.primaryButton! }
              if (sameButton(card.secondaryButton, target.button)) return { ...target, button: card.secondaryButton! }
            }
          }
        }
      }
    }
  }

  return target
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
  syncEditorSnapshot()
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
    syncEditorSnapshot()
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
  if (!confirmDiscardLiveEditChanges()) return
  editorPage.value = null
  await ensureEditorPage()
}

async function openLiveEditor(target: PageBuilderEditTarget) {
  const page = await ensureEditorPage()
  if (!page) return
  activeTarget.value = resolveLiveEditTarget(target)
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
    syncEditorSnapshot()
    $toast?.success('Page enregistrée')
  } catch (error: any) {
    console.error('LiveEdit save failed', error)
    $toast?.error(getErrorMessage(error, 'Erreur lors de l’enregistrement'))
  } finally {
    saving.value = false
  }
}

onBeforeRouteLeave(() => {
  if (confirmDiscardLiveEditChanges()) {
    if (liveEditDirty.value) restoreEditorState()
    return
  }
  return false
})
</script>
