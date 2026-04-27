<template>
  <dialog ref="dlg" class="modal" @close="$emit('update:open', false)">
    <div class="modal-box max-w-4xl">
      <h3 class="font-bold text-lg mb-4">Bibliothèque d'images</h3>

      <div class="flex items-center gap-2 mb-4">
        <input ref="fileInput" type="file" accept="image/*" class="file-input file-input-bordered file-input-sm" @change="onFileChange" />
        <span v-if="uploading" class="loading loading-spinner loading-sm" />
        <span class="text-xs opacity-60 ml-auto">{{ images.length }} image(s)</span>
      </div>

      <div v-if="pending" class="text-center py-8">
        <span class="loading loading-spinner" />
      </div>
      <div v-else-if="!images.length" class="text-center py-8 opacity-60">
        Aucune image. Importez-en une ci-dessus.
      </div>
      <div v-else class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-96 overflow-y-auto">
        <button
          v-for="img in images"
          :key="img.id"
          type="button"
          class="relative group aspect-square overflow-hidden rounded border border-base-300 hover:border-primary"
          @click="select(img)"
        >
          <img :src="img.url" :alt="img.filename" class="w-full h-full object-cover" loading="lazy" />
        </button>
      </div>

      <div class="modal-action">
        <button class="btn" @click="close">Fermer</button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>
</template>

<script setup lang="ts">
interface ImageRow { id: number; url: string; filename: string; mimeType: string; size: number }

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'select', url: string, image: ImageRow): void
}>()

const dlg = ref<HTMLDialogElement>()
const fileInput = ref<HTMLInputElement>()
const images = ref<ImageRow[]>([])
const pending = ref(false)
const uploading = ref(false)

const load = async () => {
  pending.value = true
  try {
    images.value = await $fetch<ImageRow[]>('/api/admin/images')
  } finally {
    pending.value = false
  }
}

watch(() => props.open, (o) => {
  if (o) {
    dlg.value?.showModal()
    load()
  } else {
    dlg.value?.close()
  }
})

const close = () => {
  emit('update:open', false)
}

const select = (img: ImageRow) => {
  emit('select', img.url, img)
}

const onFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const created = await $fetch<ImageRow>('/api/admin/images', { method: 'POST', body: fd })
    images.value = [created, ...images.value]
    input.value = ''
    const { $toast } = useNuxtApp() as any
    $toast?.success('Image importée')
  } catch (err: any) {
    const { $toast } = useNuxtApp() as any
    $toast?.error(err.statusMessage || 'Erreur upload')
  } finally {
    uploading.value = false
  }
}
</script>
