<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">{{ $t('admin.imagesPage.title') }}</h1>
      <label class="btn btn-primary">
        <Icon name="mdi:upload" size="18" />
        <span v-if="!uploading">{{ $t('admin.imagesPage.import') }}</span>
        <span v-else class="loading loading-spinner loading-sm" />
        <input type="file" accept="image/*" multiple class="hidden" @change="onFileChange" />
      </label>
    </div>

    <div v-if="pending" class="text-center py-12">
      <span class="loading loading-spinner loading-lg" />
    </div>
    <div v-else-if="!images?.length" class="text-center py-12 opacity-60">
      {{ $t('admin.imagesPage.empty') }}
    </div>
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <div v-for="img in images" :key="img.id" class="relative group rounded-box overflow-hidden border border-base-300">
        <img :src="img.url" :alt="img.filename" class="w-full aspect-square object-cover" loading="lazy" />
        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button class="btn btn-sm btn-error" @click="remove(img)">
            <Icon name="mdi:delete" size="16" />
          </button>
        </div>
        <div class="p-1 text-[10px] truncate bg-base-200">{{ img.filename }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface ImageRow { id: number; url: string; filename: string; mimeType: string; size: number }

const { t } = useI18n()
const { data: images, pending, refresh } = await useFetch<ImageRow[]>('/api/admin/images')
const uploading = ref(false)

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
    const { $toast } = useNuxtApp() as any
    $toast?.success(t('admin.imagesPage.imported', { count: files.length }))
  } catch (err: any) {
    const { $toast } = useNuxtApp() as any
    $toast?.error(err.statusMessage || t('common.error'))
  } finally {
    uploading.value = false
  }
}

const remove = async (img: ImageRow) => {
  if (!confirm(t('admin.imagesPage.deleteConfirm', { filename: img.filename }))) return
  try {
    await $fetch(`/api/admin/images/${img.id}`, { method: 'DELETE' })
    await refresh()
  } catch (err: any) {
    const { $toast } = useNuxtApp() as any
    $toast?.error(err.statusMessage || t('common.error'))
  }
}
</script>
