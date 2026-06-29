<template>
  <div class="space-y-2">
    <div class="rounded-box border border-base-300 bg-base-200/30 p-3 text-sm">
      <div v-if="modelValue" class="flex items-center justify-between gap-3">
        <a
          :href="modelValue"
          class="link link-primary truncate"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ filenameLabel }}
        </a>
        <button type="button" class="btn btn-xs btn-circle btn-error" @click="clearValue">
          <Icon name="mdi:close" size="14" />
        </button>
      </div>
      <div v-else class="opacity-60">
        Aucun PDF
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <label class="btn btn-sm btn-outline">
        <Icon name="mdi:file-upload-outline" size="16" />
        Importer un PDF
        <input type="file" accept="application/pdf,.pdf" class="hidden" @change="onFile" />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: string | null | undefined }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const filenameLabel = computed(() => {
  const value = String(props.modelValue || '').trim()
  if (!value) return 'document.pdf'
  try {
    const base = import.meta.client ? window.location.origin : 'http://localhost'
    const url = new URL(value, base)
    return url.pathname.split('/').filter(Boolean).pop() || 'document.pdf'
  } catch {
    return value.split('/').filter(Boolean).pop() || 'document.pdf'
  }
})

function clearValue() {
  emit('update:modelValue', '')
}

async function onFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const fd = new FormData()
    fd.append('file', file)
    const created = await $fetch<{ url: string }>('/api/admin/documents', { method: 'POST', body: fd })
    emit('update:modelValue', created.url)
    input.value = ''
  } catch (error: any) {
    const { $toast } = useNuxtApp() as any
    $toast?.error(error?.data?.statusMessage || error?.statusMessage || 'Erreur upload')
  }
}
</script>
