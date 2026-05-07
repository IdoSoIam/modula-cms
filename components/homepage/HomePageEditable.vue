<template>
  <div class="relative" :class="inline ? 'inline-block align-top' : ''">
    <button
      v-if="editable"
      type="button"
      class="z-20 cursor-pointer rounded-full border border-base-300 bg-base-100/85 px-2 py-1 text-[11px] font-medium shadow-sm transition hover:border-primary text-primary"
      :class="buttonPosition === 'inline-end' ? 'absolute left-full top-1/2 ml-2 -translate-y-1/2' : 'absolute right-2 top-2'"
      @click.stop="$emit('edit')"
    >
      {{ label }}
    </button>

    <div
      class="transition"
      :class="editable ? 'rounded-2xl outline outline-1 outline-dashed outline-primary/40 outline-offset-4' : ''"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  editable?: boolean
  inline?: boolean
  label: string
  buttonPosition?: 'top-right' | 'inline-end'
}>()

defineEmits<{
  edit: []
}>()
</script>
