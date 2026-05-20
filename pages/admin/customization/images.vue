<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-3xl font-bold">{{ $t('admin.imagesPage.title') }}</h1>
      <label class="btn btn-primary">
        <Icon name="mdi:upload" size="18" />
        <span v-if="!uploading">{{ $t('admin.imagesPage.import') }}</span>
        <span v-else class="loading loading-spinner loading-sm" />
        <input type="file" accept="image/*,.ico,image/x-icon,image/vnd.microsoft.icon" multiple class="hidden" @change="onFileChange" />
      </label>
    </div>

    <div v-if="pending" class="py-12 text-center">
      <span class="loading loading-spinner loading-lg" />
    </div>
    <div v-else-if="!images?.length" class="py-12 text-center opacity-60">
      {{ $t('admin.imagesPage.empty') }}
    </div>
    <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      <button
        v-for="img in images"
        :key="img.id"
        type="button"
        class="group overflow-hidden rounded-box border border-base-300 bg-base-100 text-left transition hover:border-primary"
        @click="openEditor(img)"
      >
        <AppImage :src="img.url" :alt="img.filename" class="aspect-square w-full object-cover" sizes="300px" loading="lazy" />
        <div class="space-y-1 p-2 text-[10px]">
          <div class="truncate font-medium">{{ img.filename }}</div>
          <div class="opacity-60">
            {{ totalReferences(img.references) }} association(s)
          </div>
        </div>
      </button>
    </div>

    <dialog ref="editorDialog" class="modal">
      <div class="modal-box max-w-xl">
        <h2 class="mb-4 text-xl font-bold">{{ t('admin.imagesPage.editTitle') }}</h2>

        <div v-if="editing" class="space-y-4">
          <div class="overflow-hidden rounded-box border border-base-300">
            <AppImage :src="displayedImageUrl" :alt="editing.filename" class="max-h-80 w-full object-contain bg-base-200" fit="contain" sizes="640px" />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="form-control gap-3">
              <label class="label"><span class="label-text">{{ t('admin.imagesPage.filename') }}</span></label>
              <input v-model="editForm.filename" class="input input-bordered" />
              <p class="mt-1 text-xs opacity-60">{{ t('admin.imagesPage.filenameHelp') }}</p>
            </div>

            <div class="form-control gap-3">
              <label class="label"><span class="label-text">{{ t('admin.imagesPage.replaceImage') }}</span></label>
              <input type="file" accept="image/*,.ico,image/x-icon,image/vnd.microsoft.icon" class="file-input file-input-bordered" @change="onReplacementSelected" />
              <p v-if="replacementFile" class="mt-1 text-xs opacity-60">{{ replacementFile.name }}</p>
            </div>
          </div>

          <div class="rounded-box bg-base-200 p-3 text-sm">
            <div class="font-medium">{{ t('admin.imagesPage.references') }}</div>
            <div class="mt-1 opacity-60">
              {{ totalReferences(editing.references) }} association(s) au total
            </div>
            <div class="mt-2 grid gap-1 sm:grid-cols-2">
              <div>{{ t('admin.imagesPage.referencesVegetables') }} : {{ editing.references.vegetables }}</div>
              <div>{{ t('admin.imagesPage.referencesBaskets') }} : {{ editing.references.baskets }}</div>
              <div>{{ t('admin.imagesPage.referencesArticles') }} : {{ editing.references.articles }}</div>
              <div>{{ t('admin.imagesPage.referencesArticleContent') }} : {{ editing.references.articleContent }}</div>
              <div>Reglages globaux : {{ editing.references.cmsSiteSettings.count }}</div>
              <div>Pages CMS : {{ editing.references.cmsPages.count }}</div>
              <div>{{ t('admin.imagesPage.referencesRootCount') }} : {{ editing.references.rootPage.count }}</div>
            </div>
            <div v-if="editing.references.cmsSiteSettings.items.length" class="mt-3">
              <div class="font-medium">Utilisations dans les reglages globaux</div>
              <ul class="mt-2 space-y-1 text-xs opacity-80">
                <li v-for="item in editing.references.cmsSiteSettings.items" :key="`site-${item.fieldKey}-${item.label}`">
                  {{ item.label }}
                </li>
              </ul>
            </div>
            <div v-if="editing.references.cmsPages.items.length" class="mt-3">
              <div class="font-medium">Utilisations sur les pages CMS</div>
              <ul class="mt-2 space-y-1 text-xs opacity-80">
                <li v-for="item in editing.references.cmsPages.items" :key="`cms-${item.pageId}-${item.kind}-${item.sectionId}-${item.columnIndex ?? 0}-${item.itemId ?? ''}-${item.label}`">
                  {{ item.label }}
                </li>
              </ul>
            </div>
            <div v-if="editing.references.rootPage.items.length" class="mt-3">
              <div class="font-medium">{{ t('admin.imagesPage.referencesRootPage') }}</div>
              <ul class="mt-2 space-y-1 text-xs opacity-80">
                <li v-for="item in editing.references.rootPage.items" :key="`${item.kind}-${item.sectionId}-${item.columnIndex ?? 0}-${item.itemId ?? ''}-${item.label}`">
                  {{ item.label }}
                </li>
              </ul>
            </div>
          </div>

          <div class="rounded-box bg-base-200 p-3 text-sm">
            <div class="font-medium">Variantes generees</div>
            <div v-if="!editing.variants.length" class="mt-2 opacity-60">
              Aucune variante persistée pour le moment.
            </div>
            <ul v-else class="mt-2 space-y-2 text-xs opacity-80">
              <li v-for="variant in editing.variants" :key="variant.id" class="rounded-lg border border-base-300 bg-base-100 px-3 py-2">
                <div class="flex items-start justify-between gap-3">
                  <div class="font-medium break-all">{{ variant.storageKey }}</div>
                  <button
                    type="button"
                    class="btn btn-error btn-outline btn-xs shrink-0"
                    :disabled="deletingVariantId === variant.id"
                    @click="removeVariant(variant.id)"
                  >
                    <span v-if="deletingVariantId === variant.id" class="loading loading-spinner loading-xs" />
                    Supprimer
                  </button>
                </div>
                <div class="mt-1">
                  {{ variant.format }} · {{ variant.width || '?' }}x{{ variant.height || '?' }} · q{{ variant.quality || '-' }} · {{ variant.fit || 'auto' }} · {{ variant.size }} o
                </div>
                <div class="mt-2 rounded-md bg-base-200 px-2 py-2">
                  <div class="font-medium">Associations de cette variante</div>
                  <div class="mt-1 opacity-70">
                    {{ totalReferences(variant.references) }} association(s) heritee(s) de l'image source
                  </div>
                  <div class="mt-2 grid gap-1 sm:grid-cols-2">
                    <div>{{ t('admin.imagesPage.referencesVegetables') }} : {{ variant.references.vegetables }}</div>
                    <div>{{ t('admin.imagesPage.referencesBaskets') }} : {{ variant.references.baskets }}</div>
                    <div>{{ t('admin.imagesPage.referencesArticles') }} : {{ variant.references.articles }}</div>
                    <div>{{ t('admin.imagesPage.referencesArticleContent') }} : {{ variant.references.articleContent }}</div>
                    <div>Reglages globaux : {{ variant.references.cmsSiteSettings.count }}</div>
                    <div>Pages CMS : {{ variant.references.cmsPages.count }}</div>
                    <div>{{ t('admin.imagesPage.referencesRootCount') }} : {{ variant.references.rootPage.count }}</div>
                  </div>
                  <ul v-if="variant.references.cmsSiteSettings.items.length" class="mt-2 space-y-1">
                    <li
                      v-for="item in variant.references.cmsSiteSettings.items"
                      :key="`variant-site-${variant.id}-${item.fieldKey}-${item.label}`"
                    >
                      {{ item.label }}
                    </li>
                  </ul>
                  <ul v-if="variant.references.cmsPages.items.length" class="mt-2 space-y-1">
                    <li
                      v-for="item in variant.references.cmsPages.items"
                      :key="`variant-cms-${variant.id}-${item.pageId}-${item.kind}-${item.sectionId}-${item.columnIndex ?? 0}-${item.itemId ?? ''}-${item.label}`"
                    >
                      {{ item.label }}
                    </li>
                  </ul>
                  <ul v-if="variant.references.rootPage.items.length" class="mt-2 space-y-1">
                    <li
                      v-for="item in variant.references.rootPage.items"
                      :key="`variant-${variant.id}-${item.kind}-${item.sectionId}-${item.columnIndex ?? 0}-${item.itemId ?? ''}-${item.label}`"
                    >
                      {{ item.label }}
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-error btn-outline mr-auto" :disabled="saving || deleting" @click="removeCurrent">
            <span v-if="deleting" class="loading loading-spinner loading-sm" />
            {{ t('admin.common.delete') }}
          </button>
          <button class="btn" @click="closeEditor">{{ t('admin.common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="saving || deleting" @click="saveCurrent">
            <span v-if="saving" class="loading loading-spinner loading-sm" />
            {{ t('admin.common.save') }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS } from '~/shared/adminRoutes'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.customizationImages
  }
})

