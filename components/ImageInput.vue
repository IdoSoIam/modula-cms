<template>
  <div class="space-y-2">
    <div v-if="modelValue" class="relative w-40 h-40 rounded-box overflow-hidden border border-base-300">
      <img :src="modelValue" alt="" class="w-full h-full object-cover" />
      <button
        type="button"
        class="btn btn-xs btn-circle btn-error absolute top-1 right-1"
        @click="$emit('update:modelValue', '')"
      >
        <Icon name="mdi:close" size="14" />
      </button>
    </div>
    <div v-else class="w-40 h-40 rounded-box border border-dashed border-base-300 flex items-center justify-center text-xs opacity-60">
      Aucune image
    </div>
    <div class="flex flex-wrap gap-2">
      <button type="button" class="btn btn-sm btn-outline" @click="pickerOpen = true">
        <Icon name="mdi:image-multiple" size="16" />
        Bibliothèque
      </button>
      <label class="btn btn-sm btn-outline">
        <Icon name="mdi:upload" size="16" />
        Importer
        <input type="file" accept="image/*" class="hidden" @change="onFile" />
      </label>
    </div>
    <ImagePicker v-model:open="pickerOpen" @select="onPick" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue: string | null | undefined }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const pickerOpen = ref(false)

const onPick = (url: string) => {
  emit('update:modelValue', url)
  pickerOpen.value = false
}

const onFile = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const fd = new FormData()
    fd.append('file', file)
    const created = await $fetch<{ url: string }>('/api/admin/images', { method: 'POST', body: fd })
    emit('update:modelValue', created.url)
    input.value = ''
  } catch (err: any) {
    const { $toast } = useNuxtApp() as any
    $toast?.error(err.statusMessage || 'Erreur upload')
  }
}
</script>
