<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-3xl font-bold">{{ $t('admin.imagesPage.title') }}</h1>
      <label class="btn btn-primary">
        <Icon name="mdi:upload" size="18" />
        <span v-if="!uploading">{{ $t('admin.imagesPage.import') }}</span>
        <span v-else class="loading loading-spinner loading-sm" />
        <input type="file" accept="image/*" multiple class="hidden" @change="onFileChange" />
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
        <img :src="img.url" :alt="img.filename" class="aspect-square w-full object-cover" loading="lazy" />
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
        <h2 class="mb-4 text-xl font-bold">Modifier l'image</h2>

        <div v-if="editing" class="space-y-4">
          <div class="overflow-hidden rounded-box border border-base-300">
            <img :src="displayedImageUrl" :alt="editing.filename" class="max-h-80 w-full object-contain bg-base-200" />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="form-control gap-3">
              <label class="label"><span class="label-text">Nom du fichier</span></label>
              <input v-model="editForm.filename" class="input input-bordered" />
              <p class="mt-1 text-xs opacity-60">L'extension sera conservée ou adaptée si tu remplaces le fichier.</p>
            </div>

            <div class="form-control gap-3">
              <label class="label"><span class="label-text">Remplacer l'image</span></label>
              <input type="file" accept="image/*" class="file-input file-input-bordered" @change="onReplacementSelected" />
              <p v-if="replacementFile" class="mt-1 text-xs opacity-60">{{ replacementFile.name }}</p>
            </div>
          </div>

          <div class="rounded-box bg-base-200 p-3 text-sm">
            <div class="font-medium">Associations</div>
            <div class="mt-2 grid gap-1 sm:grid-cols-2">
              <div>Legumes : {{ editing.references.vegetables }}</div>
              <div>Paniers : {{ editing.references.baskets }}</div>
              <div>Articles couverture : {{ editing.references.articles }}</div>
              <div>Articles contenu : {{ editing.references.articleContent }}</div>
              <div>Page racine : {{ editing.references.rootPage.count }}</div>
            </div>
            <div v-if="editing.references.rootPage.items.length" class="mt-3">
              <div class="font-medium">Utilisations sur la page racine</div>
              <ul class="mt-2 space-y-1 text-xs opacity-80">
                <li v-for="item in editing.references.rootPage.items" :key="`${item.kind}-${item.sectionId}-${item.columnIndex ?? 0}-${item.itemId ?? ''}-${item.label}`">
                  {{ item.label }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn btn-error btn-outline mr-auto" :disabled="saving || deleting" @click="removeCurrent">
            <span v-if="deleting" class="loading loading-spinner loading-sm" />
            Supprimer
          </button>
          <button class="btn" @click="closeEditor">Fermer</button>
          <button class="btn btn-primary" :disabled="saving || deleting" @click="saveCurrent">
            <span v-if="saving" class="loading loading-spinner loading-sm" />
            Enregistrer
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface ImageReferences {
  vegetables: number
  baskets: number
  articles: number
  articleContent: number
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
  references: ImageReferences
}

const { t } = useI18n()
const { data: images, pending, refresh } = await useFetch<ImageRow[]>('/api/admin/images')
const { $toast } = useNuxtApp() as any

const uploading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editorDialog = ref<HTMLDialogElement>()
const editing = ref<ImageRow | null>(null)
const replacementFile = ref<File | null>(null)
const replacementPreviewUrl = ref<string | null>(null)
const editForm = reactive({ filename: '' })
const displayedImageUrl = computed(() => replacementPreviewUrl.value || editing.value?.url || '')

const totalReferences = (references: ImageReferences) =>
  references.vegetables + references.baskets + references.articles + references.articleContent + references.rootPage.count

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
    $toast?.success('Image mise à jour')
  } catch (err: any) {
    $toast?.error(err.statusMessage || t('common.error'))
  } finally {
    saving.value = false
  }
}

const removeCurrent = async () => {
  if (!editing.value) return
  if (!confirm(t('admin.imagesPage.deleteConfirm', { filename: editing.value.filename }))) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/images/${editing.value.id}`, { method: 'DELETE' })
    await refresh()
    closeEditor()
    $toast?.success('Image supprimée')
  } catch (err: any) {
    $toast?.error(err.statusMessage || t('common.error'))
  } finally {
    deleting.value = false
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