interface ImageReferences {
  vegetables: number
  baskets: number
  articles: number
  articleContent: number
  cmsSiteSettings: {
    count: number
    items: Array<{
      fieldKey: 'logo' | 'favicon'
      label: string
    }>
  }
  cmsPages: {
    count: number
    items: Array<{
      kind: 'section-background-image' | 'section-background-carousel' | 'column-image' | 'column-carousel'
      pageId: number
      pagePath: string
      pageTitle: string
      sectionId: string
      sectionLabel: string
      columnIndex?: number
      itemId?: string
      label: string
    }>
  }
  rootPage: {
    count: number
    items: Array<{
      kind: 'section-background-image' | 'section-background-carousel' | 'column-image' | 'column-carousel'
      sectionId: string
      sectionLabel: string
      columnIndex?: number
      itemId?: string
      label: string
    }>
  }
}

interface ImageRow {
  id: number
  url: string
  filename: string
  mimeType: string
  size: number
  variants: Array<{
    id: number
    storageKey: string
    mimeType: string
    size: number
    width: number | null
    height: number | null
    fit: string | null
    quality: number | null
    format: string
    createdAt: string
    usages: Array<{
      id: number
      scopeType: string
      scopeId: string
      fieldKey: string
      label: string
    }>
    references: ImageReferences
  }>
  usages: Array<{
    id: number
    scopeType: string
    scopeId: string
    fieldKey: string
    label: string
  }>
  references: ImageReferences
}

const { t } = useI18n()
const { data: images, pending, refresh } = await useFetch<ImageRow[]>('/api/admin/images')
const { $toast } = useNuxtApp() as any

const uploading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const deletingVariantId = ref<number | null>(null)
const editorDialog = ref<HTMLDialogElement>()
const editing = ref<ImageRow | null>(null)
const replacementFile = ref<File | null>(null)
const replacementPreviewUrl = ref<string | null>(null)
const editForm = reactive({ filename: '' })
const displayedImageUrl = computed(() => replacementPreviewUrl.value || editing.value?.url || '')

const totalReferences = (references: ImageReferences) =>
  references.vegetables
  + references.baskets
  + references.articles
  + references.articleContent
  + references.cmsSiteSettings.count
  + references.cmsPages.count
  + references.rootPage.count

const onFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (!files.length) return
  uploading.value = true
  try {
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      await $fetch('/api/admin/images', { method: 'POST', body: fd })
    }
    input.value = ''
    await refresh()
    $toast?.success(t('admin.imagesPage.imported', { count: files.length }))
  } catch (err: any) {
    $toast?.error(err.statusMessage || t('common.error'))
  } finally {
    uploading.value = false
  }
}

const openEditor = (img: ImageRow) => {
  editing.value = img
  editForm.filename = img.filename.replace(/\.[^.]+$/, '')
  resetReplacement()
  editorDialog.value?.showModal()
}

const closeEditor = () => {
  resetReplacement()
  editorDialog.value?.close()
}

const onReplacementSelected = (e: Event) => {
  const input = e.target as HTMLInputElement
  replacementFile.value = input.files?.[0] ?? null
  if (replacementPreviewUrl.value) {
    URL.revokeObjectURL(replacementPreviewUrl.value)
    replacementPreviewUrl.value = null
  }
  if (replacementFile.value) {
    replacementPreviewUrl.value = URL.createObjectURL(replacementFile.value)
  }
}

const saveCurrent = async () => {
  if (!editing.value) return
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('filename', editForm.filename.trim())
    if (replacementFile.value) {
      fd.append('file', replacementFile.value)
    }
    await $fetch(`/api/admin/images/${editing.value.id}`, {
      method: 'PUT',
      body: fd
    })
    await refresh()
    closeEditor()
    $toast?.success(t('admin.imagesPage.updated'))
  } catch (err: any) {
    $toast?.error(err.statusMessage || t('common.error'))
  } finally {
    saving.value = false
  }
}

const removeCurrent = async () => {
  if (!editing.value) return
  const linkedCount = totalReferences(editing.value.references)
  const confirmed = linkedCount > 0
    ? confirm(`Cette image a encore ${linkedCount} association(s). Etes-vous sur de vouloir la supprimer ? Toutes les associations seront retirees.`)
    : confirm(t('admin.imagesPage.deleteConfirm', { filename: editing.value.filename }))

  if (!confirmed) return

  deleting.value = true
  try {
    await $fetch(`/api/admin/images/${editing.value.id}`, {
      method: 'DELETE',
      query: linkedCount > 0 ? { force: '1' } : undefined
    })
    await refresh()
    closeEditor()
    $toast?.success(t('admin.imagesPage.deleted'))
  } catch (err: any) {
    $toast?.error(err.statusMessage || t('common.error'))
  } finally {
    deleting.value = false
  }
}

const removeVariant = async (variantId: number) => {
  if (!editing.value) return
  if (!confirm('Supprimer cette variante générée ?')) return

  deletingVariantId.value = variantId
  try {
    await $fetch(`/api/admin/images/variants/${variantId}`, {
      method: 'DELETE'
    })
    await refresh()
    const updated = images.value?.find((image) => image.id === editing.value?.id) ?? null
    if (updated) {
      editing.value = updated
    }
    $toast?.success('Variante supprimée')
  } catch (err: any) {
    $toast?.error(err.statusMessage || t('common.error'))
  } finally {
    deletingVariantId.value = null
  }
}

function resetReplacement() {
  replacementFile.value = null
  if (replacementPreviewUrl.value) {
    URL.revokeObjectURL(replacementPreviewUrl.value)
    replacementPreviewUrl.value = null
  }
}

onBeforeUnmount(() => {
  resetReplacement()
})
</script>
